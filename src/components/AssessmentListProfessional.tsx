import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  PlusIcon,
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { Job, Assessment } from '../types';
import { apiCall } from '../utils/apiUtils';
import AssessmentSubmissions from './AssessmentSubmissions';
import { reseedDatabase } from '../services/database';
import toast from 'react-hot-toast';

interface AssessmentListProfessionalProps {
  onCreateAssessment: (jobId: string) => void;
}

const AssessmentListProfessional: React.FC<AssessmentListProfessionalProps> = ({ onCreateAssessment }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load jobs
      const jobsResponse = await apiCall('/api/jobs?page=1&pageSize=100');
      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        const loadedJobs = jobsData.data || [];
        setJobs(loadedJobs);

        // Load assessments for each job
        const assessmentPromises = loadedJobs.map(async (job: Job) => {
          try {
            const response = await apiCall(`/api/assessments/${job.id}`);
            if (response.ok) {
              const data = await response.json();
              return data.data;
            }
            return null;
          } catch {
            return null;
          }
        });

        const assessmentResults = await Promise.all(assessmentPromises);
        const validAssessments = assessmentResults.filter(a => a !== null);
        setAssessments(validAssessments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssessment = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this assessment?')) return;

    try {
      const response = await apiCall(`/api/assessments/${jobId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast.success('Assessment deleted successfully!');
        loadData();
      } else {
        throw new Error('Failed to delete assessment');
      }
    } catch (error) {
      console.error('Error deleting assessment:', error);
      toast.error('Failed to delete assessment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assessments...</p>
        </div>
      </div>
    );
  }

  const jobsWithoutAssessments = jobs.filter(job =>
    !assessments.some(assessment => assessment.jobId === job.id)
  );

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
              Assessment Management
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Create and manage job assessments • {assessments.length} assessments created
            </p>
          </div>
          <button
            onClick={async () => {
              await reseedDatabase();
              loadData();
              toast.success('Database reseeded with sample submissions!');
            }}
            className="mt-4 sm:mt-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
          >
            Reseed Database (Dev)
          </button>
        </div>

        {/* Create New Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Create New Assessment</h2>
          
          {jobsWithoutAssessments.length > 0 ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) => {
                  if (e.target.value) {
                    onCreateAssessment(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
              >
                <option value="">Select a job to create assessment...</option>
                {jobsWithoutAssessments.map(job => (
                  <option key={job.id} value={job.id}>
                    {job.title} - {job.location}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  const select = document.querySelector('select') as HTMLSelectElement;
                  if (select?.value) {
                    onCreateAssessment(select.value);
                    select.value = '';
                  } else {
                    toast.error('Please select a job first');
                  }
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                Create Assessment
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                All Jobs Have Assessments
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Every job posting already has an assessment created.
              </p>
            </div>
          )}
        </motion.div>

        {/* Existing Assessments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Existing Assessments</h2>
          </div>

          {assessments.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {assessments.map((assessment) => (
                <div key={assessment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {assessment.title || 'Untitled Assessment'}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                          {jobs.find(j => j.id === assessment.jobId)?.title || 'Unknown Job'}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {assessment.description || 'No description provided'}
                      </p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-1" />
                          {assessment.sections?.length || 0} sections
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {assessment.sections?.reduce((total, section) => total + (section.questions?.length || 0), 0) || 0} questions
                        </div>
                        <div className="flex items-center">
                          <CheckCircleIcon className="w-4 h-4 mr-1" />
                          Created {new Date(assessment.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedAssessment(assessment)}
                        className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Submissions
                      </button>
                      
                      <button
                        onClick={() => onCreateAssessment(assessment.jobId)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleDeleteAssessment(assessment.jobId)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Assessments Created
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Get started by creating your first assessment for a job posting.
              </p>
              {jobsWithoutAssessments.length > 0 && (
                <button
                  onClick={() => {
                    if (jobsWithoutAssessments[0]) {
                      onCreateAssessment(jobsWithoutAssessments[0].id);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create First Assessment
                </button>
              )}
            </div>
          )}
        </motion.div>
        
        {/* Assessment Submissions - Full Screen */}
        {selectedAssessment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-30 overflow-y-auto pt-20"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Assessment Submissions
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedAssessment.title} • {jobs.find(j => j.id === selectedAssessment.jobId)?.title || 'Unknown Job'}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="inline-flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  ← Back to Assessments
                </button>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <AssessmentSubmissions 
                  jobId={selectedAssessment.jobId} 
                  jobTitle={jobs.find(j => j.id === selectedAssessment.jobId)?.title || 'Unknown Job'}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AssessmentListProfessional;