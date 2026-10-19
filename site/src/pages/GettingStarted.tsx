import { useCatalog } from '../catalog';
import { CommandBox } from '../components/Common';

export function GettingStarted() {
  const { marketplace, entries } = useCatalog();
  const repo = marketplace.repoUrl?.replace('https://github.com/', '') ?? `<owner>/${marketplace.name}`;
  const example = entries.find((e) => e.kind === 'plugin')?.install;

  return (
    <section>
      <h1>Getting started</h1>
      <p className="lead">Install plugins from inside Claude Code. This site is for finding them.</p>
      <ol className="steps">
        <li>
          <h2>Add the marketplace</h2>
          <p>Registers this repository as a plugin source.</p>
          <CommandBox command={`/plugin marketplace add ${repo}`} />
        </li>
        <li>
          <h2>Install a plugin</h2>
          <p>Pick a plugin in the catalog and copy its install command{example ? '. For example:' : '.'}</p>
          {example && <CommandBox command={example} />}
        </li>
        <li>
          <h2>Update</h2>
          <p>Refresh the list of sources, then update the plugin. Run /reload-plugins to apply it in an open session.</p>
          <CommandBox command="/plugin marketplace update" />
        </li>
      </ol>
    </section>
  );
}
