import api from './api';
import type { ApiResponse } from './locationService';

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

export const volunteerService = {
  async createSession(sessionData: CreateVolunteerSessionData): Promise<VolunteerSession> {
    const response = await api.post<ApiResponse<VolunteerSession>>('/volunteer/sessions', sessionData);
    return response.data.data;
  },

  async getSessions(filters?: SessionFilters): Promise<VolunteerSession[]> {
    const response = await api.get<ApiResponse<VolunteerSession[]>>('/volunteer/sessions', {
      params: filters
    });
    return response.data.data;
  },

  async getSessionById(sessionId: number): Promise<VolunteerSession> {
    const response = await api.get<ApiResponse<VolunteerSession>>(`/volunteer/sessions/${sessionId}`);
    return response.data.data;
  },

  async updateSession(sessionId: number, sessionData: Partial<CreateVolunteerSessionData>): Promise<VolunteerSession> {
    const response = await api.put<ApiResponse<VolunteerSession>>(`/volunteer/sessions/${sessionId}`, sessionData);
    return response.data.data;
  },

  async deleteSession(sessionId: number): Promise<void> {
    await api.delete(`/volunteer/sessions/${sessionId}`);
  },

  async getVolunteerStats(filters?: { location_id?: number; date_from?: string; date_to?: string }): Promise<VolunteerStats> {
    const response = await api.get<ApiResponse<VolunteerStats>>('/volunteer/stats', {
      params: filters
    });
    return response.data.data;
  }
};