import Database from 'better-sqlite3';
import path from 'path';

export class DatabaseConnection {
  private static instance: Database.Database;
  
  static getInstance(): Database.Database {
    if (!this.instance) {
      const dbPath = path.join(process.cwd(), 'data', 'inventory.db');
      this.instance = new Database(dbPath);
      
      // Enable foreign key constraints
      this.instance.pragma('foreign_keys = ON');

      // Verify foreign keys are enabled
      const fkEnabled = this.instance.pragma('foreign_keys', { simple: true });
      if (fkEnabled !== 1) {
        throw new Error('Failed to enable foreign key constraints!');
      }

      // Set WAL mode for better performance
      this.instance.pragma('journal_mode = WAL');

      console.log('✅ Database connection established (foreign keys: enabled)');
    }
    return this.instance;
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
      console.log('✅ Database connection closed');
    }
  }
}