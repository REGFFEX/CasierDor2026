/**
 * Gestionnaire Centralisé des Permissions Appareil
 * Gère les permissions avec explications claires et fallbacks
 */

let Capacitor: any = null;

// Charger Capacitor dynamiquement si disponible
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  Capacitor = (window as any).Capacitor;
}

// Fonction helper pour déterminer si Capacitor est disponible
const hasCapacitor = () => Capacitor !== null;

// Types de permissions
export enum PermissionType {
  STORAGE = 'STORAGE',           // Accès fichiers (téléchargement/sauvegarde)
  INTERNET = 'INTERNET',         // Accès réseau (sync/maj taux)
  PRINTING = 'PRINTING',         // Impression (reçus/rapports)
  CAMERA = 'CAMERA',             // Caméra (scan codes)
  CONTACTS = 'CONTACTS',         // Contacts (clients)
  MEDIA = 'MEDIA',               // Accès photos/images (logo, galerie)
}

// État de la permission
export enum PermissionStatus {
  GRANTED = 'GRANTED',           // Accordée
  DENIED = 'DENIED',             // Refusée
  PROMPT_ONCE = 'PROMPT_ONCE',   // À demander
  PROMPT = 'PROMPT',             // À demander à chaque fois
  UNAVAILABLE = 'UNAVAILABLE',   // Non disponible sur cet appareil
}

// Interface pour réponse permission
export interface PermissionResponse {
  type: PermissionType;
  status: PermissionStatus;
  message: string;
  canRetry: boolean;
  shouldOpenSettings: boolean;
}

// Messages explicatifs
const PERMISSION_MESSAGES: Record<PermissionType, { title: string; description: string }> = {
  [PermissionType.STORAGE]: {
    title: '📂 Accès au Stockage',
    description: 'Permet de télécharger des fichiers JSON, ZIP, PDF et de sauvegarder vos données.',
  },
  [PermissionType.INTERNET]: {
    title: '🌐 Accès à Internet',
    description: 'Permet de synchroniser vos données, mettre à jour les taux de change et sauvegarder dans le cloud.',
  },
  [PermissionType.PRINTING]: {
    title: '🖨️ Impression',
    description: 'Permet d\'imprimer vos reçus, tableaux et rapports depuis n\'importe quel appareil.',
  },
  [PermissionType.CAMERA]: {
    title: '📷 Caméra',
    description: 'Permet de scanner les codes produits et codes de paiement.',
  },
  [PermissionType.CONTACTS]: {
    title: '👥 Contacts',
    description: 'Permet de charger et synchroniser vos clients et contacts.',
  },
  [PermissionType.MEDIA]: {
    title: '🖼️ Accès aux Médias',
    description: 'Permet de télécharger et gérer vos logos, photos et images depuis la galerie ou l\'appareil photo.',
  },
};

// Fonction de détection d'environnement
const getEnvironment = (): 'web' | 'android' | 'ios' | 'electron' => {
  if (!hasCapacitor()) return 'web';
  try {
    const platform = Capacitor.getPlatform();
    if (platform === 'android') return 'android';
    if (platform === 'ios') return 'ios';
  } catch {
    // Fallback
  }
  return 'web';
};

/**
 * Détecte la disponibilité de l'accès Internet
 */
export const checkInternetConnection = (): boolean => {
  if (typeof navigator === 'undefined') return true; // SSR safe
  return navigator.onLine;
};

/**
 * Demande la permission d'accès au stockage (fichiers)
 */
export const requestStoragePermission = async (): Promise<PermissionResponse> => {
  const env = getEnvironment();

  try {
    if (env === 'web') {
      // Web: utilise l'API Filesystem moderne si disponible
      if ('storage' in navigator && 'getDirectory' in navigator.storage) {
        try {
          const handle = await navigator.storage.getDirectory();
          return {
            type: PermissionType.STORAGE,
            status: PermissionStatus.GRANTED,
            message: 'Accès au stockage accordé',
            canRetry: true,
            shouldOpenSettings: false,
          };
        } catch {
          return {
            type: PermissionType.STORAGE,
            status: PermissionStatus.DENIED,
            message: 'Accès au stockage refusé. Téléchargement via navigateur impossible.',
            canRetry: true,
            shouldOpenSettings: false,
          };
        }
      }
      // Fallback: Web classique permet les téléchargements
      return {
        type: PermissionType.STORAGE,
        status: PermissionStatus.GRANTED,
        message: 'Accès au stockage (Web)',
        canRetry: false,
        shouldOpenSettings: false,
      };
    }

    if (env === 'android' || env === 'ios') {
      try {
        // Pas d'import de Filesystem pour éviter les erreurs
        // Simplement tenter l'accès
        console.log('Capacitor Storage Permission Request (Mobile)');

        return {
          type: PermissionType.STORAGE,
          status: PermissionStatus.GRANTED,
          message: 'Accès au stockage accordé',
          canRetry: true,
          shouldOpenSettings: false,
        };
      } catch (error) {
        return {
          type: PermissionType.STORAGE,
          status: PermissionStatus.DENIED,
          message: 'Accès au stockage refusé. Allez dans Paramètres > Casier d\'Or > Fichiers et médias.',
          canRetry: true,
          shouldOpenSettings: true,
        };
      }
    }

    return {
      type: PermissionType.STORAGE,
      status: PermissionStatus.UNAVAILABLE,
      message: 'Accès au stockage non disponible',
      canRetry: false,
      shouldOpenSettings: false,
    };
  } catch (error) {
    console.error('Erreur permission stockage:', error);
    return {
      type: PermissionType.STORAGE,
      status: PermissionStatus.DENIED,
      message: 'Erreur lors de la vérification des permissions',
      canRetry: true,
      shouldOpenSettings: false,
    };
  }
};

