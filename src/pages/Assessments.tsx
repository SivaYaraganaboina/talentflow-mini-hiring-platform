import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AssessmentListProfessional from '../components/AssessmentListProfessional';
import AssessmentBuilder from '../components/AssessmentBuilder';
import { Assessment } from '../types';
import toast from 'react-hot-toast';

const Assessments: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [pendingCandidateId, setPendingCandidateId] = useState<string>('');

  useEffect(() => {
    const jobId = searchParams.get('jobId');
    const candidateId = searchParams.get('candidateId');
    
    if (jobId) {
      setSelectedJobId(jobId);
      setShowBuilder(true);
      if (candidateId) {
        setPendingCandidateId(candidateId);
        toast.success('Creating assessment for candidate invitation');
      }
    }
  }, [searchParams]);

  const handleCreateAssessment = (jobId: string) => {
    console.log('handleCreateAssessment called with jobId:', jobId);
    setSelectedJobId(jobId);
    setShowBuilder(true);
    console.log('showBuilder set to true, selectedJobId set to:', jobId);
  };

  const handleSaveAssessment = async (assessment: Assessment) => {
    setShowBuilder(false);
    setSelectedJobId('');
    
    // If there's a pending candidate invitation, send it now
    if (pendingCandidateId) {
      try {
        const response = await fetch(`/api/candidates/${pendingCandidateId}/invite-assessment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: assessment.jobId,
            invitedBy: 'HR',
            stage: 'assessment'
          })
        });
        
        if (response.ok) {
          toast.success('Assessment created and invitation sent to candidate!');
        }
      } catch (error) {
        console.error('Error sending invitation:', error);
        toast.error('Assessment created but failed to send invitation');
      }
      setPendingCandidateId('');
    }
    
    // Refresh the list
    window.location.reload();
  };

  const handleCloseBuilder = () => {
    setShowBuilder(false);
    setSelectedJobId('');
    setPendingCandidateId('');
  };

  console.log('Assessments render - showBuilder:', showBuilder, 'selectedJobId:', selectedJobId);
  
  if (showBuilder) {
    console.log('Rendering AssessmentBuilder with jobId:', selectedJobId);
    return (
      <AssessmentBuilder
        jobId={selectedJobId}
        onSave={handleSaveAssessment}
        onClose={handleCloseBuilder}
      />
    );
  }

  return <AssessmentListProfessional onCreateAssessment={handleCreateAssessment} />;
};

export default Assessments;
