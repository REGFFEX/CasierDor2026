import { ArchiveMetadata, DocumentType, FileFormat } from '../types/archive';
import { getStoreData, setStoreData, STORAGE_KEYS, addActivity, moveToTrash } from '../store';
import { LogAction } from '../types';

export class ArchiveService {
  /**
   * Retrieves all archives for the current scope
   */
  static getArchives(): ArchiveMetadata[] {
    // Note: STORAGE_KEYS.ARCHIVES should be added to store.ts
    return getStoreData<ArchiveMetadata[]>('casier_archives', []);
  }

  /**
   * Save a new archive record
   */
  static archiveDocument(
    userId: string,
    documentType: DocumentType,
    fileName: string,
    fileFormat: FileFormat,
    dataToStore: any,
    documentId?: string
  ): ArchiveMetadata {
    const archives = this.getArchives();
    
    const newArchive: ArchiveMetadata = {
      id: `ARC-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      userId,
      documentType,
      documentId,
      fileName,
      fileFormat,
      sizeBytes: JSON.stringify(dataToStore).length, // Rough estimate
      createdAt: Date.now(),
      updatedAt: Date.now(),
      archivedAt: Date.now(),
      createdBy: userId,
      isSynced: false
    };

    // Store the actual file data.
    // In a real system, this goes to FileStorage/S3/Supabase Storage.
    // For MVP offline functionality, we can store it in a separate indexedDB or localStorage key if small,
    // but here we just store the metadata and assume the data is either exported immediately or stored locally.
    
    // For demonstration of local persistence of the *content*, we could use localStorage if small enough:
    try {
      setStoreData(`casier_archive_data_${newArchive.id}`, dataToStore);
    } catch (e) {
      console.warn("Could not store archive data locally (quota exceeded).");
    }

    archives.push(newArchive);
    setStoreData('casier_archives', archives);

    try {
      addActivity({
        userName: userId,
        action: LogAction.CREATE,
        details: `Archivage du document : ${fileName}`,
        module: 'ARCHIVE'
      });
    } catch (e) {
      console.warn("Erreur log activité", e);
    }

    return newArchive;
  }

  /**
   * Delete an archive
   */
  static deleteArchive(archiveId: string, userName: string = 'Système'): void {
    const archives = this.getArchives();
    const archive = archives.find(a => a.id === archiveId);
    if (!archive) return;

    // Déplacer vers la corbeille au lieu de supprimer
    try {
      moveToTrash(archive, 'ARCHIVE' as any);
    } catch (e) {
      console.error("Erreur mise à la corbeille", e);
    }

    const updated = archives.filter(a => a.id !== archiveId);
    setStoreData('casier_archives', updated);
    
    // On garde les données en cache (dans le store ou dans la corbeille). 
    // Idéalement on les laisse pour que la corbeille puisse les restaurer.
    // localStorage.removeItem(`casier_archive_data_${archiveId}`);
  }

  /**
   * Retrieve the raw data of an archive
   */
  static getArchiveData(archiveId: string): any {
    return getStoreData(`casier_archive_data_${archiveId}`, null);
  }
}
