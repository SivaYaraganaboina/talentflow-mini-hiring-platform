export interface Job {
    id: string;
    title: string;
    slug: string;
    description: string;
    location: string;
    status: 'active' | 'archived';
    tags: string[];
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface Candidate {
    id: string;
    name: string;
    email: string;
    phone: string;
    resume: string;
    status: string;
    stage: string;
    jobId: string;
    appliedAt: string;
    timeline: TimelineEntry[];
    assessmentInvited?: boolean;
    assessmentInvitedAt?: string;
    assessmentCompleted?: boolean;
    assessmentCompletedAt?: string;
}

export interface TimelineEntry {
    id: string;
    stage: string;
    timestamp: string;
    notes: string;
    movedBy?: string;
}

export interface Application {
    id: string;
    candidateId: string;
    jobId: string;
    stage: 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected';
    appliedAt: string;
    timeline: ApplicationTimelineEntry[];
    notes: string;
}

export interface ApplicationTimelineEntry {
    id: string;
    stage: 'applied' | 'screen' | 'tech' | 'offer' | 'hired' | 'rejected';
    timestamp: string;
    notes: string;
    movedBy: string;
}

export interface Assessment {
    id: string;
    jobId: string;
    title: string;
    description: string;
    sections: AssessmentSection[];
    enableScoring: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AssessmentSection {
    id: string;
    title: string;
    questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
    id: string;
    type: string;
    title: string;
    description: string;
    required: boolean;
    options?: string[];
    correctAnswer?: string | string[]; // For scoring - single answer or multiple answers
    points?: number; // Points for this question
    validation?: {
        min?: number;
        max?: number;
        maxLength?: number;
    };
    conditional?: {
        dependsOn: string;
        condition: string;
        value: string;
    };
}

export interface AssessmentSubmission {
    id: string;
    jobId: string;
    candidateId: string;
    responses: Record<string, any>;
    score?: number; // Calculated score percentage (0-100)
    maxScore?: number; // Maximum possible score
    scoredQuestions?: number; // Number of questions that were scored
    submittedAt: string;
}

export interface ApiResponse<T> {
    data: T;
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

export interface PaginationParams {
    page?: number;
    pageSize?: number;
    search?: string;
    sort?: string;
    status?: string;
}