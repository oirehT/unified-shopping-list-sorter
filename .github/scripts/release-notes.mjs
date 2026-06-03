import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const releaseTag = process.env.RELEASE_TAG;
const repository = process.env.GITHUB_REPOSITORY;
const outputPath = process.env.RELEASE_NOTES_PATH ?? 'release/notes.md';

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

const previousTag = findPreviousTag(releaseTag);
const range = previousTag ? `${previousTag}..${releaseTag}` : releaseTag;
const commits = getCommits(range);

const groupedCommits = new Map(typeOrder.map((type) => [type, []]));
for (const commit of commits) {
	groupedCommits.get(commit.type).push(commit);
}

const lines = [];
lines.push('## Changes', '');

let wroteChange = false;
for (const type of typeOrder) {
	const group = groupedCommits.get(type);
	if (group.length === 0) {
		continue;
	}

	wroteChange = true;
	lines.push(`### ${sectionNames.get(type)}`);
	for (const commit of group) {
		lines.push(`- ${commit.summary} (${commit.shortSha})`);
	}
	lines.push('');
}

if (!wroteChange) {
	lines.push('- No commit changes found for this tag.', '');
}

lines.push('## Changelog', '');
if (previousTag) {
	lines.push(
		`Full Changelog: https://github.com/${repository}/compare/${previousTag}...${releaseTag}`,
		'',
	);
}

for (const commit of commits) {
	lines.push(`- ${commit.shortSha} ${commit.subject}${commit.authorHandle}`);
}

if (commits.length === 0) {
	lines.push('- No commits found.');
}

lines.push('');
writeFileSync(outputPath, lines.join('\n'));

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
			const match = subject.match(/^([a-z]+)(?:\([^)]+\))?!?:\s+(.+)$/);
			const type = match && sectionNames.has(match[1]) ? match[1] : 'other';
			const summary = match ? match[2] : subject;

			return {
				type,
				subject,
				summary,
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
