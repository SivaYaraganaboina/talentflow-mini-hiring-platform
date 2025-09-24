import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Assessment, AssessmentSection, AssessmentQuestion } from '../types';

interface AssessmentBuilderProps {
  jobId: string;
  onSave: (assessment: Assessment) => void;
  onClose: () => void;
}

const questionTypes = [
  { value: 'single-choice', label: 'Single Choice' },
  { value: 'multi-choice', label: 'Multiple Choice' },
  { value: 'short-text', label: 'Short Text' },
  { value: 'long-text', label: 'Long Text' },
  { value: 'numeric', label: 'Numeric' },
  { value: 'file-upload', label: 'File Upload' }
];

const AssessmentBuilder: React.FC<AssessmentBuilderProps> = ({ jobId, onSave, onClose }) => {
  const [assessment, setAssessment] = useState<Assessment>({
    id: '',
    jobId,
    title: '',
    description: '',
    sections: [],
    enableScoring: false,
    createdAt: '',
    updatedAt: ''
  });

  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);

  useEffect(() => {
    console.log('AssessmentBuilder useEffect - jobId:', jobId);
    if (jobId) {
      loadAssessment();
    } else {
      console.warn('AssessmentBuilder: No jobId provided');
      setLoading(false);
    }
  }, [jobId]);

  const loadAssessment = async () => {
    if (!jobId) {
      console.warn('loadAssessment: No jobId provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('Loading assessment for jobId:', jobId);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`/api/assessments/${jobId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      console.log('Assessment response:', response.status, response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Assessment data:', data);
        if (data.data) {
          setAssessment(data.data);
        } else {
          console.log('No existing assessment found, starting with empty assessment');
          setAssessment({
            id: '',
            jobId,
            title: '',
            description: '',
            sections: [],
            enableScoring: false,
            createdAt: '',
            updatedAt: ''
          });
        }
      } else {
        console.log('Assessment not found, starting with empty assessment');
        setAssessment({
          id: '',
          jobId,
          title: '',
          description: '',
          sections: [],
          enableScoring: false,
          createdAt: '',
          updatedAt: ''
        });
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
      // Initialize with empty assessment on error
      setAssessment({
        id: '',
        jobId,
        title: '',
        description: '',
        sections: [],
        enableScoring: false,
        createdAt: '',
        updatedAt: ''
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!assessment.title.trim()) {
      alert('Please enter an assessment title');
      return;
    }
    
    try {
      console.log('Saving assessment:', assessment);
      const response = await fetch(`/api/assessments/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assessment,
          jobId,
          updatedAt: new Date().toISOString(),
          createdAt: assessment.createdAt || new Date().toISOString()
        })
      });

      console.log('Save response:', response.status, response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed:', errorText);
        throw new Error('Failed to save assessment');
      }

      const data = await response.json();
      console.log('Assessment saved successfully:', data);
      alert('Assessment saved successfully!');
      onSave(data.data);
    } catch (error) {
      console.error('Error saving assessment:', error);
      alert('Failed to save assessment. Please try again.');
    }
  };

  const addSection = () => {
    const newSection: AssessmentSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      questions: []
    };

    setAssessment(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  };

  const updateSection = (sectionIndex: number, updates: Partial<AssessmentSection>) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? { ...section, ...updates } : section
      )
    }));
  };

  const deleteSection = (sectionIndex: number) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.filter((_, index) => index !== sectionIndex)
    }));
  };

  const addQuestion = (sectionIndex: number) => {
    const newQuestion: AssessmentQuestion = {
      id: `question-${Date.now()}`,
      type: 'short-text',
      title: 'New Question',
      description: '',
      required: false,
      options: [],
      points: 1,
      validation: {}
    };

    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex
          ? { ...section, questions: [...section.questions, newQuestion] }
          : section
      )
    }));
  };

  const updateQuestion = (sectionIndex: number, questionIndex: number, updates: Partial<AssessmentQuestion>) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map((section, sIndex) =>
        sIndex === sectionIndex
          ? {
              ...section,
              questions: section.questions.map((question, qIndex) =>
                qIndex === questionIndex ? { ...question, ...updates } : question
              )
            }
          : section
      )
    }));
  };

  const deleteQuestion = (sectionIndex: number, questionIndex: number) => {
    setAssessment(prev => ({
      ...prev,
      sections: prev.sections.map((section, sIndex) =>
        sIndex === sectionIndex
          ? {
              ...section,
              questions: section.questions.filter((_, qIndex) => qIndex !== questionIndex)
            }
          : section
      )
    }));
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading assessment builder...</p>
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
            onClick={onClose}
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Assessments
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {assessment.id ? 'Edit Assessment' : 'Create Assessment'}
            </h2>
            {assessment.id && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Last updated: {assessment.updatedAt ? new Date(assessment.updatedAt).toLocaleDateString() : 'Never'}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" 
              onClick={handleSave}
            >
              {assessment.id ? 'Update Assessment' : 'Save Assessment'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assessment Details</h3>
                {assessment.id && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-medium rounded-full">
                    Existing Assessment
                  </span>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={assessment.title}
                    onChange={(e) => setAssessment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Assessment Title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={assessment.description}
                    onChange={(e) => setAssessment(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Assessment Description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                      checked={assessment.enableScoring}
                      onChange={(e) => setAssessment(prev => ({ ...prev, enableScoring: e.target.checked }))}
                    />
                    Enable Automatic Scoring
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    When enabled, you can set correct answers for questions and get automatic scores for submissions.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {assessment.sections.map((section, sectionIndex) => (
                <div
                  key={section.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      className="flex-1 text-lg font-semibold bg-transparent border-none text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      value={section.title}
                      onChange={(e) => updateSection(sectionIndex, { title: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                        onClick={() => addQuestion(sectionIndex)}
                      >
                        Add Question
                      </button>
                      <button
                        className="px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                        onClick={() => deleteSection(sectionIndex)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {section.questions.map((question, questionIndex) => (
                      <div
                        key={question.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <select
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={question.type}
                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, { type: e.target.value as any })}
                          >
                            {questionTypes.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <button
                            className="w-8 h-8 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center justify-center"
                            onClick={() => deleteQuestion(sectionIndex, questionIndex)}
                          >
                            ×
                          </button>
                        </div>

                        <div className="space-y-3">
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={question.title}
                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, { title: e.target.value })}
                            placeholder="Question title"
                          />

                          <textarea
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={question.description}
                            onChange={(e) => updateQuestion(sectionIndex, questionIndex, { description: e.target.value })}
                            placeholder="Question description (optional)"
                            rows={2}
                          />

                          {(question.type === 'single-choice' || question.type === 'multi-choice') && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Options:</label>
                              <div className="space-y-2">
                                {question.options?.map((option, optionIndex) => (
                                  <div key={optionIndex} className="flex gap-2">
                                    <input
                                      type="text"
                                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      value={option}
                                      onChange={(e) => {
                                        const newOptions = [...(question.options || [])];
                                        newOptions[optionIndex] = e.target.value;
                                        updateQuestion(sectionIndex, questionIndex, { options: newOptions });
                                      }}
                                      placeholder={`Option ${optionIndex + 1}`}
                                    />
                                    <button
                                      className="w-8 h-8 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors flex items-center justify-center"
                                      onClick={() => {
                                        const newOptions = (question.options || []).filter((_, i) => i !== optionIndex);
                                        updateQuestion(sectionIndex, questionIndex, { options: newOptions });
                                      }}
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                <button
                                  className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
                                  onClick={() => {
                                    const newOptions = [...(question.options || []), ''];
                                    updateQuestion(sectionIndex, questionIndex, { options: newOptions });
                                  }}
                                >
                                  Add Option
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                              <input
                                type="checkbox"
                                className="mr-2 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                                checked={question.required}
                                onChange={(e) => updateQuestion(sectionIndex, questionIndex, { required: e.target.checked })}
                              />
                              Required
                            </label>
                            
                            {assessment.enableScoring && (
                              <div className="flex items-center space-x-2">
                                <label className="text-sm text-gray-700 dark:text-gray-300">Points:</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  value={question.points || 1}
                                  onChange={(e) => updateQuestion(sectionIndex, questionIndex, { points: parseInt(e.target.value) || 1 })}
                                />
                              </div>
                            )}
                          </div>
                          
                          {assessment.enableScoring && (question.type === 'single-choice' || question.type === 'multi-choice') && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Correct Answer{question.type === 'multi-choice' ? 's' : ''}:
                              </label>
                              <div className="space-y-2">
                                {question.options?.map((option, optionIndex) => (
                                  <label key={optionIndex} className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <input
                                      type={question.type === 'single-choice' ? 'radio' : 'checkbox'}
                                      name={`correct-${question.id}`}
                                      className="mr-2 text-green-600 focus:ring-green-500"
                                      checked={
                                        question.type === 'single-choice'
                                          ? question.correctAnswer === option
                                          : Array.isArray(question.correctAnswer) && question.correctAnswer.includes(option)
                                      }
                                      onChange={(e) => {
                                        if (question.type === 'single-choice') {
                                          updateQuestion(sectionIndex, questionIndex, { 
                                            correctAnswer: e.target.checked ? option : undefined 
                                          });
                                        } else {
                                          const currentAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [];
                                          const newAnswers = e.target.checked
                                            ? [...currentAnswers, option]
                                            : currentAnswers.filter(a => a !== option);
                                          updateQuestion(sectionIndex, questionIndex, { 
                                            correctAnswer: newAnswers.length > 0 ? newAnswers : undefined 
                                          });
                                        }
                                      }}
                                    />
                                    <span className="text-green-600 dark:text-green-400 font-medium">✓</span>
                                    <span className="ml-2">{option}</span>
                                  </label>
                                ))}
                              </div>
                              {(!question.options || question.options.length === 0) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                  Add options first to set correct answers
                                </p>
                              )}
                            </div>
                          )}
                          
                          {assessment.enableScoring && (question.type === 'short-text' || question.type === 'long-text') && (
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Expected Answer (for reference only):
                              </label>
                              <textarea
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={typeof question.correctAnswer === 'string' ? question.correctAnswer : ''}
                                onChange={(e) => updateQuestion(sectionIndex, questionIndex, { correctAnswer: e.target.value })}
                                placeholder="Expected answer or key points (manual review required)"
                                rows={2}
                              />
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Text answers require manual review. This is for HR reference only.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button 
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors" 
              onClick={addSection}
            >
              Add Section
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-fit sticky top-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assessment Overview</h3>
              {assessment.sections.length > 0 && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>{assessment.sections.length} sections, {assessment.sections.reduce((total, section) => total + section.questions.length, 0)} questions</div>
                  {assessment.enableScoring && (
                    <div className="text-green-600 dark:text-green-400 font-medium">
                      Scoring: {assessment.sections.reduce((total, section) => total + section.questions.reduce((sectionTotal, q) => sectionTotal + (q.points || 0), 0), 0)} points total
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {assessment.title && (
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{assessment.title}</h2>
              )}
              {assessment.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">{assessment.description}</p>
              )}

              {assessment.sections.map((section, sectionIndex) => (
                <div key={section.id} className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{section.title}</h3>

                  {section.questions.map((question, questionIndex) => (
                    <div key={question.id} className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {question.title}
                          {question.required && <span className="text-red-500 ml-1">*</span>}
                        </h4>
                        {question.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{question.description}</p>
                        )}
                      </div>

                      <div className="mt-2">
                        {question.type === 'single-choice' && (
                          <div className="space-y-2">
                            {question.options?.map((option, optionIndex) => (
                              <label key={optionIndex} className="flex items-center text-gray-700 dark:text-gray-300">
                                <input type="radio" name={`q-${question.id}`} className="mr-2" disabled />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}

                        {question.type === 'multi-choice' && (
                          <div className="space-y-2">
                            {question.options?.map((option, optionIndex) => (
                              <label key={optionIndex} className="flex items-center text-gray-700 dark:text-gray-300">
                                <input type="checkbox" className="mr-2" disabled />
                                {option}
                              </label>
                            ))}
                          </div>
                        )}

                        {question.type === 'short-text' && (
                          <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Your answer" disabled />
                        )}

                        {question.type === 'long-text' && (
                          <textarea className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" rows={4} placeholder="Your answer" disabled />
                        )}

                        {question.type === 'numeric' && (
                          <input type="number" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Your answer" disabled />
                        )}

                        {question.type === 'file-upload' && (
                          <input type="file" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" disabled />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

              {assessment.sections.length === 0 && (
                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                  Add sections and questions to see the preview
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssessmentBuilder;
