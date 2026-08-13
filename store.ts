
import { Product, Client, Sale, StoreSettings, ProductType, SaleStatus, UserRole, Activity, LogAction, TrashItem } from './types';
import { DEFAULT_CURRENCY } from './constants';
import { getActivityUserName } from './utils/companyProfile';
import { ensureInstallationSecret } from './utils/cryptoVault';
import { runSecurityMigration } from './utils/recoveryKeyService';
import { scopeStorageKey } from './utils/accountStorage';
import { enqueueSyncItem, SyncEntityType } from './utils/syncQueue';

export const STORAGE_KEYS = {
  PRODUCTS: 'casier_products',
  CLIENTS: 'casier_clients',
  SALES: 'casier_sales',
  SETTINGS: 'casier_settings',
  USERS: 'casier_users',
  MOVEMENTS: 'casier_stock_movements',
  RECENT_PAYMENTS: 'casier_recent_payments',
  RECYCLE_BIN: 'casier_recycle_bin',
  ACTIVITIES: 'casier_activities',
  ACCOUNTING_TRANSACTIONS: 'casier_accounting_transactions',
  REPLENISHMENT_ORDERS: 'casier_replenishment_orders',
  ARCHIVES: 'casier_archives'
};

export const DEFAULT_SETTINGS: StoreSettings = {
  name: "Mon Entreprise",
  phone: "",
  email: "",
  address: "",
  currency: DEFAULT_CURRENCY,
  country: 'cg',
  language: 'fr',
  stockEnabled: true,
  userRole: UserRole.ADMIN,
  businessType: "Dépôt de Boisson",
  trashRetentionDays: 30,
  enableActivityLogging: true,
  customProductTypes: [],
  enableTestAccounts: false,
  showDashboardShortcuts: true,
  disabledModules: [],
  securityActive: false,
  loginAttempts: {},
  updatedAt: Date.now()
};

// Mock data supprimées pour la production (MVP)

export const getStoreData = <T,>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(scopeStorageKey(key));
  return data ? JSON.parse(data) : defaultValue;
};

const getEntityTypeFromKey = (key: string): SyncEntityType | null => {
  switch (key) {
    case STORAGE_KEYS.PRODUCTS: return 'product';
    case STORAGE_KEYS.CLIENTS: return 'client';
    case STORAGE_KEYS.SALES: return 'sale';
    case STORAGE_KEYS.SETTINGS: return 'settings';
    case STORAGE_KEYS.MOVEMENTS: return 'movement';
    case STORAGE_KEYS.ACCOUNTING_TRANSACTIONS: return 'accounting';
    case STORAGE_KEYS.REPLENISHMENT_ORDERS: return 'replenishment';
    default: return null;
  }
};

export const setStoreData = <T,>(key: string, value: T): void => {
  try {
    const entityType = getEntityTypeFromKey(key);
    
    // Si c'est une entité synchronisable et que c'est un tableau
    if (entityType && Array.isArray(value)) {
      const oldArray = getStoreData<any[]>(key, []);
      const oldMap = new Map(oldArray.map(item => [item.id, item]));
      const newMap = new Map(value.map(item => [item.id, item]));
      
      // Détecter les Créations et Mises à jour
      value.forEach(newItem => {
        if (!newItem || !newItem.id) return;
        const oldItem = oldMap.get(newItem.id);
        if (!oldItem) {
          enqueueSyncItem(entityType, 'create', newItem);
        } else if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
          enqueueSyncItem(entityType, 'update', newItem);
        }
      });
      
      // Détecter les Suppressions strictes
      oldArray.forEach(oldItem => {
        if (oldItem && oldItem.id && !newMap.has(oldItem.id)) {
          enqueueSyncItem(entityType, 'delete', { id: oldItem.id });
        }
      });
    } else if (entityType === 'settings') {
      // Cas particulier pour les paramètres qui sont un objet unique
      enqueueSyncItem('settings', 'update', value as any);
    }
  } catch (err) {
    console.error('Erreur lors du calcul du diff pour la synchronisation', err);
  }

  localStorage.setItem(scopeStorageKey(key), JSON.stringify(value));
};

export const clearAllData = () => {
  localStorage.clear();
  window.location.reload();
};

