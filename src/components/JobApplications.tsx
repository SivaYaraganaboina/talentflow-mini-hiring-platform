import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ChevronRightIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Application, Candidate } from '../types';
import { apiCall } from '../utils/apiUtils';
import { useAuth } from '../store';
import toast from 'react-hot-toast';

interface JobApplicationsProps {
  jobId: string;
}

const STAGES = [
  { key: 'applied', label: 'Applied', color: 'blue' },
  { key: 'screen', label: 'Screening', color: 'yellow' },
  { key: 'tech', label: 'Technical', color: 'purple' },
  { key: 'offer', label: 'Offer', color: 'green' },
  { key: 'hired', label: 'Hired', color: 'emerald' },
  { key: 'rejected', label: 'Rejected', color: 'red' }
];

const JobApplications: React.FC<JobApplicationsProps> = ({ jobId }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<Record<string, Candidate>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [movingStage, setMovingStage] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadApplications();
  }, [jobId]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      
      // Load applications for this job
      const appsResponse = await apiCall(`/api/applications?jobId=${jobId}`);
      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        setApplications(appsData.data || []);
        
        // Load candidate details
        const candidateIds = appsData.data?.map((app: Application) => app.candidateId) || [];
        const candidatesMap: Record<string, Candidate> = {};
        
        for (const candidateId of candidateIds) {
          const candidateResponse = await apiCall(`/api/candidates/${candidateId}`);
          if (candidateResponse.ok) {
            const candidateData = await candidateResponse.json();
            candidatesMap[candidateId] = candidateData.data;
          }
        }
        
        setCandidates(candidatesMap);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const moveToNextStage = async (applicationId: string, currentStage: string) => {
    const stageIndex = STAGES.findIndex(s => s.key === currentStage);
    if (stageIndex === -1 || stageIndex >= STAGES.length - 2) return; // Can't move from hired/rejected
    
    const nextStage = STAGES[stageIndex + 1];
    
    try {
      setMovingStage(applicationId);
      
      const response = await apiCall(`/api/applications/${applicationId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: nextStage.key,
          notes: `Moved to ${nextStage.label} stage`,
          movedBy: user?.name || 'HR Manager'
        })
      });

      if (response.ok) {
        toast.success(`Candidate moved to ${nextStage.label} stage`);
        loadApplications();
      } else {
        toast.error('Failed to update candidate stage');
      }
    } catch (error) {
      toast.error('Failed to update candidate stage');
    } finally {
      setMovingStage(null);
    }
  };

  const rejectCandidate = async (applicationId: string) => {
    try {
      setMovingStage(applicationId);
      
      const response = await apiCall(`/api/applications/${applicationId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'rejected',
          notes: 'Application rejected',
          movedBy: user?.name || 'HR Manager'
        })
      });

      if (response.ok) {
        toast.success('Candidate rejected');
        loadApplications();
      } else {
        toast.error('Failed to reject candidate');
      }
    } catch (error) {
      toast.error('Failed to reject candidate');
    } finally {
      setMovingStage(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStageColor = (stage: string) => {
    const stageInfo = STAGES.find(s => s.key === stage);
    return stageInfo?.color || 'gray';
  };

  const canMoveToNext = (stage: string) => {
    return !['hired', 'rejected'].includes(stage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="text-center py-8">
        <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Applications Yet</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Applications will appear here once candidates start applying to this job.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Applications by Stage */}
      {STAGES.slice(0, -1).map((stage) => {
        const stageApplications = applications.filter(app => app.stage === stage.key);
        
        if (stageApplications.length === 0) return null;

        return (
          <motion.div
            key={stage.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stage.label} ({stageApplications.length})
                </h3>
                <span className={`px-3 py-1 text-sm font-medium rounded-full bg-${stage.color}-100 text-${stage.color}-800 dark:bg-${stage.color}-900 dark:text-${stage.color}-200`}>
                  {stage.label}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {stageApplications.map((application) => {
                  const candidate = candidates[application.candidateId];
                  if (!candidate) return null;

                  return (
                    <motion.div
                      key={application.id}
                      layout
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {candidate.name.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {candidate.name}
                            </h4>
                            <button
                              onClick={() => setSelectedCandidate(selectedCandidate === candidate.id ? null : candidate.id)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <div className="flex items-center">
                              <EnvelopeIcon className="w-4 h-4 mr-1" />
                              {candidate.email}
                            </div>
                            <div className="flex items-center">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              Applied {formatDate(application.appliedAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {canMoveToNext(application.stage) && (
                          <button
                            onClick={() => moveToNextStage(application.id, application.stage)}
                            disabled={movingStage === application.id}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {movingStage === application.id ? (
                              <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin mr-1" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 mr-1" />
                            )}
                            Next Stage
                          </button>
                        )}
                        
                        {application.stage !== 'rejected' && (
                          <button
                            onClick={() => rejectCandidate(application.id)}
                            disabled={movingStage === application.id}
                            className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircleIcon className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* Rejected Candidates */}
      {applications.some(app => app.stage === 'rejected') && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rejected ({applications.filter(app => app.stage === 'rejected').length})
            </h3>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {applications.filter(app => app.stage === 'rejected').map((application) => {
                const candidate = candidates[application.candidateId];
                if (!candidate) return null;

                return (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg opacity-75"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-medium">
                        {candidate.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {candidate.name}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                          <span>{candidate.email}</span>
                          <span>Applied {formatDate(application.appliedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <span className="px-3 py-1 text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                      Rejected
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Candidate Timeline Modal */}
      {selectedCandidate && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCandidate(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {candidates[selectedCandidate]?.name} - Application Timeline
                </h3>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {applications
                  .find(app => app.candidateId === selectedCandidate)
                  ?.timeline.map((entry, index) => (
                    <div key={entry.id} className="flex items-start space-x-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${getStageColor(entry.stage)}-100 text-${getStageColor(entry.stage)}-600`}>
                        {index === 0 ? (
                          <UserIcon className="w-4 h-4" />
                        ) : (
                          <CheckCircleIcon className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {STAGES.find(s => s.key === entry.stage)?.label || entry.stage}
                          </h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {entry.notes}
                        </p>
                        {entry.movedBy && (
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            by {entry.movedBy}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default JobApplications;