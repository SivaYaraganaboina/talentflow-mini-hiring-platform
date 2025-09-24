import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { Candidate, Job, ApiResponse } from '../types';
import { apiCall } from '../utils/apiUtils';
import toast from 'react-hot-toast';


const PAGE_SIZE = 12;

const CandidateListProfessional: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const stages = [
    { value: 'applied', label: 'Applied', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'screen', label: 'Screening', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
    { value: 'tech', label: 'Technical', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
    { value: 'offer', label: 'Offer', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
    { value: 'hired', label: 'Hired', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const filteredCandidates = useMemo(() => {
    let filtered = allCandidates;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(candidate => 
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower) ||
        candidate.phone.toLowerCase().includes(searchLower)
      );
    }

    if (stageFilter) {
      filtered = filtered.filter(candidate => candidate.stage === stageFilter);
    }

    if (jobFilter) {
      filtered = filtered.filter(candidate => candidate.jobId === jobFilter);
    }

    return filtered;
  }, [allCandidates, searchTerm, stageFilter, jobFilter]);

  const paginatedCandidates = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredCandidates.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredCandidates, page]);

  const totalPages = Math.ceil(filteredCandidates.length / PAGE_SIZE);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load candidates
      const candidatesResponse = await apiCall('/api/candidates?page=1&pageSize=1000');
      if (candidatesResponse.ok) {
        const candidatesData: ApiResponse<Candidate[]> = await candidatesResponse.json();
        setAllCandidates(candidatesData.data);
        setCandidates(candidatesData.data);
      }

      // Load jobs for filter
      const jobsResponse = await apiCall('/api/jobs?page=1&pageSize=1000');
      if (jobsResponse.ok) {
        const jobsData: ApiResponse<Job[]> = await jobsResponse.json();
        setJobs(jobsData.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const openCandidateProfile = (candidate: Candidate) => {
    navigate(`/candidates/${candidate.id}`);
  };

  const handleRefresh = () => {
    loadData();
  };

  const getStageInfo = (stage: string) => {
    return stages.find(s => s.value === stage) || stages[0];
  };

  const getJobTitle = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    return job?.title || 'Unknown Position';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Candidates
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your candidate pipeline • {filteredCandidates.length} candidates found
            </p>
          </div>

        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Stages</option>
              {stages.map(stage => (
                <option key={stage.value} value={stage.value}>{stage.label}</option>
              ))}
            </select>
            
            <select
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Jobs</option>
              {jobs.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FunnelIcon className="w-4 h-4 mr-2" />
              {filteredCandidates.length} of {allCandidates.length} candidates
            </div>
          </div>
        </div>

        {/* Candidates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedCandidates.map((candidate) => {
            const stageInfo = getStageInfo(candidate.stage);
            return (
              <div
                key={candidate.id}
                onClick={() => openCandidateProfile(candidate)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md hover:border-blue-300 cursor-pointer"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        {candidate.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {candidate.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${stageInfo.color}`}>
                        {stageInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`mailto:${candidate.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {candidate.email}
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <a href={`tel:${candidate.phone}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {candidate.phone}
                    </a>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <BriefcaseIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <span>{getJobTitle(candidate.jobId)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
                    <span>Applied {new Date(candidate.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Resume Preview */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resume</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {candidate.resume}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Click for details
                  </span>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {candidate.timeline?.length || 0} activities
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCandidates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No candidates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || stageFilter || jobFilter
                ? 'Try adjusting your filters to see more results.'
                : 'No candidates have applied yet.'}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        )}


      </div>
    </div>
  );
};

export default CandidateListProfessional;