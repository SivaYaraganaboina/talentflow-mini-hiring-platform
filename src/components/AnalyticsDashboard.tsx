import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  BriefcaseIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Job, Candidate } from '../types';
import { apiCall } from '../utils/apiUtils';
import Card from './ui/Card';

const AnalyticsDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const [jobsResponse, candidatesResponse] = await Promise.all([
        apiCall('/api/jobs?page=1&pageSize=1000'),
        apiCall('/api/candidates?page=1&pageSize=2000')
      ]);

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.data || []);
      }

      if (candidatesResponse.ok) {
        const candidatesData = await candidatesResponse.json();
        setCandidates(candidatesData.data || []);
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analytics = useMemo(() => {
    const activeJobs = jobs.filter(job => job.status === 'active');
    const totalApplications = candidates.length;
    
    // Candidates by stage
    const candidatesByStage = candidates.reduce((acc, candidate) => {
      acc[candidate.stage] = (acc[candidate.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Applications per job
    const applicationsByJob = candidates.reduce((acc, candidate) => {
      acc[candidate.jobId] = (acc[candidate.jobId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Time in stage calculation (simplified)
    const avgTimeInStage = Object.keys(candidatesByStage).reduce((acc, stage) => {
      const stageCandidates = candidates.filter(c => c.stage === stage);
      const avgDays = stageCandidates.reduce((sum, candidate) => {
        const daysSinceApplied = Math.floor(
          (Date.now() - new Date(candidate.appliedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + daysSinceApplied;
      }, 0) / stageCandidates.length || 0;
      
      acc[stage] = Math.round(avgDays);
      return acc;
    }, {} as Record<string, number>);

    // Conversion rates
    const conversionRates = {
      'applied-to-screen': candidatesByStage.screen / candidatesByStage.applied * 100 || 0,
      'screen-to-tech': candidatesByStage.tech / candidatesByStage.screen * 100 || 0,
      'tech-to-offer': candidatesByStage.offer / candidatesByStage.tech * 100 || 0,
      'offer-to-hired': candidatesByStage.hired / candidatesByStage.offer * 100 || 0,
    };

    return {
      totalJobs: jobs.length,
      activeJobs: activeJobs.length,
      totalApplications,
      candidatesByStage,
      applicationsByJob,
      avgTimeInStage,
      conversionRates,
      topPerformingJobs: Object.entries(applicationsByJob)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([jobId, count]) => ({
          job: jobs.find(j => j.id === jobId),
          applications: count
        }))
    };
  }, [jobs, candidates]);

  const stages = [
    { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { key: 'screen', label: 'Screening', color: 'bg-yellow-500' },
    { key: 'tech', label: 'Technical', color: 'bg-purple-500' },
    { key: 'offer', label: 'Offer', color: 'bg-green-500' },
    { key: 'hired', label: 'Hired', color: 'bg-emerald-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-500' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Jobs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalJobs}</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {analytics.activeJobs} active
                </p>
              </div>
              <BriefcaseIcon className="w-12 h-12 text-blue-500" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Applications</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalApplications}</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {Math.round(analytics.totalApplications / analytics.activeJobs || 0)} per job
                </p>
              </div>
              <UsersIcon className="w-12 h-12 text-green-500" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hire Rate</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.round((analytics.candidatesByStage.hired || 0) / analytics.totalApplications * 100 || 0)}%
                </p>
                <div className="flex items-center text-sm">
                  <ArrowTrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400">+2.3%</span>
                </div>
              </div>
              <ChartBarIcon className="w-12 h-12 text-purple-500" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg. Time to Hire</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {analytics.avgTimeInStage.hired || 0}d
                </p>
                <div className="flex items-center text-sm">
                  <ArrowTrendingDownIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 dark:text-green-400">-1.2d</span>
                </div>
              </div>
              <ClockIcon className="w-12 h-12 text-orange-500" />
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidate Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Candidate Pipeline</h3>
            <div className="space-y-4">
              {stages.map((stage) => {
                const count = analytics.candidatesByStage[stage.key] || 0;
                const percentage = (count / analytics.totalApplications) * 100 || 0;
                
                return (
                  <div key={stage.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {stage.label}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${stage.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white w-8">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Top Performing Jobs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Top Performing Jobs</h3>
            <div className="space-y-4">
              {analytics.topPerformingJobs.map((item, index) => (
                <div key={item.job?.id || index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {item.job?.title || 'Unknown Job'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {item.job?.location || 'Unknown Location'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.applications}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">applications</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Conversion Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Conversion Funnel</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Object.entries(analytics.conversionRates).map(([key, rate]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(rate)}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {key.replace('-', ' → ').replace('-to-', ' to ')}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;