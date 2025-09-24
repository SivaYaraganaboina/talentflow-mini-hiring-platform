import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import CandidateListProfessional from '../components/CandidateListProfessional';
import CandidateListVirtualized from '../components/CandidateListVirtualized';
import CandidateKanbanSimple from '../components/CandidateKanbanSimple';

const Candidates: React.FC = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [viewMode, setViewMode] = useState<'list' | 'virtualized' | 'kanban'>(jobId ? 'kanban' : 'virtualized');

  useEffect(() => {
    // Auto-switch to kanban when coming from job detail
    if (jobId) {
      setViewMode('kanban');
    }
  }, [jobId]);

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

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Candidates
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your candidate pipeline
            </p>
          </div>
          <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'virtualized'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setViewMode('virtualized')}
            >
              Virtualized
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban Board
            </button>
          </div>
        </div>

        {viewMode === 'list' && <CandidateListProfessional />}
        {viewMode === 'virtualized' && <CandidateListVirtualized />}
        {viewMode === 'kanban' && <CandidateKanbanSimple />}
      </div>
    </div>
  );
};

export default Candidates;
