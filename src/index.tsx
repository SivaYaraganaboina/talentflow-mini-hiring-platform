import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Initialize MSW with production fix
async function initializeApp() {
  try {
    // Initialize database first
    const { initializeDatabase } = await import('./services/database');
    await initializeDatabase();
    
    // Check if we're in production and handle MSW differently
    if (process.env.NODE_ENV === 'production') {
      // In production, try to register service worker manually
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/mockServiceWorker.js', {
            scope: '/',
          });
          console.log('Service worker registered manually');
          
          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('Service worker is ready');
          
          // Now start MSW
          const { worker } = await import('./services/mockApi');
          await worker.start({
            onUnhandledRequest: 'bypass',
            quiet: false
          });
          console.log('MSW worker started in production');
          
          // Wait for MSW to be fully ready
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (swError) {
          console.warn('Service worker registration failed:', swError);
        }
      }
    } else {
      // Development mode - normal MSW startup
      const { worker } = await import('./services/mockApi');
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js'
        },
        quiet: false
      });
      console.log('MSW worker started in development');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
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
