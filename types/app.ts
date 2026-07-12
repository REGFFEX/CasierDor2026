// Common application-wide types used across pages/components

export enum ProductType {
  BEVERAGE = 'beverage',
  CRATE = 'crate',
  ACCESSORY = 'accessory',
  OTHER = 'other'
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  image?: string;
  price: number;
  cost?: number;
  stock: number;
  type?: ProductType | string;
  unit?: string;
  criticalThreshold?: number;
  active?: boolean;
  createdAt?: number;
  updatedAt?: number;
  purchasePrice?: number;
}

export enum SaleStatus {
  DRAFT = 'draft',
  VALIDATED = 'validated',
  CANCELED = 'canceled'
}

export interface SaleLine {
  id?: string;
  productId: string;
  productName: string;
  quantity: number;
  qty?: number;
  unitPrice: number;
  total: number;
  lineTotal?: number;
}

export interface Sale {
  id: string;
  saleNumber?: string;
  date: number;
  clientName?: string;
  clientId?: string;
  lines: SaleLine[];
  total: number;
  status: SaleStatus;
  paymentMethod?: string;
  paymentDetails?: PaymentDetails | Record<string, any> | null;
  isSynced?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer'
}

export enum TransactionCategory {
  SALES = 'sales',
  PURCHASE = 'purchase',
  SALARY = 'salary',
  OTHER = 'other'
}

export interface AccountingTransaction {
  id: string;
  date: number;
  amount: number;
  type: TransactionType;
  category?: TransactionCategory | string;
  description?: string;
  referenceId?: string;
  createdAt?: number;
}

export enum ReplenishmentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  CANCELLED = 'cancelled'
}

export interface ReplenishmentOrder {
  id?: string;
  orderNumber?: string;
  date?: number;
  supplier?: string;
  items?: any[];
  status?: ReplenishmentStatus;
  totalAmount?: number;
  updatedAt?: number;
  createdAt?: number;
}


export enum LogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  IMPORT = 'import',
  EXPORT = 'export',
  RESTORE = 'restore'
  ,REPLENISHMENT = 'replenishment',
  SALE = 'sale',
  STOCK_ADJUST = 'stock_adjust',
  ACCOUNTING_RECORD = 'accounting_record'
}

export enum Permission {
  READ = 'read',
  WRITE = 'write',
  MANAGE_USERS = 'manage_users',
  MANAGE_PRODUCTS = 'manage_products',
  VIEW_REPORTS = 'view_reports',
  VIEW_DASHBOARD = 'view_dashboard',
  VIEW_SALES = 'view_sales',
  CREATE_SALE = 'create_sale',
  VIEW_STOCK = 'view_stock',
  MANAGE_STOCK = 'manage_stock',
  VIEW_CLIENTS = 'view_clients',
  MANAGE_CLIENTS = 'manage_clients',
  EXPORT_DATA = 'export_data',
  MANAGE_PERMISSIONS = 'manage_permissions',
  SYSTEM_CONFIG = 'system_config',
  MANAGE_COMPANY_SETTINGS = 'manage_company_settings'
}

export enum ClientType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  WHOLESALE = 'wholesale'
  ,SIMPLE_CLIENT = 'simple'
}

export enum ContactMethod {
  PHONE = 'phone',
  EMAIL = 'email',
  WHATSAPP = 'whatsapp'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  MOBILE = 'mobile',
  MOBILE_MONEY = 'mobile_money',
  CREDIT_CARD = 'credit_card',
  PAYPAL = 'paypal',
  BINANCE = 'binance',
  CRYPTO = 'crypto',
  OTHER = 'other'
}

export interface PaymentDetails {
  method?: PaymentMethod | string;
  reference?: string;
  paidAmount?: number;
  timestamp?: number;
  isSynced?: boolean;
  mobileMoney?: { operator?: string; phoneNumber?: string; reference?: string; amount?: number; currency?: string };
  creditCard?: { cardNumber?: string; holder?: string; transactionId?: string; cardholderName?: string; expiryDate?: string; cvv?: string; email?: string };
  paypal?: { email?: string; transactionId?: string };
  binance?: { binanceId?: string; email?: string; amount?: number; currency?: string };
  crypto?: { walletAddress?: string; cryptoType?: string; transactionId?: string; amount?: number };
}

