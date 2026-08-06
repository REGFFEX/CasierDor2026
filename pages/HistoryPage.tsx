import React, { useState, useMemo, useEffect } from 'react';
import { Search, Calendar, Eye, Download, Printer, X, Folder, FileText, FileJson, Loader2, Share2, ArrowLeft, Archive, Upload, Receipt as ReceiptIcon, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStoreData, setStoreData, moveToTrash, addActivity, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { Sale, StoreSettings, UserRole, LogAction } from '../types';
import { ArchiveMetadata, DocumentType, FileFormat } from '../types/archive';
import { ArchiveService } from '../utils/archiveService';
import { ExportService } from '../utils/exportService';
import Receipt from '../components/Receipt';
import CurrencyDisplay from '../components/CurrencyDisplay';
import HighlightQuery from '../components/HighlightQuery';
import ConfirmActionModal from '../components/ConfirmActionModal';
import PageBackButton from '../components/PageBackButton';
import { downloadFile, advancedPrint, requestFilePermissions, shareViaBrowser } from '../utils/fileManager';
import { useLanguage } from '../utils/languageContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/scrollbar.css';
import { getActivityUserName, resolveCompanyProfile } from '../utils/companyProfile';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const isAdmin = settings.userRole === UserRole.ADMIN;

  const [sales, setSales] = useState<Sale[]>(getStoreData<Sale[]>(STORAGE_KEYS.SALES, []));
  const [archives, setArchives] = useState<ArchiveMetadata[]>(ArchiveService.getArchives());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentType | 'ALL'>('ALL');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);

  // Dynamic Categories
  const categories = [
    { id: 'ALL', label: t('history.allArchives') || 'Toutes les archives', icon: <Archive className="w-5 h-5" /> },
    { id: DocumentType.RECEIPT, label: t('history.receipts') || 'Reçus & Ventes', icon: <ReceiptIcon className="w-5 h-5" /> },
    { id: DocumentType.EXPORT, label: 'Exports', icon: <Download className="w-5 h-5" /> },
    { id: DocumentType.IMPORT, label: 'Imports', icon: <Upload className="w-5 h-5" /> },
    { id: DocumentType.REPORT, label: 'Rapports', icon: <BarChart className="w-5 h-5" /> },
    { id: DocumentType.OTHER, label: 'Autres', icon: <Folder className="w-5 h-5" /> },
  ];

  // Helper function to map Sales to virtual Archives for display if not archived explicitly
  // In a real system, you'd trigger archiving at sale creation.
  const virtualArchives: ArchiveMetadata[] = useMemo(() => {
    return sales.map(sale => ({
      id: `VIRTUAL-${sale.id}`,
      userId: sale.userId || 'system',
      documentType: DocumentType.RECEIPT,
      documentId: sale.id,
      fileName: `REC-${sale.saleNumber}`,
      fileFormat: FileFormat.PDF,
      createdAt: sale.date,
      updatedAt: sale.date,
      archivedAt: sale.date,
      createdBy: sale.userId || 'system',
      isSynced: false,
      _originalData: sale // inject for rendering
    } as any));
  }, [sales]);

  const allRecords = useMemo(() => {
    const combined = [...archives, ...virtualArchives];
    // Filter out virtuals if they actually exist in archives to prevent duplicates
    const realArchiveDocIds = new Set(archives.filter(a => a.documentId).map(a => a.documentId));
    return combined.filter(a => {
      if (a.id.startsWith('VIRTUAL-') && realArchiveDocIds.has(a.documentId)) return false;
      return true;
    }).sort((a, b) => b.createdAt - a.createdAt);
  }, [archives, virtualArchives]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      if (selectedCategory !== 'ALL' && record.documentType !== selectedCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!record.fileName.toLowerCase().includes(q) && !record.id.toLowerCase().includes(q)) {
          // If it's a sale, check client
          if (record.documentType === DocumentType.RECEIPT && record._originalData) {
            const client = record._originalData.clientName?.toLowerCase() || '';
            const num = record._originalData.saleNumber?.toLowerCase() || '';
            if (!client.includes(q) && !num.includes(q)) return false;
          } else {
            return false;
          }
        }
      }
      return true;
    });
  }, [allRecords, selectedCategory, searchQuery]);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedItems(next);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredRecords.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredRecords.map(r => r.id)));
    }
  };

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (window.innerWidth <= 768);
  };

  const handleDelete = (id: string) => {
    setSaleToDelete(id);
  };

  const confirmDeleteAction = () => {
    if (saleToDelete) {
      if (saleToDelete.startsWith('VIRTUAL-')) {
        const originalId = saleToDelete.replace('VIRTUAL-', '');
        const sale = sales.find(s => s.id === originalId);
        if (sale) {
          const newSales = sales.filter(s => s.id !== originalId);
          setSales(newSales);
          setStoreData(STORAGE_KEYS.SALES, newSales);
          moveToTrash(sale, 'SALE');
        }
      } else {
        ArchiveService.deleteArchive(saleToDelete, settings.userRole === UserRole.ADMIN ? settings.adminName || 'Admin' : settings.staffName || 'Staff');
        setArchives(ArchiveService.getArchives());
      }
      setSaleToDelete(null);
      setSelectedItems(prev => {
        const next = new Set(prev);
        next.delete(saleToDelete);
        return next;
      });
    }
  };

  // Export Logic
  const generateSaleContent = (sale: Sale) => {
    const company = resolveCompanyProfile(settings);
    let content = `${t('history.receiptTitle')} - ${company.companyName}\n`;
    content += `${t('history.receiptNumber')}: ${sale.saleNumber}\n`;
    content += `${t('history.receiptDate')}: ${new Date(sale.date).toLocaleString()}\n`;
    content += `${t('history.receiptClient')}: ${sale.clientName || t('dashboard.punctualClient')}\n`;
    content += `------------------------------------------\n`;
    sale.lines.forEach(l => {
      content += `${l.quantity}x ${l.productName} @ ${l.unitPrice} = ${l.total} ${settings.currency}\n`;
    });
    content += `------------------------------------------\n`;
    content += `${t('history.receiptTotal')}: ${sale.total} ${settings.currency}\n`;
    content += `${t('history.receiptMode')}: ${sale.paymentMethod}\n`;
    return content;
  };

  const downloadSelected = async (format?: FileFormat) => {
    if (selectedItems.size === 0) return;
    setIsProcessing(true);

    try {
      if (selectedItems.size === 1 && format) {
        // Single export
        const id = Array.from(selectedItems)[0];
        const record = allRecords.find(r => r.id === id);
        if (!record) return;

        if (record.documentType === DocumentType.RECEIPT && record._originalData) {
          const sale = record._originalData;
          await ExportService.exportData([sale], format, `Export_${sale.saleNumber}`);
        } else {
          // generic archive data
          const data = ArchiveService.getArchiveData(record.id);
          if (data) await ExportService.exportData(Array.isArray(data) ? data : [data], format, record.fileName);
        }
      } else {
        // ZIP Multiple
        const files: Record<string, string> = {};
        for (const id of Array.from(selectedItems)) {
          const record = allRecords.find(r => r.id === id);
          if (!record) continue;
          
          const folderName = record.documentType;
          if (record.documentType === DocumentType.RECEIPT && record._originalData) {
             files[`${folderName}/${record.fileName}.txt`] = generateSaleContent(record._originalData);
             files[`${folderName}/${record.fileName}.json`] = JSON.stringify(record._originalData, null, 2);
          } else {
            const data = ArchiveService.getArchiveData(record.id);
            if (data) files[`${folderName}/${record.fileName}.json`] = JSON.stringify(data, null, 2);
          }
        }
        await ExportService.exportMultipleAsZip(files, `Kelasi_Archives_${new Date().toISOString().split('T')[0]}`);
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors de l\'export');
    } finally {
      setIsProcessing(false);
    }
  };

  const getColorForLetter = (str: string) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600', 'bg-pink-100 text-pink-600'];
    const char = str.charCodeAt(0) || 0;
    return colors[char % colors.length];
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-4">
          <PageBackButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('history.title') || 'Archives'}</h1>
            <p className="text-gray-500">Gestion complète de vos documents et historiques</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`btn-3d flex items-center space-x-2 px-4 py-2 rounded-2xl whitespace-nowrap transition-all ${
                  selectedCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-white text-gray-600 border border-gray-100 hover:bg-gray-50'
                }`}
              >
                {cat.icon}
                <span className="font-bold text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
          <div className="relative min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('history.searchPlaceholder') || 'Rechercher une archive...'}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar d'actions multiples */}
        {selectedItems.size > 0 && (
          <div className="bg-blue-50 px-6 py-4 flex items-center justify-between border-b border-blue-100 animate-in slide-in-from-top-2">
            <span className="text-blue-700 font-bold text-sm">
              {t('history.selectedCount').replace('{count}', selectedItems.size.toString())}
            </span>
            <div className="flex items-center space-x-2">
              {selectedItems.size === 1 ? (
                <>
                  <button onClick={() => downloadSelected(FileFormat.PDF)} className="btn-3d px-3 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-600 hover:text-white transition-all">{t('history.btnPDF')}</button>
                  <button onClick={() => downloadSelected(FileFormat.XLSX)} className="btn-3d px-3 py-1.5 bg-white text-green-600 rounded-lg text-xs font-bold shadow-sm hover:bg-green-600 hover:text-white transition-all">{t('history.btnXLSX')}</button>
                  <button onClick={() => downloadSelected(FileFormat.JSON)} className="btn-3d px-3 py-1.5 bg-white text-purple-600 rounded-lg text-xs font-bold shadow-sm hover:bg-purple-600 hover:text-white transition-all">{t('history.btnJSON')}</button>
                </>
              ) : (
                <button onClick={() => downloadSelected()} disabled={isProcessing} className="btn-3d flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-all">
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span className="text-sm font-bold">{t('history.generateZip')}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Liste des archives */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.size === filteredRecords.length && filteredRecords.length > 0} 
                    onChange={selectAll}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-4 font-bold">{t('history.tableDocument')}</th>
                <th className="px-6 py-4 font-bold hidden sm:table-cell">{t('history.tableType')}</th>
                <th className="px-6 py-4 font-bold hidden md:table-cell">{t('history.tableDate')}</th>
                <th className="px-6 py-4 font-bold text-right">{t('history.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(record => (
                  <tr key={record.id} className={`hover:bg-gray-50/50 transition-colors ${selectedItems.has(record.id) ? 'bg-blue-50/20' : ''}`}>
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.has(record.id)}
                        onChange={() => toggleSelection(record.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${getColorForLetter(record.documentType)}`}>
                          {record.fileName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm"><HighlightQuery text={record.fileName} query={searchQuery} /></p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase">{record.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        {record.documentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600 font-medium">{new Date(record.createdAt).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-400">{new Date(record.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {record.documentType === DocumentType.RECEIPT && record._originalData && (
                          <button onClick={() => setSelectedSale(record._originalData)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Aperçu">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button onClick={() => handleDelete(record.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Archive className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-sm font-bold uppercase tracking-widest">{t('history.noArchiveFound')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legacy Receipt Modal pour les Ventes */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 no-print">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-black text-gray-900">{selectedSale.saleNumber}</h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">{t('history.viewReceipt')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => advancedPrint('.receipt-container')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">{t('button.print')}</span>
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 custom-scrollbar">
              <Receipt sale={selectedSale} settings={settings} />
            </div>
          </div>
        </div>
      )}

      <ConfirmActionModal
        open={!!saleToDelete}
        actionId={`delete-archive-${saleToDelete}`}
        title={t('confirm.deleteTitle') || 'Confirmation'}
        message={'Êtes-vous sûr de vouloir supprimer cette archive ? Cette action est irréversible.'}
        onCancel={() => setSaleToDelete(null)}
        onConfirm={confirmDeleteAction}
      />
    </div>
  );
};

export default HistoryPage;