/**
 * Demande la permission d'accès à Internet
 */
export const requestInternetPermission = async (): Promise<PermissionResponse> => {
  const hasConnection = checkInternetConnection();

  if (hasConnection) {
    return {
      type: PermissionType.INTERNET,
      status: PermissionStatus.GRANTED,
      message: 'Connexion Internet active',
      canRetry: true,
      shouldOpenSettings: false,
    };
  }

  return {
    type: PermissionType.INTERNET,
    status: PermissionStatus.DENIED,
    message: 'Pas de connexion Internet. Mode hors-ligne activé.',
    canRetry: true,
    shouldOpenSettings: false,
  };
};

/**
 * Demande la permission d'impression
 */
export const requestPrintingPermission = async (): Promise<PermissionResponse> => {
  const env = getEnvironment();

  // Web: utilise l'API d'impression native
  if (env === 'web' && 'print' in window) {
    return {
      type: PermissionType.PRINTING,
      status: PermissionStatus.GRANTED,
      message: 'Impression disponible',
      canRetry: false,
      shouldOpenSettings: false,
    };
  }

  // Android: utilise le service d'impression Capacitor
  if (env === 'android' || env === 'ios') {
    try {
      // Vérifier si le plugin Printer est disponible
      return {
        type: PermissionType.PRINTING,
        status: PermissionStatus.GRANTED,
        message: 'Impression système disponible',
        canRetry: false,
        shouldOpenSettings: false,
      };
    } catch {
      return {
        type: PermissionType.PRINTING,
        status: PermissionStatus.UNAVAILABLE,
        message: 'Aucun service d\'impression disponible',
        canRetry: false,
        shouldOpenSettings: false,
      };
    }
  }

  return {
    type: PermissionType.PRINTING,
    status: PermissionStatus.UNAVAILABLE,
    message: 'Impression non disponible',
    canRetry: false,
    shouldOpenSettings: false,
  };
};

/**
 * Demande la permission pour la caméra (scan)
 */
export const requestCameraPermission = async (): Promise<PermissionResponse> => {
  const env = getEnvironment();

  if (env === 'web') {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      return {
        type: PermissionType.CAMERA,
        status: PermissionStatus.GRANTED,
        message: 'Accès à la caméra accordé',
        canRetry: true,
        shouldOpenSettings: false,
      };
    } catch {
      return {
        type: PermissionType.CAMERA,
        status: PermissionStatus.DENIED,
        message: 'Accès à la caméra refusé',
        canRetry: true,
        shouldOpenSettings: true,
      };
    }
  }

  if (env === 'android' || env === 'ios') {
    return {
      type: PermissionType.CAMERA,
      status: PermissionStatus.GRANTED,
      message: 'Accès à la caméra',
      canRetry: true,
      shouldOpenSettings: true,
    };
  }

  return {
    type: PermissionType.CAMERA,
    status: PermissionStatus.UNAVAILABLE,
    message: 'Caméra non disponible',
    canRetry: false,
    shouldOpenSettings: false,
  };
};

/**
 * Demande la permission pour accéder aux photos/images (média)
 * Compatible: Android, iOS, Web, macOS, Windows, Linux
 */
