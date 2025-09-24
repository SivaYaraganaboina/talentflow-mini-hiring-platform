import { offlineQueue } from '../services/offlineQueue';

// API utility with retry logic and offline support
export const apiCall = async (url: string, options?: RequestInit, retries = 3): Promise<Response> => {
  // Check if online
  if (!navigator.onLine && options && (options.method === 'POST' || options.method === 'PATCH' || options.method === 'DELETE')) {
    // Queue write operations when offline
    offlineQueue.addRequest(url, options);
    // Return a mock successful response for optimistic updates
    return new Response(JSON.stringify({ success: true, queued: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // Check if response is HTML (indicates MSW not working)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error('Received HTML instead of JSON - MSW may not be ready');
      }
      
      return response;
    } catch (error) {
      console.warn(`API call attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        // If this is a write operation and we've exhausted retries, queue it
        if (options && (options.method === 'POST' || options.method === 'PATCH' || options.method === 'DELETE')) {
          offlineQueue.addRequest(url, options);
          return new Response(JSON.stringify({ success: true, queued: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
    }
  }
  
  throw new Error('All retry attempts failed');
};