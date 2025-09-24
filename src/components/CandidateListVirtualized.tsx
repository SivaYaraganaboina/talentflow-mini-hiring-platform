import React, { useState, useEffect, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useNavigate } from 'react-router-dom';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Candidate, Job, ApiResponse } from '../types';
import { apiCall } from '../utils/apiUtils';
import toast from 'react-hot-toast';


const ITEM_HEIGHT = 120;
const CONTAINER_HEIGHT = 600;

interface CandidateItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    candidates: Candidate[];
    jobs: Job[];
    onViewCandidate: (candidate: Candidate) => void;
  };
}

const CandidateItem: React.FC<CandidateItemProps> = ({ index, style, data }) => {
  const { candidates, jobs, onViewCandidate } = data;
  const candidate = candidates[index];
  const job = jobs.find(j => j.id === candidate.jobId);

  const getStageColor = (stage: string) => {
    const colors = {
      applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      screen: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      tech: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      offer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      hired: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[stage as keyof typeof colors] || colors.applied;
  };

  return (
    <div style={style} className="px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mx-2 my-1 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                  {candidate.name}
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStageColor(candidate.stage)}`}>
                  {candidate.stage}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <EnvelopeIcon className="w-4 h-4 mr-1" />
                  <span className="truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="w-4 h-4 mr-1" />
                  <span>{candidate.phone}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  <span>{new Date(candidate.appliedAt).toLocaleDateString()}</span>
                </div>
              </div>
              
              {job && (
                <div className="mt-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Applied to: <span className="font-medium text-gray-700 dark:text-gray-300">{job.title}</span>
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => onViewCandidate(candidate)}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            <EyeIcon className="w-4 h-4 mr-1" />
            View
          </button>
        </div>
      </div>
    </div>
  );
};

const CandidateListVirtualized: React.FC = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all candidates (no pagination for virtualization)
      const candidatesResponse = await apiCall('/api/candidates?page=1&pageSize=10000');
      if (candidatesResponse.ok) {
        const candidatesData: ApiResponse<Candidate[]> = await candidatesResponse.json();
        setCandidates(candidatesData.data || []);
      }

      // Load jobs for reference
      const jobsResponse = await apiCall('/api/jobs?page=1&pageSize=1000');
      if (jobsResponse.ok) {
        const jobsData: ApiResponse<Job[]> = await jobsResponse.json();
        setJobs(jobsData.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const filteredCandidates = useMemo(() => {
    let filtered = candidates;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(candidate =>
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower)
      );
    }

    if (stageFilter) {
      filtered = filtered.filter(candidate => candidate.stage === stageFilter);
    }

    return filtered;
  }, [candidates, searchTerm, stageFilter]);

  const handleViewCandidate = (candidate: Candidate) => {
    navigate(`/candidates/${candidate.id}`);
  };

  const handleRefresh = () => {
    loadData();
  };

  const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
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
              <option key={stage} value={stage}>
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </option>
            ))}
          </select>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FunnelIcon className="w-4 h-4 mr-2" />
            {filteredCandidates.length} of {candidates.length} candidates
          </div>
        </div>
      </div>

      {/* Virtualized List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Candidates ({filteredCandidates.length})
          </h2>
        </div>
        
        {filteredCandidates.length > 0 ? (
          <List
            height={CONTAINER_HEIGHT}
            width="100%"
            itemCount={filteredCandidates.length}
            itemSize={ITEM_HEIGHT}
            itemData={{
              candidates: filteredCandidates,
              jobs,
              onViewCandidate: handleViewCandidate
            }}
          >
            {CandidateItem}
          </List>
        ) : (
          <div className="p-12 text-center">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No candidates found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || stageFilter
                ? 'Try adjusting your filters to see more results.'
                : 'No candidates have been added yet.'}
            </p>
          </div>
        )}
      </div>


    </div>
  );
};

export default CandidateListVirtualized;