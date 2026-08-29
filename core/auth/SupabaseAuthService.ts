/**
 * Supabase Auth Service
 * 
 * Integration layer for Supabase Authentication with the new identity system.
 * This service provides a bridge between Supabase Auth and our identity management,
 * while maintaining compatibility with the existing auth system during migration.
 */

import { supabase } from '../../utils/supabaseClient';
import { AuthUserId } from '../identity/IdentityTypes';
import { userIdentityService } from '../identity/UserIdentityService';
import { deviceIdentityService } from '../identity/DeviceIdentityService';
import { syncEngine } from '../sync/SyncEngine';

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Register data
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName?: string;
}

/**
 * Auth result
 */
export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
  isFirstLogin?: boolean;
  isFirstDevice?: boolean;
}

/**
 * Session data
 */
export interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: any;
}

class SupabaseAuthService {
  private static instance: SupabaseAuthService;
  private currentSession: SessionData | null = null;

  private constructor() {}

  static getInstance(): SupabaseAuthService {
    if (!SupabaseAuthService.instance) {
      SupabaseAuthService.instance = new SupabaseAuthService();
    }
    return SupabaseAuthService.instance;
  }

  /**
   * Initialize the auth service
   * Checks for existing session and restores it if available
   */
  async initialize(): Promise<AuthResult> {
    try {
      // Check for existing Supabase session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error getting session:', error);
        return { success: false, error: error.message };
      }

      if (session) {
        // Restore session
        this.currentSession = {
          accessToken: session.access_token,
          refreshToken: session.refresh_token || '',
          expiresAt: session.expires_at || Date.now(),
          user: session.user
        };

        // Resolve identity
        const authUserId = session.user.id as AuthUserId;
        const identity = await userIdentityService.resolveIdentity(authUserId);

        return {
          success: true,
          user: identity.user,
          isFirstLogin: identity.isFirstLogin,
          isFirstDevice: identity.isFirstDevice
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error initializing auth service:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Register a new user
   * Flow: Register -> Supabase Auth -> User Profile -> Tenant -> Identity Resolution
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            firstName: data.firstName,
            lastName: data.lastName,
            companyName: data.companyName
          }
        }
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Registration failed' };
      }

      // Create user profile and tenant in database
      // This would normally be handled by a database trigger or edge function
      // For now, we'll do it manually (this will be improved)
      const profileCreated = await this.createUserProfile(
        authData.user.id,
        data.email,
        `${data.firstName} ${data.lastName}`,
        data.companyName
      );

      if (!profileCreated) {
        return { success: false, error: 'Failed to create user profile' };
      }

      // Resolve identity
      const identity = await userIdentityService.resolveIdentity(authData.user.id as AuthUserId);

      // Update device identity
      await deviceIdentityService.getOrCreateDeviceIdentity();

      // Set session
      this.currentSession = {
        accessToken: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token || '',
        expiresAt: authData.session?.expires_at || Date.now(),
        user: authData.user
      };

      return {
        success: true,
        user: identity.user,
        isFirstLogin: true,
        isFirstDevice: true
      };
    } catch (error) {
      console.error('Error during registration:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Login with email and password
   * Flow: Login -> Supabase Auth -> Identity Resolution -> Initial Sync
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Login with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: 'Login failed' };
      }

      // Resolve identity
      const identity = await userIdentityService.resolveIdentity(authData.user.id as AuthUserId);

      // Update device identity
      const device = await deviceIdentityService.getOrCreateDeviceIdentity();

      // Update primary device if needed
      if (identity.isFirstDevice) {
        await userIdentityService.updatePrimaryDeviceId(device.deviceId);
      }

      // Set session
      this.currentSession = {
        accessToken: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token || '',
        expiresAt: authData.session?.expires_at || Date.now(),
        user: authData.user
      };

      // Perform initial sync
      try {
        await syncEngine.performInitialSync();
      } catch (syncError) {
        console.error('Initial sync failed:', syncError);
        // Don't fail login if sync fails, but log it
      }

      return {
        success: true,
        user: identity.user,
        isFirstLogin: identity.isFirstLogin,
        isFirstDevice: identity.isFirstDevice
      };
    } catch (error) {
      console.error('Error during login:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: error.message };
      }

      // Clear local identities
      userIdentityService.clearCachedIdentities();
      deviceIdentityService.clearDeviceIdentity();

      // Clear session
      this.currentSession = null;

      // Stop sync engine
      await syncEngine.stop();

      return { success: true };
    } catch (error) {
      console.error('Error during logout:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): SessionData | null {
    return this.currentSession;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser(): any {
    return this.currentSession?.user;
  }

  /**
   * Create user profile in database
   * This is a temporary implementation - should be handled by database triggers
   */
  private async createUserProfile(
    authUserId: string,
    email: string,
    displayName: string,
    companyName?: string
  ): Promise<boolean> {
    try {
      // First, create or get tenant
      let tenantId: string;
      
      if (companyName) {
        // Try to find existing tenant by name
        const { data: existingTenant } = await supabase
          .from('Tenant')
          .select('id')
          .eq('name', companyName)
          .maybeSingle();

        if (existingTenant) {
          tenantId = existingTenant.id;
        } else {
          // Create new tenant
          const { data: newTenant, error: tenantError } = await supabase
            .from('Tenant')
            .insert({
              name: companyName,
              slug: companyName.toLowerCase().replace(/\s+/g, '-'),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            .select('id')
            .single();

          if (tenantError || !newTenant) {
            console.error('Error creating tenant:', tenantError);
            return false;
          }

          tenantId = newTenant.id;
        }
      } else {
        // Create personal tenant
        const { data: newTenant, error: tenantError } = await supabase
          .from('Tenant')
          .insert({
            name: `${displayName}'s Workspace`,
            slug: `${displayName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
          .select('id')
          .single();

        if (tenantError || !newTenant) {
          console.error('Error creating tenant:', tenantError);
          return false;
        }

        tenantId = newTenant.id;
      }

      // Create user profile
      const { error: userError } = await supabase
        .from('User')
        .insert({
          id: authUserId,
          tenantId,
          email,
          displayName,
          role: 'ADMIN',
          storageAccountId: authUserId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

      if (userError) {
        console.error('Error creating user profile:', userError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      return false;
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error during password reset:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error during password update:', error);
      return { success: false, error: String(error) };
    }
  }
}

export const supabaseAuthService = SupabaseAuthService.getInstance();