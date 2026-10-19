import { describe, expect, it } from 'vitest';
import { applyFacets, countBy, queryToParams, readQuery, search, textMatches, type Query } from './search';
import type { Entry } from './types';

function entry(over: Partial<Entry>): Entry {
  return {
    id: `artifact/p/skill/${over.name}`, kind: 'skill', name: 'x', plugin: 'p', description: '', keywords: [], author: 'Team A',
    version: '1.0.0', updated: '2026-01-01', install: '/plugin install p@m', githubUrl: '', hasBody: false, searchText: '', ...over,
  };
}

const entries = [
  entry({ name: 'zod', description: 'Schema validation', keywords: ['typescript'], updated: '2026-03-01' }),
  entry({ name: 'react-testing', description: 'Test React components', keywords: ['react', 'testing'], searchText: 'userEvent and queries' }),
  entry({ id: 'plugin/p', kind: 'plugin', name: 'p', description: 'Shared skills', author: 'Team B', updated: null }),
];
const base: Query = { q: '', kinds: [], keywords: [], author: null, sort: 'relevance' };

describe('search', () => {
  it('requires every word to match somewhere', () => {
    expect(textMatches(entries, 'react testing').map((s) => s.entry.name)).toEqual(['react-testing']);
    expect(textMatches(entries, 'react zod')).toEqual([]);
  });

  it('finds text from the body and the plugin name', () => {
    expect(search(entries, { ...base, q: 'userevent' }).map((e) => e.name)).toEqual(['react-testing']);
    expect(search(entries, { ...base, q: 'p' }).length).toBe(3);
  });

  it('ranks a name hit above a description hit', () => {
    const list = [entry({ name: 'a', description: 'about zod' }), entry({ name: 'zod' })];
    expect(search(list, { ...base, q: 'zod' }).map((e) => e.name)).toEqual(['zod', 'a']);
  });

  it('filters by kind, keyword and author', () => {
    const all = textMatches(entries, '');
    expect(applyFacets(all, { ...base, kinds: ['plugin'] }).length).toBe(1);
    expect(applyFacets(all, { ...base, keywords: ['react'] }).length).toBe(1);
    expect(applyFacets(all, { ...base, author: 'Team B' }).length).toBe(1);
  });

  it('sorts by name and by update date, newest first, undated last', () => {
    expect(search(entries, { ...base, sort: 'name' }).map((e) => e.name)).toEqual(['p', 'react-testing', 'zod']);
    expect(search(entries, { ...base, sort: 'updated' }).map((e) => e.name)).toEqual(['zod', 'react-testing', 'p']);
  });

  it('counts facet values', () => {
    expect(countBy(textMatches(entries, ''), (e) => e.keywords)[0]).toEqual(['react', 1]);
  });

  it('round-trips the query through URL parameters and ignores junk', () => {
    const query: Query = { q: 'react', kinds: ['skill', 'agent'], keywords: ['a'], author: 'Team A', sort: 'name' };
    expect(readQuery(queryToParams(query))).toEqual(query);
    expect(readQuery(new URLSearchParams('kind=bogus&sort=nope')).kinds).toEqual([]);
    expect(readQuery(new URLSearchParams('sort=nope')).sort).toBe('relevance');
  });
});
