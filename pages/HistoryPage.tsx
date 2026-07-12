
import React, { useState, useMemo } from 'react';
import { Search, Calendar, Eye, Download, Printer, X, Folder, FolderOpen, FileText, ChevronRight, ChevronDown, Archive, FileJson, Loader2, Share2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getStoreData, setStoreData, moveToTrash, addActivity, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { Sale, SaleLine, Product, StoreSettings, UserRole, LogAction } from '../types';
import Receipt from '../components/Receipt';
import CurrencyDisplay from '../components/CurrencyDisplay';
import HighlightQuery from '../components/HighlightQuery';
import PageBackButton from '../components/PageBackButton';
import { downloadFile, advancedPrint, requestFilePermissions, shareViaBrowser, shareZipViaBrowser } from '../utils/fileManager';
import { useLanguage } from '../utils/languageContext';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import '../styles/scrollbar.css';
import { getActivityUserName, resolveCompanyProfile } from '../utils/companyProfile';

const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>(getStoreData<Sale[]>(STORAGE_KEYS.SALES, []));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['today']));
  const [isProcessing, setIsProcessing] = useState(false);
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  const handleDelete = (sale: Sale) => {
    if (confirm(t('confirm.deleteSale').replace('{0}', sale.saleNumber))) {
      const newSales = sales.filter(s => s.id !== sale.id);
      setSales(newSales);
      setStoreData(STORAGE_KEYS.SALES, newSales);

      // Utiliser le nouveau système de corbeille
      moveToTrash(sale, 'SALE');

      // Log l'activité
      addActivity({
        userName: getActivityUserName(settings),
        userRole: settings.userRole || UserRole.ADMIN,
        action: LogAction.DELETE,
        details: `Vente envoyée à la corbeille: ${sale.saleNumber}`,
        module: 'SALE'
      });
    }
  };

  const isAdmin = settings.userRole === UserRole.ADMIN;

  // Détection mobile/desktop
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      (window.innerWidth <= 768);
  };



  // Supprimé au profit de downloadSale avec menu de format

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) newExpanded.delete(path);
    else newExpanded.add(path);
    setExpandedFolders(newExpanded);
  };

  // Helper dates
  const formatDateForFolder = (timestamp: number) => {
    const d = new Date(timestamp);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}_00:00:00`;
  };

  const getWeekNumber = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  };

  const getDayOfWeek = (d: Date) => (d.getDay() === 0 ? 7 : d.getDay());

  // Organization Logic
  const organizedData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const tree: any = { today: [], archive: {} };

    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const saleDateStr = saleDate.toISOString().slice(0, 10);

      // Search Filter
      if (searchQuery && !sale.saleNumber.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(sale.clientName && sale.clientName.toLowerCase().includes(searchQuery.toLowerCase()))) {
        return;
      }

      if (saleDateStr === todayStr) {
        tree.today.push(sale);
      } else {
        const year = saleDate.getFullYear();
        const month = saleDate.getMonth() + 1;
        const week = getWeekNumber(saleDate);
        const day = getDayOfWeek(saleDate);

        // Nested structure
        const yearKey = `A-${year}_M-${month}_S-${week}_J-${day}_${formatDateForFolder(sale.date)}`;

        if (!tree.archive[yearKey]) tree.archive[yearKey] = { sales: [], label: yearKey };
        tree.archive[yearKey].sales.push(sale);
      }
    });

    return tree;
  }, [sales, searchQuery]);

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

  const downloadFolder = async (folderName: string, salesInFolder: Sale[], useShare: boolean = false) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    try {
      if (useShare || isMobile()) {
        // Mode mobile : partage via navigateur (avec fallback automatique vers download)
        const success = await shareZipViaBrowser(salesInFolder, folderName);
        if (!success) {
          alert(t('history.shareError'));
        }
      } else {
        // Mode desktop : téléchargement direct
        const hasPermission = await requestFilePermissions();
        if (!hasPermission) {
          alert(t('history.permissionError'));
          setIsProcessing(false);
          return;
        }

        const zip = new JSZip();
        salesInFolder.forEach(sale => {
          zip.file(`${sale.saleNumber}.txt`, generateSaleContent(sale));
        });
        const blob = await zip.generateAsync({ type: "blob" });
        await downloadFile(blob, `${folderName}.zip`, 'application/zip');
      }
    } catch (error) {
      console.error('Erreur téléchargement ZIP:', error);
      alert(t('history.archiveError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSale = async (sale: Sale, format: 'txt' | 'json' | 'pdf', useShare: boolean = false) => {
    if (!isAdmin) return;
    setIsProcessing(true);
    try {
      if (format === 'pdf') {
        // Pour générer un PDF de qualité, on doit rendre le composant Receipt temporairement
        // S'il n'est pas déjà affiché (selectedSale), on peut l'injecter dans un conteneur invisible
        let element = document.querySelector('.receipt-container');
        let needsCleanup = false;

        if (!element) {
          // Créer un conteneur temporaire pour le rendu
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.id = 'temp-receipt-capture';
          document.body.appendChild(tempDiv);

          // On force l'ouverture de la modale ou on utilise un portail si on voulait être propre
          // Mais ici le plus simple est de s'assurer que .receipt-container existe via selectedSale
          setSelectedSale(sale);
          await new Promise(resolve => setTimeout(resolve, 500));
          element = document.querySelector('.receipt-container');
          needsCleanup = true;
        }

        if (element) {
          const canvas = await html2canvas(element as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

          if (useShare || isMobile()) {
            const pdfBlob = pdf.output('blob');
            const success = await shareViaBrowser(pdfBlob, `${sale.saleNumber}.pdf`, 'application/pdf');
            if (!success) alert(t('history.shareError'));
          } else {
            pdf.save(`${sale.saleNumber}.pdf`);
          }

          if (needsCleanup) {
            setSelectedSale(null);
          }
        }
        setIsProcessing(false);
        return;
      }

      const content = format === 'json' ? JSON.stringify(sale, null, 2) : generateSaleContent(sale);
      const mimeType = format === 'json' ? 'application/json' : 'text/plain';
      const filename = `${sale.saleNumber}.${format}`;

      if (useShare || isMobile()) {
        // Mode mobile : partage via navigateur
        const success = await shareViaBrowser(content, filename, mimeType);
        if (!success) {
          alert(t('history.shareError'));
        }
      } else {
        // Mode desktop : téléchargement direct
        const hasPermission = await requestFilePermissions();
        if (!hasPermission) {
          alert(t('history.permissionError'));
          setIsProcessing(false);
          return;
        }
        await downloadFile(content, filename, mimeType);
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert(t('history.downloadError'));
    } finally {
      setIsProcessing(false);
    }
  };

  // Fixed the sub-component to be a render function to properly handle keys
  const renderSaleRow = (sale: Sale) => (
    <div key={sale.id} className="p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-sm transition-all group mb-2 ml-8">
      {/* En-tête avec informations principales */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-4 flex-shrink-0 min-w-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
              #{sale.saleNumber.slice(-3)}
            </div>
            <div>
              <p className="font-bold text-gray-900 leading-tight">
                <HighlightQuery text={sale.saleNumber} query={searchQuery} />
              </p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                {sale.clientName ? <HighlightQuery text={sale.clientName} query={searchQuery} /> : t('sales.anonymousClient')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          <p className="font-black text-sm whitespace-nowrap"><CurrencyDisplay amount={sale.total} from="XAF" /></p>
          <button onClick={() => setSelectedSale(sale)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg min-w-[40px] h-[40px] flex items-center justify-center flex-shrink-0" title={t('history.viewReceipt')}>
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Boutons d'action avec scroll horizontal */}
      {isAdmin && (
        <div className="border-t border-gray-100 pt-3">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {/* Menu de format de téléchargement */}
            <div className="flex items-center space-x-1 p-1 bg-gray-50 rounded-xl">
              <button
                onClick={() => downloadSale(sale, 'txt')}
                disabled={isProcessing}
                className="px-3 py-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-all flex items-center space-x-1"
              >
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold">TXT</span>
              </button>
              <button
                onClick={() => downloadSale(sale, 'json')}
                disabled={isProcessing}
                className="px-3 py-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-all flex items-center space-x-1"
              >
                <FileJson className="w-4 h-4" />
                <span className="text-[10px] font-bold">JSON</span>
              </button>
              <button
                onClick={() => downloadSale(sale, 'pdf')}
                disabled={isProcessing}
                className="px-3 py-2 text-red-600 hover:bg-red-100 rounded-lg transition-all flex items-center space-x-1"
              >
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold">PDF</span>
              </button>

              {isMobile() && (
                <button
                  onClick={() => downloadSale(sale, 'txt', true)}
                  disabled={isProcessing}
                  className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex items-center space-x-4">
          <PageBackButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('history.title')}</h1>
            <p className="text-gray-500">{t('history.subtitle')}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {isAdmin && (
            <div className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black rounded-full uppercase tracking-tighter whitespace-nowrap">
              {t('history.adminMode')}
            </div>
          )}
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('history.searchPlaceholder')}
              className="w-full sm:w-auto pl-10 pr-4 py-2 bg-white border rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* AUJOURD'HUI */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleFolder('today')}
            className="w-full flex items-center justify-between p-6 bg-blue-50/50 hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h3 className="font-black text-gray-900 uppercase tracking-wide">{t('history.today')}</h3>
                <p className="text-[10px] text-blue-600 font-bold uppercase">{organizedData.today.length} {t('history.transactions')}</p>
              </div>
            </div>
            {expandedFolders.has('today') ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedFolders.has('today') && (
            <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-300">
              {organizedData.today.length > 0 ? (
                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="min-w-max space-y-2">
                    {organizedData.today.map((sale: Sale) => renderSaleRow(sale))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400 text-xs italic">{t('history.noSales')}</p>
              )}
            </div>
          )}
        </div>

        {/* ARCHIVES (DOSSIERS AUTOMATIQUES) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 px-4">
            <Archive className="w-4 h-4 text-gray-400" />
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('history.archives')}</h4>
          </div>

          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <div className="flex gap-4 min-w-max">
              {Object.entries(organizedData.archive).sort().reverse().map(([key, folder]: any) => (
                <div key={key} className="w-80 sm:w-96 flex-shrink-0 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="w-full flex items-center justify-between p-4 group transition-colors">
                    <div
                      className="flex items-center space-x-4 flex-1 cursor-pointer"
                      onClick={() => toggleFolder(key)}
                    >
                      <div className="w-8 h-8 bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600 rounded-lg flex items-center justify-center transition-all">
                        {expandedFolders.has(key) ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-700 text-xs font-mono">{folder.label}</h3>
                        <p className="text-[9px] text-gray-400 uppercase font-black">{folder.sales.length} {t('history.filesArchived')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => downloadFolder(key, folder.sales)}
                            disabled={isProcessing}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            title={t('history.downloadArchive')}
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                          </button>
                          {isMobile() && (
                            <button
                              onClick={() => downloadFolder(key, folder.sales, true)}
                              disabled={isProcessing}
                              className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              title={t('history.shareArchive')}
                            >
                              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                            </button>
                          )}
                        </>
                      )}
                      <button onClick={() => toggleFolder(key)} className="p-2 text-gray-400">
                        {expandedFolders.has(key) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {expandedFolders.has(key) && (
                    <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300 border-t border-gray-50 pt-4">
                      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <div className="min-w-max space-y-2">
                          {folder.sales.map((sale: Sale) => renderSaleRow(sale))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {Object.keys(organizedData.archive).length === 0 && (
            <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border border-dashed border-gray-200">
              <Archive className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 text-xs uppercase font-bold tracking-widest">{t('history.archiveEmpty')}</p>
            </div>
          )}
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col">
            {/* Header avec bouton retour et actions */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 no-print">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title={t('history.backToHistory')}
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
                  title={t('button.close')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu du reçu */}
            <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30 custom-scrollbar">
              <Receipt sale={selectedSale} settings={settings} />
            </div>

            {/* Footer mobile avec actions */}
            <div className="border-t border-gray-100 p-4 no-print md:hidden">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => advancedPrint('.receipt-container')}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg"
                >
                  <Printer className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">{t('button.print')}</span>
                </button>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="flex items-center justify-center space-x-2 px-3 py-2 bg-gray-200 text-gray-700 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">{t('history.backToHistory')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
