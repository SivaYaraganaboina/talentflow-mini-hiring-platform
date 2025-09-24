import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Initialize MSW for production deployment
async function initializeApp() {
  try {
    // Initialize database first
    const { initializeDatabase } = await import('./services/database');
    await initializeDatabase();
    
    // Start MSW worker
    const { worker } = await import('./services/mockApi');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      },
      quiet: process.env.NODE_ENV === 'production'
    });
    
    console.log('MSW worker started successfully');
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('Failed to start MSW worker:', error);
  }

  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
}

initializeApp();
