/**
 * Outbox Pattern Types
 * 
 * Defines the outbox pattern for reliable mutation tracking and synchronization.
 * Ensures no mutations are silently dropped and provides retry/backoff mechanisms.
 */

import { MutationOperation, OutboxStatus } from '../database/DatabaseSchema';

/**
 * Outbox entry representing a pending mutation
 */
export interface OutboxEntry {
  mutationId: string;
  entityId: string;
  entityType: 'product' | 'client' | 'sale' | 'tenant' | 'user';
  operation: MutationOperation;
  tenantId: string;
  userId: string;
  deviceId: string;
  version: number;
  createdAt: number;
  status: OutboxStatus;
  attempts: number;
  lastAttemptAt?: number;
  nextRetryAt?: number;
  payload: any;
  error?: string;
}

/**
 * Outbox operation result
 */
export interface OutboxOperationResult {
  success: boolean;
  mutationId: string;
  error?: string;
}

/**
 * Outbox statistics
 */
export interface OutboxStatistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  oldestPending?: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialBackoffMs: number;
  maxBackoffMs: number;
  backoffMultiplier: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 5,
  initialBackoffMs: 1000, // 1 second
  maxBackoffMs: 300000, // 5 minutes
  backoffMultiplier: 2
};

/**
 * Outbox event types
 */
export enum OutboxEventType {
  ENTRY_CREATED = 'ENTRY_CREATED',
  ENTRY_PROCESSING = 'ENTRY_PROCESSING',
  ENTRY_COMPLETED = 'ENTRY_COMPLETED',
  ENTRY_FAILED = 'ENTRY_FAILED',
  ENTRY_RETRY = 'ENTRY_RETRY',
  OUTBOX_CLEARED = 'OUTBOX_CLEARED'
}

/**
 * Outbox event
 */
export interface OutboxEvent {
  type: OutboxEventType;
  mutationId: string;
  timestamp: number;
  data?: any;
}