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
    
    // Start MSW worker with production debugging
    const { worker } = await import('./services/mockApi');
    
    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.error('Service Worker not supported - MSW will not work');
      return;
    }
    
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      },
      quiet: false
    });
    
    console.log('MSW worker start initiated...');
    
    // Wait longer for service worker registration
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check service worker registration
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('Service Worker registered successfully:', registration.scope);
    } else {
      console.error('Service Worker registration failed');
    }
    
    // Test MSW functionality
    try {
      const testResponse = await fetch('/api/jobs?page=1&pageSize=1');
      console.log('MSW test response status:', testResponse.status);
      if (testResponse.ok) {
        const data = await testResponse.json();
        console.log('MSW working - got data:', data.jobs?.length || 0, 'jobs');
      } else {
        console.error('MSW test failed - status:', testResponse.status);
      }
    } catch (testError) {
      console.error('MSW test request failed:', testError);
    }
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
