import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserIcon,
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  CalendarIcon,
  StarIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { AssessmentSubmission, Assessment } from '../types';
import { apiCall } from '../utils/apiUtils';
import Card from './ui/Card';
import Button from './ui/Button';
import Modal from './ui/Modal';
import toast from 'react-hot-toast';

interface AssessmentSubmissionsProps {
  jobId: string;
  jobTitle: string;
}

interface QuestionWithAnswer {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: string | string[];
  userAnswer: string | string[];
  isCorrect?: boolean;
  score?: number;
}

const AssessmentSubmissions: React.FC<AssessmentSubmissionsProps> = ({ jobId, jobTitle }) => {
  const [submissions, setSubmissions] = useState<AssessmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<AssessmentSubmission | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questionsWithAnswers, setQuestionsWithAnswers] = useState<QuestionWithAnswer[]>([]);

  useEffect(() => {
    loadData();
  }, [jobId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load assessment details
      const assessmentResponse = await apiCall(`/api/assessments/${jobId}`);
      if (assessmentResponse.ok) {
        const assessmentData = await assessmentResponse.json();
        setAssessment(assessmentData.data);
      }
      
      // Load submissions
      const response = await apiCall(`/api/assessments/${jobId}/submissions`);
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const calculateScore = (submission: AssessmentSubmission, assessment: Assessment): { score: number; details: QuestionWithAnswer[] } => {
    if (!assessment?.sections || !submission.responses) {
      return { score: 0, details: [] };
    }
    
    // If submission already has a calculated score, use it
    if (submission.score !== undefined) {
      const details = getQuestionDetails(submission, assessment);
      return { score: submission.score, details };
    }
    
    // Fallback calculation for older submissions
    let totalScore = 0;
    let totalPossibleScore = 0;
    const details: QuestionWithAnswer[] = [];
    
    assessment.sections.forEach(section => {
      section.questions?.forEach(question => {
        const userAnswer = submission.responses[question.id];
        const questionPoints = question.points || 1;
        let isCorrect = false;
        let earnedPoints = 0;
        
        if (question.correctAnswer !== undefined && userAnswer !== undefined) {
          totalPossibleScore += questionPoints;
          
          if (question.type === 'single-choice') {
            isCorrect = userAnswer === question.correctAnswer;
            earnedPoints = isCorrect ? questionPoints : 0;
          } else if (question.type === 'multi-choice') {
            const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
            const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
            
            if (correctAnswers.length > 0) {
              const correctSelected = userAnswers.filter(answer => correctAnswers.includes(answer)).length;
              const incorrectSelected = userAnswers.filter(answer => !correctAnswers.includes(answer)).length;
              const partialScore = Math.max(0, (correctSelected - incorrectSelected) / correctAnswers.length);
              earnedPoints = questionPoints * partialScore;
              isCorrect = partialScore === 1;
            }
          }
          
          totalScore += earnedPoints;
        }
        
        details.push({
          id: question.id,
          question: question.title || question.description || 'Question',
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer || 'No answer provided',
          isCorrect,
          score: earnedPoints
        });
      });
    });
    
    const finalScore = totalPossibleScore > 0 ? Math.round((totalScore / totalPossibleScore) * 100) : 0;
    return { score: finalScore, details };
  };
  
  const getQuestionDetails = (submission: AssessmentSubmission, assessment: Assessment): QuestionWithAnswer[] => {
    const details: QuestionWithAnswer[] = [];
    
    assessment.sections.forEach(section => {
      section.questions?.forEach(question => {
        const userAnswer = submission.responses[question.id];
        let isCorrect = false;
        
        if (question.correctAnswer !== undefined && userAnswer !== undefined) {
          if (question.type === 'single-choice') {
            isCorrect = userAnswer === question.correctAnswer;
          } else if (question.type === 'multi-choice') {
            const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
            const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
            isCorrect = correctAnswers.length > 0 && 
              correctAnswers.every(answer => userAnswers.includes(answer)) &&
              userAnswers.every(answer => correctAnswers.includes(answer));
          }
        }
        
        details.push({
          id: question.id,
          question: question.title || question.description || 'Question',
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
          userAnswer: userAnswer || 'No answer provided',
          isCorrect,
          score: isCorrect ? (question.points || 1) : 0
        });
      });
    });
    
    return details;
  };

  const handleViewSubmission = (submission: AssessmentSubmission) => {
    if (!assessment) return;
    
    const { details } = calculateScore(submission, assessment);
    setQuestionsWithAnswers(details);
    setSelectedSubmission(submission);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <DocumentTextIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Assessment Submissions
              </h3>
              <p className="text-blue-600 dark:text-blue-400 font-medium">
                {jobTitle}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {submissions.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Submissions
            </div>
          </div>
        </div>
        
        {submissions.length > 0 && assessment && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <ChartBarIcon className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Avg Score</span>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {assessment.enableScoring 
                  ? Math.round(submissions.reduce((acc, sub) => acc + calculateScore(sub, assessment).score, 0) / submissions.length)
                  : 'N/A'
                }%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <StarIcon className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Top Score</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {assessment.enableScoring 
                  ? Math.max(...submissions.map(sub => calculateScore(sub, assessment).score))
                  : 'N/A'
                }%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <ClockIcon className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Latest</span>
              </div>
              <div className="text-sm font-bold text-blue-600">
                {new Date(Math.max(...submissions.map(sub => new Date(sub.submittedAt).getTime()))).toLocaleDateString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {submissions.length === 0 ? (
        <Card className="p-12 text-center">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Submissions Yet
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            No candidates have completed the assessment for this job.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <UserIcon className="w-5 h-5 mr-2" />
            Candidate Submissions
          </h4>
          
          <div className="space-y-3">
            {submissions
              .sort((a, b) => {
                if (!assessment || !assessment.enableScoring) return 0;
                const scoreA = calculateScore(a, assessment).score;
                const scoreB = calculateScore(b, assessment).score;
                return scoreB - scoreA;
              })
              .map((submission, index) => {
                const { score } = assessment ? calculateScore(submission, assessment) : { score: 0 };
                const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
                const scoreBg = score >= 80 ? 'bg-green-100 dark:bg-green-900/20' : score >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/20' : 'bg-red-100 dark:bg-red-900/20';
                
                return (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-white">#{index + 1}</span>
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Candidate #{submission.candidateId.slice(-4)}
                              </h4>
                              {assessment?.enableScoring ? (
                                <div className={`px-3 py-1 rounded-full text-sm font-bold ${scoreBg} ${scoreColor}`}>
                                  Score: {score}%
                                </div>
                              ) : (
                                <div className="px-3 py-1 rounded-full text-sm font-bold bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                                  Manual Review
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-300">
                              <div className="flex items-center">
                                <CalendarIcon className="w-4 h-4 mr-1" />
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {new Date(submission.submittedAt).toLocaleTimeString()}
                              </div>
                              <div className="flex items-center">
                                <DocumentTextIcon className="w-4 h-4 mr-1" />
                                {Object.keys(submission.responses || {}).length} responses
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => handleViewSubmission(submission)}
                          icon={<EyeIcon className="w-4 h-4" />}
                          className="ml-4"
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        </div>
      )}

      {/* Detailed Submission Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Assessment Submission Details"
        size="xl"
      >
        {selectedSubmission && assessment && (
          <div className="space-y-6">
            {/* Header with Score */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      Candidate #{selectedSubmission.candidateId.slice(-4)}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {new Date(selectedSubmission.submittedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {assessment.enableScoring ? (
                    <>
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {calculateScore(selectedSubmission, assessment).score}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Overall Score
                      </div>
                      {selectedSubmission.scoredQuestions && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {selectedSubmission.scoredQuestions} questions scored
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-1">
                        Manual Review
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Scoring Disabled
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Questions and Answers */}
            <div className="space-y-4">
              <h5 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <DocumentTextIcon className="w-6 h-6 mr-2" />
                Detailed Responses
              </h5>
              
              {questionsWithAnswers.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {questionsWithAnswers.map((qa, index) => (
                    <div key={qa.id} className={`border rounded-xl p-4 ${
                      !assessment.enableScoring || qa.correctAnswer === undefined
                        ? 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                        : qa.isCorrect 
                        ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                        : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
                    }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                              Question {index + 1}
                            </span>
                            {assessment.enableScoring && qa.correctAnswer !== undefined ? (
                              <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                                qa.isCorrect 
                                  ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' 
                                  : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                              }`}>
                                {qa.isCorrect ? 'Correct' : 'Incorrect'} ({qa.score} pts)
                              </div>
                            ) : (
                              <div className="px-2 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                                Manual Review
                              </div>
                            )}
                          </div>
                          <h6 className="font-semibold text-gray-900 dark:text-white mb-3">
                            {qa.question}
                          </h6>
                        </div>
                        {assessment.enableScoring && qa.correctAnswer !== undefined ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            qa.isCorrect 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-500 text-white'
                          }`}>
                            {qa.isCorrect ? '✓' : '✗'}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-400 text-white">
                            ?
                          </div>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Candidate's Answer:</div>
                          <div className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded border">
                            {Array.isArray(qa.userAnswer) ? qa.userAnswer.join(', ') : String(qa.userAnswer)}
                          </div>
                        </div>
                        
                        {assessment.enableScoring && qa.correctAnswer !== undefined ? (
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correct Answer:</div>
                            <div className="text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-800 p-2 rounded border">
                              {Array.isArray(qa.correctAnswer) ? qa.correctAnswer.join(', ') : String(qa.correctAnswer)}
                            </div>
                          </div>
                        ) : qa.type === 'short-text' || qa.type === 'long-text' ? (
                          <div>
                            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Answer (Reference):</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 p-2 rounded border italic">
                              {qa.correctAnswer || 'No reference answer provided'}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No responses recorded for this submission.
                </p>
              )}
            </div>
            
            {/* Summary Stats */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              {assessment.enableScoring ? (
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {questionsWithAnswers.filter(qa => qa.isCorrect && qa.correctAnswer !== undefined).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {questionsWithAnswers.filter(qa => !qa.isCorrect && qa.correctAnswer !== undefined).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Incorrect</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-600">
                      {questionsWithAnswers.filter(qa => qa.correctAnswer === undefined).length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Manual Review</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {questionsWithAnswers.length}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {questionsWithAnswers.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Questions (Manual Review Required)</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssessmentSubmissions;