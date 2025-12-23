// Entry point alternativo para acessar apenas o Dashboard
// Use: npm run dev -- --open /dashboard ou acesse diretamente via rota

import React from 'react';
import ReactDOM from 'react-dom/client';
import Dashboard from './pages/Dashboard';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>
);

