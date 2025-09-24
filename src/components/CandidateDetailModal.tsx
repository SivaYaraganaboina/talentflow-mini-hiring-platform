import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BriefcaseIcon,
  DocumentTextIcon,
  ClockIcon,
  FunnelIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { Candidate, Job, Application, ApplicationTimelineEntry } from '../types';
import { apiCall } from '../utils/apiUtils';
import toast from 'react-hot-toast';

interface CandidateDetailModalProps {
  candidate: Candidate;
  onClose: () => void;
  onRefresh?: () => void;
}

const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  onClose,
  onRefresh
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [newStage, setNewStage] = useState('');

  const stages = [
    { value: 'applied', label: 'Applied', color: 'blue', icon: '📝' },
    { value: 'screen', label: 'Screening', color: 'yellow', icon: '📞' },
    { value: 'tech', label: 'Technical', color: 'purple', icon: '💻' },
    { value: 'offer', label: 'Offer', color: 'green', icon: '📄' },
    { value: 'hired', label: 'Hired', color: 'green', icon: '✅' },
    { value: 'rejected', label: 'Rejected', color: 'red', icon: '❌' }
  ];

  useEffect(() => {
    fetchCandidateData();
  }, [candidate.id]);

  const fetchCandidateData = async () => {
    try {
      setLoading(true);

      // Fetch all applications for this candidate
      const applicationsResponse = await apiCall(`/api/applications?candidateId=${candidate.id}`);
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setApplications(applicationsData.data || []);
      }

      // Fetch all jobs
      const jobsResponse = await apiCall('/api/jobs');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching candidate data:', error);
      toast.error('Failed to load candidate details');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveStage = async () => {
    if (!selectedApplication || !newStage) return;

    try {
      const response = await apiCall(`/api/applications/${selectedApplication.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: newStage,
          notes: `Moved from ${selectedApplication.stage} to ${newStage}`
        })
      });

      if (response.ok) {
        setApplications(prev => prev.map(app => 
          app.id === selectedApplication.id 
            ? { ...app, stage: newStage as Application['stage'] }
            : app
        ));
        setShowMoveModal(false);
        setNewStage('');
        setSelectedApplication(null);
        toast.success(`Application moved to ${newStage} stage`);
        
        if (onRefresh) onRefresh();
        fetchCandidateData();
      }
    } catch (error) {
      toast.error('Failed to update application stage');
    }
  };

  const getStageInfo = (stage: string) => {
    return stages.find(s => s.value === stage) || stages[0];
  };

  const getJobTitle = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job ? job.title : 'Unknown Position';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredApplications = selectedJobId === 'all' 
    ? applications 
    : applications.filter(app => app.jobId === selectedJobId);

  const openMoveModal = (application: Application) => {
    setSelectedApplication(application);
    setNewStage(application.stage);
    setShowMoveModal(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {getInitials(candidate.name)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{candidate.name}</h2>
              <div className="flex items-center space-x-3 mt-1">
                <span className="text-gray-600 dark:text-gray-400">
                  {applications.length} Application{applications.length !== 1 ? 's' : ''}
                </span>
                <span className="text-gray-500 dark:text-gray-400">•</span>
                <span className="text-gray-600 dark:text-gray-400">
                  Member since {new Date(candidate.appliedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Job Filter */}
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Applications ({applications.length})</option>
                {jobs.filter(job => applications.some(app => app.jobId === job.id)).map(job => {
                  const count = applications.filter(app => app.jobId === job.id).length;
                  return (
                    <option key={job.id} value={job.id}>
                      {job.title} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Contact Information */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <EnvelopeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                          <a
                            href={`mailto:${candidate.email}`}
                            className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {candidate.email}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <PhoneIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                          <a
                            href={`tel:${candidate.phone}`}
                            className="text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          >
                            {candidate.phone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                          <BriefcaseIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Applications</p>
                          <p className="text-gray-900 dark:text-white">
                            {applications.length} position{applications.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Resume */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <DocumentTextIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resume</h3>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 font-mono leading-relaxed">
                        {candidate.resume}
                      </pre>
                    </div>
                  </div>

                  {/* Applications & Timeline */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Applications & Timeline
                        </h3>
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {selectedJobId === 'all' ? 'All Applications' : `Filtered: ${getJobTitle(selectedJobId)}`}
                      </span>
                    </div>

                    {filteredApplications.length > 0 ? (
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {filteredApplications.map((application) => {
                          const job = jobs.find(j => j.id === application.jobId);
                          const stageInfo = getStageInfo(application.stage);
                          
                          return (
                            <div key={application.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                              {/* Application Header */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                    <BriefcaseIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">
                                      {job ? job.title : 'Unknown Position'}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      Applied {new Date(application.appliedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-${stageInfo.color}-100 text-${stageInfo.color}-800 dark:bg-${stageInfo.color}-900 dark:text-${stageInfo.color}-200`}>
                                    <span className="mr-1">{stageInfo.icon}</span>
                                    {stageInfo.label}
                                  </span>
                                  <button
                                    onClick={() => openMoveModal(application)}
                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                                  >
                                    Move Stage
                                  </button>
                                </div>
                              </div>

                              {/* Timeline for this application */}
                              {application.timeline && application.timeline.length > 0 && (
                                <div className="space-y-2 ml-11">
                                  {application.timeline.map((item: ApplicationTimelineEntry, index: number) => {
                                    const itemStageInfo = getStageInfo(item.stage);
                                    return (
                                      <div key={`${application.id}-${index}`} className="flex items-start space-x-3">
                                        <div className={`w-6 h-6 bg-${itemStageInfo.color}-100 dark:bg-${itemStageInfo.color}-900 rounded-full flex items-center justify-center flex-shrink-0`}>
                                          <span className="text-xs">{itemStageInfo.icon}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <h5 className="text-xs font-medium text-gray-900 dark:text-white">
                                              {itemStageInfo.label}
                                            </h5>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {new Date(item.timestamp).toLocaleString()}
                                            </span>
                                          </div>
                                          {item.notes && (
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                              {item.notes}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        {selectedJobId === 'all' ? 'No applications found' : 'No applications for this position'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Application Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Summary</h3>
                    
                    <div className="space-y-3">
                      {stages.map((stage) => {
                        const count = filteredApplications.filter(app => app.stage === stage.value).length;
                        
                        return (
                          <div key={stage.value} className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs bg-${stage.color}-100 text-${stage.color}-800 dark:bg-${stage.color}-900 dark:text-${stage.color}-200`}>
                                {stage.icon}
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {stage.label}
                              </span>
                            </div>
                            <span className={`text-sm font-medium ${
                              count > 0 
                                ? 'text-gray-900 dark:text-white'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Move Stage Modal */}
        {showMoveModal && selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Move Application to New Stage
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Application
                  </label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getJobTitle(selectedApplication.jobId)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Stage
                  </label>
                  <div className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-${getStageInfo(selectedApplication.stage).color}-100 text-${getStageInfo(selectedApplication.stage).color}-800 dark:bg-${getStageInfo(selectedApplication.stage).color}-900 dark:text-${getStageInfo(selectedApplication.stage).color}-200`}>
                    <span className="mr-1">{getStageInfo(selectedApplication.stage).icon}</span>
                    {getStageInfo(selectedApplication.stage).label}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    New Stage
                  </label>
                  <select
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select new stage</option>
                    {stages.map(stage => (
                      <option 
                        key={stage.value} 
                        value={stage.value} 
                        disabled={stage.value === selectedApplication.stage}
                      >
                        {stage.icon} {stage.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveStage}
                  disabled={!newStage || newStage === selectedApplication?.stage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  Move Stage
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CandidateDetailModal;