export enum EnterpriseType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  ENTERPRISE = 'enterprise',
  OTHER = 'other',
}

export enum ActivityType {
  RETAIL = 'retail',
  WHOLESALE = 'wholesale',
  SERVICE = 'service',
  DEPOT = 'depot',
  OTHER = 'other',
}

/** Préférences optionnelles pour la clé de récupération */
export interface RecoverySecurityPrefs {
  /** Après import du fichier, ne pas pré-remplir — l'utilisateur doit retaper la clé */
  requireManualKeyAfterUpload?: boolean;
  /** Chiffrer le fichier .key avec un mot de passe supplémentaire */
  useKeyFilePassword?: boolean;
}

export interface StoreSettings {
  name?: string;
  businessType?: string;
  /** Email affiché aux clients (entreprise) */
  publicEmail?: string;
  /** Téléphone affiché aux clients (entreprise) — legacy, 1er numéro */
  publicPhone?: string;
  /** Jusqu'à 3 numéros publics entreprise */
  publicPhones?: string[];
  /** Libellé si activityType / enterpriseType = other */
  customActivityType?: string;
  customEnterpriseType?: string;
  /** Dossier racine archives / exports */
  storageRootPath?: string;
  storageRootLabel?: string;
  storageConfigured?: boolean;
  /** Nom du responsable affiché (créateur du compte) */
  responsibleDisplayName?: string;
  /** Photo du bâtiment / dépôt */
  buildingImage?: string;
  recoverySecurityPrefs?: RecoverySecurityPrefs;
  enableTestAccounts?: boolean;
  /** Modules désactivés (ids — voir utils/modules.ts) */
  disabledModules?: string[];
  /** Afficher les raccourcis modules récents sur le dashboard */
  showDashboardShortcuts?: boolean;
  /** Préférences confirmations (miroir localStorage casier_confirm_prefs) */
  confirmPreferences?: { globalDisabled?: boolean; neverAskAgain?: string[]; strictActions?: string[] };
  customProductTypes?: string[];
  loginAttempts?: Record<string, { count: number; lastAttempt: number; isLocked?: boolean }>;
  securityActive?: boolean;
  userRole?: string;
  phone?: string;
  email?: string;
  address?: string;
  enterpriseType?: EnterpriseType | string;
  logo?: string;
  logoFileName?: string;
  adminName?: string;
  staffName?: string;
  trashRetentionDays?: number;
  enableActivityLogging?: boolean;
  stockEnabled?: boolean;
  currency?: string;
  country?: string;
  language?: string;
  recoveryConfig?: RecoveryConfig;
  updatedAt?: number;
}

export interface EncryptionConfig {
  algorithm?: string;
  keyLength?: number;
  iterations?: number;
  enabled?: boolean;
  password?: string;
  salt?: string;
}

export interface RecoveryConfig {
  method?: 'key' | 'email' | 'both';
  /** @deprecated Ne plus stocker en clair — migré vers keyHash */
  key?: string;
  keyHash?: string;
  keySalt?: string;
  keyFingerprint?: string;
  keyVersion?: number;
  keyUsedAt?: number;
  contact?: string;
}

export interface Client {
  id: string;
  code?: string;
  name: string;
  phone?: string;
  type?: ClientType | string;
  contactMethod?: ContactMethod | string;
  note?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Activity {
  id: string;
  userName: string;
  userRole?: string;
  action: LogAction | string;
  details?: string;
  module?: string;
  timestamp: number;
}

export interface TrashItem {
  id: string;
  originalId: string;
  module: string;
  data: any;
  deletedAt: number;
  expiresAt: number;
  originalPath?: string;
}
