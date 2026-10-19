import { useMemo, useSyncExternalStore } from 'react';

// Hash routing: GitHub Pages cannot rewrite URLs, and `#/plugin/<name>` links survive a refresh.
// The URL is the single source of truth for the screen, the search text and the facets.

export interface Location {
  segments: string[];
  params: URLSearchParams;
}

const listeners = new Set<() => void>();
window.addEventListener('hashchange', () => listeners.forEach((l) => l()));

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** "search?q=x" for "#/search?q=x" */
const readHash = (): string => window.location.hash.replace(/^#\/?/, '');

export function parseLocation(raw: string): Location {
  const i = raw.indexOf('?');
  const path = i < 0 ? raw : raw.slice(0, i);
  const query = i < 0 ? '' : raw.slice(i + 1);
  return {
    segments: path.split('/').filter(Boolean).map((s) => decodeURIComponent(s)),
    params: new URLSearchParams(query),
  };
}

export function useLocation(): Location {
  const raw = useSyncExternalStore(subscribe, readHash);
  return useMemo(() => parseLocation(raw), [raw]);
}

/** `replace` rewrites the current history entry; use it while typing so Back is not flooded. */
export function navigate(to: string, replace = false): void {
  const hash = '#/' + to.replace(/^\/+/, '');
  if (replace) {
    window.history.replaceState(null, '', hash);
    listeners.forEach((l) => l());
  } else {
    window.location.hash = hash;
  }
}

const enc = encodeURIComponent;
export const pluginHref = (name: string): string => `#/plugin/${enc(name)}`;
export const entryHref = (e: { id: string; kind: string; plugin: string; name: string }): string =>
  e.kind === 'plugin' ? pluginHref(e.name) : `#/artifact/${enc(e.plugin)}/${e.kind}/${enc(e.name)}`;
export const searchHref = (params: URLSearchParams): string => {
  const s = params.toString();
  return '#/search' + (s ? `?${s}` : '');
};
