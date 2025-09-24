import Dexie, { Table } from 'dexie';
import { Job, Candidate, Assessment, AssessmentSubmission, TimelineEntry, Application } from '../types';


export class TalentFlowDatabase extends Dexie {
  jobs!: Table<Job>;
  candidates!: Table<Candidate>;
  assessments!: Table<Assessment>;
  submissions!: Table<AssessmentSubmission>;
  timeline!: Table<TimelineEntry>;
  applications!: Table<Application>;

  constructor() {
    super('TalentFlowDatabase');
    this.version(1).stores({
      jobs: 'id, title, slug, status, order, createdAt',
      candidates: 'id, name, email, stage, jobId, appliedAt',
      assessments: 'id, jobId, title, createdAt',
      submissions: 'id, jobId, candidateId, submittedAt',
      timeline: 'id, candidateId, stage, timestamp',
      applications: 'id, candidateId, jobId, stage, appliedAt'
    });
  }
}

export const db = new TalentFlowDatabase();

// Initialize database with seed data
export const initializeDatabase = async () => {
  try {
    const jobCount = await db.jobs.count();
    const candidateCount = await db.candidates.count();
    console.log('Current job count:', jobCount);
    console.log('Current candidate count:', candidateCount);

    if (jobCount === 0 || candidateCount === 0) {
      console.log('Seeding database with initial data...');
      await seedDatabase();
      console.log('Database seeded successfully');
    } else {
      console.log('Database already has data');
    }

    const finalJobCount = await db.jobs.count();
    const finalCandidateCount = await db.candidates.count();
    console.log('Final job count:', finalJobCount);
    console.log('Final candidate count:', finalCandidateCount);
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Force reseed database (for development)
export const reseedDatabase = async () => {
  try {
    console.log('Clearing and reseeding database...');
    await db.jobs.clear();
    await db.candidates.clear();
    await db.assessments.clear();
    await db.submissions.clear();
    await db.applications.clear();
    await seedDatabase();
    console.log('Database reseeded successfully');
  } catch (error) {
    console.error('Error reseeding database:', error);
  }
};

const seedDatabase = async () => {
  // Generate 30 jobs with slugs
  const jobTitles = [
    'Senior Frontend Developer - TechCorp',
    'Backend Developer - DataFlow', 
    'Full Stack Developer - CloudTech',
    'DevOps Engineer - InfraCorp',
    'Mobile App Developer - AppWorks',
    'Data Scientist - AnalyticsPro',
    'UI/UX Designer - DesignStudio',
    'Security Engineer - SecureNet',
    'Product Manager - ProductLabs',
    'QA Engineer - QualityFirst',
    'Blockchain Developer - CryptoTech',
    'AI/ML Engineer - BrainTech',
    'Database Administrator - DataCorp',
    'Technical Writer - DocuTech',
    'Site Reliability Engineer - UptimeCorp',
    'Game Developer - GameStudio',
    'Systems Architect - ArchTech',
    'Frontend Developer - StartupXYZ',
    'Backend Developer - EcommercePlus',
    'Mobile Developer - HealthTech',
    'Data Engineer - BigData Inc',
    'Cybersecurity Analyst - SecureCorp',
    'Full Stack Developer - SaaS Company',
    'Machine Learning Engineer - AI Startup',
    'DevOps Engineer - FinTech',
    'Software Engineer - TestCompany',
    'UX Designer - CreativeAgency',
    'Data Analyst - AnalyticsCorp',
    'Project Manager - TechSolutions',
    'Marketing Specialist - GrowthCo'
  ];

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().replace(/^-|-$/g, '');
  };

  const generatedJobs = jobTitles.map((title, index) => ({
    id: `job-${index + 1}`,
    title,
    slug: generateSlug(title),
    description: `Join our team as a ${title.split(' - ')[0]}. We're looking for talented individuals to help us build the future.`,
    location: ['San Francisco, CA', 'New York, NY', 'Remote', 'Seattle, WA', 'Austin, TX'][index % 5],
    status: Math.random() < 0.8 ? 'active' : 'archived', // 80% active, 20% archived
    tags: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'Python'].slice(0, Math.floor(Math.random() * 3) + 2),
    order: index + 1,
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString()
  }));

  await db.jobs.bulkAdd(generatedJobs as Job[]);

  // Seed Candidates
  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
  const candidates: Candidate[] = Array.from({ length: 1000 }, (_, i) => {
    const jobId = `job-${Math.floor(Math.random() * 30) + 1}`;
    const stage = stages[Math.floor(Math.random() * stages.length)];
    const appliedAt = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString();

    return {
      id: `candidate-${i + 1}`,
      name: `Candidate ${i + 1}`,
      email: `candidate${i + 1}@example.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      resume: `Resume for Candidate ${i + 1}`,
      status: 'active',
      stage,
      jobId,
      appliedAt,
      timeline: [
        {
          id: `timeline-${i + 1}-1`,
          stage: 'applied',
          timestamp: appliedAt,
          notes: 'Application submitted'
        }
      ]
    };
  });

  await db.candidates.bulkAdd(candidates);

  // Seed Applications
  const applications = candidates.map((candidate, i) => {
    const appliedAt = candidate.appliedAt;
    const currentStage = candidate.stage;
    
    // Create timeline based on current stage
    const timeline = [{
      id: `app-timeline-${i + 1}-1`,
      stage: 'applied' as const,
      timestamp: appliedAt,
      notes: 'Application submitted',
      movedBy: 'System'
    }];

    // Add additional timeline entries based on current stage
    const stageOrder = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];
    const currentIndex = stageOrder.indexOf(currentStage);
    
    for (let j = 1; j <= currentIndex; j++) {
      const stageTime = new Date(new Date(appliedAt).getTime() + j * 24 * 60 * 60 * 1000).toISOString();
      timeline.push({
        id: `app-timeline-${i + 1}-${j + 1}`,
        stage: stageOrder[j] as any,
        timestamp: stageTime,
        notes: `Moved to ${stageOrder[j]} stage`,
        movedBy: 'HR Manager'
      });
    }

    return {
      id: `application-${i + 1}`,
      candidateId: candidate.id,
      jobId: candidate.jobId,
      stage: currentStage as any,
      appliedAt,
      timeline,
      notes: `Application for ${candidate.name}`
    };
  });

  await db.applications.bulkAdd(applications);

  // Seed Assessments with 10+ questions each
  const assessments: Assessment[] = ['job-1', 'job-2', 'job-3'].map((jobId, i) => ({
    id: `assessment-${jobId}`,
    jobId: jobId,
    title: `${jobTitles[i].split(' - ')[0]} Assessment`,
    description: `Comprehensive technical and behavioral assessment for ${jobTitles[i].split(' - ')[0]} position`,
    enableScoring: i < 2, // Enable scoring for first 2 assessments
    sections: [
      {
        id: `section-${i + 1}-1`,
        title: 'Technical Skills',
        questions: [
          {
            id: `q-${i + 1}-1`,
            type: 'single-choice',
            title: 'What is your experience with React?',
            description: 'Select your level of experience',
            required: true,
            options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
            points: 2
          },
          {
            id: `q-${i + 1}-2`,
            type: 'multi-choice',
            title: 'Which technologies have you worked with?',
            description: 'Select all that apply',
            required: true,
            options: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java'],
            points: 3
          },
          {
            id: `q-${i + 1}-3`,
            type: 'short-text',
            title: 'Years of experience',
            description: 'How many years of professional experience do you have?',
            required: true,
            validation: { min: 0, max: 50 },
            points: 1
          },
          {
            id: `q-${i + 1}-4`,
            type: 'long-text',
            title: 'Describe your most challenging project',
            description: 'Tell us about a challenging project you worked on',
            required: true,
            validation: { maxLength: 1000 },
            points: 5
          },
          {
            id: `q-${i + 1}-5`,
            type: 'numeric',
            title: 'Expected salary range (in thousands)',
            description: 'What is your expected salary range?',
            required: false,
            validation: { min: 30, max: 300 },
            points: 1
          },
          {
            id: `q-${i + 1}-6`,
            type: 'single-choice',
            title: 'Which development methodology do you prefer?',
            description: 'Select your preferred approach',
            required: true,
            options: ['Agile/Scrum', 'Waterfall', 'Kanban', 'DevOps'],
            points: 2
          },
          {
            id: `q-${i + 1}-7`,
            type: 'multi-choice',
            title: 'Which testing frameworks have you used?',
            description: 'Select all that apply',
            required: false,
            options: ['Jest', 'Cypress', 'Selenium', 'Mocha', 'Jasmine', 'Playwright'],
            points: 2
          }
        ]
      },
      {
        id: `section-${i + 1}-2`,
        title: 'Behavioral Questions',
        questions: [
          {
            id: `q-${i + 1}-8`,
            type: 'single-choice',
            title: 'Do you prefer working in teams?',
            description: 'Select your preference',
            required: true,
            options: ['Yes', 'No', 'Sometimes'],
            points: 1
          },
          {
            id: `q-${i + 1}-9`,
            type: 'long-text',
            title: 'Team collaboration experience',
            description: 'Describe your experience working in teams',
            required: true,
            conditional: {
              dependsOn: `q-${i + 1}-8`,
              condition: 'equals',
              value: 'Yes'
            },
            validation: { maxLength: 500 },
            points: 3
          },
          {
            id: `q-${i + 1}-10`,
            type: 'single-choice',
            title: 'How do you handle tight deadlines?',
            description: 'Choose your typical approach',
            required: true,
            options: ['Prioritize tasks', 'Work overtime', 'Negotiate timeline', 'Ask for help'],
            points: 2
          },
          {
            id: `q-${i + 1}-11`,
            type: 'long-text',
            title: 'Describe a time you had to learn a new technology quickly',
            description: 'Tell us about your learning approach and outcome',
            required: true,
            validation: { maxLength: 800 },
            points: 4
          },
          {
            id: `q-${i + 1}-12`,
            type: 'file-upload',
            title: 'Portfolio or work samples',
            description: 'Upload your portfolio or work samples',
            required: false,
            points: 2
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  await db.assessments.bulkAdd(assessments);

  // Seed Assessment Submissions
  const submissions = [
    {
      id: 'submission-1',
      jobId: 'job-1',
      candidateId: 'candidate-1',
      responses: {
        'q-1-1': 'Intermediate',
        'q-1-2': ['JavaScript', 'TypeScript', 'React'],
        'q-1-3': '3',
        'q-1-4': 'Built a full-stack e-commerce platform with React and Node.js',
        'q-1-6': 'Yes',
        'q-1-7': 'I enjoy collaborating with cross-functional teams'
      },
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'submission-2',
      jobId: 'job-1',
      candidateId: 'candidate-2',
      responses: {
        'q-1-1': 'Advanced',
        'q-1-2': ['JavaScript', 'React', 'Node.js', 'Python'],
        'q-1-3': '5',
        'q-1-4': 'Led development of a microservices architecture',
        'q-1-6': 'Yes',
        'q-1-7': 'Strong believer in agile methodologies'
      },
      submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'submission-3',
      jobId: 'job-2',
      candidateId: 'candidate-3',
      responses: {
        'q-2-1': 'Expert',
        'q-2-2': ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Java'],
        'q-2-3': '7',
        'q-2-4': 'Architected scalable backend systems handling millions of requests',
        'q-2-6': 'Sometimes',
      },
      submittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  await db.submissions.bulkAdd(submissions);
};


