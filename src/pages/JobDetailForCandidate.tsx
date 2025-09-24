import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  MapPinIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Job, ApiResponse } from '../types';
import { useAuth } from '../store';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import toast from 'react-hot-toast';

const JobDetailForCandidate: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (jobId) {
      loadJob();
      checkApplicationStatus();
    }
  }, [jobId]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/jobs/${jobId}`);
      if (response.ok) {
        const data: ApiResponse<Job> = await response.json();
        setJob(data.data);
      } else {
        toast.error('Job not found');
        navigate('/jobs');
      }
    } catch (error) {
      console.error('Error loading job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(`/api/applications/check?jobId=${jobId}&candidateEmail=${user.email}`);
      if (response.ok) {
        const data = await response.json();
        setHasApplied(data.hasApplied);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const handleApply = async () => {
    if (!job || !user.email) return;

    try {
      setApplying(true);
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: job.id,
          candidateName: user.name,
          candidateEmail: user.email,
        }),
      });

      if (response.ok) {
        setHasApplied(true);
        toast.success('Application submitted successfully!');
      } else {
        toast.error('Failed to submit application');
      }
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Job Not Found</h2>
          <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className=""
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Go Back
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/jobs')}
              className=""
            >
              All Jobs
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <Card>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {job.title}
                  </h1>
                  <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <MapPinIcon className="w-5 h-5 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-1" />
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <Badge variant={job.status === 'active' ? 'success' : 'secondary'}>
                  {job.status}
                </Badge>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-6">
                {job.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Job Description */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Job Description
                </h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {job.description}
                  </p>
                </div>
              </div>
            </Card>

            {/* Requirements */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Requirements
              </h2>
              <ul className="space-y-2">
                {[
                  'Bachelor\'s degree in Computer Science or related field',
                  '3+ years of experience in software development',
                  'Proficiency in modern web technologies',
                  'Strong problem-solving skills',
                  'Excellent communication skills',
                  'Experience with agile development methodologies'
                ].map((requirement, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Benefits */}
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Benefits & Perks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { icon: CurrencyDollarIcon, title: 'Competitive Salary', desc: 'Market-rate compensation' },
                  { icon: UserGroupIcon, title: 'Health Insurance', desc: 'Full medical coverage' },
                  { icon: ClockIcon, title: 'Flexible Hours', desc: 'Work-life balance' },
                  { icon: DocumentTextIcon, title: 'Learning Budget', desc: 'Professional development' }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <benefit.icon className="w-6 h-6 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{benefit.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Card */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Apply for this Position
              </h3>
              
              {hasApplied ? (
                <div className="text-center py-6">
                  <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Application Submitted
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your application has been received. We'll be in touch soon!
                  </p>
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/my-applications')}
                    className="w-full"
                  >
                    View My Applications
                  </Button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Ready to join our team? Submit your application now.
                  </p>
                  <Button
                    onClick={handleApply}
                    loading={applying}
                    className="w-full mb-3"
                  >
                    Apply Now
                  </Button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Your profile information will be used for the application
                  </p>
                </div>
              )}
            </Card>

            {/* Company Info */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                About the Company
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Industry</h4>
                  <p className="text-gray-600 dark:text-gray-400">Technology</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Company Size</h4>
                  <p className="text-gray-600 dark:text-gray-400">50-200 employees</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Founded</h4>
                  <p className="text-gray-600 dark:text-gray-400">2015</p>
                </div>
              </div>
            </Card>

            {/* Similar Jobs */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Similar Positions
              </h3>
              <div className="space-y-3">
                {['Frontend Developer', 'Full Stack Engineer', 'UI/UX Designer'].map((title, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{title}</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Remote • Full-time</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailForCandidate;