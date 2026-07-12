/**
 * Service de gestion des fichiers et permissions pour Web, Electron et Capacitor
 * Fonctionne en mode offline et online
 */

import { requestStoragePermission, PermissionStatus, checkInternetConnection } from './permissionManager';

// Détection de l'environnement
const isCapacitor = () => typeof (window as any).Capacitor !== 'undefined';
const isElectron = () => typeof (window as any).electron !== 'undefined';

/**
 * Dossiers système pour Casier d'Or
 */
export const SYSTEM_DIRS = {
  MAIN: 'CasierDor',
  DOWNLOADS: 'CasierDor/Downloads',
  BACKUPS: 'CasierDor/Backups',
  UPDATES: 'CasierDor/Updates'
};

/**
 * Initialise la structure des dossiers sur l'appareil (Capacitor/Android/iOS)
 */
export const initDirectoryStructure = async (): Promise<boolean> => {
  if (!isCapacitor()) return true;

  try {
    const Filesystem = (window as any).Capacitor.Plugins.Filesystem;
    const directory = (window as any).Capacitor.Plugins.Filesystem.Directory.Documents;

    // Créer les dossiers un par un (recursive: true gère les parents)
    const dirsToCreate = [SYSTEM_DIRS.DOWNLOADS, SYSTEM_DIRS.BACKUPS, SYSTEM_DIRS.UPDATES];

    for (const dir of dirsToCreate) {
      try {
        await Filesystem.mkdir({
          path: dir,
          directory,
          recursive: true
        });
      } catch (e) {
        // Le dossier existe déjà probablement, on continue
      }
    }
    return true;
  } catch (error) {
    console.error('Erreur initialisation dossiers:', error);
    return false;
  }
};

/**
 * Vérifie l'état des dossiers système
 */
export const checkDirectoryStatus = async (): Promise<Record<string, boolean>> => {
  if (!isCapacitor()) return { main: true };

  const Filesystem = (window as any).Capacitor.Plugins.Filesystem;
  const directory = (window as any).Capacitor.Plugins.Filesystem.Directory.Documents;
  const status: Record<string, boolean> = {};

  const dirsToCheck = {
    main: SYSTEM_DIRS.MAIN,
    downloads: SYSTEM_DIRS.DOWNLOADS,
    backups: SYSTEM_DIRS.BACKUPS,
    updates: SYSTEM_DIRS.UPDATES
  };

  for (const [key, path] of Object.entries(dirsToCheck)) {
    try {
      await Filesystem.readdir({ path, directory });
      status[key] = true;
    } catch (e) {
      status[key] = false;
    }
  }

  return status;
};

/**
 * Vérifie et demande les permissions nécessaires (Android)
 * Utilise maintenant le gestionnaire centralisé
 */
export const requestFilePermissions = async (): Promise<boolean> => {
  // Utiliser le gestionnaire centralisé
  const permResponse = await requestStoragePermission();
  return permResponse.status === PermissionStatus.GRANTED;
};

/**
 * Télécharge un fichier (fonctionne sur Web, Electron et Android)
 */
export const downloadFile = async (
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): Promise<void> => {
  try {
    // 1. Android/Capacitor
    if (isCapacitor()) {
      const Filesystem = (window as any).Capacitor.Plugins.Filesystem;
      const Share = (window as any).Capacitor.Plugins.Share;

      try {
        let base64String = '';
        if (content instanceof Blob) {
          base64String = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(content);
          });
        } else {
          base64String = btoa(unescape(encodeURIComponent(content)));
        }

        // Écrire dans le dossier dédié
        const path = `${SYSTEM_DIRS.DOWNLOADS}/${filename}`;
        await Filesystem.writeFile({
          path,
          data: base64String,
          directory: (window as any).Capacitor.Plugins.Filesystem.Directory.Documents,
          recursive: true
        });

        // Obtenir l'URI du fichier
        const file = await Filesystem.getUri({
          path,
          directory: (window as any).Capacitor.Plugins.Filesystem.Directory.Documents
        });

        // Partager
        await Share.share({
          title: filename,
          url: file.uri
        });
      } catch (error) {
        console.error('Erreur Capacitor:', error);
        await downloadFileWeb(content, filename, mimeType);
      }
    }
    // 2. Electron
    else if (isElectron()) {
      await downloadFileElectron(content, filename, mimeType);
    }
    // 3. Navigateur classique
    else {
      await downloadFileWeb(content, filename, mimeType);
    }
  } catch (error) {
    console.error('Erreur lors du téléchargement:', error);
  }
};

/**
 * Télécharge un fichier en utilisant l'API Web
 */
export const downloadFileWeb = async (
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): Promise<void> => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  // Nettoyage
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Télécharge un fichier via Electron
 */
export const downloadFileElectron = async (
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): Promise<void> => {
  const electron = (window as any).electron;
  if (!electron?.ipcRenderer) {
    await downloadFileWeb(content, filename, mimeType);
    return;
  }

  try {
    const buffer = content instanceof Blob
      ? Buffer.from(await content.arrayBuffer())
      : Buffer.from(content);

    await electron.ipcRenderer.invoke('save-file', {
      filename,
      content: buffer.toString('base64'),
      mimeType
    });
  } catch (error) {
    console.error('Erreur Electron:', error);
    await downloadFileWeb(content, filename, mimeType);
  }
};

