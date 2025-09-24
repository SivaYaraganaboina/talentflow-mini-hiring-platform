import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  PencilIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  MapPinIcon,
  EyeIcon,
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Job, Candidate, ApiResponse } from '../types';
import JobModal from '../components/JobModal';
import JobApplications from '../components/JobApplications';
import { apiCall } from '../utils/apiUtils';
import toast from 'react-hot-toast';

const JobDetailProfessional: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJobData();
    }
  }, [jobId]);

  const loadJobData = async () => {
    try {
      setLoading(true);
      
      // Load job details
      const jobResponse = await apiCall(`/api/jobs/${jobId}`);
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData.data);
      }

      // Load candidates for this job
      const candidatesResponse = await apiCall(`/api/candidates?jobId=${jobId}&page=1&pageSize=100`);
      if (candidatesResponse.ok) {
        const candidatesData: ApiResponse<Candidate[]> = await candidatesResponse.json();
        setCandidates(candidatesData.data || []);
      }
    } catch (error) {
      console.error('Error loading job data:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSave = () => {
    setShowEditModal(false);
    loadJobData();
    toast.success('Job updated successfully!');
  };

  const handleArchiveJob = async () => {
    if (!job) return;
    
    try {
      const response = await apiCall(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: job.status === 'active' ? 'archived' : 'active'
        })
      });

      if (response.ok) {
        toast.success(`Job ${job.status === 'active' ? 'archived' : 'activated'} successfully!`);
        loadJobData();
      }
    } catch (error) {
      toast.error('Failed to update job status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The job you're looking for doesn't exist.</p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  // Calculate candidate statistics
  const candidateStats = candidates.reduce((acc, candidate) => {
    acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalCandidates = candidates.length;
  const activeApplications = candidates.filter(c => !['hired', 'rejected'].includes(c.stage)).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </button>
            <Link
              to="/jobs"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              All Jobs
            </Link>
            <Link
              to="/candidates"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              All Candidates
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{job.title}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  job.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {job.status}
                </span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <MapPinIcon className="w-5 h-5 mr-1" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-1" />
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="w-5 h-5 mr-1" />
                  {totalCandidates} candidates
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 mt-4 lg:mt-0">
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
              >
                <PencilIcon className="w-5 h-5 mr-2" />
                Edit Job
              </button>
              
              <button
                onClick={handleArchiveJob}
                className={`inline-flex items-center px-4 py-2 font-medium rounded-lg transition-colors ${
                  job.status === 'active'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {job.status === 'active' ? (
                  <>
                    <XCircleIcon className="w-5 h-5 mr-2" />
                    Archive Job
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Activate Job
                  </>
                )}
              </button>
              
              <Link
                to={`/assessments/create?jobId=${job.id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Create Assessment
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Job Description</h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {job.description}
                </p>
              </div>
            </motion.div>

            {/* Tags */}
            {job.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Skills & Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag, index) => (
                    <span
                      key={tag}
                      className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Candidate Pipeline Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Candidate Pipeline Overview</h2>
                <Link
                  to={`/candidates?jobId=${job.id}`}
                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                >
                  <EyeIcon className="w-5 h-5 mr-1" />
                  Manage Candidates
                </Link>
              </div>

              {totalCandidates > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { stage: 'applied', label: 'Applied', color: 'blue' },
                    { stage: 'screen', label: 'Screening', color: 'yellow' },
                    { stage: 'tech', label: 'Technical', color: 'purple' },
                    { stage: 'offer', label: 'Offer', color: 'green' }
                  ].map(({ stage, label, color }) => (
                    <div key={stage} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>
                        {candidateStats[stage] || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Candidates Yet</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Candidates will appear here once they start applying to this job.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Applications Management */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Applications Management</h2>
              <JobApplications jobId={job.id} />
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Total Applications</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{totalCandidates}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ClockIcon className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Active Applications</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{activeApplications}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                    <span className="text-gray-600 dark:text-gray-400">Hired</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{candidateStats.hired || 0}</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to={`/candidates?jobId=${job.id}`}
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <UserGroupIcon className="w-5 h-5 mr-3" />
                  Manage Candidates
                </Link>
                
                <Link
                  to={`/assessments/create?jobId=${job.id}`}
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <DocumentTextIcon className="w-5 h-5 mr-3" />
                  Create Assessment
                </Link>
                
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <PencilIcon className="w-5 h-5 mr-3" />
                  Edit Job Details
                </button>
              </div>
            </motion.div>

            {/* Job Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Job Information</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Job ID:</span>
                  <span className="ml-2 font-mono text-gray-900 dark:text-white">{job.id}</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Created:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Last Updated:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">
                    {new Date(job.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Order:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">#{job.order}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Edit Job Modal */}
        <JobModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          job={job}
          onSave={handleJobSave}
        />
      </div>
    </div>
  );
};

export default JobDetailProfessional;