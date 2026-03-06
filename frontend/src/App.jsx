import React from 'react';
import Dashboard from './pages/Dashboard';
import { ThemeProvider } from './context/ThemeProvider';

function App() {
  return (
    <ThemeProvider>
      <div data-testid="app-root">
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;
