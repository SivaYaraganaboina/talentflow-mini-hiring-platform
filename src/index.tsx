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
    
    // Enhanced MSW startup for production stability
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      },
      quiet: false // Always show logs for debugging
    });
    
    console.log('✅ MSW initialized successfully');
    
    // Wait for service worker to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test MSW functionality
    try {
      const testResponse = await fetch('/api/jobs?page=1&pageSize=1');
      if (testResponse.ok) {
        console.log('✅ MSW API test successful');
      } else {
        console.warn('⚠️ MSW API test failed, fallback will handle requests');
      }
    } catch (testError) {
      console.warn('⚠️ MSW test request failed, fallback active');
    }
  } catch (error) {
    console.error('❌ MSW initialization failed, using IndexedDB fallback:', error);
    // Continue execution - robust fallback system will handle all API calls
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
