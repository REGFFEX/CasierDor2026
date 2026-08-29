/**
 * Outbox Service
 * 
 * Implements the outbox pattern for reliable mutation tracking.
 * Ensures no mutations are silently dropped and provides retry/backoff mechanisms.
 */

import { IDatabase } from '../database/DatabaseTypes';
import { databaseFactory } from '../database/DatabaseFactory';
import {
  OutboxEntry,
  OutboxOperationResult,
  OutboxStatistics,
  RetryConfig,
  DEFAULT_RETRY_CONFIG,
  OutboxEventType,
  OutboxEvent
} from './OutboxTypes';
import { MutationOperation, OutboxStatus } from '../database/DatabaseSchema';

class OutboxService {
  private static instance: OutboxService;
  private database: IDatabase | null = null;
  private retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG;
  private eventListeners: Map<OutboxEventType, Set<(event: OutboxEvent) => void>> = new Map();

  private constructor() {}

  static getInstance(): OutboxService {
    if (!OutboxService.instance) {
      OutboxService.instance = new OutboxService();
    }
    return OutboxService.instance;
  }

  /**
   * Initialize the outbox service
   */
  async initialize(): Promise<void> {
    this.database = await databaseFactory.getDatabase();
  }

  /**
   * Add a new mutation to the outbox
   */
  async addMutation(
    entityId: string,
    entityType: OutboxEntry['entityType'],
    operation: MutationOperation,
    tenantId: string,
    userId: string,
    deviceId: string,
    version: number,
    payload: any
  ): Promise<OutboxOperationResult> {
    if (!this.database) {
      await this.initialize();
    }

    const mutationId = this.generateMutationId();
    const entry: OutboxEntry = {
      mutationId,
      entityId,
      entityType,
      operation,
      tenantId,
      userId,
      deviceId,
      version,
      createdAt: Date.now(),
      status: OutboxStatus.PENDING,
      attempts: 0,
      payload
    };

    try {
      await this.database!.insert('outbox', entry);
      this.emitEvent(OutboxEventType.ENTRY_CREATED, { mutationId, entry });
      return { success: true, mutationId };
    } catch (error) {
      console.error('Failed to add mutation to outbox:', error);
      return { success: false, mutationId, error: String(error) };
    }
  }

  /**
   * Get pending mutations for a tenant
   */
  async getPendingMutations(tenantId: string): Promise<OutboxEntry[]> {
    if (!this.database) {
      await this.initialize();
    }

    const result = await this.database!.query<OutboxEntry>('outbox', [
      { field: 'tenantId', operator: 'eq', value: tenantId },
      { field: 'status', operator: 'eq', value: OutboxStatus.PENDING }
    ]);

    // Filter by retry time
    const now = Date.now();
    return result.data.filter(entry => 
      !entry.nextRetryAt || entry.nextRetryAt <= now
    );
  }

  /**
   * Get processing mutations (stuck operations)
   */
  async getStuckMutations(tenantId: string, timeoutMs: number = 300000): Promise<OutboxEntry[]> {
    if (!this.database) {
      await this.initialize();
    }

    const result = await this.database!.query<OutboxEntry>('outbox', [
      { field: 'tenantId', operator: 'eq', value: tenantId },
      { field: 'status', operator: 'eq', value: OutboxStatus.PROCESSING }
    ]);

    const now = Date.now();
    return result.data.filter(entry => 
      entry.lastAttemptAt && (now - entry.lastAttemptAt) > timeoutMs
    );
  }

  /**
   * Mark a mutation as processing
   */
  async markAsProcessing(mutationId: string): Promise<boolean> {
    if (!this.database) {
      await this.initialize();
    }

    const updated = await this.database!.update('outbox', mutationId, {
      status: OutboxStatus.PROCESSING,
      lastAttemptAt: Date.now()
    });

    if (updated) {
      this.emitEvent(OutboxEventType.ENTRY_PROCESSING, { mutationId });
      return true;
    }

    return false;
  }

