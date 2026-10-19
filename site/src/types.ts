// Shape of public/index.json, written by scripts/build-index.mjs (schemaVersion 1).

export type Kind = 'plugin' | 'skill' | 'agent' | 'command';

export const KINDS: Kind[] = ['plugin', 'skill', 'agent', 'command'];
export const KIND_LABEL: Record<Kind, string> = { plugin: 'Plugins', skill: 'Skills', agent: 'Agents', command: 'Commands' };
export const KIND_NAME: Record<Kind, string> = { plugin: 'Plugin', skill: 'Skill', agent: 'Agent', command: 'Command' };

export interface Release {
  version: string;
  date: string | null;
  notes: string;
}

export interface Dependency {
  name: string;
  version?: string;
}

export interface Entry {
  /** Route path and text file name: `plugin/<name>` or `artifact/<plugin>/<kind>/<name>`. */
  id: string;
  kind: Kind;
  name: string;
  plugin: string;
  description: string;
  keywords: string[];
  author: string | null;
  version: string | null;
  /** Date (YYYY-MM-DD) of the last commit that touched the plugin. */
  updated: string | null;
  install: string;
  githubUrl: string;
  /** True when `bodies/<id>.md` exists. */
  hasBody: boolean;
  /** Description plus the start of the text, lower-cased at search time. */
  searchText: string;
  // skills, agents and commands
  invocation?: string;
  tools?: string[];
  model?: string;
  // plugins only
  remote?: boolean;
  dependencies?: Dependency[];
  compatibility?: string | null;
  releases?: Release[];
  hooks?: boolean;
  mcpServers?: boolean;
  cost?: { alwaysLoadedTokens: number; onInvokeTokens: number };
}

export interface Index {
  schemaVersion: 1;
  generatedAt: string;
  marketplace: { name: string; description: string; owner: string; repoUrl: string | null };
  entries: Entry[];
}
