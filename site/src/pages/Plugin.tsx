import { childrenOf, findEntry, useBody, useCatalog } from '../catalog';
import { CommandBox, Empty, KindBadge, Markdown } from '../components/Common';
import { entryHref, pluginHref } from '../route';
import { KIND_LABEL, type Entry, type Kind } from '../types';

const CHILD_KINDS: Kind[] = ['skill', 'agent', 'command'];

export function Plugin({ name }: { name: string }) {
  const { entries } = useCatalog();
  const plugin = findEntry(entries, `plugin/${name}`);
  if (!plugin) return <Empty title="Plugin not found">{<a href="#/search">Back to the catalog</a>}</Empty>;
  return <PluginDetail plugin={plugin} entries={entries} />;
}

function PluginDetail({ plugin, entries }: { plugin: Entry; entries: Entry[] }) {
  const readme = useBody(plugin);
  const children = childrenOf(entries, plugin.name);
  const releases = plugin.releases ?? [];

  return (
    <article>
      <p className="crumbs">
        <a href="#/search?kind=plugin">Plugins</a> / {plugin.name}
      </p>
      <header className="detail-head">
        <div>
          <KindBadge kind="plugin" />
          <h1>{plugin.name}</h1>
          <p className="lead">{plugin.description}</p>
        </div>
        {plugin.githubUrl && (
          <a className="btn" href={plugin.githubUrl} target="_blank" rel="noopener noreferrer">
            View on GitHub ↗
          </a>
        )}
      </header>

      <CommandBox command={plugin.install} />

      <dl className="facts">
        <div>
          <dt>Version</dt>
          <dd className="mono">{plugin.version ? `v${plugin.version}` : 'remote'}</dd>
        </div>
        <div>
          <dt>Author</dt>
          <dd>{plugin.author ?? '—'}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd className="mono">{plugin.updated ?? '—'}</dd>
        </div>
        <div>
          <dt>Compatibility</dt>
          <dd className="mono">{plugin.compatibility ? `Claude Code ${plugin.compatibility}` : '—'}</dd>
        </div>
        {plugin.cost && (
          <div>
            <dt>Context cost</dt>
            <dd className="mono" title="Estimated tokens: always loaded / loaded when skills run">
              ~{plugin.cost.alwaysLoadedTokens} / ~{plugin.cost.onInvokeTokens}
            </dd>
          </div>
        )}
      </dl>

      {(plugin.hooks || plugin.mcpServers) && (
        <p className="warn" role="note">
          This plugin includes {[plugin.hooks && 'hooks', plugin.mcpServers && 'MCP servers'].filter(Boolean).join(' and ')} that run code on your machine.
        </p>
      )}

      {(plugin.dependencies ?? []).length > 0 && (
        <section>
          <h2>Dependencies</h2>
          <ul className="chips">
            {(plugin.dependencies ?? []).map((d) => (
              <li key={d.name}>
                {findEntry(entries, `plugin/${d.name}`) ? <a className="chip mono" href={pluginHref(d.name)}>{d.name}{d.version ? ` ${d.version}` : ''}</a> : <span className="chip mono">{d.name}{d.version ? ` ${d.version}` : ''}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {CHILD_KINDS.map((kind) => {
        const items = children.filter((c) => c.kind === kind);
        if (items.length === 0) return null;
        return (
          <section key={kind}>
            <h2>
              {KIND_LABEL[kind]} <span className="faint mono">{items.length}</span>
            </h2>
            <ul className="rows">
              {items.map((item) => (
                <li key={item.id}>
                  <a className="row" href={entryHref(item)}>
                    <strong>{item.name}</strong>
                    <span className="faint clamp-1">{item.description}</span>
                    {item.invocation && <span className="mono accent">{item.invocation}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {readme.text && (
        <section>
          <h2>README</h2>
          <Markdown text={readme.text} />
        </section>
      )}

      {releases.length > 0 && (
        <section>
          <h2>Changelog</h2>
          {releases.map((r) => (
            <div key={r.version} className="release">
              <h3>
                <span className="mono">v{r.version}</span> <span className="faint mono">{r.date ?? ''}</span>
              </h3>
              {r.notes && <Markdown text={r.notes} />}
            </div>
          ))}
        </section>
      )}
    </article>
  );
}
