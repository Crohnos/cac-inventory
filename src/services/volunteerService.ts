import { DatabaseConnection } from '../database/connection.js';

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
  locationId?: number;
  volunteerName?: string;
  dateFrom?: string;
  dateTo?: string;
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

export class VolunteerService {
  private static db = DatabaseConnection.getInstance();

  static createSession(data: CreateVolunteerSessionData): VolunteerSession {
    const transaction = this.db.transaction(() => {
      // Calculate hours if both start and end times are provided
      let calculatedHours = data.hours_worked;
      if (data.start_time && data.end_time && !calculatedHours) {
        calculatedHours = this.calculateHours(data.start_time, data.end_time);
      }

      const stmt = this.db.prepare(`
        INSERT INTO volunteer_sessions (
          location_id, volunteer_name, session_date, start_time, end_time, 
          hours_worked, tasks_performed, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.location_id,
        data.volunteer_name,
        data.session_date || new Date().toISOString().split('T')[0],
        data.start_time,
        data.end_time || null,
        calculatedHours || null,
        data.tasks_performed || null,
        data.notes || null
      );

      return result.lastInsertRowid as number;
    });

    const sessionId = transaction();
    return this.getSessionById(sessionId);
  }

  static getSessions(filters: SessionFilters): VolunteerSession[] {
    let query = `
      SELECT 
        vs.*,
        l.name as location_name
      FROM volunteer_sessions vs
      LEFT JOIN locations l ON vs.location_id = l.location_id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (filters.locationId) {
      query += ' AND vs.location_id = ?';
      params.push(filters.locationId);
    }

    if (filters.volunteerName) {
      query += ' AND LOWER(vs.volunteer_name) LIKE LOWER(?)';
      params.push(`%${filters.volunteerName}%`);
    }

    if (filters.dateFrom) {
      query += ' AND vs.session_date >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      query += ' AND vs.session_date <= ?';
      params.push(filters.dateTo);
    }

    query += ' ORDER BY vs.session_date DESC, vs.start_time DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const stmt = this.db.prepare(query);
    return stmt.all(...params) as VolunteerSession[];
  }

  static getSessionById(sessionId: number): VolunteerSession {
    const stmt = this.db.prepare(`
      SELECT 
        vs.*,
        l.name as location_name
      FROM volunteer_sessions vs
      LEFT JOIN locations l ON vs.location_id = l.location_id
      WHERE vs.session_id = ?
    `);
    return stmt.get(sessionId) as VolunteerSession;
  }

  static updateSession(sessionId: number, data: Partial<CreateVolunteerSessionData>): VolunteerSession {
    // Calculate hours if both start and end times are provided
    let calculatedHours = data.hours_worked;
    if (data.start_time && data.end_time && !calculatedHours) {
      calculatedHours = this.calculateHours(data.start_time, data.end_time);
    }

    const updateData = { ...data, hours_worked: calculatedHours };
    const fields = Object.keys(updateData).filter(key => updateData[key as keyof typeof updateData] !== undefined);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updateData[field as keyof typeof updateData]);

    const stmt = this.db.prepare(`
      UPDATE volunteer_sessions 
      SET ${setClause}
      WHERE session_id = ?
    `);

    stmt.run(...values, sessionId);
    return this.getSessionById(sessionId);
  }

  static deleteSession(sessionId: number): void {
    const stmt = this.db.prepare('DELETE FROM volunteer_sessions WHERE session_id = ?');
    const result = stmt.run(sessionId);
    
    if (result.changes === 0) {
      throw new Error('Volunteer session not found');
    }
  }

  static getVolunteerStats(filters: { locationId?: number; dateFrom?: string; dateTo?: string }): VolunteerStats {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (filters.locationId) {
      whereClause += ' AND vs.location_id = ?';
      params.push(filters.locationId);
    }

    if (filters.dateFrom) {
      whereClause += ' AND vs.session_date >= ?';
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      whereClause += ' AND vs.session_date <= ?';
      params.push(filters.dateTo);
    }

    // Overall stats
    const overallStatsStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as totalSessions,
        COALESCE(SUM(hours_worked), 0) as totalHours,
        COUNT(DISTINCT volunteer_name) as uniqueVolunteers,
        COALESCE(AVG(hours_worked), 0) as averageSessionLength
      FROM volunteer_sessions vs
      ${whereClause}
    `);
    const overallStats = overallStatsStmt.get(...params) as any;

    // Sessions by location
    const locationStatsStmt = this.db.prepare(`
      SELECT 
        vs.location_id,
        l.name as location_name,
        COUNT(*) as session_count,
        COALESCE(SUM(vs.hours_worked), 0) as total_hours
      FROM volunteer_sessions vs
      LEFT JOIN locations l ON vs.location_id = l.location_id
      ${whereClause}
      GROUP BY vs.location_id, l.name
      ORDER BY session_count DESC
    `);
    const sessionsByLocation = locationStatsStmt.all(...params) as any[];

    // Recent volunteers
    const recentVolunteersStmt = this.db.prepare(`
      SELECT 
        volunteer_name,
        MAX(session_date) as last_session,
        COUNT(*) as total_sessions,
        COALESCE(SUM(hours_worked), 0) as total_hours
      FROM volunteer_sessions vs
      ${whereClause}
      GROUP BY volunteer_name
      ORDER BY last_session DESC
      LIMIT 10
    `);
    const recentVolunteers = recentVolunteersStmt.all(...params) as any[];

    return {
      totalSessions: overallStats.totalSessions,
      totalHours: parseFloat(overallStats.totalHours.toFixed(2)),
      uniqueVolunteers: overallStats.uniqueVolunteers,
      averageSessionLength: parseFloat(overallStats.averageSessionLength.toFixed(2)),
      sessionsByLocation,
      recentVolunteers: recentVolunteers.map(v => ({
        ...v,
        total_hours: parseFloat(v.total_hours.toFixed(2))
      }))
    };
  }

  // Helper method to calculate hours between start and end times
  private static calculateHours(startTime: string, endTime: string): number {
    const start = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);
    
    // Handle case where end time is next day (past midnight)
    if (end < start) {
      end.setDate(end.getDate() + 1);
    }
    
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
  }
}