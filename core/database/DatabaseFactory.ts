/**
 * Database Factory
 * 
 * Factory for creating the appropriate database implementation based on platform.
 * Currently supports IndexedDB for web, with placeholders for mobile/desktop SQLite.
 */

import { IDatabase } from './DatabaseTypes';
import { IndexedDBDatabase } from './IndexedDBDatabase';
import { CORE_DATABASE_CONFIG } from './DatabaseSchema';

class DatabaseFactory {
  private static instance: DatabaseFactory;
  private database: IDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseFactory {
    if (!DatabaseFactory.instance) {
      DatabaseFactory.instance = new DatabaseFactory();
    }
    return DatabaseFactory.instance;
  }

  /**
   * Get the appropriate database implementation for the current platform
   */
  async getDatabase(): Promise<IDatabase> {
    if (this.database) {
      return this.database;
    }

    // For now, we only support web/IndexedDB
    // SQLite implementations for mobile/desktop will be added later
    const platform = this.detectPlatform();

    switch (platform) {
      case 'web':
        this.database = new IndexedDBDatabase(CORE_DATABASE_CONFIG);
        break;
      case 'android':
      case 'ios':
        // TODO: Implement SQLite for mobile
        throw new Error('SQLite database not yet implemented for mobile platforms');
      case 'windows':
      case 'linux':
      case 'macos':
        // TODO: Implement SQLite for desktop (Tauri)
        throw new Error('SQLite database not yet implemented for desktop platforms');
      default:
        this.database = new IndexedDBDatabase(CORE_DATABASE_CONFIG);
    }

    await this.database.initialize();
    return this.database;
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): 'web' | 'android' | 'ios' | 'windows' | 'linux' | 'macos' {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('android')) {
      return 'android';
    }
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ios')) {
      return 'ios';
    }
    if (userAgent.includes('win')) {
      return 'windows';
    }
    if (userAgent.includes('mac')) {
      return 'macos';
    }
    if (userAgent.includes('linux')) {
      return 'linux';
    }

    return 'web';
  }

  /**
   * Reset the database instance (useful for testing)
   */
  async reset(): Promise<void> {
    if (this.database) {
      await this.database.close();
      this.database = null;
    }
  }

  /**
   * Clear all data from the database
   */
  async clearAllData(): Promise<void> {
    const db = await this.getDatabase();
    await db.clear();
  }
}

export const databaseFactory = DatabaseFactory.getInstance();