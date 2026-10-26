import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Minimal entry point so the SPA actually builds and runs. The previous
// repository shipped no index.html/main.tsx at all — another symptom of
// the scaffold never having been functional.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
