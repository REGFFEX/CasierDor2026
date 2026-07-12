/**
 * Gestionnaire des utilisateurs et permissions
 */

import { User, UserRole, Permission } from '../types';

const USERS_STORAGE_KEY = 'app_users';

/**
 * Permissions par défaut pour chaque rôle
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_SALES,
    Permission.CREATE_SALE,
    Permission.VIEW_STOCK,
    Permission.MANAGE_STOCK,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    Permission.MANAGE_PERMISSIONS,
    Permission.SYSTEM_CONFIG,
    Permission.MANAGE_COMPANY_SETTINGS,
  ],
  [UserRole.STAFF]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_SALES,
    Permission.CREATE_SALE,
    Permission.VIEW_STOCK,
    Permission.VIEW_CLIENTS,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.MANAGER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_SALES,
    Permission.CREATE_SALE,
    Permission.VIEW_STOCK,
    Permission.MANAGE_STOCK,
    Permission.VIEW_CLIENTS,
    Permission.MANAGE_CLIENTS,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.USER]: [
    Permission.VIEW_DASHBOARD,
    Permission.VIEW_SALES
  ]
};

/**
 * Descriptions des permissions
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  [Permission.READ]: 'Lecture',
  [Permission.WRITE]: 'Écriture',
  [Permission.MANAGE_USERS]: 'Gérer les utilisateurs',
  [Permission.MANAGE_PRODUCTS]: 'Gérer les produits',
  [Permission.VIEW_DASHBOARD]: 'Voir le tableau de bord',
  [Permission.VIEW_SALES]: 'Consulter les ventes',
  [Permission.CREATE_SALE]: 'Créer des ventes',
  [Permission.VIEW_STOCK]: 'Consulter le stock',
  [Permission.MANAGE_STOCK]: 'Gérer le stock',
  [Permission.VIEW_CLIENTS]: 'Consulter les clients',
  [Permission.MANAGE_CLIENTS]: 'Gérer les clients',
  [Permission.VIEW_REPORTS]: 'Voir les rapports',
  [Permission.EXPORT_DATA]: 'Exporter les données',
  [Permission.MANAGE_PERMISSIONS]: 'Gérer les permissions',
  [Permission.SYSTEM_CONFIG]: 'Configuration système',
  [Permission.MANAGE_COMPANY_SETTINGS]: 'Gérer les infos de l\'entreprise',
};

/**
 * Récupérer tous les utilisateurs
 */
export const getAllUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Erreur lors de la lecture des utilisateurs:', error);
    return [];
  }
};

/**
 * Récupérer un utilisateur par ID
 */
export const getUserById = (id: string): User | undefined => {
  return getAllUsers().find(u => u.id === id);
};

/**
 * Ajouter un nouvel utilisateur
 */
export const addUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
  const newUser: User = {
    ...user,
    id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
  };

  const users = getAllUsers();
  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  return newUser;
};

/**
 * Mettre à jour un utilisateur
 */
export const updateUser = (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null => {
  const users = getAllUsers();
  const index = users.findIndex(u => u.id === id);

  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));

  return users[index];
};

/**
 * Supprimer un utilisateur
 */
export const deleteUser = (id: string): boolean => {
  const users = getAllUsers().filter(u => u.id !== id);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  return true;
};

/**
 * Activer/Désactiver un utilisateur
 */
export const toggleUserActive = (id: string): User | null => {
  const user = getUserById(id);
  if (!user) return null;

  return updateUser(id, { active: !user.active });
};

/**
 * Mettre à jour les permissions d'un utilisateur
 */
export const updateUserPermissions = (id: string, permissions: Permission[]): User | null => {
  return updateUser(id, { permissions });
};

/**
 * Vérifier si un utilisateur a une permission
 */
export const hasPermission = (user: User, permission: Permission): boolean => {
  return user.permissions.includes(permission);
};

/**
 * Obtenir les permissions par défaut pour un rôle
 */
export const getDefaultPermissionsForRole = (role: UserRole): Permission[] => {
  return DEFAULT_PERMISSIONS[role];
};

/**
 * Créer un utilisateur avec les permissions par défaut
 */
export const createUserWithDefaultPermissions = (userData: Omit<User, 'id' | 'createdAt' | 'permissions'>): User => {
  return addUser({
    ...userData,
    permissions: getDefaultPermissionsForRole(userData.role),
  });
};
