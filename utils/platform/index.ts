import { PlatformService } from './PlatformService';
import { WebPlatformAdapter } from './WebPlatformAdapter';

// Web-only version - always use Web Platform Adapter
export function getPlatformService(): PlatformService {
  return new WebPlatformAdapter();
}

export const platform = getPlatformService();
