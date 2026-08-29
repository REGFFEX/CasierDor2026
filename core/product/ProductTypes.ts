/**
 * Product Types for New Architecture
 * 
 * Defines the types and interfaces for the Product entity in the new offline-first architecture.
 * This is the pilot module for the new data layer.
 */

import { LocalProduct } from '../database/DatabaseSchema';

/**
 * Product creation data
 */
export interface CreateProductData {
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
}

/**
 * Product update data
 */
export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  stock?: number;
  category?: string;
  barcode?: string;
  sku?: string;
  images?: string[];
  attributes?: Record<string, any>;
}

/**
 * Product query filters
 */
export interface ProductQuery {
  tenantId: string;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Product operation result
 */
export interface ProductOperationResult {
  success: boolean;
  product?: LocalProduct;
  error?: string;
}

/**
 * Product list result
 */
export interface ProductListResult {
  products: LocalProduct[];
  total: number;
  hasMore: boolean;
}

/**
 * Product sync status
 */
export interface ProductSyncStatus {
  productId: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  lastSyncedAt?: number;
  version: number;
}