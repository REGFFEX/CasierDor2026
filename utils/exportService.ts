import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileFormat } from '../types/archive';
import { addActivity } from '../store';
import { LogAction } from '../types';

export class ExportService {
  /**
   * Main export method for single file downloads.
   */
  static async exportData(
    data: any[],
    format: FileFormat,
    filename: string,
    title?: string
  ): Promise<void> {
    const safeFilename = filename.replace(/[^a-z0-9_-]/gi, '_');

    switch (format) {
      case FileFormat.JSON:
        this.exportJSON(data, safeFilename);
        break;
      case FileFormat.TXT:
        this.exportTXT(data, safeFilename);
        break;
      case FileFormat.XLSX:
        this.exportXLSX(data, safeFilename);
        break;
      case FileFormat.PDF:
        this.exportPDF(data, safeFilename, title || 'Export Document');
        break;
      case FileFormat.ZIP:
        // ZIP makes more sense for multiple files, but we can zip a JSON + XLSX representation
        await this.exportZIP({
          [`${safeFilename}.json`]: JSON.stringify(data, null, 2),
          // For a simple ZIP export of one data set, maybe just JSON is enough, 
          // or we handle multi-file export specifically below.
        }, safeFilename);
        break;
      default:
        throw new Error(`Format ${format} non supporté`);
    }

    try {
      addActivity({
        userName: 'Système',
        action: LogAction.EXPORT,
        details: `Export généré : ${safeFilename} (${format})`,
        module: 'EXPORT'
      });
    } catch (e) {
      console.warn("Erreur d'enregistrement de l'activité", e);
    }
  }

  /**
   * Export multiple items into a structured ZIP file
   * @param files Record of path -> string content or Blob
   * @param zipFilename Name of the resulting ZIP file
   */
  static async exportMultipleAsZip(files: Record<string, string | Blob>, zipFilename: string): Promise<void> {
    const zip = new JSZip();

    for (const [path, content] of Object.entries(files)) {
      // Split path by / to create folders
      const parts = path.split('/');
      let currentFolder = zip;
      
      for (let i = 0; i < parts.length - 1; i++) {
        currentFolder = currentFolder.folder(parts[i])!;
      }
      
      const fileName = parts[parts.length - 1];
      currentFolder.file(fileName, content);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${zipFilename}.zip`);
  }

  // --- PRIVATE HELPERS ---

  private static exportJSON(data: any[], filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    saveAs(blob, `${filename}.json`);
  }

  private static exportTXT(data: any[], filename: string) {
    // Convert to a simple TSV or formatted text
    if (!data || data.length === 0) {
      const blob = new Blob(['No data'], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${filename}.txt`);
      return;
    }

    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => row[h] ?? '').join('\t'));
    const content = [headers.join('\t'), ...rows].join('\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${filename}.txt`);
  }

  private static exportXLSX(data: any[], filename: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Données');
    
    // Write array buffer
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `${filename}.xlsx`);
  }

  private static exportPDF(data: any[], filename: string, title: string) {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Généré le : ${new Date().toLocaleString()}`, 14, 30);

    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      const body = data.map(item => headers.map(h => item[h] !== undefined && item[h] !== null ? String(item[h]) : ''));
      
      autoTable(doc, {
        startY: 40,
        head: [headers],
        body: body,
        theme: 'striped',
        headStyles: { fillColor: [31, 79, 216] } // Blue primary color
      });
    } else {
      doc.text("Aucune donnée disponible", 14, 40);
    }

    doc.save(`${filename}.pdf`);
  }

  private static async exportZIP(files: Record<string, string>, filename: string) {
    const zip = new JSZip();
    for (const [name, content] of Object.entries(files)) {
      zip.file(name, content);
    }
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${filename}.zip`);
  }
}
