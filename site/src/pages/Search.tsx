import { useMemo } from 'react';
import { useCatalog } from '../catalog';
import { Empty, ResultCard } from '../components/Common';
import { navigate, useLocation } from '../route';
import { applyFacets, countBy, queryToParams, readQuery, sortScored, textMatches, type Query, type Sort } from '../search';
import { KINDS, KIND_LABEL } from '../types';

const toggle = <T,>(list: T[], value: T): T[] => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

export function Search() {
  const { entries } = useCatalog();
  const loc = useLocation();
  const query = useMemo(() => readQuery(loc.params), [loc]);
  const matched = useMemo(() => textMatches(entries, query.q), [entries, query.q]);
  const results = useMemo(() => sortScored(applyFacets(matched, query), query.sort), [matched, query]);

  const kindCounts = new Map(countBy(matched, (e) => [e.kind]));
  const keywords = countBy(matched, (e) => e.keywords).slice(0, 20);
  const authors = countBy(matched, (e) => (e.author ? [e.author] : []));

  const update = (patch: Partial<Query>) => navigate(`search?${queryToParams({ ...query, ...patch }).toString()}`, true);
  const filtered = query.kinds.length > 0 || query.keywords.length > 0 || query.author !== null;

  return (
    <div className="search-layout">
      <aside className="facets" aria-label="Filters">
        <div className="facet-head">
          <h2>Filters</h2>
          {filtered && (
            <button type="button" className="link-btn" onClick={() => update({ kinds: [], keywords: [], author: null })}>
              Clear
            </button>
          )}
        </div>

        <h3>Type</h3>
        {KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            className="facet"
            aria-pressed={query.kinds.includes(kind)}
            onClick={() => update({ kinds: toggle(query.kinds, kind) })}
          >
            <span className={`dot dot-${kind}`} aria-hidden="true" />
            <span>{KIND_LABEL[kind]}</span>
            <span className="faint mono">{kindCounts.get(kind) ?? 0}</span>
          </button>
        ))}

        {keywords.length > 0 && (
          <>
            <h3>Keywords</h3>
            <div className="chips">
              {keywords.map(([kw, n]) => (
                <button
                  key={kw}
                  type="button"
                  className="chip mono"
                  aria-pressed={query.keywords.includes(kw)}
                  onClick={() => update({ keywords: toggle(query.keywords, kw) })}
                  title={`${n} results`}
                >
                  {kw}
                </button>
              ))}
            </div>
          </>
        )}

        {authors.length > 0 && (
          <>
            <h3>Author</h3>
            {authors.map(([author, n]) => (
              <button
                key={author}
                type="button"
                className="facet"
                aria-pressed={query.author === author}
                onClick={() => update({ author: query.author === author ? null : author })}
              >
                <span>{author}</span>
                <span className="faint mono">{n}</span>
              </button>
            ))}
          </>
        )}
      </aside>

      <section>
        <div className="section-head">
          <div>
            <h1>{query.q ? `Results for “${query.q}”` : 'All artifacts'}</h1>
            <p className="faint">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
          </div>
          <label className="sort">
            <span className="faint">Sort</span>
            <select value={query.sort} onChange={(e) => update({ sort: e.target.value as Sort })}>
              <option value="relevance">Relevance</option>
              <option value="name">Name</option>
              <option value="updated">Recently updated</option>
            </select>
          </label>
        </div>

        {results.length === 0 ? (
          <Empty title="Nothing found">
            <p>Try fewer words or clear the filters.</p>
          </Empty>
        ) : (
          <div className="grid">
            {results.map((entry) => (
              <ResultCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
