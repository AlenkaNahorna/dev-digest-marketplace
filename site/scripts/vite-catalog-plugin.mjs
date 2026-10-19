// Dev only: when a plugin or marketplace.json changes, rebuild public/index.json and reload the page.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = join(siteRoot, '..');

/** @returns {import('vite').Plugin} */
export function catalogData() {
  return {
    name: 'catalog-data',
    apply: 'serve',
    configureServer(server) {
      const watched = [join(repoRoot, 'plugins'), join(repoRoot, '.claude-plugin')];
      server.watcher.add(watched);
      let timer;
      server.watcher.on('all', (_event, file) => {
        if (!watched.some((dir) => file.startsWith(dir))) return;
        clearTimeout(timer);
        timer = setTimeout(() => {
          try {
            execFileSync(process.execPath, ['scripts/build-index.mjs'], { cwd: siteRoot, stdio: 'inherit' });
            server.ws.send({ type: 'full-reload' });
          } catch {
            // The builder has already printed what is wrong; keep serving the last good index.
          }
        }, 150);
      });
    },
  };
}
