import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { getSyncQueueStats } from './syncQueue';
import { isOfflineMode } from './permissionManager';

export type ConnectivityStatus =
  | 'offline'
  | 'online'
  | 'pending'
  | 'syncing'
  | 'synced'
  | 'sync_error';

interface ConnectivityState {
  isOnline: boolean;
  status: ConnectivityStatus;
  pendingCount: number;
  failedCount: number;
  isSyncing: boolean;
  refresh: () => void;
  setSyncing: (value: boolean) => void;
}

const ConnectivityContext = createContext<ConnectivityState | null>(null);

export const ConnectivityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const refresh = useCallback(() => {
    const stats = getSyncQueueStats();
    setPendingCount(stats.pending);
    setFailedCount(stats.failed);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    refresh();
    const interval = setInterval(refresh, 5000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refresh]);

  const offlineForced = isOfflineMode();
  const effectivelyOnline = isOnline && !offlineForced;

  let status: ConnectivityStatus = 'online';
  if (!effectivelyOnline) {
    status = 'offline';
  } else if (isSyncing) {
    status = 'syncing';
  } else if (failedCount > 0) {
    status = 'sync_error';
  } else if (pendingCount > 0) {
    status = 'pending';
  } else {
    status = 'synced';
  }

  if (effectivelyOnline && pendingCount === 0 && failedCount === 0 && !isSyncing) {
    status = 'online';
  }

  const value: ConnectivityState = {
    isOnline: effectivelyOnline,
    status,
    pendingCount,
    failedCount,
    isSyncing,
    refresh,
    setSyncing: setIsSyncing,
  };

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
};

export function useConnectivity(): ConnectivityState {
  const ctx = useContext(ConnectivityContext);
  if (!ctx) {
    throw new Error('useConnectivity must be used within ConnectivityProvider');
  }
  return ctx;
}
