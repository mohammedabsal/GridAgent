import React, { useEffect, useState } from 'react';
import { Dashboard, resolveSubRoute } from './pages/Dashboard';
import { Landing } from './pages/Landing';

const normalizePath = (raw: string): string => {
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
};

export function App() {
  const [path, setPath] = useState<string>(() =>
    normalizePath(window.location.pathname)
  );

  useEffect(() => {
    const onPopState = () => setPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // The GridAgent application lives at /app with separated sub-screens.
  // NOTE: no `key={path}` — remounting on every nav would wipe activeNav
  // state and could flash the landing page during navigation.
  // Keep the console mounted once entered: any in-app nav event that
  // rewrites history to /app/* must stay on Dashboard even if the popstate
  // event races. Only explicit navigation back to `/` shows Landing.
  const inApp =
    path === '/app' ||
    path.startsWith('/app/') ||
    (typeof window !== 'undefined' &&
      normalizePath(window.location.pathname).startsWith('/app'));
  if (inApp) {
    // Canonical path drives the visible section; Dashboard also mirrors
    // it internally via initialSection so back/forward stays in sync.
    const canonical =
      path === '/app' || path.startsWith('/app/')
        ? path
        : normalizePath(window.location.pathname);
    return <Dashboard initialSection={resolveSubRoute(canonical)} />;
  }

  // Every other path renders the public landing page.
  return <Landing />;
}

export default App;

