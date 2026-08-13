
import {
  User,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  AuthResponse,
  UserRole,
  LogAction,
  Permission,
  AuthState,
  ConnectionMode,
  DeviceType,
  UpdateProfileData,
  DEFAULT_USER_PREFERENCES,
  AUTH_STORAGE_KEYS,
  AUTH_ERROR_MESSAGES,
  AUTH_SUCCESS_MESSAGES,
  AUTH_VALIDATION_RULES
} from '../types';
import { hashPassword, verifyPassword, upgradePasswordHashIfLegacy } from './cryptoVault';
import { activateStorageForUser, clearActiveStorageScope } from './accountStorage';
import { supabase } from './supabaseClient';

type SupabaseUserRow = {
  id: string;
  tenantId: string;
  email: string;
  passwordHash?: string;
  role?: string;
  displayName?: string | null;
  storageAccountId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

function isSupabaseConfigured(): boolean {
  const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
  const supabaseAnonKey =
    (import.meta as any).env.VITE_SUPABASE_ANON_KEY ||
    (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function mapSupabaseUserRow(sbUser: SupabaseUserRow, passwordHash = ''): User {
  const displayName = sbUser.displayName || sbUser.email;
  const nameParts = displayName.split(' ');

  return {
    id: sbUser.id,
    storageAccountId: sbUser.storageAccountId || sbUser.id,
    tenantId: sbUser.tenantId,
    uniqueId: `USR-${sbUser.id.slice(-4)}`,
    name: displayName,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    email: sbUser.email,
    password: passwordHash,
    role: (sbUser.role as UserRole) || UserRole.STAFF,
    active: true,
    permissions:
      sbUser.role === UserRole.ADMIN
        ? Object.values(Permission)
        : [Permission.VIEW_DASHBOARD, Permission.VIEW_SALES],
    isOnline: true,
    createdAt: new Date(sbUser.createdAt || Date.now()).getTime(),
    updatedAt: new Date(sbUser.updatedAt || Date.now()).getTime(),
    preferences: { ...DEFAULT_USER_PREFERENCES },
    displayName,
  };
}

async function fetchSupabaseUserProfile(userId: string): Promise<SupabaseUserRow | null> {
  const { data, error } = await supabase
    .from('User')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as SupabaseUserRow;
}

// Simuler une base de données locale (en production, utiliser une vraie BDD)
class LocalDatabase {
  private static instance: LocalDatabase;
  private users: User[] = [];
  private passwordResetTokens: Map<string, { email: string; expires: number }> = new Map();

  static getInstance(): LocalDatabase {
    if (!LocalDatabase.instance) {
      LocalDatabase.instance = new LocalDatabase();
    }
    return LocalDatabase.instance;
  }

  // Initialiser avec des données de test
  public async initializeTestData(force: boolean = false) {
    this.loadFromLocalStorage();
    if (force || this.users.length === 0) {
      const adminPassword = await hashPassword('admin123');

      const adminUser: User = {
        id: 'admin-1',
        storageAccountId: 'admin-1',
        uniqueId: 'ADM-001',
        name: 'Super Admin',
        firstName: 'Super',
        lastName: 'Admin',
        email: 'admin@casierdor.app',
        password: adminPassword,
        role: UserRole.ADMIN,
        active: true,
        permissions: Object.values(Permission),
        isOnline: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        preferences: { ...DEFAULT_USER_PREFERENCES }
      };

      // Si force, supprimer les comptes existants avec cet email pour éviter les doublons
      if (force) {
        this.users = this.users.filter(u => u.email !== adminUser.email);
      }

      this.users.push(adminUser);
      this.saveToLocalStorage();
    }
  }

  // Méthode publique pour synchroniser les comptes de test
  public syncTestAccounts() {
    void this.initializeTestData(true);
  }

  public async hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }

  public async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return verifyPassword(password, hashedPassword);
  }

  // Sauvegarder dans localStorage
  private saveToLocalStorage() {
    try {
      localStorage.setItem('casierdor_users', JSON.stringify(this.users));
    } catch (error) {
      console.error('Erreur sauvegarde utilisateurs:', error);
    }
  }

  // Charger depuis localStorage
  private loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('casierdor_users');
      if (stored) {
        this.users = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  }

  findUserByEmail(email: string): User | null {
    this.loadFromLocalStorage();
    const normalized = email.toLowerCase().trim();
    return this.users.find(user => user.email.toLowerCase().trim() === normalized) || null;
  }

  // Trouver un utilisateur par ID
  findUserById(id: string): User | null {
    this.loadFromLocalStorage();
    return this.users.find(user => user.id === id) || null;
  }

  // Créer un nouvel utilisateur
  async createUser(userData: RegisterData): Promise<User> {
    this.loadFromLocalStorage();

    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id: userId,
      storageAccountId: userId,
      uniqueId: `USR-${Date.now().toString().slice(-4)}`,
      name: `${userData.firstName.trim()} ${userData.lastName.trim()}`,
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone?.trim(),
      enterpriseType: userData.enterpriseType,
      activityType: userData.activityType,
      password: await this.hashPassword(userData.password),
      displayName: `${userData.firstName.trim()} ${userData.lastName.trim()}`.trim(),
      avatar: userData.avatar,
      recoveryEmail: userData.recoveryEmail?.trim() || undefined,
      companyName: userData.companyName,
      companyLogo: userData.logo,
      role: UserRole.ADMIN, // Par défaut le premier inscrit est admin
      active: true,
      permissions: Object.values(Permission),
      isOnline: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      preferences: { ...DEFAULT_USER_PREFERENCES }
    };

    this.users.push(newUser);
    this.saveToLocalStorage();
    return newUser;
  }

  // Mettre à jour un utilisateur
  updateUser(id: string, updates: Partial<User>): User | null {
    this.loadFromLocalStorage();
    const userIndex = this.users.findIndex(user => user.id === id);

    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: Date.now()
    };

    this.saveToLocalStorage();
    return this.users[userIndex];
  }

  saveUser(user: User): User {
    this.loadFromLocalStorage();
    const userIndex = this.users.findIndex(
      (existing) => existing.email.toLowerCase() === user.email.toLowerCase()
    );

    if (userIndex === -1) {
      this.users.push(user);
    } else {
      this.users[userIndex] = {
        ...this.users[userIndex],
        ...user,
        updatedAt: Date.now(),
      };
    }

    this.saveToLocalStorage();
    return userIndex === -1 ? user : this.users[userIndex];
  }

  // Supprimer un utilisateur
  deleteUser(id: string): boolean {
    this.loadFromLocalStorage();
    const userIndex = this.users.findIndex(user => user.id === id);

    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    this.saveToLocalStorage();
    return true;
  }

  // Désactiver/Activer un compte par son email
  setAccountStatus(email: string, active: boolean): boolean {
    this.loadFromLocalStorage();
    const userIndex = this.users.findIndex(user => user.email.toLowerCase() === email.toLowerCase());

    if (userIndex === -1) return false;

    this.users[userIndex] = {
      ...this.users[userIndex],
      active: active,
      updatedAt: Date.now()
    };

    this.saveToLocalStorage();
    return true;
  }

  // Générer un token de réinitialisation
  generateResetToken(email: string): string {
    const token = Math.random().toString(36).substr(2) + Math.random().toString(36).substr(2);
    const expires = Date.now() + 3600000; // 1 heure

    this.passwordResetTokens.set(token, { email, expires });
    return token;
  }

  // Vérifier un token de réinitialisation
  verifyResetToken(token: string): string | null {
    const tokenData = this.passwordResetTokens.get(token);

    if (!tokenData || tokenData.expires < Date.now()) {
      this.passwordResetTokens.delete(token);
      return null;
    }

    return tokenData.email;
  }

  // Nettoyer les tokens expirés
  cleanupExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.passwordResetTokens.entries()) {
      if (data.expires < now) {
        this.passwordResetTokens.delete(token);
      }
    }
  }
}

