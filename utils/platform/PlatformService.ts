export interface PlatformService {
  /**
   * Sauvegarde un fichier sur le périphérique de l'utilisateur.
   * @param blob Le contenu du fichier
   * @param filename Le nom du fichier avec son extension
   */
  saveBlob(blob: Blob, filename: string): Promise<void>;
}
