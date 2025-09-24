import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ArchiveBoxIcon,
  ArchiveBoxXMarkIcon,
  Bars3Icon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Job, ApiResponse } from '../types';
import JobModal from './JobModal';
import toast from 'react-hot-toast';
import { apiCall } from '../utils/apiUtils';

const PAGE_SIZE = 12;

const JobListSimple: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [draggedJob, setDraggedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  // Listen for keyboard shortcut to open modal
  useEffect(() => {
    const handleOpenModal = () => {
      handleCreateJob();
    };

    window.addEventListener('openJobModal', handleOpenModal);
    return () => window.removeEventListener('openJobModal', handleOpenModal);
  }, []);

  const filteredJobs = useMemo(() => {
    let filtered = allJobs;

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        job.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (tagFilter) {
      filtered = filtered.filter(job => job.tags.includes(tagFilter));
    }

    return filtered;
  }, [allJobs, searchTerm, statusFilter, tagFilter]);

  const paginatedJobs = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    return filteredJobs.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredJobs, page]);

  const totalPages = Math.ceil(filteredJobs.length / PAGE_SIZE);
  const uniqueTags = useMemo(() => Array.from(new Set(allJobs.flatMap(job => job.tags))), [allJobs]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await apiCall('/api/jobs?page=1&pageSize=1000');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse<Job[]> = await response.json();
      
      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format');
      }
      
      const sortedJobs = data.data.sort((a, b) => a.order - b.order);
      setAllJobs(sortedJobs);
      setJobs(sortedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      toast.error('Failed to load jobs. Please refresh the page.');
      // Fallback to empty array
      setAllJobs([]);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = () => {
    setEditingJob(null);
    setShowModal(true);
  };
  
  const handleJobSave = () => {
    loadJobs();
  };

  const handleArchiveJob = async (job: Job) => {
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: job.status === 'active' ? 'archived' : 'active'
        })
      });

      if (!response.ok) throw new Error('Failed to update job');
      
      toast.success(`Job ${job.status === 'active' ? 'archived' : 'unarchived'} successfully!`);
      loadJobs();
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  // Simple drag and drop handlers
  const handleDragStart = (e: React.DragEvent, job: Job) => {
    setDraggedJob(job);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetJob: Job) => {
    e.preventDefault();
    
    if (!draggedJob || draggedJob.id === targetJob.id) {
      setDraggedJob(null);
      return;
    }

    // Optimistic update
    const updatedJobs = [...allJobs];
    const draggedIndex = updatedJobs.findIndex(j => j.id === draggedJob.id);
    const targetIndex = updatedJobs.findIndex(j => j.id === targetJob.id);
    
    if (draggedIndex !== -1 && targetIndex !== -1) {
      // Swap positions
      const temp = updatedJobs[draggedIndex];
      updatedJobs[draggedIndex] = { ...updatedJobs[targetIndex], order: draggedJob.order };
      updatedJobs[targetIndex] = { ...temp, order: targetJob.order };
      
      setAllJobs(updatedJobs);
    }

    try {
      const response = await fetch(`/api/jobs/${draggedJob.id}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fromOrder: draggedJob.order, 
          toOrder: targetJob.order 
        })
      });

      if (!response.ok) throw new Error('Failed to reorder');
      
      toast.success('Job reordered successfully!');
      // Don't reload, keep optimistic update
    } catch (error) {
      toast.error('Failed to reorder job');
      // Revert on error
      loadJobs();
    } finally {
      setDraggedJob(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading jobs...</p>
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Job Listings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and organize your job postings • {filteredJobs.length} jobs found
            </p>
          </div>
          <button
            onClick={handleCreateJob}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Job
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs, descriptions, locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Tags</option>
              {uniqueTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FunnelIcon className="w-4 h-4 mr-2" />
              {filteredJobs.length} of {allJobs.length} jobs
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedJobs.map((job) => (
            <div
              key={job.id}
              draggable
              onDragStart={(e) => handleDragStart(e, job)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, job)}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md cursor-move ${
                draggedJob?.id === job.id ? 'opacity-50 scale-95' : ''
              }`}
            >
              {/* Drag Handle */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Bars3Icon className="w-4 h-4 text-gray-400" />
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    job.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <span className="text-xs text-gray-500">#{job.order}</span>
              </div>

              {/* Job Content */}
              <div className="mb-4">
                <Link to={`/jobs/${job.id}`} className="block group">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
                    {job.title}
                  </h3>
                </Link>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                  {job.description}
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                  📍 {job.location}
                </div>
              </div>

              {/* Tags */}
              {job.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {job.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {job.tags.length > 3 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 rounded-full">
                      +{job.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex space-x-2">
                  <Link
                    to={`/jobs/${job.id}`}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <EyeIcon className="w-4 h-4 mr-1" />
                    View
                  </Link>
                  <button
                    onClick={() => { setEditingJob(job); setShowModal(true); }}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <PencilIcon className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                </div>
                
                <button
                  onClick={() => handleArchiveJob(job)}
                  className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    job.status === 'active'
                      ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20'
                      : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900/20'
                  }`}
                >
                  {job.status === 'active' ? (
                    <>
                      <ArchiveBoxIcon className="w-4 h-4 mr-1" />
                      Archive
                    </>
                  ) : (
                    <>
                      <ArchiveBoxXMarkIcon className="w-4 h-4 mr-1" />
                      Unarchive
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💼</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No jobs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter || tagFilter
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first job posting.'}
            </p>
            {!searchTerm && !statusFilter && !tagFilter && (
              <button
                onClick={handleCreateJob}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Your First Job
              </button>
            )}
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

        {/* Job Modal */}
        <JobModal
          isOpen={showModal}
          onClose={() => { setShowModal(false); setEditingJob(null); }}
          job={editingJob}
          onSave={handleJobSave}
        />
      </div>
    </div>
  );
};

export default JobListSimple;