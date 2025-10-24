import { DatabaseConnection } from '../database/connection.js';

export interface Location {
  location_id?: number;
  name: string;
  city: string;
  state: string;
  address?: string;
  phone?: string;
  zip_code?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLocationData {
  name: string;
  city: string;
  state?: string;
  address?: string;
  phone?: string;
  zip_code?: string;
}

export interface UpdateLocationData {
  name?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
  zip_code?: string;
}

export class LocationService {
  private static db = DatabaseConnection.getInstance();

  static getActiveLocations(): Location[] {
    return this.db.prepare('SELECT * FROM locations WHERE is_active = 1 ORDER BY name').all() as Location[];
  }

  static getById(id: number): Location | null {
    const result = this.db.prepare('SELECT * FROM locations WHERE location_id = ?').get(id) as Location | undefined;
    return result || null;
  }

  static create(data: CreateLocationData): Location {
    try {
      const result = this.db.prepare(`
        INSERT INTO locations (name, city, state, address, phone)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        data.name,
        data.city,
        data.state || 'TX',
        data.address || null,
        data.phone || null
      );

      const locationId = result.lastInsertRowid as number;
      const newLocation = this.getById(locationId);

      if (!newLocation) {
        throw new Error('Failed to retrieve created location');
      }

      return newLocation;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const err = new Error(`Location with name '${data.name}' already exists`);
        (err as any).statusCode = 409;
        throw err;
      }
      throw error;
    }
  }

  static update(id: number, data: UpdateLocationData): Location {
    const existing = this.getById(id);
    if (!existing) {
      const error = new Error(`Location with ID ${id} not found`);
      (error as any).statusCode = 404;
      throw error;
    }

    try {
      this.db.prepare(`
        UPDATE locations
        SET name = ?, city = ?, state = ?, address = ?, phone = ?
        WHERE location_id = ?
      `).run(
        data.name ?? existing.name,
        data.city ?? existing.city,
        data.state ?? existing.state,
        data.address ?? existing.address,
        data.phone ?? existing.phone,
        id
      );

      const updated = this.getById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated location');
      }

      return updated;
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const err = new Error(`Location with name '${data.name}' already exists`);
        (err as any).statusCode = 409;
        throw err;
      }
      throw error;
    }
  }

  static toggleActive(id: number): Location {
    const existing = this.getById(id);
    if (!existing) {
      const error = new Error(`Location with ID ${id} not found`);
      (error as any).statusCode = 404;
      throw error;
    }

    this.db.prepare(`
      UPDATE locations
      SET is_active = NOT is_active
      WHERE location_id = ?
    `).run(id);

    const updated = this.getById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated location');
    }

    return updated;
  }
}