import { KINDS, type Entry, type Kind } from './types';

export type Sort = 'relevance' | 'name' | 'updated';

export interface Query {
  q: string;
  kinds: Kind[];
  keywords: string[];
  author: string | null;
  sort: Sort;
}

export interface Scored {
  entry: Entry;
  score: number;
}

const SORTS: Sort[] = ['relevance', 'name', 'updated'];

export function tokenize(q: string): string[] {
  return q.toLowerCase().split(/\s+/).filter(Boolean);
}

/** 0 means "does not match". Every word must match somewhere; name hits count most. */
export function score(entry: Entry, tokens: string[]): number {
  if (tokens.length === 0) return 1;
  const name = `${entry.name} ${entry.plugin}`.toLowerCase();
  const keywords = entry.keywords.join(' ').toLowerCase();
  const description = entry.description.toLowerCase();
  const text = entry.searchText.toLowerCase();
  let total = 0;
  for (const t of tokens) {
    let hit = 0;
    if (name.includes(t)) hit += 5;
    if (entry.name.toLowerCase().startsWith(t)) hit += 3;
    if (keywords.includes(t)) hit += 3;
    if (description.includes(t)) hit += 2;
    if (text.includes(t)) hit += 1;
    if (hit === 0) return 0;
    total += hit;
  }
  return total;
}

/** Entries matching the words of `q`, ignoring facets. Facet counts are computed from this list. */
export function textMatches(entries: Entry[], q: string): Scored[] {
  const tokens = tokenize(q);
  return entries.map((entry) => ({ entry, score: score(entry, tokens) })).filter((s) => s.score > 0);
}

export function applyFacets(list: Scored[], query: Query): Scored[] {
  return list.filter(({ entry }) => {
    if (query.kinds.length && !query.kinds.includes(entry.kind)) return false;
    if (query.keywords.length && !query.keywords.some((k) => entry.keywords.includes(k))) return false;
    if (query.author && entry.author !== query.author) return false;
    return true;
  });
}

export function sortScored(list: Scored[], sort: Sort): Entry[] {
  const byName = (a: Entry, b: Entry) => a.name.localeCompare(b.name);
  return [...list]
    .sort((a, b) => {
      if (sort === 'name') return byName(a.entry, b.entry);
      if (sort === 'updated') return (b.entry.updated ?? '').localeCompare(a.entry.updated ?? '') || byName(a.entry, b.entry);
      return b.score - a.score || KINDS.indexOf(a.entry.kind) - KINDS.indexOf(b.entry.kind) || byName(a.entry, b.entry);
    })
    .map((s) => s.entry);
}

export function search(entries: Entry[], query: Query): Entry[] {
  return sortScored(applyFacets(textMatches(entries, query.q), query), query.sort);
}

/** Count how often each value appears, most frequent first. */
export function countBy(list: Scored[], pick: (e: Entry) => string[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const { entry } of list) for (const v of new Set(pick(entry))) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

export function readQuery(params: URLSearchParams): Query {
  const list = (key: string) => (params.get(key) ?? '').split(',').filter(Boolean);
  const sort = params.get('sort');
  return {
    q: params.get('q') ?? '',
    kinds: list('kind').filter((k): k is Kind => (KINDS as string[]).includes(k)),
    keywords: list('kw'),
    author: params.get('author') || null,
    sort: SORTS.find((s) => s === sort) ?? 'relevance',
  };
}

export function queryToParams(query: Query): URLSearchParams {
  const p = new URLSearchParams();
  if (query.q) p.set('q', query.q);
  if (query.kinds.length) p.set('kind', query.kinds.join(','));
  if (query.keywords.length) p.set('kw', query.keywords.join(','));
  if (query.author) p.set('author', query.author);
  if (query.sort !== 'relevance') p.set('sort', query.sort);
  return p;
}
