import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { Job } from '../types';
import { apiCall } from '../utils/apiUtils';
import { useAuth } from '../store';
import Card from './ui/Card';
import Button from './ui/Button';
import toast from 'react-hot-toast';

interface AssessmentInvitation {
  jobId: string;
  jobTitle: string;
  invited: boolean;
  completed: boolean;
  hasAssessment: boolean;
  invitedAt?: string;
  completedAt?: string;
}

const AssessmentInvitations: React.FC = () => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<AssessmentInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssessmentInvitations();
  }, []);

  const loadAssessmentInvitations = async () => {
    try {
      setLoading(true);
      
      // Get candidate's applications
      const candidatesResponse = await apiCall(`/api/candidates?search=${encodeURIComponent(user.email)}&page=1&pageSize=100`);
      if (!candidatesResponse.ok) return;
      
      const candidatesData = await candidatesResponse.json();
      const applications = candidatesData.data || [];
      
      // Get jobs data
      const jobsResponse = await apiCall('/api/jobs?status=active&page=1&pageSize=100');
      if (!jobsResponse.ok) return;
      
      const jobsData = await jobsResponse.json();
      const jobs = jobsData.data || [];
      
      // Check assessment status for each application
      const invitationPromises = applications.map(async (app: any) => {
        const job = jobs.find((j: Job) => j.id === app.jobId);
        if (!job) return null;
        
        try {
          const statusResponse = await apiCall(`/api/candidates/${app.id}/assessment-status/${app.jobId}`);
          if (statusResponse.ok) {
            const status = await statusResponse.json();
            return {
              jobId: app.jobId,
              jobTitle: job.title,
              ...status
            };
          }
        } catch (error) {
          console.error('Error checking assessment status:', error);
        }
        return null;
      });
      
      const results = await Promise.all(invitationPromises);
      const validInvitations = results.filter(inv => inv !== null && inv.hasAssessment) as AssessmentInvitation[];
      
      setInvitations(validInvitations);
    } catch (error) {
      console.error('Error loading assessment invitations:', error);
      toast.error('Failed to load assessment invitations');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Card>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.invited && !inv.completed);
  const completedAssessments = invitations.filter(inv => inv.completed);

  return (
    <div className="space-y-6">
      {/* Pending Assessments */}
      {pendingInvitations.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pending Assessments
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You have been invited to take these assessments
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {pendingInvitations.map((invitation, index) => (
              <motion.div
                key={invitation.jobId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BriefcaseIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {invitation.jobTitle}
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Invited {invitation.invitedAt ? new Date(invitation.invitedAt).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  </div>
                  
                  <Link
                    to={`/take-assessment/${invitation.jobId}`}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    Take Assessment
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Completed Assessments */}
      {completedAssessments.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Completed Assessments
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Assessments you have successfully completed
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {completedAssessments.map((invitation, index) => (
              <motion.div
                key={invitation.jobId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {invitation.jobTitle}
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        Completed {invitation.completedAt ? new Date(invitation.completedAt).toLocaleDateString() : 'Recently'}
                      </div>
                    </div>
                  </div>
                  
                  <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200 text-sm font-medium rounded-full">
                    Completed
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* No Assessments */}
      {invitations.length === 0 && (
        <Card className="p-12 text-center">
          <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Assessment Invitations
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You haven't been invited to take any assessments yet. Assessment invitations will appear here when HR sends them.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <BriefcaseIcon className="w-4 h-4 mr-2" />
            Browse Jobs
          </Link>
        </Card>
      )}

      {/* No Pending Assessments */}
      {invitations.length > 0 && pendingInvitations.length === 0 && completedAssessments.length > 0 && (
        <Card className="p-8 text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            All Assessments Completed
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            You have completed all available assessments. New invitations will appear here when sent by HR.
          </p>
        </Card>
      )}
    </div>
  );
};

export default AssessmentInvitations;