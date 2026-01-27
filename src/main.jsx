import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Import file registrasi
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Render Aplikasi
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Aktifkan Service Worker agar bisa di-install
serviceWorkerRegistration.register();
