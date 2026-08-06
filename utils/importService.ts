import * as XLSX from 'xlsx';
import { ImportResult } from '../types/export';
import { FileFormat } from '../types/archive';

export class ImportService {
  /**
   * Parse a file based on its format and return a standardized ImportResult.
   */
  static async parseFile(file: File, format: FileFormat): Promise<ImportResult> {
    try {
      let data: any[] = [];
      const errors: Array<{ row: number; message: string }> = [];

      switch (format) {
        case FileFormat.JSON:
          data = await this.parseJSON(file, errors);
          break;
        case FileFormat.XLSX:
          data = await this.parseXLSX(file, errors);
          break;
        case FileFormat.TXT:
          data = await this.parseTXT(file, errors);
          break;
        default:
          throw new Error(`Import du format ${format} non supporté actuellement.`);
      }

      const totalRows = data.length;
      // In a real scenario, validRows = totalRows - invalid rows discovered during specific domain validation
      // Here we assume if they parsed, they are "valid" structure-wise.
      const validRows = totalRows - errors.length;

      return {
        success: true,
        totalRows,
        validRows: validRows > 0 ? validRows : 0,
        errors,
        data
      };
    } catch (err: any) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        errors: [{ row: 0, message: err.message || 'Erreur inconnue lors de la lecture du fichier.' }],
        data: []
      };
    }
  }

  // --- PRIVATE HELPERS ---

  private static parseJSON(file: File, errors: Array<{ row: number; message: string }>): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            resolve(parsed);
          } else {
            // Si c'est un objet unique, on le met dans un tableau
            resolve([parsed]);
          }
        } catch (err) {
          reject(new Error("Le fichier JSON est invalide ou corrompu."));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier JSON."));
      reader.readAsText(file);
    });
  }

  private static parseXLSX(file: File, errors: Array<{ row: number; message: string }>): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (workbook.SheetNames.length === 0) {
            reject(new Error("Le fichier Excel ne contient aucune feuille."));
            return;
          }

          // Prendre la première feuille par défaut
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convertir en JSON (tableau d'objets)
          const json = XLSX.utils.sheet_to_json(worksheet);
          resolve(json);
        } catch (err) {
          reject(new Error("Erreur lors de l'analyse du fichier Excel. Vérifiez le format."));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier Excel."));
      reader.readAsArrayBuffer(file);
    });
  }

  private static parseTXT(file: File, errors: Array<{ row: number; message: string }>): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n').filter(line => line.trim() !== '');
          
          if (lines.length === 0) {
            resolve([]);
            return;
          }

          // On suppose que la première ligne contient les en-têtes séparés par une tabulation ou une virgule
          const separator = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
          const headers = lines[0].split(separator).map(h => h.trim());
          
          const result = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(separator).map(v => v.trim());
            const rowData: any = {};
            
            if (values.length !== headers.length) {
              errors.push({ row: i + 1, message: "Nombre de colonnes incorrect." });
            }

            headers.forEach((header, index) => {
              rowData[header] = values[index] || '';
            });
            result.push(rowData);
          }
          
          resolve(result);
        } catch (err) {
          reject(new Error("Erreur lors de l'analyse du fichier TXT."));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture du fichier TXT."));
      reader.readAsText(file);
    });
  }
}
