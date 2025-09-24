import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Initialize MSW in development
async function initializeApp() {
  if (process.env.NODE_ENV === 'development') {
    try {
      const { worker } = await import('./services/mockApi');
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js'
        }
      });
      console.log('MSW worker started successfully');
      // Add delay to ensure MSW is fully ready
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Failed to start MSW worker:', error);
    }
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
