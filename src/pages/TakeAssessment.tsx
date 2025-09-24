import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Assessment, AssessmentQuestion } from '../types';
import { useAuth } from '../store';
import { apiCall } from '../utils/apiUtils';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const TakeAssessment: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState<{
    invited: boolean;
    completed: boolean;
    hasAssessment: boolean;
  } | null>(null);
  const [candidateId, setCandidateId] = useState<string>('');

  useEffect(() => {
    if (jobId) {
      checkInvitationAndLoadAssessment();
    }
  }, [jobId]);

  const checkInvitationAndLoadAssessment = async () => {
    try {
      setLoading(true);
      
      // First, get the candidate ID
      const candidatesResponse = await apiCall(`/api/candidates?search=${encodeURIComponent(user.email)}&page=1&pageSize=100`);
      if (!candidatesResponse.ok) {
        toast.error('Unable to verify your application status');
        navigate('/jobs');
        return;
      }
      
      const candidatesData = await candidatesResponse.json();
      const applications = candidatesData.data || [];
      const currentApplication = applications.find((app: any) => app.jobId === jobId);
      
      if (!currentApplication) {
        toast.error('You must apply for this job before taking the assessment');
        navigate('/jobs');
        return;
      }
      
      setCandidateId(currentApplication.id);
      
      // Check invitation status
      const statusResponse = await apiCall(`/api/candidates/${currentApplication.id}/assessment-status/${jobId}`);
      if (!statusResponse.ok) {
        toast.error('Unable to check assessment status');
        navigate('/jobs');
        return;
      }
      
      const status = await statusResponse.json();
      setInvitationStatus(status);
      
      // If not invited or already completed, don't load assessment
      if (!status.invited) {
        return;
      }
      
      if (status.completed) {
        return;
      }
      
      // Load assessment if invited and not completed
      const assessmentResponse = await apiCall(`/api/assessments/${jobId}`);
      if (!assessmentResponse.ok) {
        toast.error('Assessment not found');
        navigate('/jobs');
        return;
      }
      
      const assessmentData = await assessmentResponse.json();
      setAssessment(assessmentData.data);
    } catch (error) {
      console.error('Error loading assessment:', error);
      toast.error('Failed to load assessment');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const isQuestionVisible = (question: AssessmentQuestion): boolean => {
    if (!question.conditional) return true;
    
    const dependentResponse = responses[question.conditional.dependsOn];
    return dependentResponse === question.conditional.value;
  };

  const validateSection = (sectionIndex: number): boolean => {
    if (!assessment) return false;
    
    const section = assessment.sections[sectionIndex];
    const visibleQuestions = section.questions.filter(isQuestionVisible);
    
    for (const question of visibleQuestions) {
      if (question.required && !responses[question.id]) {
        return false;
      }
      
      // Validate numeric ranges
      if (question.type === 'numeric' && responses[question.id] !== undefined) {
        const value = Number(responses[question.id]);
        if (question.validation?.min !== undefined && value < question.validation.min) {
          return false;
        }
        if (question.validation?.max !== undefined && value > question.validation.max) {
          return false;
        }
      }
      
      // Validate text length
      if (question.validation?.maxLength && responses[question.id]) {
        if (responses[question.id].length > question.validation.maxLength) {
          return false;
        }
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (!validateSection(currentSection)) {
      toast.error('Please complete all required fields');
      return;
    }
    
    if (assessment && currentSection < assessment.sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment || !validateSection(currentSection)) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const response = await apiCall(`/api/assessments/${jobId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          responses
        })
      });

      if (!response.ok) throw new Error('Failed to submit assessment');
      
      toast.success('Assessment submitted successfully!');
      navigate('/my-applications');
    } catch (error) {
      toast.error('Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: AssessmentQuestion) => {
    if (!isQuestionVisible(question)) return null;

    const value = responses[question.id] || '';

    return (
      <div key={question.id} className="mb-6">
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          {question.title}
          {question.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {question.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {question.description}
          </p>
        )}

        {question.type === 'single-choice' && (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleResponse(question.id, e.target.value)}
                  className="mr-2"
                />
                <span className="text-gray-900 dark:text-white">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'multi-choice' && (
          <div className="space-y-2">
            {question.options?.map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (e.target.checked) {
                      handleResponse(question.id, [...currentValues, option]);
                    } else {
                      handleResponse(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                  className="mr-2"
                />
                <span className="text-gray-900 dark:text-white">{option}</span>
              </label>
            ))}
          </div>
        )}

        {question.type === 'short-text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            maxLength={question.validation?.maxLength}
          />
        )}

        {question.type === 'long-text' && (
          <textarea
            value={value}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            maxLength={question.validation?.maxLength}
          />
        )}

        {question.type === 'numeric' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            min={question.validation?.min}
            max={question.validation?.max}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        )}

        {question.type === 'file-upload' && (
          <input
            type="file"
            onChange={(e) => handleResponse(question.id, e.target.files?.[0]?.name || '')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assessment...</p>
        </div>
      </div>
    );
  }

  // Show different messages based on invitation status
  if (!loading && invitationStatus) {
    if (!invitationStatus.hasAssessment) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No Assessment Available</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">There is no assessment created for this job yet.</p>
            <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
          </div>
        </div>
      );
    }
    
    if (!invitationStatus.invited) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-6">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Assessment Invitation Pending</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't been invited to take this assessment yet. HR will send you an invitation when you reach the appropriate stage in the hiring process.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/my-applications')}>View My Applications</Button>
              <Button variant="secondary" onClick={() => navigate('/jobs')}>Back to Jobs</Button>
            </div>
          </div>
        </div>
      );
    }
    
    if (invitationStatus.completed) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Assessment Already Completed</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You have already completed this assessment. Thank you for your submission!
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/my-applications')}>View My Applications</Button>
              <Button variant="secondary" onClick={() => navigate('/jobs')}>Back to Jobs</Button>
            </div>
          </div>
        </div>
      );
    }
  }
  
  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Assessment Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The assessment for this job is not available.</p>
          <Button onClick={() => navigate('/jobs')}>Back to Jobs</Button>
        </div>
      </div>
    );
  }

  const currentSectionData = assessment.sections[currentSection];
  const isLastSection = currentSection === assessment.sections.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {assessment.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {assessment.description}
            </p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSection + 1) / assessment.sections.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Section {currentSection + 1} of {assessment.sections.length}
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
              {currentSectionData.title}
            </h2>
            
            {currentSectionData.questions.map(renderQuestion)}
          </div>

          <div className="flex justify-between">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={currentSection === 0}
            >
              Previous
            </Button>

            {isLastSection ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
              >
                Submit Assessment
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
              >
                Next Section
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TakeAssessment;