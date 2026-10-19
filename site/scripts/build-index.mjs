#!/usr/bin/env node
// Generates the data the catalog site reads:
//   <out>/index.json            every plugin, skill, agent and command (without long texts)
//   <out>/bodies/<id>.md        README / SKILL.md / agent / command text, loaded on demand
// Usage: node site/scripts/build-index.mjs [--check] [--out <dir>]
//   --check  validate and print a summary, but write nothing
// Default <out> is site/public. Needs `npm ci` in site/ (uses the "yaml" package). Node 22+.
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

export const SCHEMA_VERSION = 1;
const SEARCH_TEXT_LIMIT = 4000;

/** Split a markdown file into YAML frontmatter data and the remaining body. */
export function splitFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/);
  if (!m) return { data: {}, body: text };
  const data = parseYaml(m[1]);
  return { data: data && typeof data === 'object' && !Array.isArray(data) ? data : {}, body: m[2] };
}

/** Read "## [X.Y.Z] - YYYY-MM-DD" sections of a Keep a Changelog file. */
export function parseChangelog(text) {
  const releases = [];
  for (const section of text.split(/^## /m).slice(1)) {
    const [head, ...rest] = section.split('\n');
    const m = head.match(/^\[?(\d+\.\d+\.\d+)\]?\s*(?:[-–—]\s*(\d{4}-\d{2}-\d{2}))?/);
    if (m) releases.push({ version: m[1], date: m[2] ?? null, notes: rest.join('\n').trim() });
  }
  return releases;
}

/** "Claude Code `>=2.1.110`" -> ">=2.1.110" */
export function parseCompatibility(text) {
  const m = text.match(/Claude Code[^\n]*?(>=\s*\d+(?:\.\d+){0,2})/);
  return m ? m[1].replace(/\s+/g, '') : null;
}

/** Accepts "Read, Grep" or ["Read", "Grep"]. */
export function toList(value) {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function build(root) {
  const problems = [];
  const git = (args) => {
    try {
      return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
      return '';
    }
  };
  const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
  const readText = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
  const listDir = (d) => (existsSync(d) ? readdirSync(d, { withFileTypes: true }) : []);
  // Rough token estimate (~4 characters per token). See docs/COST-BASELINE.md.
  const tokens = (s) => Math.ceil(s.length / 4);
  const unique = (list) => [...new Set(list)];

  const slug = process.env.GITHUB_REPOSITORY || git(['remote', 'get-url', 'origin']).match(/github\.com[:/]+([^/]+\/[^/]+?)(?:\.git)?$/)?.[1];
  const repoUrl = slug ? `https://github.com/${slug}` : null;

  // Link to a folder ("tree") or a file ("blob") on the default branch.
  const gh = (type, path) => (repoUrl ? `${repoUrl}/${type}/main/${path.replace(/^\.\//, '')}` : '');

  const marketplace = readJson(join(root, '.claude-plugin', 'marketplace.json'));
  const entries = [];
  const bodies = {};

  const addBody = (id, text) => {
    const body = text.trim();
    if (!body) return false;
    bodies[id] = body;
    return true;
  };
  const searchText = (text) => text.replace(/\s+/g, ' ').trim().slice(0, SEARCH_TEXT_LIMIT);

  for (const entry of marketplace.plugins) {
    const name = entry.name;
    const base = {
      kind: 'plugin',
      name,
      plugin: name,
      description: entry.description ?? '',
      install: `/plugin install ${name}@${marketplace.name}`,
      githubUrl: typeof entry.source === 'string' ? gh('tree', entry.source) : (repoUrl ?? ''),
    };
    const pluginId = `plugin/${name}`;

    if (typeof entry.source !== 'string') {
      // Remote source: only catalog fields are known without fetching.
      const keywords = unique([...(entry.tags ?? []), ...(entry.category ? [entry.category] : [])]);
      entries.push({ ...base, id: pluginId, keywords, author: null, version: null, updated: null, hasBody: false, searchText: searchText(base.description), remote: true });
      continue;
    }

    const dir = join(root, entry.source);
    const manifestPath = join(dir, '.claude-plugin', 'plugin.json');
    if (!existsSync(manifestPath)) {
      problems.push(`${name}: missing ${manifestPath}`);
      continue;
    }
    const manifest = readJson(manifestPath);
    if (manifest.name !== name) problems.push(`${name}: plugin.json name is "${manifest.name}"`);
    if (!manifest.version) problems.push(`${name}: plugin.json has no version`);

    const keywords = unique([...(manifest.keywords ?? []), ...(entry.tags ?? []), ...(entry.category ? [entry.category] : [])]);
    const author = manifest.author?.name ?? null;
    const version = manifest.version ?? null;
    const updated = git(['log', '-1', '--format=%cs', '--', entry.source]) || null;
    const common = { plugin: name, keywords, author, version, updated, install: base.install };

    const children = [];

    for (const d of listDir(join(dir, 'skills'))) {
      const file = join(dir, 'skills', d.name, 'SKILL.md');
      if (!d.isDirectory() || !existsSync(file)) continue;
      let parsed;
      try {
        parsed = splitFrontmatter(readFileSync(file, 'utf8'));
      } catch (e) {
        problems.push(`${name}/${d.name}: SKILL.md frontmatter is not valid YAML (${e.message.split('\n')[0]})`);
        continue;
      }
      const { data, body } = parsed;
      const skillName = String(data.name || d.name);
      if (!data.description) problems.push(`${name}/${d.name}: SKILL.md has no description`);
      const description = String(data.description ?? '');
      const id = `artifact/${name}/skill/${skillName}`;
      children.push({
        ...common, id, kind: 'skill', name: skillName, description,
        githubUrl: gh('tree', `${entry.source}/skills/${d.name}`),
        invocation: `/${name}:${skillName}`,
        tools: toList(data['allowed-tools']),
        hasBody: addBody(id, body), searchText: searchText(`${description} ${body}`),
        // Loaded into every session: name + description. Loaded on invoke: the whole file.
        metadataTokens: tokens(`${skillName} ${description}`), bodyTokens: tokens(body),
      });
    }

    for (const [sub, kind] of [['agents', 'agent'], ['commands', 'command']]) {
      for (const f of listDir(join(dir, sub))) {
        if (!f.isFile() || !f.name.endsWith('.md')) continue;
        let parsed;
        try {
          parsed = splitFrontmatter(readFileSync(join(dir, sub, f.name), 'utf8'));
        } catch (e) {
          problems.push(`${name}/${sub}/${f.name}: frontmatter is not valid YAML (${e.message.split('\n')[0]})`);
          continue;
        }
        const { data, body } = parsed;
        const itemName = String(data.name || f.name.replace(/\.md$/, ''));
        if (kind === 'agent' && !data.description) problems.push(`${name}/${sub}/${f.name}: agent has no description`);
        const description = String(data.description ?? '');
        const id = `artifact/${name}/${kind}/${itemName}`;
        children.push({
          ...common, id, kind, name: itemName, description,
          githubUrl: gh('blob', `${entry.source}/${sub}/${f.name}`),
          invocation: kind === 'agent' ? `${name}:${itemName}` : `/${name}:${itemName}`,
          tools: toList(data.tools),
          ...(data.model ? { model: String(data.model) } : {}),
          hasBody: addBody(id, body), searchText: searchText(`${description} ${body}`),
        });
      }
    }

    const skills = children.filter((c) => c.kind === 'skill');
    const readme = readText(join(dir, 'README.md')) ?? '';
    const changelog = readText(join(dir, 'CHANGELOG.md'));
    const compat = readText(join(dir, 'COMPATIBILITY.md'));
    const dependencies = (manifest.dependencies ?? []).map((d) =>
      typeof d === 'string' ? { name: d } : { name: d.name, ...(d.version ? { version: d.version } : {}) });

    entries.push({
      ...base, ...common, id: pluginId,
      description: entry.description ?? manifest.description ?? '',
      hasBody: addBody(pluginId, readme),
      searchText: searchText(`${entry.description ?? manifest.description ?? ''} ${readme}`),
      dependencies,
      compatibility: compat ? parseCompatibility(compat) : null,
      releases: changelog ? parseChangelog(changelog) : [],
      hooks: existsSync(join(dir, 'hooks', 'hooks.json')),
      mcpServers: existsSync(join(dir, '.mcp.json')),
      cost: {
        alwaysLoadedTokens: skills.reduce((n, s) => n + s.metadataTokens, 0),
        onInvokeTokens: skills.reduce((n, s) => n + s.bodyTokens, 0),
      },
    });
    for (const c of children) {
      delete c.metadataTokens;
      delete c.bodyTokens;
    }
    entries.push(...children);
  }

  const index = {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    marketplace: {
      name: marketplace.name,
      description: marketplace.description ?? '',
      owner: marketplace.owner?.name ?? '',
      repoUrl,
    },
    entries,
  };
  return { index, bodies, problems };
}

function main() {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const outIdx = args.indexOf('--out');
  const out = outIdx >= 0 ? resolve(args[outIdx + 1]) : join(root, 'site', 'public');

  const { index, bodies, problems } = build(root);
  if (problems.length) {
    console.error('Index problems:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
  const plugins = index.entries.filter((e) => e.kind === 'plugin').length;
  const skills = index.entries.filter((e) => e.kind === 'skill').length;
  if (check) {
    console.log(`OK: ${plugins} plugins, ${skills} skills, ${index.entries.length - plugins - skills} agents and commands (nothing written).`);
    return;
  }
  rmSync(join(out, 'bodies'), { recursive: true, force: true });
  for (const [id, text] of Object.entries(bodies)) {
    const file = join(out, 'bodies', `${id}.md`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text + '\n');
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'index.json'), JSON.stringify(index) + '\n');
  console.log(`Wrote ${join(out, 'index.json')} (${index.entries.length} entries, ${Object.keys(bodies).length} texts).`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
