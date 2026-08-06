import { saveAs } from 'file-saver';
import { PlatformService } from './PlatformService';

export class WebPlatformAdapter implements PlatformService {
  async saveBlob(blob: Blob, filename: string): Promise<void> {
    // Utilise file-saver pour gérer le téléchargement standard sur le Web
    // (Cette API fonctionne également correctement dans le webview Tauri sur Desktop)
    saveAs(blob, filename);
    return Promise.resolve();
  }
}
