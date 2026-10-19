// Run with: node --test site/scripts/build-index.test.mjs   (or `npm test` in site/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { splitFrontmatter, parseChangelog, parseCompatibility, toList } from './build-index.mjs';

test('splitFrontmatter reads YAML, including quoted and folded values', () => {
  const { data, body } = splitFrontmatter('---\nname: a\ndescription: >\n  one\n  two\ntools: Read, Grep\n---\n# Title\n');
  assert.equal(data.name, 'a');
  assert.equal(data.description.trim(), 'one two');
  assert.deepEqual(toList(data.tools), ['Read', 'Grep']);
  assert.equal(body.trim(), '# Title');
});

test('splitFrontmatter returns the whole text when there is no frontmatter', () => {
  assert.deepEqual(splitFrontmatter('# Just text'), { data: {}, body: '# Just text' });
});

test('toList accepts arrays and ignores other values', () => {
  assert.deepEqual(toList(['a', 'b']), ['a', 'b']);
  assert.deepEqual(toList(undefined), []);
});

test('parseChangelog reads released sections and skips Unreleased', () => {
  const text = '# Changelog\n\n## [Unreleased]\n- x\n\n## [1.1.0] - 2026-10-20\n- Added y\n\n## [1.0.0] - 2026-10-01\n- First\n';
  assert.deepEqual(parseChangelog(text), [
    { version: '1.1.0', date: '2026-10-20', notes: '- Added y' },
    { version: '1.0.0', date: '2026-10-01', notes: '- First' },
  ]);
});

test('parseCompatibility finds the minimum Claude Code version', () => {
  assert.equal(parseCompatibility('Claude Code `>=2.1.110` is required.'), '>=2.1.110');
  assert.equal(parseCompatibility('nothing here'), null);
});

test('the real repository builds a consistent index', () => {
  const script = join(dirname(fileURLToPath(import.meta.url)), 'build-index.mjs');
  const out = mkdtempSync(join(tmpdir(), 'catalog-'));
  try {
    execFileSync('node', [script, '--out', out], { stdio: 'pipe' });
    const index = JSON.parse(readFileSync(join(out, 'index.json'), 'utf8'));
    assert.equal(index.schemaVersion, 1);
    const plugins = index.entries.filter((e) => e.kind === 'plugin');
    assert.ok(plugins.length > 0);
    const ids = new Set();
    for (const e of index.entries) {
      assert.ok(!ids.has(e.id), `duplicate id ${e.id}`);
      ids.add(e.id);
      assert.match(e.install, /^\/plugin install [a-z0-9-]+@/);
      if (e.hasBody) assert.ok(existsSync(join(out, 'bodies', `${e.id}.md`)), `missing body for ${e.id}`);
    }
    for (const e of index.entries) assert.ok(ids.has(`plugin/${e.plugin}`), `${e.id} has no plugin entry`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
