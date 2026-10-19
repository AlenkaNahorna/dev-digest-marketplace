import { allReleases, useCatalog } from '../catalog';
import { Empty, Markdown } from '../components/Common';
import { pluginHref } from '../route';

export function WhatsNew() {
  const { entries } = useCatalog();
  const releases = allReleases(entries);

  return (
    <section>
      <h1>What's new</h1>
      {releases.length === 0 ? (
        <Empty title="No releases yet">
          <p>Releases appear here from each plugin's CHANGELOG.md.</p>
        </Empty>
      ) : (
        releases.map((r) => (
          <div key={`${r.plugin}@${r.version}`} className="release">
            <h3>
              <a href={pluginHref(r.plugin)}>{r.plugin}</a> <span className="pill mono">v{r.version}</span>{' '}
              <span className="faint mono">{r.date ?? ''}</span>
            </h3>
            {r.notes && <Markdown text={r.notes} />}
          </div>
        ))
      )}
    </section>
  );
}
