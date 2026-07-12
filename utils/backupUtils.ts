import { STORAGE_KEYS } from '../store';

export const createBackupData = (forLogout: boolean = false) => {
  const allData: Record<string, any> = {};
  Object.values(STORAGE_KEYS).forEach(key => {
    const data = localStorage.getItem(key);
    allData[key] = data ? JSON.parse(data) : null;
  });

  // Ajouter les données d'utilisateurs si elles existent
  const usersData = localStorage.getItem('casierdor_users');
  if (usersData) {
    allData.users = JSON.parse(usersData);
  }

  const jsonContent = JSON.stringify(allData, null, 2);
  const jsonFilename = forLogout 
    ? `SAUVEGARDE_PREMIER_DECONNEXION_${new Date().toISOString().slice(0, 10)}.json`
    : `SAUVEGARDE_SYSTEME_${new Date().toISOString().slice(0, 10)}.json`;

  return { jsonContent, jsonFilename, allData };
};

export const downloadBackupFile = (jsonContent: string, filename: string) => {
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const createTextReport = (allData: any, settings: any, forLogout: boolean = false) => {
  let report = `RAPPORT COMPLET DU SYSTÈME - ${settings.name || 'Casier d\'Or'}\n`;
  report += `Date de génération : ${new Date().toLocaleString()}\n`;
  report += `Type de sauvegarde : ${forLogout ? 'Pré-déconnexion' : 'Manuelle'}\n`;
  report += `--------------------------------------------------\n\n`;

  // Produits
  const products = allData[STORAGE_KEYS.PRODUCTS] || [];
  report += `### PRODUITS EN STOCK (${products.length}) ###\n`;
  products.forEach((p: any) => {
    report += `- ${p.name} (SKU: ${p.sku}) | Stock: ${p.stock} | Prix: ${p.price} ${settings.currency || 'FCFA'}\n`;
  });

  // Clients
  const clients = allData[STORAGE_KEYS.CLIENTS] || [];
  report += `\n### CLIENTS RÉPERTORIÉS (${clients.length}) ###\n`;
  clients.forEach((c: any) => {
    report += `- ${c.name} (${c.code}) | Tél: ${c.phone || 'N/A'}\n`;
  });

  // Utilisateurs
  const users = allData.users || [];
  if (users.length > 0) {
    report += `\n### UTILISATEURS ENREGISTRÉS (${users.length}) ###\n`;
    users.forEach((u: any) => {
      report += `- ${u.firstName} ${u.lastName} (${u.email}) | Rôle: ${u.role} | ${u.isActive ? 'Actif' : 'Inactif'}\n`;
    });
  }

  // Ventes
  const sales = allData[STORAGE_KEYS.SALES] || [];
  const totalRev = sales.reduce((acc: number, s: any) => acc + (s.total || 0), 0);
  report += `\n### RÉSUMÉ DES VENTES (${sales.length}) ###\n`;
  report += `Chiffre d'affaires total enregistré : ${totalRev.toLocaleString()} ${settings.currency || 'FCFA'}\n`;

  const txtFilename = forLogout 
    ? `ETAT_DU_DEPOT_PREMIER_DECONNEXION_${new Date().toISOString().slice(0, 10)}.txt`
    : `ETAT_DU_DEPOT_${new Date().toISOString().slice(0, 10)}.txt`;

  return { report, txtFilename };
};

export const performFullBackup = async (forLogout: boolean = false, settings?: any) => {
  try {
    // Créer les données de sauvegarde
    const { jsonContent, jsonFilename, allData } = createBackupData(forLogout);
    
    // Télécharger le fichier JSON
    downloadBackupFile(jsonContent, jsonFilename);

    // Créer et télécharger le rapport texte
    if (settings) {
      const { report, txtFilename } = createTextReport(allData, settings, forLogout);
      const textBlob = new Blob([report], { type: 'text/plain;charset=utf-8' });
      const textUrl = URL.createObjectURL(textBlob);
      const textA = document.createElement('a');
      textA.href = textUrl;
      textA.download = txtFilename;
      textA.click();
      URL.revokeObjectURL(textUrl);
    }

    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return false;
  }
};