  /**
   * Mark a mutation as completed
   */
  async markAsCompleted(mutationId: string): Promise<boolean> {
    if (!this.database) {
      await this.initialize();
    }

    const updated = await this.database!.update('outbox', mutationId, {
      status: OutboxStatus.COMPLETED,
      lastAttemptAt: Date.now()
    });

    if (updated) {
      this.emitEvent(OutboxEventType.ENTRY_COMPLETED, { mutationId });
      return true;
    }

    return false;
  }

  /**
   * Mark a mutation as failed and schedule retry
   */
  async markAsFailed(mutationId: string, error: string): Promise<boolean> {
    if (!this.database) {
      await this.initialize();
    }

    const entry = await this.database!.getById<OutboxEntry>('outbox', mutationId);
    if (!entry) {
      return false;
    }

    const nextRetryAt = this.calculateNextRetry(entry.attempts + 1);
    const updated = await this.database!.update('outbox', mutationId, {
      status: OutboxStatus.FAILED,
      attempts: entry.attempts + 1,
      lastAttemptAt: Date.now(),
      nextRetryAt,
      error
    });

    if (updated) {
      this.emitEvent(OutboxEventType.ENTRY_FAILED, { mutationId, error, nextRetryAt });
      return true;
    }

    return false;
  }

  /**
   * Get outbox statistics
   */
  async getStatistics(tenantId: string): Promise<OutboxStatistics> {
    if (!this.database) {
      await this.initialize();
    }

    const result = await this.database!.query<OutboxEntry>('outbox', [
      { field: 'tenantId', operator: 'eq', value: tenantId }
    ]);

    const entries = result.data;
    const stats: OutboxStatistics = {
      total: entries.length,
      pending: entries.filter(e => e.status === OutboxStatus.PENDING).length,
      processing: entries.filter(e => e.status === OutboxStatus.PROCESSING).length,
      completed: entries.filter(e => e.status === OutboxStatus.COMPLETED).length,
      failed: entries.filter(e => e.status === OutboxStatus.FAILED).length
    };

    const pendingEntries = entries.filter(e => e.status === OutboxStatus.PENDING);
    if (pendingEntries.length > 0) {
      stats.oldestPending = Math.min(...pendingEntries.map(e => e.createdAt));
    }

    return stats;
  }

  /**
   * Clean up completed entries (older than specified days)
   */
  async cleanupCompletedEntries(daysToKeep: number = 7): Promise<number> {
    if (!this.database) {
      await this.initialize();
    }

    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    const result = await this.database!.query<OutboxEntry>('outbox', [
      { field: 'status', operator: 'eq', value: OutboxStatus.COMPLETED }
    ]);

    const toDelete = result.data.filter(entry => entry.createdAt < cutoffTime);
    let deletedCount = 0;

    for (const entry of toDelete) {
      const deleted = await this.database!.delete('outbox', entry.mutationId);
      if (deleted) {
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.emitEvent(OutboxEventType.OUTBOX_CLEARED, { count: deletedCount });
    }

    return deletedCount;
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: OutboxEventType, listener: (event: OutboxEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, new Set());
    }
    this.eventListeners.get(eventType)!.add(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: OutboxEventType, listener: (event: OutboxEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Set retry configuration
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Generate unique mutation ID
   */
  private generateMutationId(): string {
    return `mutation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate next retry time using exponential backoff
   */
  private calculateNextRetry(attempt: number): number {
    const backoffMs = Math.min(
      this.retryConfig.initialBackoffMs * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1),
      this.retryConfig.maxBackoffMs
    );
    return Date.now() + backoffMs;
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(type: OutboxEventType, data?: any): void {
    const event: OutboxEvent = {
      type,
      timestamp: Date.now(),
      data
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in outbox event listener:', error);
        }
      });
    }
  }
}

export const outboxService = OutboxService.getInstance();