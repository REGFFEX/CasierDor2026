/**
 * Product Use Case
 * 
 * Business logic layer for Product entity.
 * Coordinates between repository, outbox, and sync engine.
 * This is the main entry point for product operations in the new architecture.
 */

import { productRepository } from './ProductRepository';
import { outboxService } from '../sync/OutboxService';
import { syncEngine } from '../sync/SyncEngine';
import { userIdentityService } from '../identity/UserIdentityService';
import { deviceIdentityService } from '../identity/DeviceIdentityService';
import {
  CreateProductData,
  UpdateProductData,
  ProductQuery,
  ProductOperationResult,
  ProductListResult
} from './ProductTypes';
import { MutationOperation } from '../database/DatabaseSchema';

class ProductUseCase {
  private static instance: ProductUseCase;

  private constructor() {}

  static getInstance(): ProductUseCase {
    if (!ProductUseCase.instance) {
      ProductUseCase.instance = new ProductUseCase();
    }
    return ProductUseCase.instance;
  }

  /**
   * Initialize the use case
   */
  async initialize(): Promise<void> {
    await productRepository.initialize();
    await outboxService.initialize();
    await syncEngine.initialize();
  }

  /**
   * Create a new product
   * Flow: UI -> UseCase -> Repository -> Local DB -> Outbox -> UI update
   */
  async createProduct(data: CreateProductData): Promise<ProductOperationResult> {
    try {
      // Get current identity
      const identity = userIdentityService.getCurrentIdentityMapping();
      if (!identity) {
        return {
          success: false,
          error: 'No active user identity'
        };
      }

      const device = await deviceIdentityService.getOrCreateDeviceIdentity();

      // Create product in local database
      const result = await productRepository.create(
        data,
        identity.tenantId,
        identity.appUserId,
        device.deviceId
      );

      if (!result.success || !result.product) {
        return result;
      }

      // Add mutation to outbox for sync
      await outboxService.addMutation(
        result.product.id,
        'product',
        MutationOperation.CREATE,
        identity.tenantId,
        identity.appUserId,
        device.deviceId,
        result.product.version,
        result.product
      );

      // Trigger async sync (non-blocking)
      this.triggerSync().catch(error => {
        console.error('Background sync failed:', error);
      });

      return result;
    } catch (error) {
      console.error('Failed to create product:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Get a product by ID
   */
  async getProduct(id: string): Promise<ProductOperationResult> {
    try {
      const identity = userIdentityService.getCurrentIdentityMapping();
      if (!identity) {
        return {
          success: false,
          error: 'No active user identity'
        };
      }

      return await productRepository.getById(id, identity.tenantId);
    } catch (error) {
      console.error('Failed to get product:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Update a product
   * Flow: UI -> UseCase -> Repository -> Local DB -> Outbox -> UI update
   */
  async updateProduct(id: string, data: UpdateProductData): Promise<ProductOperationResult> {
    try {
      // Get current identity
      const identity = userIdentityService.getCurrentIdentityMapping();
      if (!identity) {
        return {
          success: false,
          error: 'No active user identity'
        };
      }

      // Update product in local database
      const result = await productRepository.update(
        id,
        data,
        identity.tenantId,
        identity.appUserId
      );

      if (!result.success || !result.product) {
        return result;
      }

      // Add mutation to outbox for sync
      await outboxService.addMutation(
        result.product.id,
        'product',
        MutationOperation.UPDATE,
        identity.tenantId,
        identity.appUserId,
        await deviceIdentityService.getCurrentDeviceId() || '',
        result.product.version,
        result.product
      );

      // Trigger async sync (non-blocking)
      this.triggerSync().catch(error => {
        console.error('Background sync failed:', error);
      });

      return result;
    } catch (error) {
      console.error('Failed to update product:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Delete a product (soft delete)
   * Flow: UI -> UseCase -> Repository -> Local DB -> Outbox -> UI update
   */
  async deleteProduct(id: string): Promise<ProductOperationResult> {
    try {
      // Get current identity
      const identity = userIdentityService.getCurrentIdentityMapping();
      if (!identity) {
        return {
          success: false,
          error: 'No active user identity'
        };
      }

      // Delete product in local database
      const result = await productRepository.delete(
        id,
        identity.tenantId,
        identity.appUserId
      );

      if (!result.success || !result.product) {
        return result;
      }

      // Add mutation to outbox for sync
      await outboxService.addMutation(
        result.product.id,
        'product',
        MutationOperation.DELETE,
        identity.tenantId,
        identity.appUserId,
        await deviceIdentityService.getCurrentDeviceId() || '',
        result.product.version,
        result.product
      );

      // Trigger async sync (non-blocking)
      this.triggerSync().catch(error => {
        console.error('Background sync failed:', error);
      });

      return result;
    } catch (error) {
      console.error('Failed to delete product:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Query products with filters
   */
  async queryProducts(query: ProductQuery): Promise<ProductListResult> {
    try {
      const identity = userIdentityService.getCurrentIdentityMapping();
      if (!identity) {
        return {
          products: [],
          total: 0,
          hasMore: false
        };
      }

      return await productRepository.query({
        ...query,
        tenantId: identity.tenantId
      });
    } catch (error) {
      console.error('Failed to query products:', error);
      return {
        products: [],
        total: 0,
        hasMore: false
      };
    }
  }

  /**
   * Get all products for current tenant
   */
  async getAllProducts(): Promise<ProductListResult> {
    const identity = userIdentityService.getCurrentIdentityMapping();
    if (!identity) {
      return {
        products: [],
        total: 0,
        hasMore: false
      };
    }

    return this.queryProducts({ tenantId: identity.tenantId });
  }

  /**
   * Sync products explicitly
   */
  async syncProducts(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await syncEngine.sync();
      return {
        success: result.success,
        error: result.errors.length > 0 ? result.errors.join(', ') : undefined
      };
    } catch (error) {
      console.error('Failed to sync products:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }

  /**
   * Get sync status for products
   */
  async getSyncStatus(): Promise<{ pending: number; processing: number; failed: number }> {
    const identity = userIdentityService.getCurrentIdentityMapping();
    if (!identity) {
      return { pending: 0, processing: 0, failed: 0 };
    }

    const stats = await outboxService.getStatistics(identity.tenantId);
    return {
      pending: stats.pending,
      processing: stats.processing,
      failed: stats.failed
    };
  }

  /**
   * Trigger background sync (non-blocking)
   */
  private async triggerSync(): Promise<void> {
    try {
      await syncEngine.sync();
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  /**
   * Handle offline product creation
   * Special handling for when device is offline
   */
  async createProductOffline(data: CreateProductData): Promise<ProductOperationResult> {
    // The flow is the same as createProduct - the architecture handles offline automatically
    // Local DB will persist the data, and outbox will queue the mutation for later sync
    return this.createProduct(data);
  }

  /**
   * Resolve product conflict
   * Called when a conflict is detected during sync
   */
  async resolveConflict(
    productId: string,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<ProductOperationResult> {
    try {
      const identity = userIdentityService.getCurrentIdentityMapping();
      if (!identity) {
        return {
          success: false,
          error: 'No active user identity'
        };
      }

      // Get current product state
      const current = await productRepository.getById(productId, identity.tenantId);
      if (!current.success || !current.product) {
        return current;
      }

      // Mark conflict as resolved by updating sync status
      await productRepository.updateSyncStatus(productId, 'synced');

      // Re-sync to apply resolution
      await this.syncProducts();

      return {
        success: true,
        product: current.product
      };
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      return {
        success: false,
        error: String(error)
      };
    }
  }
}

export const productUseCase = ProductUseCase.getInstance();