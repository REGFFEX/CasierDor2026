/** @deprecated Importer depuis recoveryKeyService */
export {
  generateRecoveryKey,
  validateRecoveryKeyChecksum,
  registerRecoveryKey,
  validateRecoveryKey,
  rotateRecoveryKey,
  saveRecoveryKeyFile,
  loadRecoveryKeyFromFile,
  getLastKeySaveHint,
  getUserDisplayName,
  runSecurityMigration,
  CRYPTO_CONSTANTS,
} from './recoveryKeyService';
