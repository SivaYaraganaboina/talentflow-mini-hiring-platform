import { offlineQueue } from '../services/offlineQueue';

// API utility with retry logic and offline support
// Direct IndexedDB fallback when MSW fails
const directDbFallback = async (url: string, options?: RequestInit): Promise<Response> => {
  const { db } = await import('../services/database');
  
  try {
    if (url.includes('/api/jobs') && (!options || options.method === 'GET')) {
      const jobs = await db.jobs.orderBy('order').toArray();
      return new Response(JSON.stringify({ data: jobs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.includes('/api/candidates') && (!options || options.method === 'GET')) {
      const candidates = await db.candidates.toArray();
      return new Response(JSON.stringify({ data: candidates }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default fallback
    return new Response(JSON.stringify({ data: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

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
        // Use direct IndexedDB fallback for GET requests
        if (!options || options.method === 'GET') {
          console.log('Using direct IndexedDB fallback');
          return await directDbFallback(url, options);
        }
        
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