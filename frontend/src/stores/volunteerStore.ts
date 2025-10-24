import { create } from 'zustand';
import api from '../services/api';

export interface VolunteerSession {
  session_id?: number;
  location_id: number;
  volunteer_name: string;
  session_date: string;
  start_time: string;
  end_time?: string;
  hours_worked?: number;
  tasks_performed?: string;
  notes?: string;
  created_at?: string;
  location_name?: string;
}

export interface CreateVolunteerSessionData {
  location_id: number;
  volunteer_name: string;
  session_date?: string;
  start_time: string;
  end_time?: string;
  hours_worked?: number;
  tasks_performed?: string;
  notes?: string;
}

export interface SessionFilters {
  location_id?: number;
  volunteer_name?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

export interface VolunteerStats {
  totalSessions: number;
  totalHours: number;
  uniqueVolunteers: number;
  averageSessionLength: number;
  sessionsByLocation: Array<{
    location_id: number;
    location_name: string;
    session_count: number;
    total_hours: number;
  }>;
  recentVolunteers: Array<{
    volunteer_name: string;
    last_session: string;
    total_sessions: number;
    total_hours: number;
  }>;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  count?: number;
}

interface VolunteerStore {
  sessions: VolunteerSession[];
  stats: VolunteerStats | null;
  isLoading: boolean;
  error: string | null;

  // API Actions
  createSession: (sessionData: CreateVolunteerSessionData) => Promise<VolunteerSession>;
  getSessions: (filters?: SessionFilters) => Promise<VolunteerSession[]>;
  getSessionById: (sessionId: number) => Promise<VolunteerSession>;
  updateSession: (sessionId: number, sessionData: Partial<CreateVolunteerSessionData>) => Promise<VolunteerSession>;
  deleteSession: (sessionId: number) => Promise<void>;
  getVolunteerStats: (filters?: { location_id?: number; date_from?: string; date_to?: string }) => Promise<VolunteerStats>;

  // Local State Actions
  setSessions: (sessions: VolunteerSession[]) => void;
  setStats: (stats: VolunteerStats | null) => void;
}

export const useVolunteerStore = create<VolunteerStore>((set) => ({
  sessions: [],
  stats: null,
  isLoading: false,
  error: null,

  createSession: async (sessionData: CreateVolunteerSessionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<ApiResponse<VolunteerSession>>('/volunteer/sessions', sessionData);
      const newSession = response.data.data;

      set((state) => ({
        sessions: [newSession, ...state.sessions],
        isLoading: false
      }));

      return newSession;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create volunteer session', isLoading: false });
      throw error;
    }
  },

  getSessions: async (filters?: SessionFilters) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<VolunteerSession[]>>('/volunteer/sessions', {
        params: filters
      });
      const sessions = response.data.data;

      set({ sessions, isLoading: false });
      return sessions;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch volunteer sessions', isLoading: false });
      throw error;
    }
  },

  getSessionById: async (sessionId: number) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<VolunteerSession>>(`/volunteer/sessions/${sessionId}`);
      const session = response.data.data;

      // Update sessions array with fetched session
      set((state) => {
        const existingIndex = state.sessions.findIndex(s => s.session_id === sessionId);
        if (existingIndex >= 0) {
          const updatedSessions = [...state.sessions];
          updatedSessions[existingIndex] = session;
          return { sessions: updatedSessions, isLoading: false };
        } else {
          return { sessions: [session, ...state.sessions], isLoading: false };
        }
      });

      return session;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch volunteer session', isLoading: false });
      throw error;
    }
  },

  updateSession: async (sessionId: number, sessionData: Partial<CreateVolunteerSessionData>) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<ApiResponse<VolunteerSession>>(`/volunteer/sessions/${sessionId}`, sessionData);
      const updatedSession = response.data.data;

      set((state) => ({
        sessions: state.sessions.map(s =>
          s.session_id === sessionId ? updatedSession : s
        ),
        isLoading: false
      }));

      return updatedSession;
    } catch (error: any) {
      set({ error: error.message || 'Failed to update volunteer session', isLoading: false });
      throw error;
    }
  },

  deleteSession: async (sessionId: number) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/volunteer/sessions/${sessionId}`);

      set((state) => ({
        sessions: state.sessions.filter(s => s.session_id !== sessionId),
        isLoading: false
      }));
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete volunteer session', isLoading: false });
      throw error;
    }
  },

  getVolunteerStats: async (filters?: { location_id?: number; date_from?: string; date_to?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ApiResponse<VolunteerStats>>('/volunteer/stats', {
        params: filters
      });
      const stats = response.data.data;

      set({ stats, isLoading: false });
      return stats;
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch volunteer stats', isLoading: false });
      throw error;
    }
  },

  setSessions: (sessions) => set({ sessions }),
  setStats: (stats) => set({ stats }),
}));
