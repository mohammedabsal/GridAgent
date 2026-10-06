import React, { useEffect, useState } from 'react';
import { Dashboard } from './pages/Dashboard';
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

  // The existing GridAgent application lives at /app and is rendered untouched.
  if (path === '/app') {
    return <Dashboard />;
  }

  // Every other path renders the public landing page.
  return <Landing />;
}

export default App;