// Service d'authentification principal
export class AuthService {
  private db: LocalDatabase;
  private currentUser: User | null = null;

  constructor() {
    this.db = LocalDatabase.getInstance();
    void this.db.initializeTestData();
    this.loadCurrentUser();
  }

  // Charger l'utilisateur courant depuis localStorage
  private loadCurrentUser() {
    try {
      const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER);
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur courant:', error);
    }
  }

  // Sauvegarder l'utilisateur courant
  private saveCurrentUser(user: User | null) {
    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user));
        this.currentUser = user;
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER);
        localStorage.removeItem(AUTH_STORAGE_KEYS.TOKEN);
        this.currentUser = null;
      }
    } catch (error) {
      console.error('Erreur sauvegarde utilisateur courant:', error);
    }
  }

  // Validation des données d'inscription
  private validateRegisterData(data: RegisterData): string[] {
    const errors: string[] = [];

    if (data.firstName.length < AUTH_VALIDATION_RULES.NAME_MIN_LENGTH) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    }

    if (data.firstName.length > AUTH_VALIDATION_RULES.NAME_MAX_LENGTH) {
      errors.push('Le prénom ne doit pas dépasser 50 caractères');
    }

    if (data.lastName.length < AUTH_VALIDATION_RULES.NAME_MIN_LENGTH) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if (data.lastName.length > AUTH_VALIDATION_RULES.NAME_MAX_LENGTH) {
      errors.push('Le nom ne doit pas dépasser 50 caractères');
    }

    if (data.password.length < AUTH_VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      errors.push('Le mot de passe doit contenir au moins 8 caractères');
    }

    if (data.password.length > AUTH_VALIDATION_RULES.PASSWORD_MAX_LENGTH) {
      errors.push('Le mot de passe ne doit pas dépasser 128 caractères');
    }

    if (data.password !== data.confirmPassword) {
      errors.push('Les mots de passe ne correspondent pas');
    }

    if (!data.acceptTerms) {
      errors.push('AUTH_ERROR_TERMS');
    }

    if (!data.companyName?.trim()) {
      errors.push('AUTH_ERROR_COMPANY');
    }

    if (data.enterpriseType === 'other' && !data.customEnterpriseType?.trim()) {
      errors.push('AUTH_ERROR_CUSTOM_ENTERPRISE');
    }

    if (data.activityType === 'other' && !data.customActivityType?.trim()) {
      errors.push('AUTH_ERROR_CUSTOM_ACTIVITY');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('L\'adresse email n\'est pas valide');
    }

    return errors;
  }

  // Connexion
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      let user: User | null = null;
      let authenticatedViaSupabase = false;

      if (isSupabaseConfigured()) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
        });

        if (authError || !authData.user) {
          return {
            success: false,
            message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
            error: authError?.message
          };
        }

        const sbUser = await fetchSupabaseUserProfile(authData.user.id);
        const meta = authData.user.user_metadata || {};
        
        if (sbUser) {
          user = mapSupabaseUserRow(sbUser);
        } else {
          // Reconstruire à partir des métadonnées Supabase si pas de ligne dans la table 'User'
          const displayName = `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || authData.user.email || 'Utilisateur';
          user = {
            id: authData.user.id,
            storageAccountId: authData.user.id,
            uniqueId: `USR-${authData.user.id.slice(-4)}`,
            name: displayName,
            firstName: meta.first_name || '',
            lastName: meta.last_name || '',
            email: authData.user.email || '',
            role: meta.role || UserRole.ADMIN,
            active: true,
            permissions: Object.values(Permission),
            isOnline: true,
            createdAt: new Date(authData.user.created_at || Date.now()).getTime(),
            updatedAt: Date.now(),
            preferences: { ...DEFAULT_USER_PREFERENCES },
            displayName,
          };
        }

        // Récupérer les métadonnées riches de Supabase
        user = {
          ...user,
          companyName: meta.company_name || user.companyName,
          enterpriseType: meta.enterprise_type || user.enterpriseType,
          activityType: meta.activity_type || user.activityType,
          avatar: meta.avatar || user.avatar,
          companyLogo: meta.logo || user.companyLogo,
          phone: meta.phone || user.phone,
          recoveryEmail: meta.recovery_email || user.recoveryEmail,
        };

        authenticatedViaSupabase = true;
      } else {
        user = this.db.findUserByEmail(credentials.email);
      }

      if (!user) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.USER_NOT_FOUND
        };
      }

      if (!user.active) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.ACCOUNT_LOCKED
        };
      }

      if (!authenticatedViaSupabase && user.password) {
        const valid = await this.db.verifyPassword(credentials.password, user.password);
        if (!valid) {
          return {
            success: false,
            message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
          };
        }
        const upgraded = await upgradePasswordHashIfLegacy(credentials.password, user.password);
        if (upgraded) {
          this.db.updateUser(user.id, { password: upgraded });
        }
      }

      const localUser = this.db.findUserByEmail(user.email);
      const updatedUser = localUser
        ? this.db.updateUser(localUser.id, { lastLogin: Date.now() })
        : this.db.saveUser({ ...user, lastLogin: Date.now() });

      if (!updatedUser) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.NETWORK_ERROR
        };
      }

      this.saveCurrentUser(updatedUser);
      activateStorageForUser(updatedUser);

      // Sauvegarder le remember me et l'état de l'authentification sécurisée
      if (credentials.rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEYS.REMEMBER_ME, 'true');
        localStorage.setItem('casierdor_secure_auth', 'true');
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEYS.REMEMBER_ME);
      }

      return {
        success: true,
        user: updatedUser,
        message: AUTH_SUCCESS_MESSAGES.LOGIN_SUCCESS
      };

    } catch (error) {
      return {
        success: false,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Inscription
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Validation
      const validationErrors = this.validateRegisterData(data);
      if (validationErrors.length > 0) {
        return {
          success: false,
          message: validationErrors.join(', ')
        };
      }

      let newUser: User | null = null;

      if (isSupabaseConfigured()) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email.toLowerCase().trim(),
          password: data.password,
          options: {
            data: {
              first_name: data.firstName.trim(),
              last_name: data.lastName.trim(),
              company_name: data.companyName || 'Établissement',
              role: UserRole.ADMIN,
              enterprise_type: data.enterpriseType,
              activity_type: data.activityType,
              custom_enterprise_type: data.customEnterpriseType,
              custom_activity_type: data.customActivityType,
              phone: data.phone,
              public_phones: data.publicPhones,
              public_email: data.publicEmail,
              recovery_email: data.recoveryEmail,
              avatar: data.avatar,
              logo: data.logo,
            },
          },
        });

        if (signUpError || !signUpData.user) {
          return {
            success: false,
            message: signUpError?.message || 'Erreur lors de l\'inscription',
          };
        }

        const sbUser = await fetchSupabaseUserProfile(signUpData.user.id);
        if (sbUser) {
          newUser = mapSupabaseUserRow(sbUser);
        } else {
          const displayName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();
          newUser = {
            id: signUpData.user.id,
            storageAccountId: signUpData.user.id,
            uniqueId: `USR-${signUpData.user.id.slice(-4)}`,
            name: displayName,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: signUpData.user.email || data.email.toLowerCase().trim(),
            displayName,
            companyName: data.companyName,
            enterpriseType: data.enterpriseType,
            activityType: data.activityType,
            avatar: data.avatar,
            companyLogo: data.logo,
            phone: data.phone,
            recoveryEmail: data.recoveryEmail,
            role: UserRole.ADMIN,
            active: true,
            permissions: Object.values(Permission),
            isOnline: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            preferences: { ...DEFAULT_USER_PREFERENCES },
          };
        }
      } else {
        // Mode développement local pur sans Supabase
        const existingUser = this.db.findUserByEmail(data.email);
        if (existingUser) {
          return {
            success: false,
            message: AUTH_ERROR_MESSAGES.EMAIL_EXISTS
          };
        }
        newUser = await this.db.createUser(data);
      }

      this.saveCurrentUser(newUser);
      activateStorageForUser(newUser);

      return {
        success: true,
        user: newUser,
        message: AUTH_SUCCESS_MESSAGES.REGISTER_SUCCESS
      };

    } catch (error) {
      return {
        success: false,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Déconnexion
  async logout(): Promise<AuthResponse> {
    try {
      if (isSupabaseConfigured()) {
        await supabase.auth.signOut();
      }

      this.saveCurrentUser(null);
      clearActiveStorageScope();

      return {
        success: true,
        message: AUTH_SUCCESS_MESSAGES.LOGOUT_SUCCESS
      };

    } catch (error) {
      return {
        success: false,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Mot de passe oublié
  async forgotPassword(data: ForgotPasswordData): Promise<AuthResponse> {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase.auth.resetPasswordForEmail(data.email.toLowerCase().trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) {
          console.error('[AuthService] Supabase reset password error:', error);
        }
      }

      const user = this.db.findUserByEmail(data.email);

      if (!user) {
        return {
          success: true,
          message: AUTH_SUCCESS_MESSAGES.PASSWORD_RESET_SENT
        };
      }

      const token = this.db.generateResetToken(data.email);
      console.log(`Token de réinitialisation pour ${data.email}: ${token}`);

      return {
        success: true,
        message: AUTH_SUCCESS_MESSAGES.PASSWORD_RESET_SENT
      };

    } catch (error) {
      return {
        success: false,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Réinitialiser le mot de passe
  async resetPassword(data: ResetPasswordData): Promise<AuthResponse> {
    try {
      const email = this.db.verifyResetToken(data.token);

      if (!email) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.INVALID_TOKEN
        };
      }

      if (data.password.length < AUTH_VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.WEAK_PASSWORD
        };
      }

      if (data.password !== data.confirmPassword) {
        return {
          success: false,
          message: 'Les mots de passe ne correspondent pas'
        };
      }

      const user = this.db.findUserByEmail(email);
      if (!user) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.USER_NOT_FOUND
        };
      }

      const updatedUser = this.db.updateUser(user.id, {
        password: await this.db.hashPassword(data.password),
      });

      if (!updatedUser) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.NETWORK_ERROR
        };
      }

      return {
        success: true,
        message: AUTH_SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS
      };

    } catch (error) {
      return {
        success: false,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Mettre à jour le profil
  async updateProfile(userId: string, data: UpdateProfileData): Promise<AuthResponse> {
    try {
      const { preferences, ...otherData } = data;

      const updateData: Partial<User> = {
        ...otherData,
        updatedAt: Date.now()
      };

      if (preferences) {
        const currentUser = this.db.findUserById(userId);
        if (currentUser) {
          updateData.preferences = {
            ...currentUser.preferences,
            ...preferences
          };
        }
      }

      const updatedUser = this.db.updateUser(userId, updateData);

      if (!updatedUser) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.USER_NOT_FOUND
        };
      }

      this.saveCurrentUser(updatedUser);

      return {
        success: true,
        user: updatedUser,
        message: AUTH_SUCCESS_MESSAGES.PROFILE_UPDATED
      };

    } catch (error) {
      return {
        success: false,
        message: AUTH_ERROR_MESSAGES.NETWORK_ERROR,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // Obtenir l'utilisateur courant
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  // Vérifier si l'utilisateur est authentifié
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentUser.active;
  }

  // Vérifier si l'utilisateur a un rôle spécifique
  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role;
  }

  // Vérifier si l'utilisateur est admin
  isAdmin(): boolean {
    return this.currentUser?.role === UserRole.ADMIN;
  }

  // Obtenir tous les utilisateurs (admin seulement)
  async getAllUsers(): Promise<User[]> {
    if (!this.isAdmin()) {
      return [];
    }
    this.db['loadFromLocalStorage']();
    return (this.db as any).users || [];
  }

  // Méthode publique pour synchroniser les comptes de test
  public syncTestAccounts() {
    this.db.syncTestAccounts();
  }

  // Activer/Désactiver les comptes par défaut (admin seulement)
  async setSystemAccountStatus(email: string, active: boolean): Promise<boolean> {
    if (!this.isAdmin()) return false;

    const success = this.db.setAccountStatus(email, active);

    if (success && !active && this.currentUser?.email === email) {
      await this.logout();
    }

    return success;
  }

  // Vérifier si l'authentification sécurisée est forcée par l'utilisateur
  isSecureAuthForced(): boolean {
    return localStorage.getItem('casierdor_secure_auth_forced') === 'true';
  }

  setSecureAuthForced(forced: boolean) {
    if (forced) {
      localStorage.setItem('casierdor_secure_auth_forced', 'true');
    } else {
      localStorage.removeItem('casierdor_secure_auth_forced');
    }
  }

  /** Mise à jour du mot de passe après validation clé de récupération */
  async updatePasswordByEmail(email: string, newPassword: string): Promise<boolean> {
    const user = this.db.findUserByEmail(email);
    if (!user) return false;
    if (newPassword.length < AUTH_VALIDATION_RULES.PASSWORD_MIN_LENGTH) return false;
    const hashed = await this.db.hashPassword(newPassword);
    const updated = this.db.updateUser(user.id, { password: hashed });
    return updated !== null;
  }

  /** Premier administrateur actif (pour flux recovery sans email explicite) */
  findPrimaryAdmin(): User | null {
    this.db['loadFromLocalStorage']();
    const users: User[] = (this.db as any).users || [];
    return users.find((u) => u.role === UserRole.ADMIN && u.active !== false) || users[0] || null;
  }
}

// Instance singleton du service
export const authService = new AuthService();
