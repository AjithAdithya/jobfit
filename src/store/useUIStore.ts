import { create } from 'zustand';
import type { CoverLetterTone } from '../lib/agents';

export type AppView = 'dashboard' | 'analysis' | 'resumes' | 'settings' | 'history' | 'cover_letter' | 'profile';

export interface JobContext {
  title: string;
  url: string;
  siteName: string;
  companyName?: string;
}

interface UIState {
  currentView: AppView;
  activeResumeId: string | null;
  activeResumeName: string | null;
  activeHistoryItem: any | null;
  jobContext: JobContext | null;
  coverLetterTone: CoverLetterTone;
  currentCoverLetter: string | null;
  setView: (view: AppView) => void;
  setActiveResume: (id: string | null, name?: string | null) => void;
  setActiveHistory: (item: any | null) => void;
  setJobContext: (context: JobContext | null) => void;
  setCoverLetterTone: (tone: CoverLetterTone) => void;
  setCurrentCoverLetter: (text: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'dashboard',
  activeResumeId: null,
  activeResumeName: null,
  activeHistoryItem: null,
  jobContext: null,
  coverLetterTone: 'professional',
  currentCoverLetter: null,
  setView: (view) => set({ currentView: view }),
  setActiveResume: (id, name = null) => set({ activeResumeId: id, activeResumeName: name }),
  setActiveHistory: (item) => set({ activeHistoryItem: item }),
  setJobContext: (context) => set({ jobContext: context }),
  setCoverLetterTone: (tone) => set({ coverLetterTone: tone }),
  setCurrentCoverLetter: (text) => set({ currentCoverLetter: text }),
}));
