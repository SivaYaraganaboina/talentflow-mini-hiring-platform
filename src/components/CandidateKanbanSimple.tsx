import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Candidate, Job, ApiResponse, AssessmentSubmission } from '../types';
import { MagnifyingGlassIcon, BriefcaseIcon, XMarkIcon, EnvelopeIcon, PhoneIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { apiCall } from '../utils/apiUtils';
import { useAuth } from '../store';
import toast from 'react-hot-toast';

const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

const CandidateKanbanSimple: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlJobId = searchParams.get('jobId');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedCandidate, setDraggedCandidate] = useState<Candidate | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string>(urlJobId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateApplications, setCandidateApplications] = useState<Candidate[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [selectedJobId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load jobs
      const jobsResponse = await apiCall('/api/jobs?status=active&page=1&pageSize=100');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        setJobs(jobsData.data || []);
        if (!urlJobId && jobsData.data?.length > 0) {
          setSelectedJobId(jobsData.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadCandidates = async () => {
    if (!selectedJobId) return;
    
    try {
      const url = `/api/candidates?jobId=${selectedJobId}&page=1&pageSize=1000`;
      const response = await apiCall(url);
      if (response.ok) {
        const data: ApiResponse<Candidate[]> = await response.json();
        setCandidates(data.data || []);
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
      toast.error('Failed to load candidates');
    }
  };

  const getCandidatesByStage = (stage: string) => {
    return candidates.filter(candidate => {
      const matchesStage = candidate.stage === stage;
      const matchesSearch = searchTerm === '' || 
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStage && matchesSearch;
    });
  };

  const getStageBadge = (stage: string) => {
    const badgeClasses = {
      applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      screen: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      tech: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      offer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      hired: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badgeClasses[stage as keyof typeof badgeClasses] || badgeClasses.applied}`}>
        {stage}
      </span>
    );
  };

  const handleDragStart = (e: React.DragEvent, candidate: Candidate) => {
    setDraggedCandidate(candidate);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    
    if (!draggedCandidate || draggedCandidate.stage === targetStage) {
      setDraggedCandidate(null);
      return;
    }

    const oldStage = draggedCandidate.stage;

    // Optimistic update
    const updatedCandidates = candidates.map(c =>
      c.id === draggedCandidate.id ? { ...c, stage: targetStage } : c
    );
    setCandidates(updatedCandidates);

    try {
      const response = await apiCall(`/api/candidates/${draggedCandidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: targetStage,
          notes: `Moved from ${oldStage} to ${targetStage} by ${user.name}`
        })
      });

      if (response.ok) {
        toast.success(`Candidate moved to ${targetStage} stage`);
        loadCandidates();
      } else {
        throw new Error('Failed to update candidate stage');
      }
    } catch (error) {
      console.error('Error updating candidate stage:', error);
      setCandidates(candidates);
      toast.error('Failed to update candidate stage');
    } finally {
      setDraggedCandidate(null);
    }
  };

  const handleInviteToAssessment = async (candidate: Candidate) => {
    try {
      // Check if assessment exists for this job
      const assessmentResponse = await apiCall(`/api/assessments/${selectedJobId}`);
      const assessmentData = await assessmentResponse.json();
      const hasExistingAssessment = assessmentData.data;

      if (hasExistingAssessment) {
        // Show modal to choose between existing or new assessment
        const choice = window.confirm(
          `An assessment already exists for this job.\n\nClick OK to use the existing assessment\nClick Cancel to create a new assessment`
        );
        
        if (choice) {
          // Use existing assessment - send invitation
          await sendAssessmentInvitation(candidate);
        } else {
          // Create new assessment - redirect to assessment builder
          window.location.href = `/assessments?jobId=${selectedJobId}&candidateId=${candidate.id}`;
          return;
        }
      } else {
        // No existing assessment - redirect to create new one
        const shouldCreate = window.confirm(
          `No assessment exists for this job yet.\n\nWould you like to create an assessment now?`
        );
        
        if (shouldCreate) {
          window.location.href = `/assessments?jobId=${selectedJobId}&candidateId=${candidate.id}`;
          return;
        }
      }
    } catch (error) {
      console.error('Error checking assessment:', error);
      toast.error('Failed to process assessment invitation');
    }
  };

  const sendAssessmentInvitation = async (candidate: Candidate) => {
    try {
      const response = await apiCall(`/api/candidates/${candidate.id}/invite-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJobId,
          invitedBy: user.name,
          stage: candidate.stage
        })
      });

      if (response.ok) {
        toast.success(`Assessment invitation sent to ${candidate.name}`);
      } else {
        throw new Error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send assessment invitation');
    }
  };

  const openCandidateModal = async (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setModalLoading(true);
    
    try {
      const applicationsResponse = await apiCall(`/api/candidates?search=${encodeURIComponent(candidate.email)}&page=1&pageSize=100`);
      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        setCandidateApplications(applicationsData.data || []);
      }
    } catch (error) {
      console.error('Error loading candidate details:', error);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Candidate Pipeline</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Drag candidates between stages to update their status</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Job Filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Job
            </label>
            <div className="relative">
              <BriefcaseIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Jobs</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search Candidates
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {selectedJobId && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Showing candidates for: <span className="font-medium">{jobs.find(j => j.id === selectedJobId)?.title}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map(stage => (
          <div 
            key={stage} 
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-full min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {stage.charAt(0).toUpperCase() + stage.slice(1)}
                </h3>
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full text-sm font-medium">
                  {getCandidatesByStage(stage).length}
                </span>
              </div>

              <div className="space-y-3">
                {getCandidatesByStage(stage).map((candidate) => (
                  <div
                    key={candidate.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, candidate)}
                    onClick={() => openCandidateModal(candidate)}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600 cursor-pointer transition-all ${
                      draggedCandidate?.id === candidate.id ? 'opacity-50 scale-95' : 'hover:shadow-md hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{candidate.name}</h4>
                      {getStageBadge(candidate.stage)}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center">
                        <span className="mr-2">📧</span>
                        <span className="truncate">{candidate.email}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📞</span>
                        <span>{candidate.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>Applied: {new Date(candidate.appliedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <a
                        href={`/candidates/${candidate.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        View Profile →
                      </a>
                      {(stage === 'screen' || stage === 'tech') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleInviteToAssessment(candidate);
                          }}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/20 rounded transition-colors"
                        >
                          📝 Invite Assessment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {selectedCandidate.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCandidate.name}</h2>
                    <p className="text-gray-600 dark:text-gray-400">Candidate Profile</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {modalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <EnvelopeIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.email}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">{selectedCandidate.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-gray-700 dark:text-gray-300">
                          Applied {new Date(selectedCandidate.appliedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Status & Actions</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Current Stage:</span>
                        <div className={`inline-block ml-2 px-3 py-1 text-sm font-medium rounded-full ${
                          selectedCandidate.stage === 'applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          selectedCandidate.stage === 'screen' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          selectedCandidate.stage === 'tech' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          selectedCandidate.stage === 'offer' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          selectedCandidate.stage === 'hired' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {selectedCandidate.stage}
                        </div>
                      </div>
                      {(selectedCandidate.stage === 'screen' || selectedCandidate.stage === 'tech') && (
                        <div className="pt-2">
                          <button
                            onClick={() => handleInviteToAssessment(selectedCandidate)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            Send Assessment Invitation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Applications</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {candidateApplications.map((app) => {
                        const job = jobs.find(j => j.id === app.jobId);
                        return (
                          <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {job?.title || 'Unknown Job'}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                Applied {new Date(app.appliedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              app.stage === 'applied' ? 'bg-blue-100 text-blue-800' :
                              app.stage === 'screen' ? 'bg-yellow-100 text-yellow-800' :
                              app.stage === 'tech' ? 'bg-purple-100 text-purple-800' :
                              app.stage === 'offer' ? 'bg-green-100 text-green-800' :
                              app.stage === 'hired' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {app.stage}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Timeline</h3>
                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {selectedCandidate.timeline?.map((entry, index) => (
                        <div key={entry.id} className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium text-gray-900 dark:text-white capitalize">{entry.stage}</h4>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(entry.timestamp).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{entry.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateKanbanSimple;