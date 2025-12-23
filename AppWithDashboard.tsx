// Versão do App que permite acessar o Dashboard via ?dashboard=true
// Use este arquivo apenas para desenvolvimento/testes do dashboard
// NÃO substitua o App.tsx original!

import React from 'react';
import App from './App';
import Dashboard from './pages/Dashboard';

const AppWithDashboard: React.FC = () => {
  // Verifica se deve mostrar o dashboard via query string
  const urlParams = new URLSearchParams(window.location.search);
  const showDashboard = urlParams.get('dashboard') === 'true' || window.location.hash === '#dashboard';

  if (showDashboard) {
    return <Dashboard />;
  }

  return <App />;
};

export default AppWithDashboard;

