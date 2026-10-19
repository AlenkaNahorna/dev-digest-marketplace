import { allReleases, useCatalog } from '../catalog';
import { Empty } from '../components/Common';
import { navigate, pluginHref } from '../route';
import { KINDS, KIND_LABEL } from '../types';

export function Home() {
  const { entries, marketplace } = useCatalog();
  const releases = allReleases(entries).slice(0, 4);

  return (
    <>
      <section className="hero">
        <p className="eyebrow mono">Plugins · skills · agents · commands</p>
        <h1>Find what you need and install it with one copy-paste</h1>
        <p className="lead">{marketplace.description}</p>
        <form
          className="hero-search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = String(new FormData(e.currentTarget).get('q') ?? '').trim();
            navigate(q ? `search?q=${encodeURIComponent(q)}` : 'search');
          }}
        >
          <input name="q" type="search" placeholder="Search plugins, skills and agents" aria-label="Search the catalog" />
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>
      </section>

      {entries.length === 0 ? (
        <Empty title="The catalog is empty">
          <p>No plugins yet. Add one and it appears here after the next build.</p>
          <p>
            <a href="#/getting-started">Getting started</a>
          </p>
        </Empty>
      ) : (
        <>
          <section className="tiles" aria-label="Catalog size">
            {KINDS.filter((kind) => kind !== 'command').map((kind) => (
              <a key={kind} className="tile" href={`#/search?kind=${kind}`}>
                <strong className="mono">{entries.filter((e) => e.kind === kind).length}</strong>
                <span>{KIND_LABEL[kind]}</span>
              </a>
            ))}
          </section>

          {releases.length > 0 && (
            <section>
              <div className="section-head">
                <h2>What's new</h2>
                <a href="#/whats-new">All releases →</a>
              </div>
              <ul className="rows">
                {releases.map((r) => (
                  <li key={`${r.plugin}@${r.version}`}>
                    <a className="row" href={pluginHref(r.plugin)}>
                      <span className="pill mono">v{r.version}</span>
                      <strong>{r.plugin}</strong>
                      <span className="faint mono">{r.date ?? ''}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}
