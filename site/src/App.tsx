import { useEffect } from 'react';
import { CatalogProvider } from './catalog';
import { Empty } from './components/Common';
import { Layout } from './components/Layout';
import { useLocation } from './route';
import { Artifact } from './pages/Artifact';
import { GettingStarted } from './pages/GettingStarted';
import { Home } from './pages/Home';
import { Plugin } from './pages/Plugin';
import { Search } from './pages/Search';
import { WhatsNew } from './pages/WhatsNew';

function Routes() {
  const { segments } = useLocation();
  const path = segments.join('/');

  // Searching rewrites the URL while typing; only real page changes scroll to the top.
  const page = segments[0] ?? '';
  const scrollKey = page === 'search' ? 'search' : path;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [scrollKey]);

  switch (page) {
    case '':
      return <Home />;
    case 'search':
      return <Search />;
    case 'plugin':
      return segments[1] ? <Plugin name={segments[1]} /> : <Home />;
    case 'artifact':
      return segments.length === 4 ? <Artifact id={path} /> : <Home />;
    case 'whats-new':
      return <WhatsNew />;
    case 'getting-started':
      return <GettingStarted />;
    default:
      return (
        <Empty title="Page not found">
          <a href="#/">Back to the catalog</a>
        </Empty>
      );
  }
}

export function App() {
  return (
    <CatalogProvider
      fallback={(state) => (
        <main className="container">
          <p role={state === 'error' ? 'alert' : 'status'}>{state === 'error' ? 'Catalog data could not be loaded.' : 'Loading…'}</p>
        </main>
      )}
    >
      <Layout>
        <Routes />
      </Layout>
    </CatalogProvider>
  );
}
