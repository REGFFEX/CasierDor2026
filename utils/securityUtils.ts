/**
 * Utilitaires de sécurité — façade de compatibilité
 * Nouvelle implémentation : cryptoVault.ts + recoveryKeyService.ts
 */

export {
  generateRecoveryKey,
  encryptDataLegacy as encryptData,
  decryptDataLegacy as decryptData,
} from './cryptoVault';

/**
 * Vérifie si un compte est verrouillé après trop de tentatives
 */
export const checkLockout = (
  email: string,
  loginAttempts: Record<string, { count: number; lastAttempt: number; isLocked?: boolean }>
): { isLocked: boolean; remainingMin: number } => {
  const attempt = loginAttempts[email];
  if (!attempt || !attempt.isLocked) return { isLocked: false, remainingMin: 0 };

  const LOCKOUT_DURATION = 15 * 60 * 1000;
  const now = Date.now();
  const timePassed = now - attempt.lastAttempt;

  if (timePassed >= LOCKOUT_DURATION) {
    return { isLocked: false, remainingMin: 0 };
  }

  const remainingMin = Math.ceil((LOCKOUT_DURATION - timePassed) / (60 * 1000));
  return { isLocked: true, remainingMin };
};
