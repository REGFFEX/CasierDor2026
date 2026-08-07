import { Filesystem, Directory } from '@capacitor/filesystem';
import { PlatformService } from './PlatformService';

export class CapacitorPlatformAdapter implements PlatformService {
  async saveBlob(blob: Blob, filename: string): Promise<void> {
    try {
      // Convert Blob to Base64
      const base64Data = await this.blobToBase64(blob);
      
      // Save file to the Documents directory
      await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Documents,
      });

      console.log(`File saved natively to Documents/${filename}`);
    } catch (e) {
      console.error('Erreur lors de la sauvegarde native', e);
      throw e;
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        // reader.result is a data URL (e.g. data:application/pdf;base64,JVBER...)
        // We only want the base64 part
        if (typeof reader.result === 'string') {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        } else {
          reject(new Error("Le résultat n'est pas une chaîne"));
        }
      };
      reader.readAsDataURL(blob);
    });
  }
}
