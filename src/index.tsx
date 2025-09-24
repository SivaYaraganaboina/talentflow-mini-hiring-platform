import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Initialize MSW with better error handling
async function initializeApp() {
  try {
    // Initialize database first
    const { initializeDatabase } = await import('./services/database');
    await initializeDatabase();
    
    // Then start MSW
    const { worker } = await import('./services/mockApi');
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      },
      quiet: false
    });
    console.log('MSW worker started successfully');
    
    // Wait longer for MSW to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('Failed to start MSW worker:', error);
    // Continue without MSW - app will use fallback
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
