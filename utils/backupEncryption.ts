/**
 * Utilitaire pour intégrer le chiffrement aux imports/exports
 * Fournit des wrappers pour chiffrer/déchiffrer les données de sauvegarde
 */

import FileEncryptionManager from './fileEncryption';
import { EncryptionConfig } from '../types';

export interface EncryptedBackup {
  version: string;
  encrypted: boolean;
  data: string; // Données chiffrées en base64 ou JSON en clair
  algorithm?: string;
  salt?: string;
  timestamp: number;
}

/**
 * Chiffre les données de sauvegarde si configuration active
 * @param data Données JSON à chiffrer
 * @param config Configuration de chiffrement
 * @returns Données chiffrées ou originales selon config
 */
export const encryptBackupData = (
  data: string,
  config: EncryptionConfig | null
): EncryptedBackup => {
  const backup: EncryptedBackup = {
    version: '1.0',
    encrypted: false,
    data: data,
    timestamp: Date.now()
  };

  if (!config || !config.enabled || !config.password) {
    return backup;
  }

  try {
    // Chiffrer les données
    const encrypted = FileEncryptionManager.encryptAES(
      data,
      config.password
    );

    backup.encrypted = true;
    backup.data = encrypted;
    backup.algorithm = config.algorithm;
    backup.salt = config.salt;

    return backup;
  } catch (error) {
    console.error('Erreur chiffrement:', error);
    throw new Error('Impossible de chiffrer les données: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
  }
};

/**
 * Déchiffre les données de sauvegarde si nécessaire
 * @param backup Objet de sauvegarde
 * @param password Mot de passe de déchiffrement
 * @returns Données déchiffrées JSON string
 */
export const decryptBackupData = (
  backup: EncryptedBackup,
  password: string
): string => {
  if (!backup.encrypted) {
    return backup.data;
  }

  try {
    const decrypted = FileEncryptionManager.decryptAES(
      backup.data,
      password
    );

    return decrypted;
  } catch (error) {
    console.error('Erreur déchiffrement:', error);
    throw new Error('Impossible de déchiffrer: mot de passe incorrect ou données corrompues');
  }
};

/**
 * Identifie si une sauvegarde est chiffrée
 * @param data Contenu du fichier
 * @returns true si chiffrée
 */
export const isEncryptedBackup = (data: string): boolean => {
  try {
    const parsed = JSON.parse(data);
    return parsed.encrypted === true && parsed.version === '1.0';
  } catch {
    return false;
  }
};

/**
 * Wrapper pour exporter les données avec chiffrement optionnel
 * @param backupData Données de sauvegarde JSON string
 * @param encryptionConfig Configuration chiffrement
 * @returns Contenu du fichier à télécharger
 */
export const prepareExportData = (
  backupData: string,
  encryptionConfig: EncryptionConfig | null
): string => {
  const encrypted = encryptBackupData(backupData, encryptionConfig);
  return JSON.stringify(encrypted, null, 2);
};

/**
 * Wrapper pour importer les données avec déchiffrement automatique
 * @param fileContent Contenu du fichier importé
 * @param password Mot de passe si chiffré
 * @returns Données de sauvegarde JSON string
 */
export const prepareImportData = (
  fileContent: string,
  password?: string
): string => {
  try {
    const backup: EncryptedBackup = JSON.parse(fileContent);

    if (!backup.version || !('encrypted' in backup)) {
      // Format ancien ou non reconnu
      return fileContent;
    }

    if (backup.encrypted) {
      if (!password) {
        throw new Error('Ce fichier est chiffré, veuillez entrer le mot de passe');
      }
      return decryptBackupData(backup, password);
    }

    return backup.data;
  } catch (error) {
    // Si parse échoue, c'est un ancien format
    console.warn('Format ancien détecté, traitement comme JSON brut');
    return fileContent;
  }
};

/**
 * Valide un fichier de sauvegarde
 * @param fileContent Contenu du fichier
 * @returns Objet d'erreur ou null si valide
 */
export const validateBackupFile = (
  fileContent: string
): { valid: boolean; error?: string; encrypted?: boolean } => {
  try {
    // Essayer de parser comme backup chiffré
    const parsed = JSON.parse(fileContent);

    if (parsed.version && 'encrypted' in parsed && 'data' in parsed) {
      return {
        valid: true,
        encrypted: parsed.encrypted === true
      };
    }

    // Essayer de parser comme JSON valide
    const dataCheck = JSON.parse(fileContent);
    if (dataCheck && typeof dataCheck === 'object') {
      return {
        valid: true,
        encrypted: false
      };
    }

    return {
      valid: false,
      error: 'Format de fichier non reconnu'
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Fichier invalide ou corrompu: ' + (error instanceof Error ? error.message : 'Erreur parse')
    };
  }
};

/**
 * Génère un nom de fichier de sauvegarde
 * @param encrypted Si la sauvegarde est chiffrée
 * @returns Nom de fichier
 */
export const generateBackupFileName = (encrypted: boolean = false): string => {
  const date = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  const suffix = encrypted ? '-CHIFFREE' : '';
  return `SAUVEGARDE_CASIER_${date}${suffix}.json`;
};
