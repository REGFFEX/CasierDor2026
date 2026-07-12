/**
 * File d'attente FIFO pour synchronisation future (offline-first → serveur)
 */

export type SyncEntityType =
  | 'product'
  | 'client'
  | 'sale'
  | 'settings'
  | 'movement'
  | 'accounting'
  | 'replenishment';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  entity: SyncEntityType;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  createdAt: number;
  /** Nombre de tentatives d'envoi */
  attempts: number;
  lastError?: string;
}

const QUEUE_KEY = 'casier_sync_queue';
const MAX_QUEUE_SIZE = 500;

function loadQueue(): SyncQueueItem[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as SyncQueueItem[]) : [];
  } catch {
    return [];
  }
}

function saveQueue(items: SyncQueueItem[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(0, MAX_QUEUE_SIZE)));
}

export function enqueueSyncItem(
  entity: SyncEntityType,
  operation: SyncOperation,
  payload: Record<string, unknown>
): SyncQueueItem {
  const item: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    entity,
    operation,
    payload,
    createdAt: Date.now(),
    attempts: 0,
  };
  const queue = loadQueue();
  saveQueue([item, ...queue]);
  return item;
}

export function peekSyncQueue(limit = 50): SyncQueueItem[] {
  return loadQueue()
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(0, limit);
}

export function dequeueSyncItem(id: string): void {
  saveQueue(loadQueue().filter((i) => i.id !== id));
}

export function markSyncAttempt(id: string, error?: string): void {
  const queue = loadQueue().map((i) =>
    i.id === id ? { ...i, attempts: i.attempts + 1, lastError: error } : i
  );
  saveQueue(queue);
}

export function getSyncQueueStats(): { pending: number; failed: number } {
  const queue = loadQueue();
  return {
    pending: queue.length,
    failed: queue.filter((i) => i.attempts > 0).length,
  };
}

export function clearSyncQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}