export const exportAllData = () => {
  const allData = {
    products: getStoreData(STORAGE_KEYS.PRODUCTS, []),
    clients: getStoreData(STORAGE_KEYS.CLIENTS, []),
    sales: getStoreData(STORAGE_KEYS.SALES, []),
    settings: getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
    movements: getStoreData(STORAGE_KEYS.MOVEMENTS, []),
    recentPayments: getStoreData(STORAGE_KEYS.RECENT_PAYMENTS, []),
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };

  const dataStr = JSON.stringify(allData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `casierdor-backup-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return allData;
};

export const generateSaleNumber = (sales: Sale[]) => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const count = sales.filter(s => {
    const sDate = new Date(s.date).toISOString().slice(0, 10).replace(/-/g, '');
    return sDate === dateStr;
  }).length + 1;
  return `DEP-${dateStr}-${count.toString().padStart(4, '0')}`;
};

export const initializeStore = () => {
  ensureInstallationSecret();
  const has = (key: string) => localStorage.getItem(scopeStorageKey(key)) != null;
  if (!has(STORAGE_KEYS.PRODUCTS)) {
    setStoreData(STORAGE_KEYS.PRODUCTS, []);
  }
  if (!has(STORAGE_KEYS.CLIENTS)) {
    setStoreData(STORAGE_KEYS.CLIENTS, []);
  }
  if (!has(STORAGE_KEYS.SETTINGS)) {
    setStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }
  if (!has(STORAGE_KEYS.MOVEMENTS)) {
    setStoreData(STORAGE_KEYS.MOVEMENTS, []);
  }
  if (!has(STORAGE_KEYS.RECYCLE_BIN)) {
    setStoreData(STORAGE_KEYS.RECYCLE_BIN, []);
  }
  if (!has(STORAGE_KEYS.ACTIVITIES)) {
    setStoreData(STORAGE_KEYS.ACTIVITIES, []);
  }
  if (!has(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS)) {
    setStoreData(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS, []);
  }
  if (!has(STORAGE_KEYS.REPLENISHMENT_ORDERS)) {
    setStoreData(STORAGE_KEYS.REPLENISHMENT_ORDERS, []);
  }
  void runSecurityMigration();
};

/**
 * Enregistrer une activité système
 */
export const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
  const activities = getStoreData<Activity[]>(STORAGE_KEYS.ACTIVITIES, []);
  const newActivity: Activity = {
    ...activity,
    id: crypto.randomUUID(),
    timestamp: Date.now()
  };

  // Limiter à 500 activités pour la performance mobile
  const updated = [newActivity, ...activities].slice(0, 500);
  setStoreData(STORAGE_KEYS.ACTIVITIES, updated);
};

/**
 * Déplacer un élément vers la corbeille
 */
export const moveToTrash = (item: any, module: TrashItem['module']) => {
  const trash = getStoreData<TrashItem[]>(STORAGE_KEYS.RECYCLE_BIN, []);
  const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  const expiresAt = Date.now() + (settings.trashRetentionDays * 24 * 60 * 60 * 1000);

  const newItem: TrashItem = {
    id: crypto.randomUUID(),
    originalId: item.id,
    module,
    data: { ...item, active: false, deletedAt: Date.now() },
    deletedAt: Date.now(),
    expiresAt,
    originalPath: module.toLowerCase()
  };

  setStoreData(STORAGE_KEYS.RECYCLE_BIN, [newItem, ...trash]);

  // Enregistrer l'activité
  addActivity({
    userName: getActivityUserName(settings),
    userRole: settings.userRole,
    action: LogAction.DELETE,
    details: `Suppression de ${module}: ${item.name || item.saleNumber || item.id}`,
    module: module
  });
};

/**
 * Restaurer un élément de la corbeille
 */
export const restoreFromTrash = (trashId: string): { success: boolean, error?: string } => {
  const trash = getStoreData<TrashItem[]>(STORAGE_KEYS.RECYCLE_BIN, []);
  const itemToRestore = trash.find(t => t.id === trashId);

  if (!itemToRestore) return { success: false, error: 'Élément introuvable' };

  const storageKeyMap: Record<string, string> = {
    'PRODUCT': STORAGE_KEYS.PRODUCTS,
    'CLIENT': STORAGE_KEYS.CLIENTS,
    'SALE': STORAGE_KEYS.SALES,
    'USER': STORAGE_KEYS.USERS,
    'ARCHIVE': STORAGE_KEYS.ARCHIVES
  };

  const key = storageKeyMap[itemToRestore.module];
  const currentData = getStoreData<any[]>(key, []);

  // Gestion des doublons (Conflits de noms ou SKU)
  let restoredData = { ...itemToRestore.data, active: true, deletedAt: undefined, updatedAt: Date.now() };
  const nameField = itemToRestore.module === 'SALE' ? 'saleNumber' : 'name';

  let conflictCount = 0;
  let finalName = restoredData[nameField];

  const checkConflict = (name: string) => currentData.some(d => d[nameField] === name);

  while (checkConflict(finalName)) {
    conflictCount++;
    finalName = `${restoredData[nameField]} (${conflictCount})`;
  }

  restoredData[nameField] = finalName;

  // Enregistrer
  setStoreData(key, [restoredData, ...currentData]);
  setStoreData(STORAGE_KEYS.RECYCLE_BIN, trash.filter(t => t.id !== trashId));

  // Log
  const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  addActivity({
    userName: getActivityUserName(settings),
    userRole: settings.userRole,
    action: LogAction.RESTORE,
    details: `Restauration de ${itemToRestore.module}: ${finalName}`,
    module: itemToRestore.module
  });

  return { success: true };
};
