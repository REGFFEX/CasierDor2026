
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
      const userPassword = await hashPassword('user123');

      const adminUser: User = {
        id: 'admin-1',
        storageAccountId: 'admin-1',
        uniqueId: 'ADM-001',
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
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

      const testUser: User = {
        id: 'user-1',
        storageAccountId: 'user-1',
        uniqueId: 'USR-001',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        email: 'user@casierdor.app',
        password: userPassword,
        role: UserRole.STAFF,
        active: true,
        permissions: [Permission.VIEW_DASHBOARD, Permission.VIEW_SALES],
        isOnline: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        preferences: { ...DEFAULT_USER_PREFERENCES }
      };

      // Si force, supprimer les comptes existants avec ces emails pour éviter les doublons
      if (force) {
        this.users = this.users.filter(u => u.email !== adminUser.email && u.email !== testUser.email);
      }

      this.users.push(adminUser, testUser);
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

  // Trouver un utilisateur par email
  findUserByEmail(email: string): User | null {
    this.loadFromLocalStorage();
    return this.users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
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
      const user = this.db.findUserByEmail(credentials.email);

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

      if (user.password) {
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

      // Mettre à jour la dernière connexion
      const updatedUser = this.db.updateUser(user.id, {
        lastLogin: Date.now()
      });

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

      // Vérifier si l'email existe déjà
      const existingUser = this.db.findUserByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          message: AUTH_ERROR_MESSAGES.EMAIL_EXISTS
        };
      }

      // Créer l'utilisateur
      const newUser = await this.db.createUser(data);

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
