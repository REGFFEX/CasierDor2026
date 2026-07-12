// Types et interfaces pour le système d'authentification

import { Permission } from './app';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  STAFF = 'staff'
}

export enum ConnectionMode {
  ONLINE = 'online',
  OFFLINE = 'offline',
  AUTO = 'auto'
}

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet'
}

export interface User {
  id: string;
  /** Scope localStorage partagé (admin = id propre ; staff = id de l'admin) */
  storageAccountId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  displayName?: string;
  uniqueId?: string;
  comment?: string;
  email: string;
  /** Email de récupération (privé, distinct du login si besoin) */
  recoveryEmail?: string;
  phone?: string;
  password?: string; // Hashé (optionnel pour certains usages locaux)
  role: UserRole;
  avatar?: string;
  companyLogo?: string;
  companyName?: string;
  isActive?: boolean;
  active?: boolean;
  isOnline?: boolean;
  isEmailVerified?: boolean;
  enterpriseType?: string;
  activityType?: string;
  lastLogin?: number;
  createdAt: number;
  updatedAt: number;
  preferences?: UserPreferences;
  permissions?: Permission[];
}

export interface UserPreferences {
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
  connectionMode?: ConnectionMode;
  deviceType?: DeviceType;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  display?: {
    compactMode?: boolean;
    showAnimations?: boolean;
    fontSize?: 'small' | 'medium' | 'large';
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  connectionMode: ConnectionMode;
  deviceType: DeviceType;
  isOnline: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  currency?: string;
  enterpriseType?: string;
  activityType?: string;
  customActivityType?: string;
  customEnterpriseType?: string;
  password: string;
  confirmPassword: string;
  companyName?: string;
  /** Contact public entreprise (clients) */
  publicEmail?: string;
  publicPhone?: string;
  /** 2 à 3 numéros publics entreprise */
  publicPhones?: string[];
  /** Email de récupération (optionnel, ne doit pas être trivial) */
  recoveryEmail?: string;
  avatar?: string;
  logo?: string;
  buildingImage?: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  phone?: string;
  avatar?: string;
  companyLogo?: string;
  companyName?: string;
  recoveryEmail?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message: string;
  error?: string;
}

// Configuration par défaut
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: 'fr', // Détecté automatiquement selon le pays/navigateur
  theme: 'auto',
  connectionMode: ConnectionMode.AUTO,
  deviceType: DeviceType.DESKTOP, // Détecté automatiquement
  notifications: {
    email: true,
    push: true,
    sms: false
  },
  display: {
    compactMode: false,
    showAnimations: true,
    fontSize: 'medium'
  }
};

// Messages d'erreur traduisibles
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'auth.errors.invalid_credentials',
  USER_NOT_FOUND: 'auth.errors.user_not_found',
  EMAIL_EXISTS: 'auth.errors.email_exists',
  WEAK_PASSWORD: 'auth.errors.weak_password',
  INVALID_TOKEN: 'auth.errors.invalid_token',
  TOKEN_EXPIRED: 'auth.errors.token_expired',
  NETWORK_ERROR: 'auth.errors.network_error',
  OFFLINE_MODE: 'auth.errors.offline_mode',
  PERMISSION_DENIED: 'auth.errors.permission_denied',
  ACCOUNT_LOCKED: 'auth.errors.account_locked',
  EMAIL_NOT_VERIFIED: 'auth.errors.email_not_verified'
};

// Messages de succès traduisibles
export const AUTH_SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'auth.success.login',
  REGISTER_SUCCESS: 'auth.success.register',
  LOGOUT_SUCCESS: 'auth.success.logout',
  PASSWORD_RESET_SENT: 'auth.success.password_reset_sent',
  PASSWORD_RESET_SUCCESS: 'auth.success.password_reset_success',
  PROFILE_UPDATED: 'auth.success.profile_updated',
  EMAIL_VERIFIED: 'auth.success.email_verified'
};

// Validation des données
export const AUTH_VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  EMAIL_MAX_LENGTH: 255,
  PHONE_MAX_LENGTH: 20,
  COMPANY_NAME_MAX_LENGTH: 100
};

// Clés de stockage local
export const AUTH_STORAGE_KEYS = {
  USER: 'auth_user',
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  PREFERENCES: 'user_preferences',
  CONNECTION_MODE: 'connection_mode',
  DEVICE_TYPE: 'device_type',
  LAST_LOGIN: 'last_login',
  REMEMBER_ME: 'remember_me'
};
