import { PlatformService } from './PlatformService';
import { WebPlatformAdapter } from './WebPlatformAdapter';

// Factory pattern : retourne la bonne instance de service selon l'environnement
export function getPlatformService(): PlatformService {
  // TODO (Phase 5/6): Ajouter la détection Capacitor pour utiliser CapacitorPlatformAdapter
  // (ex: if (Capacitor.isNativePlatform()))
  
  // Par défaut (Web et Tauri), on utilise le Web Adapter
  // (Le WebView Tauri supporte nativement le téléchargement de Blob via HTML5 pour l'instant)
  return new WebPlatformAdapter();
}

export const platform = getPlatformService();
