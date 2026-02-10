import React from 'react';
import Dashboard from './pages/Dashboard';

function App() {
  console.log("App.jsx: Rendering...");
  return (
    <div data-testid="app-root">
      <Dashboard />
    </div>
  );
}

export default App;
