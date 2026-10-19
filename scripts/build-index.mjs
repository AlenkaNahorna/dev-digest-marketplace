#!/usr/bin/env node
// Builds site/data/index.json from marketplace.json, each plugin.json and each SKILL.md.
// Usage: node scripts/build-index.mjs [--check] [--out <file>]
//   --check  validate and print a summary, but do not write the index
// No dependencies; requires Node 18+.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const check = args.includes('--check');
const outIdx = args.indexOf('--out');
const out = outIdx >= 0 ? resolve(args[outIdx + 1]) : join(root, 'site', 'data', 'index.json');

const problems = [];
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
// Rough token estimate (~4 characters per token). See docs/COST-BASELINE.md.
const tokens = (s) => Math.ceil(s.length / 4);
const entries = (d) => (existsSync(d) ? readdirSync(d, { withFileTypes: true }) : []);

function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const fm = {};
  if (!m) return fm;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return fm;
}

const marketplace = readJson(join(root, '.claude-plugin', 'marketplace.json'));

const plugins = marketplace.plugins.map((entry) => {
  const base = {
    name: entry.name,
    description: entry.description ?? '',
    category: entry.category ?? null,
    tags: entry.tags ?? [],
    install: `/plugin install ${entry.name}@${marketplace.name}`,
  };

  if (typeof entry.source !== 'string') {
    // Remote source: only catalog fields are known without fetching.
    return { ...base, version: null, remote: true, skills: [], commands: [], agents: [], hooks: false, mcpServers: false, cost: null };
  }

  const dir = join(root, entry.source);
  const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
  if (!existsSync(manifestPath)) {
    problems.push(`${entry.name}: missing ${manifestPath}`);
    return { ...base, version: null, skills: [], commands: [], agents: [], hooks: false, mcpServers: false, cost: null };
  }
  const manifest = readJson(manifestPath);
  if (manifest.name !== entry.name) problems.push(`${entry.name}: plugin.json name is "${manifest.name}"`);
  if (!manifest.version) problems.push(`${entry.name}: plugin.json has no version`);

  const skills = entries(join(dir, 'skills'))
    .filter((e) => e.isDirectory() && existsSync(join(dir, 'skills', e.name, 'SKILL.md')))
    .map((e) => {
      const text = readFileSync(join(dir, 'skills', e.name, 'SKILL.md'), 'utf8');
      const fm = frontmatter(text);
      if (!fm.description) problems.push(`${entry.name}/${e.name}: SKILL.md has no description`);
      const name = fm.name || e.name;
      return {
        name,
        description: fm.description ?? '',
        // Loaded into every session: name + description.
        metadataTokens: tokens(`${name} ${fm.description ?? ''}`),
        // Loaded only when the skill is invoked.
        bodyTokens: tokens(text),
      };
    });
  const mdNames = (sub) => entries(join(dir, sub)).filter((e) => e.isFile() && e.name.endsWith('.md')).map((e) => e.name.replace(/\.md$/, ''));

  return {
    ...base,
    description: entry.description ?? manifest.description ?? '',
    version: manifest.version ?? null,
    author: manifest.author?.name ?? null,
    skills,
    commands: mdNames('commands'),
    agents: mdNames('agents'),
    hooks: existsSync(join(dir, 'hooks', 'hooks.json')),
    mcpServers: existsSync(join(dir, '.mcp.json')),
    cost: {
      alwaysLoadedTokens: skills.reduce((n, s) => n + s.metadataTokens, 0),
      onInvokeTokens: skills.reduce((n, s) => n + s.bodyTokens, 0),
    },
  };
});

const index = {
  generatedAt: new Date().toISOString(),
  marketplace: { name: marketplace.name, description: marketplace.description ?? '', owner: marketplace.owner?.name ?? '' },
  plugins,
};

if (problems.length) {
  console.error('Index problems:\n - ' + problems.join('\n - '));
  process.exit(1);
}
if (check) {
  console.log(`OK: ${plugins.length} plugins, ${plugins.reduce((n, p) => n + p.skills.length, 0)} skills (index not written).`);
} else {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(index, null, 2) + '\n');
  console.log(`Wrote ${out} (${plugins.length} plugins).`);
}
