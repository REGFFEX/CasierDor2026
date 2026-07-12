import { 
  requestMediaPermission, 
  requestStoragePermission,
  requestInternetPermission,
  requestCameraPermission,
  requestPrintingPermission,
  PermissionType,
  PermissionStatus,
  getAllPermissionsStatus
} from '../utils/permissionManager';

/**
 * Tests des Permissions Multi-Plateforme
 * À exécuter dans la console du navigateur ou via un composant de test
 */

export const testMediaPermission = async () => {
  console.log('🧪 Test Permission Média...');
  
  try {
    const result = await requestMediaPermission();
    
    console.log('✅ Résultat:', {
      type: result.type,
      status: result.status,
      message: result.message,
      canRetry: result.canRetry,
      shouldOpenSettings: result.shouldOpenSettings
    });
    
    return result;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
};

export const testStoragePermission = async () => {
  console.log('🧪 Test Permission Stockage...');
  
  try {
    const result = await requestStoragePermission();
    console.log('✅ Résultat:', result);
    return result;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
};

export const testAllPermissions = async () => {
  console.log('🧪 Test Toutes les Permissions...');
  
  try {
    const results = await getAllPermissionsStatus();
    
    console.table(Object.entries(results).map(([type, result]) => ({
      Type: type,
      Status: result.status,
      Message: result.message,
      CanRetry: result.canRetry,
      OpenSettings: result.shouldOpenSettings
    })));
    
    return results;
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
};

export const testMediaUpload = async (file: File) => {
  console.log('🧪 Test Upload Média avec Permission...');
  
  try {
    // 1. Vérifier permission
    const permission = await requestMediaPermission();
    console.log('Permission:', permission.status);
    
    if (permission.status === 'DENIED') {
      console.warn('⚠️ Permission refusée:', permission.message);
      return null;
    }
    
    // 2. Vérifier type de fichier
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier n\'est pas une image');
    }
    
    // 3. Vérifier taille
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      throw new Error(`Fichier trop volumineux: ${(file.size / 1024 / 1024).toFixed(2)}MB > 2MB`);
    }
    
    // 4. Charger en Base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    console.log('✅ Fichier chargé:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)}KB`,
      type: file.type,
      base64Length: base64.length
    });
    
    return base64;
  } catch (error) {
    console.error('❌ Erreur upload:', error);
    throw error;
  }
};

// Tests d'environnement
export const getEnvironmentInfo = () => {
  const info = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    onLine: navigator.onLine,
    hasCapacitor: typeof (window as any).Capacitor !== 'undefined',
    capacitorPlatform: (window as any).Capacitor?.getPlatform?.() || 'unknown',
    hasFileAPI: typeof File !== 'undefined',
    hasFileReaderAPI: typeof FileReader !== 'undefined',
    hasMediaDevices: typeof navigator.mediaDevices !== 'undefined',
    canRequestFilesystem: 'getDirectory' in (navigator as any).storage,
  };
  
  console.table(info);
  return info;
};

// Mode debug
export const enablePermissionDebug = () => {
  console.log('🔍 Permission Debug Enabled');
  
  // Intercepter les appels de permission
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    if (typeof args[0] === 'string' && args[0].includes('permission')) {
      console.log('⚠️ [PERMISSION]', ...args);
    }
    originalWarn(...args);
  };
  
  // Afficher info env
  getEnvironmentInfo();
};

/**
 * Export pour utilisation dans la console:
 * 
 * // Test simple
 * await testMediaPermission();
 * 
 * // Test complet
 * await testAllPermissions();
 * 
 * // Test upload
 * const input = document.createElement('input');
 * input.type = 'file';
 * input.accept = 'image/*';
 * input.onchange = async (e) => {
 *   const file = (e.target as HTMLInputElement).files?.[0];
 *   if (file) await testMediaUpload(file);
 * };
 * input.click();
 * 
 * // Info environnement
 * getEnvironmentInfo();
 * 
 * // Debug mode
 * enablePermissionDebug();
 */
