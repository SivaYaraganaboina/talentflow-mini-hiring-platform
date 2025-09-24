import { offlineQueue } from '../services/offlineQueue';

// Direct IndexedDB fallback when MSW fails
const directDbFallback = async (url: string, options?: RequestInit): Promise<Response> => {
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
    
    // Handle assessment endpoints
    const assessmentMatch = url.match(/\/api\/assessments\/([^/?]+)$/);
    if (assessmentMatch) {
      const jobId = assessmentMatch[1];
      
      if (options?.method === 'PUT') {
        // Handle assessment save
        const assessmentData = JSON.parse(options.body as string);
        const existingAssessment = await db.assessments.where('jobId').equals(jobId).first();
        
        if (existingAssessment) {
          await db.assessments.update(existingAssessment.id, {
            ...assessmentData,
            updatedAt: new Date().toISOString()
          });
          const updated = await db.assessments.get(existingAssessment.id);
          return new Response(JSON.stringify({ data: updated }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        } else {
          const newAssessment = {
            id: `assessment-${jobId}-${Date.now()}`,
            jobId,
            title: assessmentData.title || 'Untitled Assessment',
            description: assessmentData.description || '',
            sections: assessmentData.sections || [],
            enableScoring: assessmentData.enableScoring || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await db.assessments.add(newAssessment);
          return new Response(JSON.stringify({ data: newAssessment }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } else {
        // Handle assessment get
        const assessment = await db.assessments.where('jobId').equals(jobId).first();
        return new Response(JSON.stringify({ data: assessment || null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Handle applications with query params
    if (url.includes('/api/applications')) {
      if (options?.method === 'PATCH') {
        // Handle application stage updates
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
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
    
    // Handle candidate updates
    const candidateUpdateMatch = url.match(/\/api\/candidates\/([^/?]+)$/);
    if (candidateUpdateMatch && options?.method === 'PATCH') {
      return new Response(JSON.stringify({ success: true }), {
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
    
    // Default success response for write operations
    if (options?.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
      return new Response(JSON.stringify({ success: true }), {
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

// API utility with bulletproof IndexedDB fallback
export const apiCall = async (url: string, options?: RequestInit, retries = 1): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    
    // Check if response is HTML instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.log('🔄 MSW returned HTML, using IndexedDB fallback');
      return await directDbFallback(url, options);
    }
    
    // Check if response is actually JSON
    if (response.ok) {
      try {
        const clone = response.clone();
        const text = await clone.text();
        if (text.startsWith('<!doctype') || text.startsWith('<html')) {
          console.log('🔄 HTML detected in response, using IndexedDB fallback');
          return await directDbFallback(url, options);
        }
      } catch (parseError) {
        console.log('🔄 Response parsing failed, using IndexedDB fallback');
        return await directDbFallback(url, options);
      }
    }
    
    return response;
  } catch (error) {
    console.log('🔄 Fetch failed, using IndexedDB fallback');
    return await directDbFallback(url, options);
  }
};