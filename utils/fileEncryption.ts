/**
 * 🔐 Gestionnaire de Chiffrement des Fichiers
 * Sécurise les imports/exports avec mot de passe et chiffrement
 */

import CryptoJS from 'crypto-js';

export interface EncryptionConfig {
  enabled: boolean;
  algorithm: 'AES' | 'DES' | 'SHA256';
  password: string;
  salt: string;
}

export class FileEncryptionManager {
  /**
   * Générer un salt aléatoire
   */
  static generateSalt(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < length; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  }

  /**
   * Chiffrer les données avec AES
   */
  static encryptAES(data: string, password: string): string {
    try {
      return CryptoJS.AES.encrypt(data, password).toString();
    } catch (error) {
      console.error('Erreur chiffrement AES:', error);
      throw new Error('Impossible de chiffrer les données');
    }
  }

  /**
   * Déchiffrer les données avec AES
   */
  static decryptAES(encryptedData: string, password: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, password);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Erreur déchiffrement AES:', error);
      throw new Error('Mot de passe incorrect ou données corrompues');
    }
  }

  /**
   * Chiffrer les données avec une clé dérivée
   */
  static deriveKey(password: string, salt: string): string {
    return CryptoJS.PBKDF2(password, salt, { keySize: 256 / 32 }).toString();
  }

  /**
   * Empaqueter et chiffrer les fichiers
   */
  static async packageAndEncrypt(
    data: Record<string, any>,
    config: EncryptionConfig
  ): Promise<string> {
    try {
      // Sérialiser les données
      const json = JSON.stringify(data);

      if (!config.enabled || !config.password) {
        // Sans chiffrement, retourner le JSON normal
        return json;
      }

      // Générer salt s'il n'existe pas
      const salt = config.salt || this.generateSalt();

      // Créer un paquet avec métadonnées
      const package_data = {
        version: '1.0',
        algorithm: config.algorithm,
        salt: salt,
        timestamp: new Date().toISOString(),
        encrypted: true,
        data: null as any
      };

      // Chiffrer selon l'algorithme
      switch (config.algorithm) {
        case 'AES':
          package_data.data = this.encryptAES(json, config.password);
          break;
        case 'DES':
          // Utiliser AES par défaut (DES est trop faible)
          package_data.data = this.encryptAES(json, config.password);
          break;
        case 'SHA256':
          // SHA256 est pour le hashing, utiliser AES avec dérivation
          const derivedKey = this.deriveKey(config.password, salt);
          package_data.data = this.encryptAES(json, derivedKey);
          break;
      }

      // Retourner le paquet en Base64
      return btoa(JSON.stringify(package_data));
    } catch (error) {
      console.error('Erreur empaquetage:', error);
      throw error;
    }
  }

  /**
   * Déchiffrer et dépaqueter les fichiers
   */
  static async decryptAndUnpackage(
    encryptedPackage: string,
    password: string
  ): Promise<Record<string, any>> {
    try {
      // Décoder le paquet
      const packageData = JSON.parse(atob(encryptedPackage));

      if (!packageData.encrypted) {
        // Pas chiffré, retourner directement
        return packageData.data || packageData;
      }

      // Déchiffrer selon l'algorithme
      let decryptedJson: string;

      switch (packageData.algorithm) {
        case 'AES':
          decryptedJson = this.decryptAES(packageData.data, password);
          break;
        case 'DES':
          decryptedJson = this.decryptAES(packageData.data, password);
          break;
        case 'SHA256':
          const derivedKey = this.deriveKey(password, packageData.salt);
          decryptedJson = this.decryptAES(packageData.data, derivedKey);
          break;
        default:
          throw new Error(`Algorithme non supporté: ${packageData.algorithm}`);
      }

      return JSON.parse(decryptedJson);
    } catch (error) {
      console.error('Erreur dépaquetage:', error);
      throw new Error('Impossible de déchiffrer le fichier');
    }
  }

  /**
   * Valider la force du mot de passe
   */
  static validatePasswordStrength(password: string): {
    score: number;
    level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Longueur
    if (password.length >= 8) score += 20;
    else feedback.push('security.passwordMinLength');

    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // Majuscules
    if (/[A-Z]/.test(password)) score += 15;
    else feedback.push('security.passwordUppercase');

    // Minuscules
    if (/[a-z]/.test(password)) score += 15;
    else feedback.push('security.passwordLowercase');

    // Chiffres
    if (/[0-9]/.test(password)) score += 15;
    else feedback.push('security.passwordNumber');

    // Caractères spéciaux
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;
    else feedback.push('security.passwordSpecial');

    let level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong' = 'weak';
    if (score <= 20) level = 'weak';
    else if (score <= 40) level = 'fair';
    else if (score <= 60) level = 'good';
    else if (score <= 80) level = 'strong';
    else level = 'very-strong';

    return { score, level, feedback };
  }
}

export default FileEncryptionManager;

