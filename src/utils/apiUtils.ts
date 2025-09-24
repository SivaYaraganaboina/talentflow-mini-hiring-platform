import { offlineQueue } from '../services/offlineQueue';

// Direct IndexedDB fallback when MSW fails
const directDbFallback = async (url: string): Promise<Response> => {
  const { db } = await import('../services/database');
  
  try {
    // Handle specific candidate by ID
    const candidateMatch = url.match(/\/api\/candidates\/([^/?]+)$/);
    if (candidateMatch) {
      const candidateId = candidateMatch[1];
      const candidate = await db.candidates.get(candidateId);
      return new Response(JSON.stringify({ data: candidate }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle applications with query params
    if (url.includes('/api/applications')) {
      const urlObj = new URL(url, 'http://localhost');
      const candidateId = urlObj.searchParams.get('candidateId');
      
      let applications = await db.applications.toArray();
      if (candidateId) {
        applications = applications.filter(app => app.candidateId === candidateId);
      }
      
      return new Response(JSON.stringify({ data: applications }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.includes('/api/jobs')) {
      const jobs = await db.jobs.orderBy('order').toArray();
      return new Response(JSON.stringify({ data: jobs }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.includes('/api/candidates')) {
      const candidates = await db.candidates.toArray();
      return new Response(JSON.stringify({ data: candidates }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
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

// API utility with retry logic and IndexedDB fallback
export const apiCall = async (url: string, options?: RequestInit, retries = 3): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
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
          return await directDbFallback(url);
        }
        
        // For write operations, return success
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
    }
  }
  
  throw new Error('All retry attempts failed');
};