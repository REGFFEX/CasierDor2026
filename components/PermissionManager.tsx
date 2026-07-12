import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, XCircle, Settings, Wifi, WifiOff, Lock, Unlock } from 'lucide-react';
import {
  PermissionType,
  PermissionStatus,
  PermissionResponse,
  getPermissionMessage,
  openAppSettings,
  requestStoragePermission,
  requestInternetPermission,
  requestPrintingPermission,
  requestCameraPermission,
  isOfflineMode,
  checkInternetConnection,
  getAllPermissionsStatus,
} from '../utils/permissionManager';

interface PermissionCardProps {
  permission: PermissionResponse;
  onRetry?: () => void;
}

/**
 * Composant pour afficher une permission unique
 */
const PermissionCard: React.FC<PermissionCardProps> = ({ permission, onRetry }) => {
  const message = getPermissionMessage(permission.type);
  const isGranted = permission.status === PermissionStatus.GRANTED;
  const isDenied = permission.status === PermissionStatus.DENIED;
  const isUnavailable = permission.status === PermissionStatus.UNAVAILABLE;

  return (
    <div
      className={`p-4 rounded-xl border-2 transition-all ${
        isGranted
          ? 'bg-green-50 border-green-200'
          : isDenied
          ? 'bg-red-50 border-red-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          {isGranted ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          ) : isDenied ? (
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h4 className="font-bold text-sm text-gray-900">{message.title}</h4>
            <p className="text-[10px] text-gray-600 mt-1">{message.description}</p>
            <p className={`text-[10px] font-bold mt-2 uppercase tracking-wide ${
              isGranted ? 'text-green-700' : isDenied ? 'text-red-700' : 'text-gray-500'
            }`}>
              {permission.message}
            </p>
          </div>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          {permission.canRetry && onRetry && (
            <button
              onClick={onRetry}
              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
              title="Réessayer"
            >
              <Unlock className="w-4 h-4" />
            </button>
          )}
          {permission.shouldOpenSettings && (
            <button
              onClick={openAppSettings}
              className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all"
              title="Ouvrir paramètres"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Composant PermissionManager - Affiche toutes les permissions
 */
const PermissionManager: React.FC = () => {
  const [permissions, setPermissions] = useState<Record<PermissionType, PermissionResponse> | null>(null);
  const [isOnline, setIsOnline] = useState(checkInternetConnection());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Charger toutes les permissions
    const loadPermissions = async () => {
      setIsLoading(true);
      const allPerms = await getAllPermissionsStatus();
      setPermissions(allPerms);
      setIsLoading(false);
    };

    loadPermissions();

    // Monitorer la connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetryPermission = async (type: PermissionType) => {
    if (permissions) {
      let updatedPerm: PermissionResponse;
      switch (type) {
        case PermissionType.STORAGE:
          updatedPerm = await requestStoragePermission();
          break;
        case PermissionType.INTERNET:
          updatedPerm = await requestInternetPermission();
          break;
        case PermissionType.PRINTING:
          updatedPerm = await requestPrintingPermission();
          break;
        case PermissionType.CAMERA:
          updatedPerm = await requestCameraPermission();
          break;
        default:
          return;
      }
      setPermissions({ ...permissions, [type]: updatedPerm });
    }
  };

  if (isLoading || !permissions) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  const offlineMode = isOfflineMode();

  return (
    <div className="space-y-6">
      {/* Statut Internet */}
      <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${
        isOnline
          ? 'bg-blue-50 border-blue-200'
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-blue-600" />
          ) : (
            <WifiOff className="w-5 h-5 text-amber-600" />
          )}
          <div>
            <p className="font-bold text-sm">{isOnline ? 'En ligne' : 'Hors-ligne'}</p>
            <p className="text-[10px] text-gray-600">
              {isOnline
                ? 'Toutes les fonctionnalités disponibles'
                : 'Mode hors-ligne - Les données seront synchronisées à la reconnexion'}
            </p>
          </div>
        </div>
        {!isOnline && (
          <div className="px-3 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-tight">
            Hors-ligne
          </div>
        )}
      </div>

      {/* Permissions */}
      <div>
        <h3 className="font-black text-gray-900 mb-3 uppercase text-sm">Permissions Appareil</h3>
        <div className="space-y-3">
          {Object.entries(permissions)
            .filter(([key]) => key !== 'CONTACTS') // CONTACTS non implémenté
            .map(([key, perm]: [string, any]) => (
              <PermissionCard
                key={key}
                permission={perm}
                onRetry={() => handleRetryPermission(perm.type)}
              />
            ))}
        </div>
      </div>

      {/* Avertissement mode hors-ligne */}
      {offlineMode && (
        <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-xl">
          <p className="text-sm font-bold text-amber-900">
            ⚠️ Mode hors-ligne activé - Vos données seront sauvegardées localement et synchronisées dès la reconnexion.
          </p>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
export { PermissionCard };
