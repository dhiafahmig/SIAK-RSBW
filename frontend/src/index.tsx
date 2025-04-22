// Import utilitas tema terlebih dahulu untuk inisialisasi dark mode
import './utils/theme';

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Cek dan inisialisasi dark mode sebelum render
(function initializeDarkMode() {
  const darkMode = localStorage.getItem('darkMode');
  if (darkMode === 'true') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
})();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 