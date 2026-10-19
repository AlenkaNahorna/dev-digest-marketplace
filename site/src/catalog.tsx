import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Entry, Index, Release } from './types';
import { compareReleases } from './releases';

// Loads public/index.json once and shares it; long texts are fetched per page from bodies/.

let indexPromise: Promise<Index> | null = null;

function loadIndex(): Promise<Index> {
  indexPromise ??= fetch('index.json')
    .then((res) => {
      if (!res.ok) throw new Error(`index.json: HTTP ${res.status}`);
      return res.json() as Promise<Index>;
    })
    .then((index) => {
      if (index.schemaVersion !== 1) throw new Error('Unsupported index.json schema');
      return index;
    });
  return indexPromise;
}

const CatalogContext = createContext<Index | null>(null);

export function CatalogProvider({ children, fallback }: { children: ReactNode; fallback: (state: 'loading' | 'error') => ReactNode }) {
  const [state, setState] = useState<{ index: Index | null; error: boolean }>({ index: null, error: false });
  useEffect(() => {
    let live = true;
    loadIndex().then(
      (index) => live && setState({ index, error: false }),
      () => live && setState({ index: null, error: true }),
    );
    return () => {
      live = false;
    };
  }, []);
  if (!state.index) return <>{fallback(state.error ? 'error' : 'loading')}</>;
  return <CatalogContext.Provider value={state.index}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): Index {
  const index = useContext(CatalogContext);
  if (!index) throw new Error('useCatalog must be used inside CatalogProvider');
  return index;
}

/** Markdown text of an entry, or null while loading / when there is none. */
export function useBody(entry: Entry): { text: string | null; failed: boolean } {
  const [state, setState] = useState<{ id: string; text: string | null; failed: boolean }>({ id: '', text: null, failed: false });
  useEffect(() => {
    if (!entry.hasBody) return;
    let live = true;
    fetch(`bodies/${entry.id}.md`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then(
        (text) => live && setState({ id: entry.id, text, failed: false }),
        () => live && setState({ id: entry.id, text: null, failed: true }),
      );
    return () => {
      live = false;
    };
  }, [entry.id, entry.hasBody]);
  return state.id === entry.id ? { text: state.text, failed: state.failed } : { text: null, failed: false };
}

export interface ReleaseItem extends Release {
  plugin: string;
}

/** Every release of every plugin, newest first: by date, then version (undated last). */
export function allReleases(entries: Entry[]): ReleaseItem[] {
  return entries
    .flatMap((e) => (e.releases ?? []).map((r) => ({ ...r, plugin: e.name })))
    .sort(compareReleases);
}

export const findEntry = (entries: Entry[], id: string): Entry | undefined => entries.find((e) => e.id === id);
export const childrenOf = (entries: Entry[], plugin: string): Entry[] => entries.filter((e) => e.plugin === plugin && e.kind !== 'plugin');
