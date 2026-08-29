/**
 * Product Repository
 * 
 * Repository implementation for Product entity using the new local database abstraction.
 * This is the data access layer for the Product use case.
 */

import { IDatabase } from '../database/DatabaseTypes';
import { databaseFactory } from '../database/DatabaseFactory';
import { LocalProduct } from '../database/DatabaseSchema';
import {
  CreateProductData,
  UpdateProductData,
  ProductQuery,
  ProductOperationResult,
  ProductListResult
} from './ProductTypes';

class ProductRepository {
  private static instance: ProductRepository;
  private database: IDatabase | null = null;

  private constructor() {}

  static getInstance(): ProductRepository {
    if (!ProductRepository.instance) {
      ProductRepository.instance = new ProductRepository();
    }
    return ProductRepository.instance;
  }

  /**
   * Initialize the repository
   */
  async initialize(): Promise<void> {
    this.database = await databaseFactory.getDatabase();
  }

  /**
   * Create a new product
   */
  async create(
    data: CreateProductData,
    tenantId: string,
    userId: string,
    deviceId: string
  ): Promise<ProductOperationResult> {
    if (!this.database) {
      await this.initialize();
    }

    try {
      const product: LocalProduct = {
        id: this.generateProductId(),
        tenantId,
        name: data.name,
        description: data.description,
        price: data.price,
        cost: data.cost,
        stock: data.stock,
        category: data.category,
        barcode: data.barcode,
        sku: data.sku,
        images: data.images,
        attributes: data.attributes,
        version: 1,
        syncStatus: 'pending',
        createdBy: userId,
        updatedBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await this.database!.insert('products', product);

      return {
        success: true,
        product
      };
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
  async getById(id: string, tenantId: string): Promise<ProductOperationResult> {
    if (!this.database) {
      await this.initialize();
    }

    try {
      const product = await this.database!.getById<LocalProduct>('products', id);
      
      if (!product || product.tenantId !== tenantId) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      return {
        success: true,
        product
      };
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
   */
  async update(
    id: string,
    data: UpdateProductData,
    tenantId: string,
    userId: string
  ): Promise<ProductOperationResult> {
    if (!this.database) {
      await this.initialize();
    }

    try {
      const existing = await this.database!.getById<LocalProduct>('products', id);
      
      if (!existing || existing.tenantId !== tenantId) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      const updated: LocalProduct = {
        ...existing,
        ...data,
        version: existing.version + 1,
        syncStatus: 'pending',
        updatedBy: userId,
        updatedAt: Date.now()
      };

      await this.database!.update('products', id, updated);

      return {
        success: true,
        product: updated
      };
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
   */
  async delete(id: string, tenantId: string, userId: string): Promise<ProductOperationResult> {
    if (!this.database) {
      await this.initialize();
    }

    try {
      const existing = await this.database!.getById<LocalProduct>('products', id);
      
      if (!existing || existing.tenantId !== tenantId) {
        return {
          success: false,
          error: 'Product not found'
        };
      }

      const updated: LocalProduct = {
        ...existing,
        deletedAt: Date.now(),
        version: existing.version + 1,
        syncStatus: 'pending',
        updatedBy: userId,
        updatedAt: Date.now()
      };

      await this.database!.update('products', id, updated);

      return {
        success: true,
        product: updated
      };
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
  async query(query: ProductQuery): Promise<ProductListResult> {
    if (!this.database) {
      await this.initialize();
    }

    try {
      const conditions = [
        { field: 'tenantId', operator: 'eq', value: query.tenantId }
      ];

      // Add soft delete filter
      conditions.push({ field: 'deletedAt', operator: 'eq', value: null });

      // Add optional filters
      if (query.category) {
        conditions.push({ field: 'category', operator: 'eq', value: query.category });
      }

      if (query.inStock !== undefined) {
        if (query.inStock) {
          conditions.push({ field: 'stock', operator: 'gt', value: 0 });
        } else {
          conditions.push({ field: 'stock', operator: 'eq', value: 0 });
        }
      }

      const result = await this.database!.query<LocalProduct>('products', conditions, {
        limit: query.limit,
        offset: query.offset,
        orderBy: { field: 'updatedAt', direction: 'desc' }
      });

      // Apply search filter (post-query for now)
      let filteredData = result.data;
      if (query.search) {
        const searchLower = query.search.toLowerCase();
        filteredData = filteredData.filter(product =>
          product.name.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.barcode?.toLowerCase().includes(searchLower) ||
          product.sku?.toLowerCase().includes(searchLower)
        );
      }

      // Apply price filters (post-query for now)
      if (query.minPrice !== undefined) {
        filteredData = filteredData.filter(product => product.price >= query.minPrice!);
      }
      if (query.maxPrice !== undefined) {
        filteredData = filteredData.filter(product => product.price <= query.maxPrice!);
      }

      return {
        products: filteredData,
        total: filteredData.length,
        hasMore: query.limit ? filteredData.length >= query.limit : false
      };
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
   * Get products that need syncing
   */
  async getPendingSync(tenantId: string): Promise<LocalProduct[]> {
    if (!this.database) {
      await this.initialize();
    }

    const result = await this.database!.query<LocalProduct>('products', [
      { field: 'tenantId', operator: 'eq', value: tenantId },
      { field: 'syncStatus', operator: 'eq', value: 'pending' }
    ]);

    return result.data;
  }

  /**
   * Update product sync status
   */
  async updateSyncStatus(
    id: string,
    status: LocalProduct['syncStatus'],
    lastSyncedAt?: number
  ): Promise<boolean> {
    if (!this.database) {
      await this.initialize();
    }

    const updated = await this.database!.update('products', id, {
      syncStatus: status,
      lastSyncedAt: lastSyncedAt || Date.now()
    });

    return updated !== null;
  }

  /**
   * Generate unique product ID
   */
  private generateProductId(): string {
    return `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const productRepository = ProductRepository.getInstance();