import React from 'react';
import Dashboard from './pages/Dashboard';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  console.log("App.jsx: Rendering...");
  return (
    <ThemeProvider>
      <div data-testid="app-root">
        <Dashboard />
      </div>
    </ThemeProvider>
  );
}

export default App;
