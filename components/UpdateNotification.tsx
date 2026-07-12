import React, { useState, useEffect } from 'react';
import { X, Download, AlertCircle, CheckCircle } from 'lucide-react';
import UpdateManager, { UpdateCheckResult } from '../utils/updateManager';
import { UserRole } from '../types';

interface UpdateNotificationProps {
  userRole: UserRole;
  onDismiss?: () => void;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ userRole, onDismiss }) => {
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Vérifier les mises à jour au montage (admin seulement)
    if (userRole === UserRole.ADMIN && UpdateManager.shouldCheckForUpdates()) {
      checkForUpdates();
    }
  }, [userRole]);

  const checkForUpdates = async () => {
    try {
      const result = await UpdateManager.checkForUpdates();
      setUpdateInfo(result);
      
      // Afficher notification seulement si update disponible
      if (result.hasUpdate) {
        setVisible(true);
      }
    } catch (error) {
      console.error('Erreur vérification mises à jour:', error);
    }
  };

  const handleInstall = async () => {
    if (!updateInfo?.hasUpdate) return;
    
    setInstalling(true);
    try {
      const result = await UpdateManager.installUpdate();
      console.log(result);
      
      // Redémarrer l'app après installation (en production)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Erreur installation:', error);
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };

  if (!visible || !updateInfo?.hasUpdate || !updateInfo.updateInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md z-50 animate-in fade-in slide-in-from-bottom-4">
      <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-l-4 border-red-500 shadow-lg rounded-lg p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-red-900 dark:text-red-100 text-sm">
                🆕 Nouvelle version disponible!
              </h3>
              <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                v{updateInfo.currentVersion} → v{updateInfo.latestVersion}
              </p>
              {updateInfo.updateInfo.description && (
                <p className="text-xs text-red-600 dark:text-red-300 mt-2 line-clamp-2">
                  {updateInfo.updateInfo.description}
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded transition-colors flex items-center justify-center gap-2"
          >
            {installing ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Installation...</span>
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                <span>Installer</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-3 py-2 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800/50 text-red-700 dark:text-red-200 text-xs font-bold rounded transition-colors"
          >
            Plus tard
          </button>
        </div>

        <p className="text-[10px] text-red-600 dark:text-red-300 mt-2">
          Dernière vérification: {updateInfo.lastChecked.toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default UpdateNotification;
