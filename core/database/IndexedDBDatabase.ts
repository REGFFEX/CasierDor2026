/**
 * IndexedDB Database Implementation
 * 
 * Concrete implementation of IDatabase interface using IndexedDB for web platforms.
 * Provides offline-first local storage with full CRUD operations and transactions.
 */

import {
  IDatabase,
  QueryCondition,
  QueryOptions,
  QueryResult,
  TransactionOperation,
  TransactionResult,
  DatabaseConfig,
  DatabaseTable,
  DatabaseErrorType,
  DatabaseError
} from './DatabaseTypes';

class IndexedDBDatabase implements IDatabase {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig;
  private isInitialized: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        reject(new DatabaseError(
          DatabaseErrorType.INITIALIZATION_FAILED,
          'Failed to open IndexedDB database',
          request.error
        ));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createSchema(db);
      };
    });
  }

  async query<T>(
    table: string,
    conditions?: QueryCondition[],
    options?: QueryOptions
  ): Promise<QueryResult<T>> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const objectStore = transaction.objectStore(table);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        let data = request.result as T[];

        // Apply conditions
        if (conditions && conditions.length > 0) {
          data = this.applyConditions(data, conditions);
        }

        // Apply ordering
        if (options?.orderBy) {
          data = this.applyOrdering(data, options.orderBy);
        }

        // Apply pagination
        let count = data.length;
        if (options?.offset) {
          data = data.slice(options.offset);
        }
        if (options?.limit) {
          data = data.slice(0, options.limit);
        }

        resolve({ data, count });
      };

      request.onerror = () => {
        reject(new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          `Failed to query table ${table}`,
          request.error
        ));
      };
    });
  }

  async getById<T>(table: string, id: string): Promise<T | null> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readonly');
      const objectStore = transaction.objectStore(table);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          `Failed to get record from table ${table}`,
          request.error
        ));
      };
    });
  }

  async insert<T>(table: string, data: T): Promise<T> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const objectStore = transaction.objectStore(table);
      const request = objectStore.add(data);

      request.onsuccess = () => {
        resolve(data);
      };

      request.onerror = () => {
        if (request.error?.name === 'ConstraintError') {
          reject(new DatabaseError(
            DatabaseErrorType.CONSTRAINT_VIOLATION,
            `Record already exists in table ${table}`,
            request.error
          ));
        } else {
          reject(new DatabaseError(
            DatabaseErrorType.QUERY_FAILED,
            `Failed to insert into table ${table}`,
            request.error
          ));
        }
      };
    });
  }

  async update<T>(table: string, id: string, data: Partial<T>): Promise<T | null> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const objectStore = transaction.objectStore(table);
      
      // First get the existing record
      const getRequest = objectStore.get(id);

      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          resolve(null);
          return;
        }

        // Merge with updates
        const updated = { ...existing, ...data };
        const putRequest = objectStore.put(updated);

        putRequest.onsuccess = () => {
          resolve(updated);
        };

        putRequest.onerror = () => {
          reject(new DatabaseError(
            DatabaseErrorType.QUERY_FAILED,
            `Failed to update record in table ${table}`,
            putRequest.error
          ));
        };
      };

      getRequest.onerror = () => {
        reject(new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          `Failed to get record for update in table ${table}`,
          getRequest.error
        ));
      };
    });
  }

  async delete(table: string, id: string): Promise<boolean> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([table], 'readwrite');
      const objectStore = transaction.objectStore(table);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        reject(new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          `Failed to delete record from table ${table}`,
          request.error
        ));
      };
    });
  }

  async transaction(operations: TransactionOperation[]): Promise<TransactionResult> {
    this.ensureInitialized();

    // Get all unique tables involved in the transaction
    const tables = [...new Set(operations.map(op => op.table))];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(tables, 'readwrite');
      const results: any[] = [];
      let hasError = false;

      operations.forEach((operation, index) => {
        const objectStore = transaction.objectStore(operation.table);

        try {
          switch (operation.type) {
            case 'insert':
              const insertRequest = objectStore.add(operation.data);
              insertRequest.onsuccess = () => {
                results[index] = operation.data;
              };
              insertRequest.onerror = () => {
                hasError = true;
              };
              break;

            case 'update':
              const updateRequest = objectStore.put(operation.data);
              updateRequest.onsuccess = () => {
                results[index] = operation.data;
              };
              updateRequest.onerror = () => {
                hasError = true;
              };
              break;

            case 'delete':
              const deleteRequest = objectStore.delete(operation.id!);
              deleteRequest.onsuccess = () => {
                results[index] = true;
              };
              deleteRequest.onerror = () => {
                hasError = true;
              };
              break;
          }
        } catch (error) {
          hasError = true;
        }
      });

      transaction.oncomplete = () => {
        if (hasError) {
          resolve({
            success: false,
            error: 'Some operations in the transaction failed'
          });
        } else {
          resolve({
            success: true,
            results
          });
        }
      };

      transaction.onerror = () => {
        reject(new DatabaseError(
          DatabaseErrorType.TRANSACTION_FAILED,
          'Transaction failed',
          transaction.error
        ));
      };
    });
  }

  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  async clear(): Promise<void> {
    this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.config.tables.map(t => t.name), 'readwrite');
      
      this.config.tables.forEach(table => {
        const objectStore = transaction.objectStore(table.name);
        objectStore.clear();
      });

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = () => {
        reject(new DatabaseError(
          DatabaseErrorType.QUERY_FAILED,
          'Failed to clear database',
          transaction.error
        ));
      };
    });
  }

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError(
        DatabaseErrorType.INITIALIZATION_FAILED,
        'Database is not initialized'
      );
    }
  }

  private createSchema(db: IDBDatabase): void {
    this.config.tables.forEach(table => {
      if (!db.objectStoreNames.contains(table.name)) {
        const objectStore = db.createObjectStore(table.name, {
          keyPath: table.primaryKey
        });

        // Create indexes
        table.indexes?.forEach(index => {
          objectStore.createIndex(index.name, index.keyPath, {
            unique: index.unique || false
          });
        });
      }
    });
  }

  private applyConditions<T>(data: T[], conditions: QueryCondition[]): T[] {
    return data.filter(item => {
      return conditions.every(condition => {
        const value = this.getNestedValue(item, condition.field);
        return this.evaluateCondition(value, condition);
      });
    });
  }

  private evaluateCondition(value: any, condition: QueryCondition): boolean {
    switch (condition.operator) {
      case 'eq':
        return value === condition.value;
      case 'ne':
        return value !== condition.value;
      case 'gt':
        return value > condition.value;
      case 'gte':
        return value >= condition.value;
      case 'lt':
        return value < condition.value;
      case 'lte':
        return value <= condition.value;
      case 'like':
        return String(value).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return false;
    }
  }

  private applyOrdering<T>(data: T[], orderBy: QueryOptions['orderBy']): T[] {
    if (!orderBy) return data;

    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, orderBy.field);
      const bValue = this.getNestedValue(b, orderBy.field);

      if (aValue < bValue) return orderBy.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return orderBy.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

export { IndexedDBDatabase };