/**
 * Database Schema Configuration
 * 
 * Defines the database schema for the offline-first local database.
 * Initially focused on Product entity as the pilot module.
 */

import { DatabaseConfig, DatabaseTable } from './DatabaseTypes';

/**
 * Core schema for the offline-first local database
 * This will be expanded incrementally as we migrate more modules
 */
export const CORE_DATABASE_CONFIG: DatabaseConfig = {
  name: 'CasierDorOfflineDB',
  version: 1,
  tables: [
    // Product table - pilot entity for new architecture
    {
      name: 'products',
      primaryKey: 'id',
      indexes: [
        { name: 'by_tenant', keyPath: 'tenantId', unique: false },
        { name: 'by_name', keyPath: 'name', unique: false },
        { name: 'by_sync_status', keyPath: 'syncStatus', unique: false },
        { name: 'by_updated', keyPath: 'updatedAt', unique: false }
      ]
    },
    // Outbox table for mutation tracking
    {
      name: 'outbox',
      primaryKey: 'mutationId',
      indexes: [
        { name: 'by_entity', keyPath: 'entityId', unique: false },
        { name: 'by_tenant', keyPath: 'tenantId', unique: false },
        { name: 'by_status', keyPath: 'status', unique: false },
        { name: 'by_created', keyPath: 'createdAt', unique: false }
      ]
    },
    // Sync metadata table
    {
      name: 'sync_metadata',
      primaryKey: 'key',
      indexes: [
        { name: 'by_tenant', keyPath: 'tenantId', unique: false }
      ]
    },
    // Identity cache table
    {
      name: 'identity_cache',
      primaryKey: 'id',
      indexes: [
        { name: 'by_auth_user', keyPath: 'authUserId', unique: true },
        { name: 'by_tenant', keyPath: 'tenantId', unique: false }
      ]
    }
  ]
};

/**
 * Product entity for local database
 * Matches the structure defined in ARCHITECTURE-TARGET.md
 */
export interface LocalProduct {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stock: number;
  category?: string;
  barcode?: string;
  sku?: string;
  images?: string[];
  attributes?: Record<string, any>;
  
  // Sync fields
  version: number;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastSyncedAt?: number;
  createdBy: string;
  updatedBy: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

/**
 * Outbox entry for mutation tracking
 */
export interface OutboxEntry {
  mutationId: string;
  entityId: string;
  entityType: 'product' | 'client' | 'sale' | 'tenant' | 'user';
  operation: 'create' | 'update' | 'delete';
  tenantId: string;
  userId: string;
  deviceId: string;
  version: number;
  createdAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  payload: any;
  error?: string;
}

/**
 * Sync metadata entry
 */
export interface SyncMetadata {
  key: string;
  tenantId: string;
  value: any;
  updatedAt: number;
}

/**
 * Identity cache entry
 */
export interface IdentityCache {
  id: string;
  authUserId: string;
  appUserId: string;
  tenantId: string;
  email: string;
  displayName: string;
  deviceId: string;
  cachedAt: number;
  expiresAt: number;
}

/**
 * Sync status enum for entities
 */
export enum SyncStatus {
  SYNCED = 'synced',
  PENDING = 'pending',
  CONFLICT = 'conflict',
  ERROR = 'error'
}

/**
 * Mutation operation types
 */
export enum MutationOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

/**
 * Outbox status enum
 */
export enum OutboxStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}