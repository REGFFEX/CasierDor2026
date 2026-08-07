import { Capacitor } from '@capacitor/core';
import { PlatformService } from './PlatformService';
import { WebPlatformAdapter } from './WebPlatformAdapter';
import { CapacitorPlatformAdapter } from './CapacitorPlatformAdapter';

// Factory pattern : retourne la bonne instance de service selon l'environnement
export function getPlatformService(): PlatformService {
  // Détection Capacitor (Android/iOS)
  if (Capacitor.isNativePlatform()) {
    return new CapacitorPlatformAdapter();
  }
  
  // Par défaut (Web et Tauri), on utilise le Web Adapter
  // (Le WebView Tauri supporte nativement le téléchargement de Blob via HTML5 pour l'instant)
  return new WebPlatformAdapter();
}

export const platform = getPlatformService();
