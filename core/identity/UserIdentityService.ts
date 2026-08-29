/**
 * User Identity Service
 * 
 * Manages user identity with Supabase Auth as the single source of truth.
 * Handles identity resolution, mapping, and multi-device consistency.
 */

import { supabase } from '../../utils/supabaseClient';
import {
  AuthUserId,
  AppUserId,
  TenantId,
  UserIdentity,
  TenantIdentity,
  IdentityMapping,
  IdentityResolution,
  IdentitySyncState
} from './IdentityTypes';
import { deviceIdentityService } from './DeviceIdentityService';

class UserIdentityService {
  private static instance: UserIdentityService;
  private cachedIdentity: UserIdentity | null = null;
  private cachedTenant: TenantIdentity | null = null;
  private cachedMapping: IdentityMapping | null = null;

  private constructor() {}

  static getInstance(): UserIdentityService {
    if (!UserIdentityService.instance) {
      UserIdentityService.instance = new UserIdentityService();
    }
    return UserIdentityService.instance;
  }

  /**
   * Resolve complete identity after Supabase Auth authentication
   * This is the main entry point for identity resolution
   */
  async resolveIdentity(authUserId: AuthUserId): Promise<IdentityResolution> {
    // Get device identity
    const device = await deviceIdentityService.getOrCreateDeviceIdentity();

    // Fetch user profile from Supabase
    const userProfile = await this.fetchUserProfile(authUserId);
    if (!userProfile) {
      throw new Error('User profile not found in database');
    }

    // Fetch tenant information
    const tenant = await this.fetchTenant(userProfile.tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Build identity mapping
    const mapping: IdentityMapping = {
      authUserId,
      appUserId: userProfile.id,
      tenantId: userProfile.tenantId,
      storageAccountId: userProfile.storageAccountId, // Legacy compatibility
      currentDeviceId: device.deviceId
    };

    // Cache identities
    this.cachedIdentity = userProfile;
    this.cachedTenant = tenant;
    this.cachedMapping = mapping;

    // Determine if this is first login or first device
    const isFirstLogin = await this.checkIfFirstLogin(authUserId);
    const isFirstDevice = await this.checkIfFirstDevice(authUserId, device.deviceId);

    return {
      user: userProfile,
      tenant,
      device,
      mapping,
      isFirstLogin,
      isFirstDevice
    };
  }

  /**
   * Get current cached user identity
   */
  getCurrentUserIdentity(): UserIdentity | null {
    return this.cachedIdentity;
  }

  /**
   * Get current cached tenant identity
   */
  getCurrentTenantIdentity(): TenantIdentity | null {
    return this.cachedTenant;
  }

  /**
   * Get current cached identity mapping
   */
  getCurrentIdentityMapping(): IdentityMapping | null {
    return this.cachedMapping;
  }

  /**
   * Clear cached identities (e.g., after logout)
   */
  clearCachedIdentities(): void {
    this.cachedIdentity = null;
    this.cachedTenant = null;
    this.cachedMapping = null;
  }

  /**
   * Fetch user profile from Supabase User table
   */
  private async fetchUserProfile(authUserId: AuthUserId): Promise<UserIdentity | null> {
    try {
      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', authUserId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return this.mapToUserIdentity(data);
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  }

  /**
   * Fetch tenant from Supabase Tenant table
   */
  private async fetchTenant(tenantId: TenantId): Promise<TenantIdentity | null> {
    try {
      const { data, error } = await supabase
        .from('Tenant')
        .select('*')
        .eq('id', tenantId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching tenant:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return {
        tenantId: data.id,
        name: data.name,
        slug: data.slug,
        createdAt: new Date(data.createdAt).getTime(),
        updatedAt: new Date(data.updatedAt).getTime()
      };
    } catch (error) {
      console.error('Error in fetchTenant:', error);
      return null;
    }
  }

  /**
   * Map Supabase User row to UserIdentity
   */
  private mapToUserIdentity(data: any): UserIdentity {
    const displayName = data.displayName || data.email;
    
    return {
      authUserId: data.id,
      appUserId: data.id,
      email: data.email,
      displayName,
      tenantId: data.tenantId,
      primaryDeviceId: data.primaryDeviceId || undefined,
      createdAt: new Date(data.createdAt).getTime(),
      updatedAt: new Date(data.updatedAt).getTime()
    };
  }

  /**
   * Check if this is the first login for the user
   */
  private async checkIfFirstLogin(authUserId: AuthUserId): Promise<boolean> {
    // This could be enhanced by tracking login history
    // For now, we'll check if the user has any previous activity
    try {
      const { count, error } = await supabase
        .from('Sale')
        .select('*', { count: 'exact', head: true })
        .eq('userId', authUserId);

      if (error) {
        console.error('Error checking first login:', error);
        return true; // Assume first login on error
      }

      return count === 0;
    } catch (error) {
      console.error('Error in checkIfFirstLogin:', error);
      return true;
    }
  }

  /**
   * Check if this is the first device for the user
   */
  private async checkIfFirstDevice(authUserId: AuthUserId, deviceId: string): Promise<boolean> {
    // This would require a device tracking table
    // For now, we'll implement a simple check using User.primaryDeviceId
    try {
      const { data, error } = await supabase
        .from('User')
        .select('primaryDeviceId')
        .eq('id', authUserId)
        .single();

      if (error) {
        console.error('Error checking first device:', error);
        return true; // Assume first device on error
      }

      return !data.primaryDeviceId || data.primaryDeviceId === deviceId;
    } catch (error) {
      console.error('Error in checkIfFirstDevice:', error);
      return true;
    }
  }

  /**
   * Update primary device ID for user
   */
  async updatePrimaryDeviceId(deviceId: string): Promise<boolean> {
    if (!this.cachedIdentity) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('User')
        .update({ primaryDeviceId: deviceId })
        .eq('id', this.cachedIdentity.authUserId);

      if (error) {
        console.error('Error updating primary device ID:', error);
        return false;
      }

      this.cachedIdentity.primaryDeviceId = deviceId;
      return true;
    } catch (error) {
      console.error('Error in updatePrimaryDeviceId:', error);
      return false;
    }
  }

  /**
   * Get identity sync state
   */
  async getIdentitySyncState(): Promise<IdentitySyncState> {
    // This would be enhanced with actual sync state tracking
    // For now, return a default state
    return IdentitySyncState.SYNCED;
  }
}

export const userIdentityService = UserIdentityService.getInstance();