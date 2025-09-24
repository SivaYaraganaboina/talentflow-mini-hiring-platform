import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BriefcaseIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ChartBarIcon,
  PlusIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Job, Candidate, Application, Assessment } from '../types';
import { apiCall } from '../utils/apiUtils';
import { useAuth } from '../store';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import toast from 'react-hot-toast';

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    archivedJobs: 0,
    totalCandidates: 0,
    activeCandidates: 0,
    hiredCandidates: 0,
    rejectedCandidates: 0,
    recentApplications: 0,
    todayApplications: 0,
    totalAssessments: 0,
    pendingReviews: 0
  });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Loading dashboard data...');
      
      // Load all data in parallel
      const [jobsResponse, candidatesResponse] = await Promise.all([
        apiCall('/api/jobs?page=1&pageSize=1000'),
        apiCall('/api/candidates?page=1&pageSize=2000')
      ]);

      let jobs: Job[] = [];
      let candidates: Candidate[] = [];

      // Process jobs
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        jobs = jobsData.data || [];
        console.log('Jobs loaded:', jobs.length);
        setRecentJobs(jobs.slice(0, 5));
      } else {
        console.error('Failed to load jobs:', jobsResponse.status);
      }

      // Process candidates
      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json();
        candidates = candidatesData.data || [];
        console.log('Candidates loaded:', candidates.length);
        setRecentCandidates(candidates.slice(0, 5));
      } else {
        console.error('Failed to load candidates:', candidatesResponse.status);
      }

      // Calculate real-time statistics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const activeJobs = jobs.filter(job => job.status === 'active').length;
      const archivedJobs = jobs.filter(job => job.status === 'archived').length;
      
      const activeCandidates = candidates.filter(c => !['hired', 'rejected'].includes(c.stage)).length;
      const hiredCandidates = candidates.filter(c => c.stage === 'hired').length;
      const rejectedCandidates = candidates.filter(c => c.stage === 'rejected').length;
      
      const recentApplications = candidates.filter(c => {
        const appliedDate = new Date(c.appliedAt);
        return appliedDate >= weekAgo;
      }).length;
      
      const todayApplications = candidates.filter(c => {
        const appliedDate = new Date(c.appliedAt);
        return appliedDate >= today;
      }).length;
      
      const pendingReviews = candidates.filter(c => 
        ['screen', 'tech'].includes(c.stage)
      ).length;

      const newStats = {
        totalJobs: jobs.length,
        activeJobs,
        archivedJobs,
        totalCandidates: candidates.length,
        activeCandidates,
        hiredCandidates,
        rejectedCandidates,
        recentApplications,
        todayApplications,
        totalAssessments: 0,
        pendingReviews
      };
      
      console.log('Dashboard stats:', newStats);
      setStats(newStats);
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user.name}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's what's happening with your hiring pipeline today.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <button
                onClick={loadDashboardData}
                disabled={loading}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BriefcaseIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalJobs}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Jobs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeJobs}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Candidates</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCandidates}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Pipeline</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCandidates}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.recentApplications}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hired</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.hiredCandidates}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <ClockIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayApplications}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/jobs"
              className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <BriefcaseIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Manage Jobs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Create and edit job postings</p>
              </div>
            </Link>

            <Link
              to="/candidates"
              className="flex items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <UserGroupIcon className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Review Candidates</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Manage candidate pipeline</p>
              </div>
            </Link>

            <Link
              to="/assessments"
              className="flex items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
            >
              <DocumentTextIcon className="w-8 h-8 text-purple-600 dark:text-purple-400 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Create Assessment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Build custom assessments</p>
              </div>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Recent Jobs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Jobs</h2>
              <Link
                to="/jobs"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  to={`/jobs/${job.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{job.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {job.location} • Created {formatDate(job.createdAt)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {job.status}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Candidates */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Applications</h2>
              <Link
                to="/candidates"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentCandidates.map((candidate) => (
                <Link
                  key={candidate.id}
                  to={`/candidates/${candidate.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm mr-3">
                      {candidate.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{candidate.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Applied {formatDate(candidate.appliedAt)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    candidate.stage === 'applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    candidate.stage === 'screen' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    candidate.stage === 'tech' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    candidate.stage === 'offer' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    candidate.stage === 'hired' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {candidate.stage}
                  </span>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics Overview</h2>
          <AnalyticsDashboard />
        </motion.div>
      </div>
    </div>
  );
};

export default HRDashboard;