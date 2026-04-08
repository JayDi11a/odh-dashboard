import React from 'react';

// Lazy load to avoid resolving dependencies at build time
const LazyOpenclawApp = React.lazy(() => import('./LazyOpenclawApp'));

const OpenclawWrapper: React.FC = () => (
  <React.Suspense fallback={<div>Loading OpenClaw...</div>}>
    <LazyOpenclawApp />
  </React.Suspense>
);

export default OpenclawWrapper;
