import type Database from 'better-sqlite3';

declare global {
  namespace BetterSqlite3 {
    interface Statement<BindParameters extends unknown[] = unknown[]> {
      // Add any additional types if needed
    }
  }
}

export {};