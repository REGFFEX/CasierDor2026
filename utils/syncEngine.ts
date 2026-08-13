import { supabase } from './supabaseClient';
import { peekSyncQueue, dequeueSyncItem, markSyncAttempt, SyncQueueItem } from './syncQueue';

// Simple network check using navigator
const checkOnlineStatus = () => typeof navigator !== 'undefined' && navigator.onLine;

class SyncEngine {
  private isRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private syncIntervalMs = 30000; // 30 seconds

  public start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.processQueue(), this.syncIntervalMs);
    
    // Listen to network events to trigger immediate sync
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.processQueue());
    }
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  public async processQueue() {
    if (this.isRunning || !checkOnlineStatus()) return;
    
    // Check if Supabase is actually configured before trying to sync
    const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
    const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    this.isRunning = true;
    try {
      const items = peekSyncQueue(10); // Process batch of 10
      
      for (const item of items) {
        await this.syncItem(item);
      }
    } catch (err) {
      console.error('[SyncEngine] Erreur globale lors de la synchronisation:', err);
    } finally {
      this.isRunning = false;
    }
  }

  private async syncItem(item: SyncQueueItem) {
    try {
      const { entity, operation, payload, id } = item;
      
      // Mappage des entités vers les tables Supabase
      // Ex: 'product' -> 'Product', 'sale' -> 'Sale', etc.
      const tableName = entity.charAt(0).toUpperCase() + entity.slice(1);

      // Injecter le tenantId pour satisfaire les règles RLS de Supabase
      let tenantId = null;
      try {
        const authUserStr = localStorage.getItem('auth_user');
        if (authUserStr) {
          const authUser = JSON.parse(authUserStr);
          tenantId = authUser.tenantId;
        }
      } catch (e) {
        console.warn('[SyncEngine] Impossible de lire le tenantId');
      }

      if (operation === 'create' || operation === 'update') {
        const finalPayload = tenantId ? { ...payload, tenantId } : payload;
        const { error } = await supabase.from(tableName).upsert(finalPayload);
        if (error) throw new Error(error.message);
      } else if (operation === 'delete') {
        // Soft delete (Tombstone) si possible
        const { error } = await supabase.from(tableName).update({ deletedAt: new Date().toISOString(), active: false }).eq('id', payload.id);
        if (error) {
           // Fallback to hard delete if table doesn't support soft delete
           const hardDelete = await supabase.from(tableName).delete().eq('id', payload.id);
           if (hardDelete.error) throw new Error(hardDelete.error.message);
        }
      }

      // Success! Remove from queue
      dequeueSyncItem(id);
      console.log(`[SyncEngine] Synced ${operation} for ${entity} (Queue ID: ${id})`);
    } catch (err: any) {
      console.error(`[SyncEngine] Failed to sync item ${item.id}:`, err);
      markSyncAttempt(item.id, err?.message || 'Erreur inconnue');
    }
  }
}

export const syncEngine = new SyncEngine();
