/**
 * Device Identity Service
 * 
 * Manages stable device identification across app restarts.
 * Device ID must be:
 * - Stable on the same device
 * - Different on different devices
 * - Usable for mutation tracking
 * - Not replace userId or tenantId
 */

import { DeviceId, DeviceIdentity } from './IdentityTypes';

class DeviceIdentityService {
  private static instance: DeviceIdentityService;
  private deviceIdentity: DeviceIdentity | null = null;
  private readonly STORAGE_KEY = 'casierdor_device_identity';

  private constructor() {}

  static getInstance(): DeviceIdentityService {
    if (!DeviceIdentityService.instance) {
      DeviceIdentityService.instance = new DeviceIdentityService();
    }
    return DeviceIdentityService.instance;
  }

  /**
   * Get or create device identity
   * Loads from storage if available, otherwise creates new identity
   */
  async getOrCreateDeviceIdentity(): Promise<DeviceIdentity> {
    if (this.deviceIdentity) {
      return this.deviceIdentity;
    }

    // Try to load from storage
    const stored = this.loadFromStorage();
    if (stored) {
      this.deviceIdentity = stored;
      return stored;
    }

    // Create new device identity
    const newIdentity = this.createNewDeviceIdentity();
    this.saveToStorage(newIdentity);
    this.deviceIdentity = newIdentity;
    return newIdentity;
  }

  /**
   * Get current device ID without creating if doesn't exist
   */
  getCurrentDeviceId(): DeviceId | null {
    if (this.deviceIdentity) {
      return this.deviceIdentity.deviceId;
    }

    const stored = this.loadFromStorage();
    return stored ? stored.deviceId : null;
  }

  /**
   * Update device last seen timestamp
   */
  updateLastSeen(): void {
    if (this.deviceIdentity) {
      this.deviceIdentity.lastSeenAt = Date.now();
      this.saveToStorage(this.deviceIdentity);
    }
  }

  /**
   * Clear device identity (useful for testing or reset)
   */
  clearDeviceIdentity(): void {
    this.deviceIdentity = null;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear device identity:', error);
    }
  }

  /**
   * Create new device identity
   */
  private createNewDeviceIdentity(): DeviceIdentity {
    const platform = this.detectPlatform();
    const deviceName = this.generateDeviceName(platform);

    return {
      deviceId: this.generateDeviceId(),
      deviceName,
      platform,
      lastSeenAt: Date.now(),
      registeredAt: Date.now()
    };
  }

  /**
   * Generate unique device ID
   * Uses crypto API for secure random generation
   */
  private generateDeviceId(): DeviceId {
    // Try to use crypto API for secure random generation
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback to Math.random-based generation
    return 'device-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Detect current platform
   */
  private detectPlatform(): DeviceIdentity['platform'] {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes('android')) {
      return 'android';
    }
    if (userAgent.includes('iphone') || userAgent.includes('ipad') || userAgent.includes('ios')) {
      return 'ios';
    }
    if (userAgent.includes('win')) {
      return 'windows';
    }
    if (userAgent.includes('mac')) {
      return 'macos';
    }
    if (userAgent.includes('linux')) {
      return 'linux';
    }

    return 'web';
  }

  /**
   * Generate human-readable device name
   */
  private generateDeviceName(platform: DeviceIdentity['platform']): string {
    const platformNames: Record<DeviceIdentity['platform'], string> = {
      web: 'Web Browser',
      android: 'Android Device',
      ios: 'iOS Device',
      windows: 'Windows PC',
      linux: 'Linux PC',
      macos: 'Mac'
    };

    const baseName = platformNames[platform];
    const timestamp = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return `${baseName} (${timestamp})`;
  }

  /**
   * Load device identity from storage
   */
  private loadFromStorage(): DeviceIdentity | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate structure
        if (parsed.deviceId && parsed.deviceName && parsed.platform) {
          return parsed as DeviceIdentity;
        }
      }
    } catch (error) {
      console.error('Failed to load device identity:', error);
    }
    return null;
  }

  /**
   * Save device identity to storage
   */
  private saveToStorage(identity: DeviceIdentity): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(identity));
    } catch (error) {
      console.error('Failed to save device identity:', error);
    }
  }
}

export const deviceIdentityService = DeviceIdentityService.getInstance();