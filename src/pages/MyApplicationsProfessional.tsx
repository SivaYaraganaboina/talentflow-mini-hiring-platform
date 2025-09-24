import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BriefcaseIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Candidate, Job, ApiResponse } from '../types';
import { useAuth } from '../store';
import { apiCall } from '../utils/apiUtils';
import toast from 'react-hot-toast';

const MyApplicationsProfessional: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentStatuses, setAssessmentStatuses] = useState<Record<string, any>>({});

  const stages = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: ClockIcon },
    { value: 'screen', label: 'Screening', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: ExclamationTriangleIcon },
    { value: 'tech', label: 'Technical', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: BriefcaseIcon },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircleIcon },
    { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: CheckCircleIcon },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircleIcon }
  ];

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      // Load user's applications using search by email
      const candidatesResponse = await apiCall(`/api/candidates?search=${encodeURIComponent(user.email)}&page=1&pageSize=1000`);
      if (candidatesResponse.ok) {
        const candidatesData: ApiResponse<Candidate[]> = await candidatesResponse.json();
        const apps = candidatesData.data || [];
        setApplications(apps);
        
        // Load assessment statuses for each application
        const statusPromises = apps.map(async (app: Candidate) => {
          try {
            const statusResponse = await apiCall(`/api/candidates/${app.id}/assessment-status/${app.jobId}`);
            if (statusResponse.ok) {
              const status = await statusResponse.json();
              return { [app.jobId]: status };
            }
          } catch (error) {
            console.error('Error checking assessment status:', error);
          }
          return { [app.jobId]: { invited: false, completed: false, hasAssessment: false } };
        });
        
        const statuses = await Promise.all(statusPromises);
        const statusMap = statuses.reduce((acc, status) => ({ ...acc, ...status }), {});
        setAssessmentStatuses(statusMap);
      }

      // Load jobs for details
      const jobsResponse = await apiCall('/api/jobs?page=1&pageSize=1000');
      if (jobsResponse.ok) {
        const jobsData: ApiResponse<Job[]> = await jobsResponse.json();
        setJobs(jobsData.data || []);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStageInfo = (stage: string) => {
    return stages.find(s => s.value === stage) || stages[0];
  };

  const getJobDetails = (jobId: string) => {
    return jobs.find(job => job.id === jobId);
  };

  const getStageProgress = (stage: string) => {
    const stageIndex = stages.findIndex(s => s.value === stage);
    return ((stageIndex + 1) / stages.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            My Applications
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Track your job applications and see your progress through the hiring process
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <BriefcaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{applications.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {applications.filter(app => ['applied', 'screen', 'tech'].includes(app.stage)).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {applications.filter(app => ['offer', 'hired'].includes(app.stage)).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Successful</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {applications.filter(app => app.stage === 'rejected').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-6">
          {applications.map((application) => {
            const job = getJobDetails(application.jobId);
            const stageInfo = getStageInfo(application.stage);
            const StageIcon = stageInfo.icon;
            const progress = getStageProgress(application.stage);

            return (
              <div
                key={application.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      {job?.title || 'Unknown Position'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Applied {new Date(application.appliedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <BriefcaseIcon className="w-4 h-4 mr-1" />
                        {job?.location || 'Location not specified'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <StageIcon className="w-5 h-5 text-gray-400" />
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${stageInfo.color}`}>
                      {stageInfo.label}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <span>Application Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        application.stage === 'rejected' 
                          ? 'bg-red-500' 
                          : application.stage === 'hired'
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Job Description */}
                {job && (
                  <div className="mb-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                      {job.description}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {job?.tags && job.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.tags.slice(0, 4).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {job.tags.length > 4 && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                        +{job.tags.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Assessment Action */}
                {assessmentStatuses[application.jobId]?.invited && !assessmentStatuses[application.jobId]?.completed && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                    <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                        <span className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                          Assessment invitation received
                        </span>
                      </div>
                      <Link
                        to={`/take-assessment/${application.jobId}`}
                        className="inline-flex items-center px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Take Assessment
                      </Link>
                    </div>
                  </div>
                )}

                {/* Timeline */}
                {application.timeline && application.timeline.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Recent Activity</h4>
                    <div className="space-y-2">
                      {application.timeline.slice(-2).map((entry, index) => (
                        <div key={entry.id} className="flex items-center text-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          <span className="text-gray-600 dark:text-gray-400">
                            {entry.notes} • {new Date(entry.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {applications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No applications yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start applying to jobs to see your applications here.
            </p>
            <a
              href="/jobs"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <BriefcaseIcon className="w-5 h-5 mr-2" />
              Browse Jobs
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyApplicationsProfessional;