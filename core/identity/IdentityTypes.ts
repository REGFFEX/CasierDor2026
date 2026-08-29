/**
 * Core Identity Types for Offline-First Multi-Device Architecture
 * 
 * This module defines the core identity concepts used across the new data layer.
 * Identity is managed by Supabase Auth as the single source of truth.
 */

/**
 * Device ID - stable identifier for the current device
 * Must be stable across app restarts but different on different devices
 */
export type DeviceId = string;

/**
 * Auth User ID - Supabase Auth user identifier
 * This is the canonical identity source from Supabase Auth
 */
export type AuthUserId = string;

/**
 * Application User ID - matches User.id in database
 * Mapped deterministically from AuthUserId
 */
export type AppUserId = string;

/**
 * Tenant ID - organization/workspace identifier
 * Single user can belong to multiple tenants via memberships
 */
export type TenantId = string;

/**
 * Storage Account ID - legacy identifier for backward compatibility
 * Will be phased out in favor of AppUserId
 */
export type StorageAccountId = string;

/**
 * Device Identity
 * Represents the current device's identity in the system
 */
export interface DeviceIdentity {
  deviceId: DeviceId;
  deviceName: string;
  platform: 'web' | 'android' | 'ios' | 'windows' | 'linux' | 'macos';
  lastSeenAt: number;
  registeredAt: number;
}

/**
 * User Identity
 * Represents the canonical user identity across all devices
 */
export interface UserIdentity {
  authUserId: AuthUserId;
  appUserId: AppUserId;
  email: string;
  displayName: string;
  tenantId: TenantId;
  primaryDeviceId?: DeviceId;
  createdAt: number;
  updatedAt: number;
}

/**
 * Tenant Identity
 * Represents an organization/workspace identity
 */
export interface TenantIdentity {
  tenantId: TenantId;
  name: string;
  slug: string;
  createdAt: number;
  updatedAt: number;
}

/**
 * Identity Mapping
 * Deterministic mapping between different identity layers
 */
export interface IdentityMapping {
  authUserId: AuthUserId;
  appUserId: AppUserId;
  tenantId: TenantId;
  storageAccountId?: StorageAccountId; // Legacy, for compatibility
  currentDeviceId: DeviceId;
}

/**
 * Identity Resolution Result
 * Result of resolving user identity after authentication
 */
export interface IdentityResolution {
  user: UserIdentity;
  tenant: TenantIdentity;
  device: DeviceIdentity;
  mapping: IdentityMapping;
  isFirstDevice: boolean;
  isFirstLogin: boolean;
}

/**
 * Identity Sync State
 * State of identity synchronization across devices
 */
export enum IdentitySyncState {
  /** Identity is fully synchronized across all devices */
  SYNCED = 'SYNCED',
  /** Local identity needs to be pushed to remote */
  NEEDS_PUSH = 'NEEDS_PUSH',
  /** Remote identity needs to be pulled */
  NEEDS_PULL = 'NEEDS_PULL',
  /** Conflict detected between local and remote identity */
  CONFLICT = 'CONFLICT',
  /** Identity state is unknown (initial state) */
  UNKNOWN = 'UNKNOWN'
}