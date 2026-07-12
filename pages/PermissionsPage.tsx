import React, { useState, useEffect } from 'react';
import { Shield, HardDrive, Activity, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import PageBackButton from '../components/PageBackButton';
import { getStorageInfo, manageCacheStorage, isOfflineMode, checkInternetConnection } from '../utils/permissionManager';
import PermissionManager from '../components/PermissionManager';

const PermissionsPage: React.FC = () => {
  const [storageInfo, setStorageInfo] = useState<{ available: number; total: number; percentage: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(checkInternetConnection());

  useEffect(() => {
    const loadStorageInfo = async () => {
      setLoading(true);
      const info = await getStorageInfo();
      setStorageInfo(info);
      setLoading(false);
    };

    loadStorageInfo();

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

  const handleClearCache = async () => {
    try {
      await manageCacheStorage();
      alert('Cache nettoyé avec succès');
      // Recharger les infos de stockage
      const info = await getStorageInfo();
      setStorageInfo(info);
    } catch (error) {
      alert('Erreur lors du nettoyage du cache');
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* En-tête */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-4">
          <PageBackButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Permissions & Diagnostics</h1>
            <p className="text-gray-500">Gérez les autorisations de l'appareil et vérifiez l'état du système</p>
          </div>
        </div>
      </div>

      {/* État du système */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Connexion */}
        <div className={`p-6 rounded-2xl border-2 ${isOnline
            ? 'bg-blue-50 border-blue-200'
            : 'bg-amber-50 border-amber-200'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Connexion</p>
              <p className="text-2xl font-black text-gray-900 mt-2">{isOnline ? '🌐 En ligne' : '📴 Hors-ligne'}</p>
            </div>
            <Activity className={`w-8 h-8 ${isOnline ? 'text-blue-600' : 'text-amber-600'}`} />
          </div>
        </div>

        {/* Mode hors-ligne */}
        <div className={`p-6 rounded-2xl border-2 ${isOfflineMode()
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase">Mode</p>
              <p className="text-2xl font-black text-gray-900 mt-2">{isOfflineMode() ? '💾 Hors-ligne' : '☁️ Cloud'}</p>
            </div>
            <Shield className={`w-8 h-8 ${isOfflineMode() ? 'text-amber-600' : 'text-green-600'}`} />
          </div>
        </div>

        {/* Stockage */}
        {storageInfo && (
          <div className="p-6 rounded-2xl border-2 bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase">Stockage</p>
                <p className="text-2xl font-black text-gray-900 mt-2">{formatBytes(storageInfo.available)}</p>
                <p className="text-[10px] text-gray-500 mt-1">{storageInfo.percentage.toFixed(0)}% utilisé</p>
              </div>
              <HardDrive className="w-8 h-8 text-purple-600" />
            </div>
            {storageInfo.percentage > 80 && (
              <div className="mt-3 p-2 bg-red-100 rounded-lg">
                <p className="text-[10px] text-red-700 font-bold">⚠️ Stockage presque plein</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Indicateur stockage */}
      {storageInfo && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-black text-sm text-gray-900">Utilisation du Stockage</h3>
            <span className="text-[10px] font-bold text-gray-500">
              {formatBytes(storageInfo.total - storageInfo.available)} / {formatBytes(storageInfo.total)}
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${storageInfo.percentage > 80
                  ? 'bg-red-500'
                  : storageInfo.percentage > 50
                    ? 'bg-amber-500'
                    : 'bg-green-500'
                }`}
              style={{ width: `${storageInfo.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions stockage */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-900">Nettoyage du Cache</p>
            <p className="text-[10px] text-gray-600">Libère de l'espace en supprimant les fichiers temporaires</p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-bold text-xs uppercase flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Nettoyer
          </button>
        </div>
      </div>

      {/* Manager des permissions */}
      <PermissionManager />

      {/* Avertissements */}
      {!isOnline && (
        <div className="p-4 border-2 border-amber-200 bg-amber-50 rounded-2xl flex gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Mode Hors-Ligne Actif</p>
            <p className="text-[10px] text-amber-800 mt-1">
              Tous les changements seront enregistrés localement et synchronisés automatiquement dès la reconnexion.
            </p>
          </div>
        </div>
      )}

      {/* Informations système */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
        <p className="font-bold text-gray-900 text-sm mb-3">Informations Système</p>
        <div className="space-y-2 text-[10px] text-gray-600 font-mono">
          <p>Platform: {typeof navigator !== 'undefined' ? navigator.platform : 'N/A'}</p>
          <p>User Agent: {typeof navigator !== 'undefined' ? navigator.userAgent.substring(0, 60) : 'N/A'}...</p>
          <p>Langue: {typeof navigator !== 'undefined' ? navigator.language : 'N/A'}</p>
          <p>Cookies: {typeof navigator !== 'undefined' ? (navigator.cookieEnabled ? 'Activés' : 'Désactivés') : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default PermissionsPage;
