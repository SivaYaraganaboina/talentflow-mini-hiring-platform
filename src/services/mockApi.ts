import { http, HttpResponse } from 'msw';
import { setupWorker } from 'msw/browser';
import { db } from './database';
import { Job, Candidate, Assessment, AssessmentSubmission, ApiResponse, PaginationParams } from '../types';

// Utility function to simulate network delay and errors
const simulateNetworkDelay = (isWriteEndpoint = false) => {
  return new Promise<void>((resolve, reject) => {
    const delay = Math.random() * 1000 + 200; // 200-1200ms delay
    const errorRate = isWriteEndpoint ? 0.075 : 0.001; // 7.5% error rate on writes, 0.1% on reads
    const shouldError = Math.random() < errorRate;

    setTimeout(() => {
      if (shouldError) {
        reject(new Error('Network error'));
      } else {
        resolve();
      }
    }, delay);
  });
};

const handlers = [
  // Jobs endpoints
  http.get('/api/jobs', async ({ request }) => {
    try {
      await simulateNetworkDelay();

      const url = new URL(request.url);
      const search = url.searchParams.get('search') || '';
      const status = url.searchParams.get('status') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
      const sort = url.searchParams.get('sort') || 'order';

      let query = db.jobs.orderBy(sort);

      if (status) {
        query = query.filter(job => job.status === status);
      }

      if (search) {
        const searchTerm = search.toLowerCase();
        query = query.filter(job =>
          job.title.toLowerCase().includes(searchTerm) ||
          job.description.toLowerCase().includes(searchTerm) ||
          job.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      const total = await query.count();
      const jobs = await query.offset((page - 1) * pageSize).limit(pageSize).toArray();

      const response: ApiResponse<Job[]> = {
        data: jobs,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };

      return HttpResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Jobs API error:', error);
      return HttpResponse.json({ error: 'Internal server error' }, {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }),

  http.post('/api/jobs', async ({ request }) => {
    try {
      console.log('MSW: Creating new job');
      await simulateNetworkDelay(true);

      const jobData = await request.json() as Partial<Job>;
      console.log('MSW: Job data received:', jobData);

      // Check for slug uniqueness
      if (jobData.slug) {
        const existingJob = await db.jobs.where('slug').equals(jobData.slug).first();
        if (existingJob) {
          return HttpResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }
      }

      const newJob: Job = {
        id: `job-${Date.now()}`,
        title: jobData.title || '',
        slug: jobData.slug || '',
        description: jobData.description || '',
        location: jobData.location || '',
        status: jobData.status || 'active',
        tags: jobData.tags || [],
        order: jobData.order || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await db.jobs.add(newJob);
      console.log('MSW: Job created successfully:', newJob.id);
      return HttpResponse.json({ data: newJob });
    } catch (error) {
      console.error('MSW: Failed to create job:', error);
      return HttpResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }
  }),

  http.patch('/api/jobs/:id', async ({ request, params }) => {
    try {
      await simulateNetworkDelay(true);
      
      const { id } = params;
      const updates = await request.json() as Partial<Job>;
      
      // Check for slug uniqueness if slug is being updated
      if (updates.slug) {
        const existingJob = await db.jobs.where('slug').equals(updates.slug).first();
        if (existingJob && existingJob.id !== id) {
          return HttpResponse.json({ error: 'Slug already exists' }, { status: 400 });
        }
      }
      
      await db.jobs.update(id as string, {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      const updatedJob = await db.jobs.get(id as string);
      return HttpResponse.json({ data: updatedJob });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }
  }),

  http.patch('/api/jobs/:id/reorder', async ({ request, params }) => {
    try {
      await simulateNetworkDelay(true);

      const { id } = params;
      const { fromOrder, toOrder } = await request.json() as { fromOrder: number; toOrder: number };

      // Simulate occasional failure for rollback testing (very low frequency)
      if (Math.random() < 0.005) {
        return HttpResponse.json({ error: 'Reorder failed' }, { status: 500 });
      }

      // Handle both numeric IDs (like "1") and string IDs (like "job-1")
      let jobId = id as string;
      if (!isNaN(Number(id))) {
        // If it's a numeric ID, try to find the corresponding job
        const allJobs = await db.jobs.toArray();
        const job = allJobs.find(j => j.id === id || j.id === `job-${id}`);
        if (job) {
          jobId = job.id;
        }
      }

      // Update the specific job's order
      const job = await db.jobs.get(jobId);
      if (!job) {
        return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      await db.jobs.update(jobId, {
        order: toOrder,
        updatedAt: new Date().toISOString()
      });

      return HttpResponse.json({ success: true });
    } catch (error) {
      console.error('Reorder API error:', error);
      return HttpResponse.json({ error: 'Reorder failed' }, { status: 500 });
    }
  }),

  http.get('/api/jobs/:id', async ({ params }) => {
    try {
      await simulateNetworkDelay();

      const { id } = params;
      const job = await db.jobs.get(id as string);

      if (!job) {
        return HttpResponse.json({ error: 'Job not found' }, { status: 404 });
      }

      return HttpResponse.json({ data: job });
    } catch (error) {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),

  // Candidates endpoints
  http.get('/api/candidates', async ({ request }) => {
    try {
      await simulateNetworkDelay();

      const url = new URL(request.url);
      const search = url.searchParams.get('search') || '';
      const stage = url.searchParams.get('stage') || '';
      const jobId = url.searchParams.get('jobId') || '';
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '50');
      const sortBy = url.searchParams.get('sortBy') || 'appliedAt';
      const sortOrder = url.searchParams.get('sortOrder') || 'desc';

      // Start with all candidates
      let allCandidates = await db.candidates.toArray();

      // Apply filters server-side
      if (stage) {
        allCandidates = allCandidates.filter(candidate => candidate.stage === stage);
      }

      if (jobId) {
        allCandidates = allCandidates.filter(candidate => candidate.jobId === jobId);
      }

      if (search) {
        const searchLower = search.toLowerCase();
        allCandidates = allCandidates.filter(candidate =>
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.email.toLowerCase().includes(searchLower) ||
          candidate.phone.toLowerCase().includes(searchLower)
        );
      }

      // Apply sorting
      allCandidates.sort((a, b) => {
        let aValue = a[sortBy as keyof Candidate];
        let bValue = b[sortBy as keyof Candidate];
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (sortOrder === 'desc') {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      });

      const total = allCandidates.length;
      const startIndex = (page - 1) * pageSize;
      const candidates = allCandidates.slice(startIndex, startIndex + pageSize);

      const response: ApiResponse<Candidate[]> = {
        data: candidates,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      };

      return HttpResponse.json(response, {
        headers: {
          'Content-Type': 'application/json',
          'X-Total-Count': total.toString(),
          'X-Page': page.toString(),
          'X-Page-Size': pageSize.toString()
        },
      });
    } catch (error) {
      console.error('Candidates API error:', error);
      return HttpResponse.json({ error: 'Internal server error' }, {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  }),

  http.post('/api/candidates', async ({ request }) => {
    try {
      await simulateNetworkDelay(true);

      const candidateData = await request.json() as Partial<Candidate>;
      const newCandidate: Candidate = {
        id: `candidate-${Date.now()}`,
        name: candidateData.name || '',
        email: candidateData.email || '',
        phone: candidateData.phone || '',
        resume: candidateData.resume || '',
        status: candidateData.status || 'active',
        stage: candidateData.stage || 'applied',
        jobId: candidateData.jobId || '',
        appliedAt: new Date().toISOString(),
        timeline: [
          {
            id: `timeline-${Date.now()}`,
            stage: candidateData.stage || 'applied',
            timestamp: new Date().toISOString(),
            notes: 'Application submitted'
          }
        ]
      };

      await db.candidates.add(newCandidate);
      return HttpResponse.json({ data: newCandidate });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
    }
  }),

  http.patch('/api/candidates/:id', async ({ request, params }) => {
    try {
      await simulateNetworkDelay(true);
      
      const { id } = params;
      const updates = await request.json() as Partial<Candidate> & { notes?: string };
      
      const candidate = await db.candidates.get(id as string);
      if (!candidate) {
        return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }

      // If stage is being updated, add timeline entry
      if (updates.stage && updates.stage !== candidate.stage) {
        const timelineEntry = {
          id: `timeline-${Date.now()}`,
          stage: updates.stage,
          timestamp: new Date().toISOString(),
          notes: updates.notes || `Moved to ${updates.stage}`
        };
        
        candidate.timeline.push(timelineEntry);
        updates.timeline = candidate.timeline;
      }

      await db.candidates.update(id as string, updates as Partial<Candidate>);
      const updatedCandidate = await db.candidates.get(id as string);
      
      return HttpResponse.json({ data: updatedCandidate });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
    }
  }),

  http.get('/api/candidates/:id', async ({ params }) => {
    try {
      await simulateNetworkDelay();

      const { id } = params;
      const candidate = await db.candidates.get(id as string);

      if (!candidate) {
        return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }

      return HttpResponse.json({ data: candidate });
    } catch (error) {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),

  http.get('/api/candidates/:id/timeline', async ({ params }) => {
    try {
      await simulateNetworkDelay();

      const { id } = params;
      const candidate = await db.candidates.get(id as string);

      if (!candidate) {
        return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }

      return HttpResponse.json({ data: candidate.timeline });
    } catch (error) {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),

  // Assessments endpoints
  http.get('/api/assessments/:jobId', async ({ params }) => {
    try {
      await simulateNetworkDelay();
      
      const { jobId } = params;
      const assessment = await db.assessments.where('jobId').equals(jobId as string).first();
      
      return HttpResponse.json({ data: assessment || null });
    } catch (error) {
      return HttpResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }),

  http.put('/api/assessments/:jobId', async ({ request, params }) => {
    try {
      await simulateNetworkDelay(true);

      const { jobId } = params;
      const assessmentData = await request.json() as Partial<Assessment>;
      
      console.log('MSW: Saving assessment for job:', jobId, 'with data:', assessmentData);

      const existingAssessment = await db.assessments.where('jobId').equals(jobId as string).first();

      if (existingAssessment) {
        // Update existing assessment
        const updateData = {
          title: assessmentData.title || existingAssessment.title,
          description: assessmentData.description || existingAssessment.description,
          sections: assessmentData.sections || existingAssessment.sections,
          enableScoring: assessmentData.enableScoring !== undefined ? assessmentData.enableScoring : existingAssessment.enableScoring,
          updatedAt: new Date().toISOString()
        };
        
        await db.assessments.update(existingAssessment.id, updateData);
        const updated = await db.assessments.get(existingAssessment.id);
        console.log('MSW: Updated existing assessment:', updated?.id);
        return HttpResponse.json({ data: updated });
      } else {
        // Create new assessment
        const newAssessment: Assessment = {
          id: `assessment-${jobId}-${Date.now()}`,
          jobId: jobId as string,
          title: assessmentData.title || 'Untitled Assessment',
          description: assessmentData.description || '',
          sections: assessmentData.sections || [],
          enableScoring: assessmentData.enableScoring || false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await db.assessments.add(newAssessment);
        console.log('MSW: Created new assessment:', newAssessment.id);
        return HttpResponse.json({ data: newAssessment });
      }
    } catch (error) {
      console.error('MSW: Assessment save error:', error);
      return HttpResponse.json({ error: 'Failed to save assessment' }, { status: 500 });
    }
  }),

  http.post('/api/assessments/:jobId/submit', async ({ request, params }) => {
    try {
      await simulateNetworkDelay(true);

      const { jobId } = params;
      const submissionData = await request.json() as Partial<AssessmentSubmission>;

      // Get the assessment to calculate score
      const assessment = await db.assessments.where('jobId').equals(jobId as string).first();
      
      let score: number | undefined;
      let maxScore: number | undefined;
      let scoredQuestions: number | undefined;

      if (assessment && assessment.enableScoring) {
        let totalScore = 0;
        let totalPossibleScore = 0;
        let questionsScored = 0;

        // Calculate score for each section and question
        assessment.sections.forEach(section => {
          section.questions.forEach(question => {
            const questionPoints = question.points || 1;
            const userResponse = submissionData.responses?.[question.id];

            // Only score questions that have correct answers defined
            if (question.correctAnswer !== undefined && userResponse !== undefined) {
              totalPossibleScore += questionPoints;
              questionsScored++;

              // Score based on question type
              if (question.type === 'single-choice') {
                if (userResponse === question.correctAnswer) {
                  totalScore += questionPoints;
                }
              } else if (question.type === 'multi-choice') {
                const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                const userAnswers = Array.isArray(userResponse) ? userResponse : [];
                
                // Calculate partial credit for multi-choice
                if (correctAnswers.length > 0) {
                  const correctSelected = userAnswers.filter(answer => correctAnswers.includes(answer)).length;
                  const incorrectSelected = userAnswers.filter(answer => !correctAnswers.includes(answer)).length;
                  const missedCorrect = correctAnswers.filter(answer => !userAnswers.includes(answer)).length;
                  
                  // Partial scoring: (correct - incorrect) / total correct, minimum 0
                  const partialScore = Math.max(0, (correctSelected - incorrectSelected) / correctAnswers.length);
                  totalScore += questionPoints * partialScore;
                }
              }
              // Note: Text questions are not auto-scored, they require manual review
            }
          });
        });

        if (totalPossibleScore > 0) {
          score = Math.round((totalScore / totalPossibleScore) * 100); // Percentage
          maxScore = totalPossibleScore;
          scoredQuestions = questionsScored;
        }
      }

      const submission: AssessmentSubmission = {
        id: `submission-${Date.now()}`,
        jobId: jobId as string,
        candidateId: submissionData.candidateId || '',
        responses: submissionData.responses || {},
        score,
        maxScore,
        scoredQuestions,
        submittedAt: new Date().toISOString()
      };

      await db.submissions.add(submission);
      
      // Update candidate assessment completion status
      if (submissionData.candidateId) {
        await db.candidates.update(submissionData.candidateId, {
          assessmentCompleted: true,
          assessmentCompletedAt: new Date().toISOString()
        });
      }
      
      return HttpResponse.json({ data: submission });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to submit assessment' }, { status: 500 });
    }
  }),

  http.delete('/api/assessments/:jobId', async ({ params }) => {
    try {
      await simulateNetworkDelay();
      
      const { jobId } = params;
      const assessment = await db.assessments.where('jobId').equals(jobId as string).first();
      
      if (!assessment) {
        return HttpResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }

      await db.assessments.delete(assessment.id);
      return HttpResponse.json({ success: true });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
    }
  }),

  http.get('/api/assessments/:jobId/submissions', async ({ params }) => {
    try {
      await simulateNetworkDelay();
      
      const { jobId } = params;
      const submissions = await db.submissions.where('jobId').equals(jobId as string).toArray();
      
      return HttpResponse.json({ data: submissions });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
  }),

  // Applications endpoints
  http.get('/api/applications', async ({ request }) => {
    try {
      await simulateNetworkDelay();

      const url = new URL(request.url);
      const jobId = url.searchParams.get('jobId');
      const candidateId = url.searchParams.get('candidateId');

      let applications = await db.applications.toArray();

      if (jobId) {
        applications = applications.filter(app => app.jobId === jobId);
      }

      if (candidateId) {
        applications = applications.filter(app => app.candidateId === candidateId);
      }

      return HttpResponse.json({ data: applications });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
  }),

  http.patch('/api/applications/:id/stage', async ({ request, params }) => {
    try {
      await simulateNetworkDelay(true);
      
      const { id } = params;
      const { stage, notes, movedBy } = await request.json() as { stage: string; notes?: string; movedBy: string };
      
      const application = await db.applications.get(id as string);
      if (!application) {
        return HttpResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Add timeline entry
      const timelineEntry = {
        id: `timeline-${Date.now()}`,
        stage: stage as any,
        timestamp: new Date().toISOString(),
        notes: notes || `Moved to ${stage} stage`,
        movedBy
      };
      
      application.timeline.push(timelineEntry);
      
      // Update application
      await db.applications.update(id as string, {
        stage: stage as any,
        timeline: application.timeline
      });

      // Also update candidate stage
      await db.candidates.update(application.candidateId, {
        stage,
        timeline: application.timeline.map(t => ({ ...t, movedBy: t.movedBy }))
      });
      
      const updatedApplication = await db.applications.get(id as string);
      return HttpResponse.json({ data: updatedApplication });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to update application stage' }, { status: 500 });
    }
  }),

  // Assessment invitation endpoint
  http.post('/api/candidates/:id/invite-assessment', async ({ request, params }) => {
    try {
      await simulateNetworkDelay(true);
      
      const { id } = params;
      const { jobId, invitedBy, stage } = await request.json() as { jobId: string; invitedBy: string; stage: string };
      
      const candidate = await db.candidates.get(id as string);
      if (!candidate) {
        return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }

      // Update candidate with assessment invitation
      await db.candidates.update(id as string, {
        assessmentInvited: true,
        assessmentInvitedAt: new Date().toISOString()
      });

      // Add timeline entry
      const timelineEntry = {
        id: `timeline-${Date.now()}`,
        stage: candidate.stage,
        timestamp: new Date().toISOString(),
        notes: `Assessment invitation sent by ${invitedBy}`,
        movedBy: invitedBy
      };
      
      candidate.timeline.push(timelineEntry);
      await db.candidates.update(id as string, { timeline: candidate.timeline });
      
      return HttpResponse.json({ success: true });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to send assessment invitation' }, { status: 500 });
    }
  }),

  // Check assessment invitation status
  http.get('/api/candidates/:candidateId/assessment-status/:jobId', async ({ params }) => {
    try {
      await simulateNetworkDelay();
      
      const { candidateId, jobId } = params;
      const candidate = await db.candidates.get(candidateId as string);
      
      if (!candidate) {
        return HttpResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }

      // Check if assessment exists for this job
      const assessment = await db.assessments.where('jobId').equals(jobId as string).first();
      if (!assessment) {
        return HttpResponse.json({ 
          invited: false, 
          completed: false, 
          hasAssessment: false 
        });
      }

      // Check if candidate has completed assessment
      const submission = await db.submissions
        .where('jobId').equals(jobId as string)
        .and(sub => sub.candidateId === candidateId)
        .first();
      
      return HttpResponse.json({ 
        invited: candidate.assessmentInvited || false,
        completed: !!submission,
        hasAssessment: true,
        invitedAt: candidate.assessmentInvitedAt,
        completedAt: submission?.submittedAt
      });
    } catch (error) {
      return HttpResponse.json({ error: 'Failed to check assessment status' }, { status: 500 });
    }
  })
];

export const worker = setupWorker(...handlers);
