import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { apiCall } from '../utils/apiUtils';
import { db } from '../services/database';

interface FeatureTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
  status: 'pending' | 'running' | 'passed' | 'failed';
  error?: string;
}

const FeatureChecker: React.FC = () => {
  const [tests, setTests] = useState<FeatureTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState({ passed: 0, failed: 0, total: 0 });

  const featureTests: Omit<FeatureTest, 'status'>[] = [
    {
      name: 'Database Initialization',
      description: 'Check if IndexedDB is initialized with seed data',
      test: async () => {
        const jobCount = await db.jobs.count();
        const candidateCount = await db.candidates.count();
        const assessmentCount = await db.assessments.count();
        return jobCount >= 25 && candidateCount >= 1000 && assessmentCount >= 3;
      }
    },
    {
      name: 'Jobs API',
      description: 'Fetch jobs list via API or fallback',
      test: async () => {
        const response = await apiCall('/api/jobs');
        const data = await response.json();
        return response.ok && Array.isArray(data.data) && data.data.length > 0;
      }
    },
    {
      name: 'Candidates API',
      description: 'Fetch candidates list via API or fallback',
      test: async () => {
        const response = await apiCall('/api/candidates');
        const data = await response.json();
        return response.ok && Array.isArray(data.data) && data.data.length > 0;
      }
    },
    {
      name: 'Individual Candidate API',
      description: 'Fetch specific candidate profile',
      test: async () => {
        const response = await apiCall('/api/candidates/candidate-1');
        const data = await response.json();
        return response.ok && data.data && data.data.id === 'candidate-1';
      }
    },
    {
      name: 'Applications API',
      description: 'Fetch applications for a candidate',
      test: async () => {
        const response = await apiCall('/api/applications?candidateId=candidate-1');
        const data = await response.json();
        return response.ok && Array.isArray(data.data);
      }
    },
    {
      name: 'Assessments API',
      description: 'Fetch assessment for a job',
      test: async () => {
        const response = await apiCall('/api/assessments/job-1');
        const data = await response.json();
        return response.ok;
      }
    },
    {
      name: 'Virtualized List Data',
      description: 'Check if 1000+ candidates can be loaded',
      test: async () => {
        const candidates = await db.candidates.toArray();
        return candidates.length >= 1000;
      }
    },
    {
      name: 'Job Stages Data',
      description: 'Verify candidates have different stages',
      test: async () => {
        const candidates = await db.candidates.toArray();
        const stages = new Set(candidates.map(c => c.stage));
        return stages.size >= 4; // At least 4 different stages
      }
    },
    {
      name: 'Assessment Questions',
      description: 'Check assessments have 10+ questions each',
      test: async () => {
        const assessments = await db.assessments.toArray();
        return assessments.every(assessment => {
          const totalQuestions = assessment.sections.reduce((sum, section) => 
            sum + section.questions.length, 0
          );
          return totalQuestions >= 10;
        });
      }
    },
    {
      name: 'Timeline Data',
      description: 'Verify candidates have timeline entries',
      test: async () => {
        const candidates = await db.candidates.limit(10).toArray();
        return candidates.every(c => c.timeline && c.timeline.length > 0);
      }
    },
    {
      name: 'Job Status Mix',
      description: 'Check jobs have mixed active/archived status',
      test: async () => {
        const jobs = await db.jobs.toArray();
        const activeJobs = jobs.filter(j => j.status === 'active').length;
        const archivedJobs = jobs.filter(j => j.status === 'archived').length;
        return activeJobs > 0 && archivedJobs > 0;
      }
    },
    {
      name: 'Assessment Scoring',
      description: 'Check some assessments have scoring enabled',
      test: async () => {
        const assessments = await db.assessments.toArray();
        return assessments.some(a => a.enableScoring === true);
      }
    },
    {
      name: 'Conditional Questions',
      description: 'Verify assessments have conditional logic',
      test: async () => {
        const assessments = await db.assessments.toArray();
        return assessments.some(assessment => 
          assessment.sections.some(section =>
            section.questions.some(q => q.conditional)
          )
        );
      }
    },
    {
      name: 'Network Simulation',
      description: 'Test API call timing (should have delay)',
      test: async () => {
        const startTime = Date.now();
        await apiCall('/api/jobs');
        const endTime = Date.now();
        const duration = endTime - startTime;
        return duration > 100; // Should have some delay from simulation or fallback
      }
    },
    {
      name: 'Local Storage Persistence',
      description: 'Check if data persists in IndexedDB',
      test: async () => {
        // Try to add and retrieve a test record
        const testId = 'test-persistence-' + Date.now();
        await db.jobs.add({
          id: testId,
          title: 'Test Job',
          slug: 'test-job',
          description: 'Test',
          location: 'Test',
          status: 'active',
          tags: [],
          order: 999,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        
        const retrieved = await db.jobs.get(testId);
        await db.jobs.delete(testId); // Cleanup
        return !!retrieved;
      }
    }
  ];

  useEffect(() => {
    setTests(featureTests.map(test => ({ ...test, status: 'pending' })));
  }, []);

  const runAllTests = async () => {
    setIsRunning(true);
    let passed = 0;
    let failed = 0;

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      
      // Update status to running
      setTests(prev => prev.map((t, index) => 
        index === i ? { ...t, status: 'running' } : t
      ));

      try {
        const result = await test.test();
        const status = result ? 'passed' : 'failed';
        
        setTests(prev => prev.map((t, index) => 
          index === i ? { ...t, status, error: result ? undefined : 'Test assertion failed' } : t
        ));

        if (result) passed++;
        else failed++;
      } catch (error) {
        setTests(prev => prev.map((t, index) => 
          index === i ? { ...t, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' } : t
        ));
        failed++;
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setSummary({ passed, failed, total: tests.length });
    setIsRunning(false);
  };

  const getStatusIcon = (status: FeatureTest['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'running':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: FeatureTest['status']) => {
    switch (status) {
      case 'passed': return 'text-green-700 bg-green-50 border-green-200';
      case 'failed': return 'text-red-700 bg-red-50 border-red-200';
      case 'running': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">TalentFlow Feature Verification</h2>
              <p className="text-gray-600 mt-1">Automated testing of all implemented features</p>
            </div>
            <button
              onClick={runAllTests}
              disabled={isRunning}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>

          {summary.total > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{summary.passed}</div>
                <div className="text-sm text-green-700">Passed</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{summary.total}</div>
                <div className="text-sm text-gray-700">Total</div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="space-y-3">
            {tests.map((test, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getStatusColor(test.status)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium">{test.name}</h3>
                      <p className="text-sm opacity-75">{test.description}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {test.status === 'passed' && '✓ PASS'}
                    {test.status === 'failed' && '✗ FAIL'}
                    {test.status === 'running' && '⟳ RUNNING'}
                    {test.status === 'pending' && '○ PENDING'}
                  </div>
                </div>
                {test.error && (
                  <div className="mt-2 text-sm text-red-600 bg-red-100 p-2 rounded">
                    Error: {test.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureChecker;