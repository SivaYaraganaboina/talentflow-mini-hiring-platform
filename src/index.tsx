import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Initialize MSW as required by technical assignment
async function initializeApp() {
  try {
    // Initialize database first
    const { initializeDatabase } = await import('./services/database');
    await initializeDatabase();
    
    // Start MSW worker (assignment requirement)
    const { worker } = await import('./services/mockApi');
    
    // Production-optimized MSW startup
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js',
        options: {
          scope: '/'
        }
      },
      quiet: process.env.NODE_ENV === 'production'
    });
    
    console.log('MSW initialized for assignment compliance');
    
    // Brief delay for service worker registration
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (error) {
    console.error('MSW initialization failed, using fallback:', error);
    // Continue execution - fallback will handle API calls
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