/**
 * Améliore l'impression avec gestion d'erreur et vérification
 */
export const printContent = async (
  title: string = 'Document'
): Promise<void> => {
  return new Promise((resolve) => {
    // Attendre que le contenu soit prêt à l'impression
    setTimeout(() => {
      try {
        const printWindow = window.open('', '', 'height=400,width=600');
        if (!printWindow) {
          console.error('Impossible d\'ouvrir la fenêtre d\'impression');
          resolve();
          return;
        }

        // Copier le contenu à imprimer
        const printContent = document.querySelector('.print-content, .receipt-container, main');
        if (!printContent) {
          console.error('Aucun contenu trouvé à imprimer');
          resolve();
          return;
        }

        // Préparer le document
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Inter', Arial, sans-serif; padding: 20px; }
                @media print {
                  .no-print { display: none !important; }
                  body { margin: 0; padding: 0; }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();

        // Attendre le rendu
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
          resolve();
        }, 250);
      } catch (error) {
        console.error('Erreur impression:', error);
        // Fallback: utiliser window.print
        window.print();
        resolve();
      }
    }, 100);
  });
};

/**
 * Alterne entre l'impression classique (window.print) et une meilleure approche
 */
export const advancedPrint = async (contentSelector: string = 'body'): Promise<void> => {
  try {
    // Sur Android/Capacitor, essayer avec Printer plugin
    if (isCapacitor()) {
      const Printer = (window as any).Capacitor?.Plugins?.Printer;
      if (Printer) {
        const printElement = document.querySelector(contentSelector);
        if (printElement) {
          await Printer.print({
            htmlContent: printElement.innerHTML,
            printerId: 'default'
          }).catch(() => {
            // Fallback
            window.print();
          });
          return;
        }
      }
    }

    // Fallback standard
    await printContent();
  } catch (error) {
    console.error('Erreur impression avancée:', error);
    window.print();
  }
};

/**
 * Sauvegarde sécurisée des données avec notification
 */
export const safeBackupData = async (
  data: any,
  filename: string
): Promise<boolean> => {
  try {
    const hasPermission = await requestFilePermissions();
    if (!hasPermission) {
      console.warn('Permissions refusées pour la sauvegarde');
      return false;
    }

    const jsonContent = JSON.stringify(data, null, 2);

    if (isCapacitor()) {
      const Filesystem = (window as any).Capacitor.Plugins.Filesystem;
      const base64String = btoa(unescape(encodeURIComponent(jsonContent)));
      const path = `${SYSTEM_DIRS.BACKUPS}/${filename}`;

      await Filesystem.writeFile({
        path,
        data: base64String,
        directory: (window as any).Capacitor.Plugins.Filesystem.Directory.Documents,
        recursive: true
      });
      return true;
    }

    const blob = new Blob([jsonContent], { type: 'application/json' });
    await downloadFile(blob, filename, 'application/json');
    return true;
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    return false;
  }
};

/**
 * Restaure les données depuis un fichier
 */
export const restoreDataFromFile = async (
  file: File
): Promise<any | null> => {
  try {
    const hasPermission = await requestFilePermissions();
    if (!hasPermission) {
      console.warn('Permissions refusées pour la restauration');
      return null;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target?.result as string);
          resolve(content);
        } catch (error) {
          reject(new Error('Format de fichier invalide'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
      reader.readAsText(file);
    });
  } catch (error) {
    console.error('Erreur restauration:', error);
    return null;
  }
};
/**
 * Partage un fichier via l'API Web Share
 */
export const shareViaBrowser = async (
  content: string | Blob,
  filename: string,
  mimeType: string = 'text/plain'
): Promise<boolean> => {
  try {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
    const file = new File([blob], filename, { type: mimeType });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: filename,
        text: `Fichier partagé depuis Casier d'Or`
      });
      return true;
    } else {
      // Fallback au téléchargement
      await downloadFileWeb(content, filename, mimeType);
      return true;
    }
  } catch (error) {
    if ((error as any).name !== 'AbortError') {
      console.error('Erreur partage browser:', error);
    }
    return false;
  }
};

/**
 * Partage un ZIP de ventes via le navigateur
 */
export const shareZipViaBrowser = async (
  sales: any[],
  archiveName: string
): Promise<boolean> => {
  try {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    sales.forEach(sale => {
      // Version simplifiée pour le TXT
      const content = `SALE ${sale.saleNumber}\nDate: ${new Date(sale.date).toLocaleString()}\nTotal: ${sale.total}\n`;
      zip.file(`${sale.saleNumber}.txt`, content);
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    return await shareViaBrowser(blob, `${archiveName}.zip`, 'application/zip');
  } catch (error) {
    console.error('Erreur partage ZIP browser:', error);
    return false;
  }
};
