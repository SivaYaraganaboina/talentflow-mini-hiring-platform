import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Job, Candidate, Assessment } from '../types';

interface AppState {
  // Auth state
  user: {
    role: string | null;
    name: string | null;
    email?: string | null;
  };
  
  // UI state
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  
  // Data state
  jobs: Job[];
  candidates: Candidate[];
  assessments: Assessment[];
  
  // Loading states
  loading: {
    jobs: boolean;
    candidates: boolean;
    assessments: boolean;
  };
  
  // Error states
  errors: {
    jobs: string | null;
    candidates: string | null;
    assessments: string | null;
  };
  
  // Actions
  setUser: (user: { role: string; name: string; email?: string }) => void;
  logout: () => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Data actions
  setJobs: (jobs: Job[]) => void;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;
  
  setCandidates: (candidates: Candidate[]) => void;
  addCandidate: (candidate: Candidate) => void;
  updateCandidate: (id: string, updates: Partial<Candidate>) => void;
  removeCandidate: (id: string) => void;
  
  setAssessments: (assessments: Assessment[]) => void;
  addAssessment: (assessment: Assessment) => void;
  updateAssessment: (id: string, updates: Partial<Assessment>) => void;
  removeAssessment: (id: string) => void;
  
  // Loading actions
  setLoading: (key: keyof AppState['loading'], loading: boolean) => void;
  
  // Error actions
  setError: (key: keyof AppState['errors'], error: string | null) => void;
  clearErrors: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state - check localStorage for existing session
        user: {
          role: localStorage.getItem('role'),
          name: localStorage.getItem('username'),
          email: localStorage.getItem('email'),
        },
        theme: 'light',
        sidebarOpen: false,
        jobs: [],
        candidates: [],
        assessments: [],
        loading: {
          jobs: false,
          candidates: false,
          assessments: false,
        },
        errors: {
          jobs: null,
          candidates: null,
          assessments: null,
        },
        
        // Auth actions
        setUser: (user) => {
          localStorage.setItem('role', user.role);
          localStorage.setItem('username', user.name);
          if (user.email) {
            localStorage.setItem('email', user.email);
          }
          set({ user });
        },
        
        logout: () => {
          localStorage.removeItem('role');
          localStorage.removeItem('username');
          localStorage.removeItem('email');
          set({
            user: { role: null, name: null, email: null },
            jobs: [],
            candidates: [],
            assessments: [],
          });
        },
        
        // UI actions
        toggleTheme: () => {
          const newTheme = get().theme === 'light' ? 'dark' : 'light';
          set({ theme: newTheme });
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
        },
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        
        // Data actions
        setJobs: (jobs) => set({ jobs }),
        addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
        updateJob: (id, updates) => set((state) => ({
          jobs: state.jobs.map(job => job.id === id ? { ...job, ...updates } : job)
        })),
        removeJob: (id) => set((state) => ({
          jobs: state.jobs.filter(job => job.id !== id)
        })),
        
        setCandidates: (candidates) => set({ candidates }),
        addCandidate: (candidate) => set((state) => ({ candidates: [...state.candidates, candidate] })),
        updateCandidate: (id, updates) => set((state) => ({
          candidates: state.candidates.map(candidate => 
            candidate.id === id ? { ...candidate, ...updates } : candidate
          )
        })),
        removeCandidate: (id) => set((state) => ({
          candidates: state.candidates.filter(candidate => candidate.id !== id)
        })),
        
        setAssessments: (assessments) => set({ assessments }),
        addAssessment: (assessment) => set((state) => ({ assessments: [...state.assessments, assessment] })),
        updateAssessment: (id, updates) => set((state) => ({
          assessments: state.assessments.map(assessment => 
            assessment.id === id ? { ...assessment, ...updates } : assessment
          )
        })),
        removeAssessment: (id) => set((state) => ({
          assessments: state.assessments.filter(assessment => assessment.id !== id)
        })),
        
        // Loading actions
        setLoading: (key, loading) => set((state) => ({
          loading: { ...state.loading, [key]: loading }
        })),
        
        // Error actions
        setError: (key, error) => set((state) => ({
          errors: { ...state.errors, [key]: error }
        })),
        
        clearErrors: () => set({
          errors: { jobs: null, candidates: null, assessments: null }
        }),
      }),
      {
        name: 'talentflow-storage',
        partialize: (state) => ({
          theme: state.theme,
        }),
      }
    ),
    {
      name: 'talentflow-store',
    }
  )
);

// Selectors for better performance
export const useAuth = () => useAppStore((state) => ({
  user: state.user,
  setUser: state.setUser,
  logout: state.logout,
}));

export const useTheme = () => useAppStore((state) => ({
  theme: state.theme,
  toggleTheme: state.toggleTheme,
}));

export const useJobs = () => useAppStore((state) => ({
  jobs: state.jobs,
  loading: state.loading.jobs,
  error: state.errors.jobs,
  setJobs: state.setJobs,
  addJob: state.addJob,
  updateJob: state.updateJob,
  removeJob: state.removeJob,
  setLoading: (loading: boolean) => state.setLoading('jobs', loading),
  setError: (error: string | null) => state.setError('jobs', error),
}));

export const useCandidates = () => useAppStore((state) => ({
  candidates: state.candidates,
  loading: state.loading.candidates,
  error: state.errors.candidates,
  setCandidates: state.setCandidates,
  addCandidate: state.addCandidate,
  updateCandidate: state.updateCandidate,
  removeCandidate: state.removeCandidate,
  setLoading: (loading: boolean) => state.setLoading('candidates', loading),
  setError: (error: string | null) => state.setError('candidates', error),
}));

export const useAssessments = () => useAppStore((state) => ({
  assessments: state.assessments,
  loading: state.loading.assessments,
  error: state.errors.assessments,
  setAssessments: state.setAssessments,
  addAssessment: state.addAssessment,
  updateAssessment: state.updateAssessment,
  removeAssessment: state.removeAssessment,
  setLoading: (loading: boolean) => state.setLoading('assessments', loading),
  setError: (error: string | null) => state.setError('assessments', error),
}));