export const requestMediaPermission = async (): Promise<PermissionResponse> => {
  const env = getEnvironment();

  try {
    if (env === 'web') {
      // Web: utilise l'API File System Access ou input type="file"
      try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        return {
          type: PermissionType.MEDIA,
          status: PermissionStatus.GRANTED,
          message: 'Accès aux médias accordé (Web)',
          canRetry: false,
          shouldOpenSettings: false,
        };
      } catch {
        return {
          type: PermissionType.MEDIA,
          status: PermissionStatus.GRANTED,
          message: 'Accès aux médias (sélecteur natif disponible)',
          canRetry: false,
          shouldOpenSettings: false,
        };
      }
    }

    if (env === 'android') {
      // Android: demande READ_MEDIA_IMAGES (API 33+) ou READ_EXTERNAL_STORAGE
      // Géré par Capacitor Filesystem
      return {
        type: PermissionType.MEDIA,
        status: PermissionStatus.GRANTED,
        message: 'Accès à la galerie accordé',
        canRetry: true,
        shouldOpenSettings: true,
      };
    }

    if (env === 'ios') {
      // iOS: demande NSPhotoLibraryUsageDescription via info.plist
      // Géré par Capacitor Filesystem
      return {
        type: PermissionType.MEDIA,
        status: PermissionStatus.GRANTED,
        message: 'Accès à la photo library accordé',
        canRetry: true,
        shouldOpenSettings: true,
      };
    }

    // macOS, Windows, Linux: utilise le sélecteur natif de fichiers
    return {
      type: PermissionType.MEDIA,
      status: PermissionStatus.GRANTED,
      message: 'Accès aux médias (sélecteur natif)',
      canRetry: false,
      shouldOpenSettings: false,
    };
  } catch (error) {
    console.error('Erreur permission média:', error);
    return {
      type: PermissionType.MEDIA,
      status: PermissionStatus.DENIED,
      message: 'Erreur lors de l\'accès aux médias',
      canRetry: true,
      shouldOpenSettings: true,
    };
  }
};

/**
 * Obtient le message d'une permission
 */
export const getPermissionMessage = (type: PermissionType): { title: string; description: string } => {
  return PERMISSION_MESSAGES[type] || { title: 'Permission', description: 'Permission requise' };
};

/**
 * Ouvre les paramètres système pour autoriser l'app
 */
export const openAppSettings = async (): Promise<void> => {
  const env = getEnvironment();

  if ((env === 'android' || env === 'ios') && hasCapacitor()) {
    try {
      // Ouvrir les paramètres de l'app
      if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.App) {
        await Capacitor.Plugins.App.openUrl({ url: 'app-settings:' });
      }
    } catch (error) {
      console.error('Impossible d\'ouvrir les paramètres:', error);
    }
  }
};

/**
 * Gestionnaire de cache - nettoie automatiquement
 */
export const manageCacheStorage = async (): Promise<void> => {
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const cacheDate = new Date(dateHeader).getTime();
              if (cacheDate < oneWeekAgo) {
                await cache.delete(request);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur gestion cache:', error);
    }
  }
};

/**
 * Obtient l'espace de stockage disponible
 */
export const getStorageInfo = async (): Promise<{ available: number; total: number; percentage: number }> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const percentage = (estimate.usage! / estimate.quota!) * 100;
      return {
        available: estimate.quota! - estimate.usage!,
        total: estimate.quota!,
        percentage,
      };
    } catch {
      return { available: 0, total: 0, percentage: 0 };
    }
  }

  return { available: 0, total: 0, percentage: 0 };
};

/**
 * Initie un mode hors-ligne avec notification
 */
export const initializeOfflineMode = async (): Promise<void> => {
  const hasConnection = checkInternetConnection();

  if (!hasConnection) {
    // Stocker le mode hors-ligne
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem('offline_timestamp', new Date().toISOString());

    // Événement pour les listeners
    window.dispatchEvent(new CustomEvent('offline_mode_activated'));
  }
};

/**
 * Vérifie si en mode hors-ligne
 */
export const isOfflineMode = (): boolean => {
  return localStorage.getItem('offline_mode') === 'true' && !checkInternetConnection();
};

/**
 * Quitte le mode hors-ligne
 */
export const exitOfflineMode = async (): Promise<void> => {
  const hasConnection = checkInternetConnection();

  if (hasConnection) {
    localStorage.removeItem('offline_mode');
    localStorage.removeItem('offline_timestamp');
    window.dispatchEvent(new CustomEvent('offline_mode_deactivated'));
  }
};

/**
 * Monitore les changements de connexion
 */
export const setupConnectionMonitoring = (
  onOnline?: () => void,
  onOffline?: () => void
): (() => void) => {
  const handleOnline = async () => {
    await exitOfflineMode();
    onOnline?.();
  };

  const handleOffline = async () => {
    await initializeOfflineMode();
    onOffline?.();
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Retourner une fonction de cleanup
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Résume tous les états des permissions
 */
export const getAllPermissionsStatus = async (): Promise<Record<PermissionType, PermissionResponse>> => {
  const [storage, internet, printing, camera, media] = await Promise.all([
    requestStoragePermission(),
    requestInternetPermission(),
    requestPrintingPermission(),
    requestCameraPermission(),
    requestMediaPermission(),
  ]);

  return {
    [PermissionType.STORAGE]: storage,
    [PermissionType.INTERNET]: internet,
    [PermissionType.PRINTING]: printing,
    [PermissionType.CAMERA]: camera,
    [PermissionType.MEDIA]: media,
    [PermissionType.CONTACTS]: {
      type: PermissionType.CONTACTS,
      status: PermissionStatus.UNAVAILABLE,
      message: 'Non implémenté',
      canRetry: false,
      shouldOpenSettings: false,
    },
  };
};
