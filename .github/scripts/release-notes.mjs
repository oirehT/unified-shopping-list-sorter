import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const releaseTag = process.env.RELEASE_TAG;
const repository = process.env.GITHUB_REPOSITORY;
const outputPath = process.env.RELEASE_NOTES_PATH ?? 'release/notes.md';
const maxCommitsPerCategory = 5;

if (!releaseTag) {
	throw new Error('RELEASE_TAG is required');
}

if (!repository) {
	throw new Error('GITHUB_REPOSITORY is required');
}

const sectionNames = new Map([
	['feat', 'New Features'],
	['fix', 'Bug Fixes'],
	['docs', 'Documentation'],
	['perf', 'Performance'],
	['refactor', 'Refactors'],
	['test', 'Tests'],
	['ci', 'CI'],
	['build', 'Build'],
	['chore', 'Chores'],
	['style', 'Style'],
	['other', 'Other Changes'],
]);

const typeOrder = [
	'feat',
	'fix',
	'docs',
	'perf',
	'refactor',
	'test',
	'ci',
	'build',
	'chore',
	'style',
	'other',
];

const typeScores = new Map([
	['feat', 80],
	['fix', 70],
	['perf', 70],
	['docs', 40],
	['ci', 35],
	['build', 35],
	['refactor', 20],
	['test', 20],
	['chore', 20],
	['style', 20],
	['other', 10],
]);

const positiveSignals = [
	'auto-sort',
	'sort',
	'checkbox',
	'command',
	'settings',
	'release',
	'manifest',
	'editor',
	'store',
	'hide',
	'insert',
];

const negativeSignals = [
	'metadata',
	'scaffold',
	'lockfile',
	'format',
	'typo',
	'cleanup',
	'deps-only',
	'deps',
	'dependency',
	'dependencies',
];

const previousTag = findPreviousTag(releaseTag);
const range = previousTag ? `${previousTag}..${releaseTag}` : releaseTag;
const commits = getCommits(range);

const groupedCommits = new Map(typeOrder.map((type) => [type, []]));
for (const [index, commit] of commits.entries()) {
	commit.index = index;
	commit.score = scoreCommit(commit);
	groupedCommits.get(commit.type).push(commit);
}

const lines = [];
lines.push('## Changes', '');

let wroteChange = false;
const omittedCommits = [];
for (const type of typeOrder) {
	const group = groupedCommits.get(type);
	if (group.length === 0) {
		continue;
	}

	const selectedCommits = selectCategoryCommits(group);
	const selectedShas = new Set(selectedCommits.map((commit) => commit.sha));
	omittedCommits.push(...group.filter((commit) => !selectedShas.has(commit.sha)));

	wroteChange = true;
	lines.push(`### ${sectionNames.get(type)}`);
	for (const commit of selectedCommits) {
		lines.push(`- ${commit.summary} (${commit.shortSha})`);
	}
	lines.push('');
}

if (!wroteChange) {
	lines.push('- No commit changes found for this tag.', '');
}

if (omittedCommits.length > 0) {
	omittedCommits.sort((left, right) => left.index - right.index);

	lines.push('## Changelog', '');
	if (previousTag) {
		lines.push(
			`Full Changelog: https://github.com/${repository}/compare/${previousTag}...${releaseTag}`,
			'',
		);
	}

	for (const commit of omittedCommits) {
		lines.push(`- ${commit.shortSha} ${commit.subject}${commit.authorHandle}`);
	}

	lines.push('');
}

writeFileSync(outputPath, lines.join('\n'));

function selectCategoryCommits(commitsForType) {
	if (commitsForType.length <= maxCommitsPerCategory) {
		return commitsForType;
	}

	return commitsForType
		.toSorted((left, right) => right.score - left.score || left.index - right.index)
		.slice(0, maxCommitsPerCategory)
		.toSorted((left, right) => left.index - right.index);
}

function scoreCommit(commit) {
	let score = typeScores.get(commit.type) ?? typeScores.get('other');
	if (commit.isBreaking) {
		score += 100;
	}

	const subject = commit.subject.toLowerCase();
	for (const signal of positiveSignals) {
		if (subject.includes(signal)) {
			score += 10;
		}
	}

	for (const signal of negativeSignals) {
		if (subject.includes(signal)) {
			score -= 10;
		}
	}

	return score;
}

function findPreviousTag(tag) {
	try {
		return execFileSync(
			'git',
			['describe', '--tags', '--abbrev=0', `${tag}^`],
			{ encoding: 'utf8' },
		).trim();
	} catch {
		return '';
	}
}

function getCommits(gitRange) {
	const format = '%H%x1f%s%x1f%an%x1f%ae%x1e';
	const output = execFileSync('git', ['log', '--reverse', `--format=${format}`, gitRange], {
		encoding: 'utf8',
	}).trim();

	if (!output) {
		return [];
	}

	return output
		.split('\x1e')
		.map((record) => record.trim())
		.filter(Boolean)
		.map((record) => {
			const [sha, subject, authorName, authorEmail] = record.split('\x1f');
			const match = subject.match(/^([a-z]+)(?:\([^)]+\))?(!)?:\s+(.+)$/);
			const type = match && sectionNames.has(match[1]) ? match[1] : 'other';
			const summary = match ? match[3] : subject;

			return {
				sha,
				type,
				subject,
				summary,
				isBreaking: Boolean(match?.[2]),
				shortSha: sha.slice(0, 7),
				authorHandle: githubAuthorHandle(authorName, authorEmail),
			};
		});
}

function githubAuthorHandle(authorName, authorEmail) {
	const noreplyMatch = authorEmail.match(/\+([^@]+)@users\.noreply\.github\.com$/);
	if (noreplyMatch) {
		return ` @${noreplyMatch[1]}`;
	}

	if (/^[A-Za-z0-9-]+$/.test(authorName)) {
		return ` @${authorName}`;
	}

	return '';
}
