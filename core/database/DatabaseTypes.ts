/**
 * Core Database Types for Offline-First Architecture
 * 
 * Defines the common database interface that must be implemented
 * for each platform (IndexedDB for web, SQLite for mobile/desktop).
 */

/**
 * Query conditions for database operations
 */
export interface QueryCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: any;
}

/**
 * Query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

/**
 * Database query result
 */
export interface QueryResult<T> {
  data: T[];
  count: number;
}

/**
 * Transaction operation
 */
export interface TransactionOperation {
  type: 'insert' | 'update' | 'delete';
  table: string;
  data?: any;
  id?: string;
  conditions?: QueryCondition[];
}

/**
 * Transaction result
 */
export interface TransactionResult {
  success: boolean;
  error?: string;
  results?: any[];
}

/**
 * Database interface - must be implemented by each platform
 */
export interface IDatabase {
  /**
   * Initialize the database
   */
  initialize(): Promise<void>;

  /**
   * Query records from a table
   */
  query<T>(table: string, conditions?: QueryCondition[], options?: QueryOptions): Promise<QueryResult<T>>;

  /**
   * Get a single record by ID
   */
  getById<T>(table: string, id: string): Promise<T | null>;

  /**
   * Insert a new record
   */
  insert<T>(table: string, data: T): Promise<T>;

  /**
   * Update a record by ID
   */
  update<T>(table: string, id: string, data: Partial<T>): Promise<T | null>;

  /**
   * Delete a record by ID
   */
  delete(table: string, id: string): Promise<boolean>;

  /**
   * Execute multiple operations in a transaction
   */
  transaction(operations: TransactionOperation[]): Promise<TransactionResult>;

  /**
   * Check if database is ready
   */
  isReady(): boolean;

  /**
   * Close database connection
   */
  close(): Promise<void>;

  /**
   * Clear all data (use with caution)
   */
  clear(): Promise<void>;
}

/**
 * Database configuration
 */
export interface DatabaseConfig {
  name: string;
  version: number;
  tables: DatabaseTable[];
}

/**
 * Database table definition
 */
export interface DatabaseTable {
  name: string;
  primaryKey: string;
  indexes?: DatabaseIndex[];
}

/**
 * Database index definition
 */
export interface DatabaseIndex {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
}

/**
 * Database error types
 */
export enum DatabaseErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  NOT_FOUND = 'NOT_FOUND',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED'
}

/**
 * Database error
 */
export class DatabaseError extends Error {
  constructor(
    public type: DatabaseErrorType,
    message: string,
    public originalError?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}