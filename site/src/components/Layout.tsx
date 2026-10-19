import { useState, type ReactNode } from 'react';
import { useCatalog } from '../catalog';
import { navigate, useLocation } from '../route';

type Theme = 'light' | 'dark';

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === 'light' || set === 'dark') return set;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function Layout({ children }: { children: ReactNode }) {
  const { marketplace, generatedAt } = useCatalog();
  const loc = useLocation();
  const [theme, setTheme] = useState<Theme>(currentTheme);
  const onSearch = loc.segments[0] === 'search';
  const q = onSearch ? (loc.params.get('q') ?? '') : '';

  function toggleTheme() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      // storage can be blocked; the theme still applies for this visit
    }
    setTheme(next);
  }

  function onQuery(value: string) {
    const params = new URLSearchParams(onSearch ? loc.params : undefined);
    if (value) params.set('q', value);
    else params.delete('q');
    navigate(`search?${params.toString()}`, onSearch);
  }

  return (
    <>
      <header className="topbar">
        <a className="brand" href="#/">
          <span className="logo" aria-hidden="true">◆</span>
          <span>Catalog</span>
          <span className="pill mono">{marketplace.name}</span>
        </a>
        <input
          className="search-input"
          type="search"
          value={q}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search plugins, skills, agents…"
          aria-label="Search the catalog"
        />
        <nav className="nav" aria-label="Main">
          <a href="#/whats-new">What's new</a>
          <a href="#/getting-started">Getting started</a>
          {marketplace.repoUrl && (
            <a href={marketplace.repoUrl} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
          )}
        </nav>
        <button type="button" className="icon-btn" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          {theme === 'dark' ? '☾' : '☀'}
        </button>
      </header>
      <main className="container">{children}</main>
      <footer className="footer faint">
        {marketplace.name} · generated {generatedAt.slice(0, 10)}
      </footer>
    </>
  );
}
