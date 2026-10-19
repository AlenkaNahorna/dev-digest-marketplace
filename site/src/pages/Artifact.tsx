import { findEntry, useBody, useCatalog } from '../catalog';
import { CommandBox, Empty, KindBadge, Markdown } from '../components/Common';
import { pluginHref } from '../route';
import type { Entry } from '../types';

export function Artifact({ id }: { id: string }) {
  const { entries } = useCatalog();
  const entry = findEntry(entries, id);
  if (!entry) return <Empty title="Not found">{<a href="#/search">Back to the catalog</a>}</Empty>;
  return <ArtifactDetail entry={entry} />;
}

function ArtifactDetail({ entry }: { entry: Entry }) {
  const body = useBody(entry);
  return (
    <article>
      <p className="crumbs">
        <a href={pluginHref(entry.plugin)}>{entry.plugin}</a> / {entry.name}
      </p>
      <header className="detail-head">
        <div>
          <KindBadge kind={entry.kind} />
          <h1>{entry.name}</h1>
          <p className="lead">{entry.description}</p>
        </div>
        {entry.githubUrl && (
          <a className="btn" href={entry.githubUrl} target="_blank" rel="noopener noreferrer">
            View on GitHub ↗
          </a>
        )}
      </header>

      <p className="faint">Installed with its plugin:</p>
      <CommandBox command={entry.install} />

      <dl className="facts">
        {entry.invocation && (
          <div>
            <dt>{entry.kind === 'agent' ? 'Scoped name' : 'Invocation'}</dt>
            <dd className="mono">{entry.invocation}</dd>
          </div>
        )}
        {entry.model && (
          <div>
            <dt>Model</dt>
            <dd className="mono">{entry.model}</dd>
          </div>
        )}
        {entry.tools && entry.tools.length > 0 && (
          <div>
            <dt>Tools</dt>
            <dd className="mono">{entry.tools.join(', ')}</dd>
          </div>
        )}
        <div>
          <dt>Plugin version</dt>
          <dd className="mono">{entry.version ? `v${entry.version}` : '—'}</dd>
        </div>
      </dl>

      {body.text ? <Markdown text={body.text} /> : body.failed && <p className="warn">The text could not be loaded.</p>}
    </article>
  );
}
