
import React, { useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Package, TrendingUp, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Download, UploadCloud, LayoutGrid, CloudSync, Wifi, Database, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../utils/languageContext';
import { formatDateTime } from '../utils/dateTimeUtils';
import { getStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { scopeStorageKey } from '../utils/accountStorage';
import { Sale, Product, SaleStatus, StoreSettings, UserRole } from '../types';
import CurrencyDisplay from '../components/CurrencyDisplay';
import { getNavigationItems } from '../constants';
import {
  filterNavigationItems,
  getRecentModuleIds,
  isModuleDisabled,
} from '../utils/modules';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { useConfirmAction } from '../hooks/useConfirmAction';
import { CrystalCard } from '../components/design-system';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const { pending, neverAsk, setNeverAsk, requestConfirm, cancel, confirm } = useConfirmAction();
  const sales = getStoreData<Sale[]>(STORAGE_KEYS.SALES, []);
  const products = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shortcutItems = useMemo(() => {
    const all = filterNavigationItems(getNavigationItems(t), settings.disabledModules);
    const byId = new Map(all.map((item) => [item.id!, item]));
    const recent = getRecentModuleIds()
      .filter((id) => byId.has(id) && !isModuleDisabled(id, settings.disabledModules))
      .map((id) => byId.get(id)!)
      .slice(0, 6);
    if (recent.length >= 3) return recent;
    const primary = all.filter((i) => i.primary && i.id !== 'dashboard').slice(0, 6);
    return primary.length ? primary : all.filter((i) => i.id !== 'dashboard').slice(0, 6);
  }, [t, settings.disabledModules]);

  const isAdmin = settings.userRole === UserRole.ADMIN;
  const today = new Date().toLocaleDateString('en-CA'); // Format YYYY-MM-DD local

  const stats = useMemo(() => {
    const todaySales = sales.filter(s =>
      new Date(s.date).toLocaleDateString('en-CA') === today &&
      s.status === SaleStatus.VALIDATED
    );

    const dailyTotal = todaySales.reduce((acc, s) => acc + s.total, 0);
    const criticalProducts = products.filter(p => p.active && p.stock <= p.criticalThreshold);

    return {
      dailyTotal,
      saleCount: todaySales.length,
      criticalCount: criticalProducts.length,
      activeProducts: products.filter(p => p.active).length,
      recentSales: sales.sort((a, b) => b.date - a.date).slice(0, 5),
      criticalProducts: criticalProducts.slice(0, 5)
    };
  }, [sales, products, today]);

  const handleExportData = async () => {
    const allData: Record<string, any> = {};
    Object.values(STORAGE_KEYS).forEach(key => {
      const data = localStorage.getItem(scopeStorageKey(key));
      allData[key] = data ? JSON.parse(data) : null;
    });

    const fileName = `${t('dashboard.export')}_${new Date().toISOString().slice(0, 10)}.json`;
    const jsonString = JSON.stringify(allData, null, 2);

    if (Capacitor.isNativePlatform()) {
      try {
        await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Documents,
        });
        alert(`Sauvegarde réussie dans les Documents : ${fileName}`);
      } catch (error) {
        console.error('Error saving file', error);
        alert('Erreur lors de la sauvegarde sur l\'appareil. Vérifiez les permissions.');
      }
    } else {
      const jsonBlob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
    }
  };

  const applyImport = (content: Record<string, unknown>) => {
    Object.entries(content).forEach(([key, value]) => {
      if (value != null && Object.values(STORAGE_KEYS).includes(key as (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS])) {
        localStorage.setItem(scopeStorageKey(key), JSON.stringify(value));
      }
    });
    window.location.reload();
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string) as Record<string, unknown>;
        requestConfirm({
          actionId: 'importJson',
          message: t('confirm.importAllData'),
          level: 2,
          run: () => applyImport(content),
        });
      } catch {
        alert(t('message.invalidFile'));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const accentColors: Record<string, { bg: string; text: string; glow: string }> = {
    'bg-blue-600':   { bg: 'rgba(31,79,216,0.08)',   text: '#1F4FD8', glow: 'rgba(31,79,216,0.20)' },
    'bg-green-600':  { bg: 'rgba(22,163,74,0.08)',   text: '#16A34A', glow: 'rgba(22,163,74,0.20)' },
    'bg-orange-600': { bg: 'rgba(234,88,12,0.08)',   text: '#EA580C', glow: 'rgba(234,88,12,0.20)' },
    'bg-purple-600': { bg: 'rgba(147,51,234,0.08)',  text: '#9333EA', glow: 'rgba(147,51,234,0.20)' },
  };

  const StatCard = ({ title, value, icon, color, trend }: any) => {
    const palette = accentColors[color] || accentColors['bg-blue-600'];
    return (
      <div className="ds-card p-4 flex items-center justify-between gap-4 ds-card-interactive">
        <div className="flex-1 min-w-0">
          <p className="ds-section-title mb-1">{title}</p>
          <h3 className="text-2xl font-bold tracking-tight text-[var(--c-text)]">{value}</h3>
          {trend && (
            <div className={`flex items-center mt-1.5 text-xs font-semibold ${trend > 0 ? 'text-[var(--c-success)]' : 'text-[var(--c-error)]'}`}>
              {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              <span>{Math.abs(trend)}% {t('dashboard.vsYesterday')}</span>
            </div>
          )}
        </div>
        <div className="w-12 h-12 rounded-[var(--r-lg)] flex items-center justify-center flex-shrink-0"
          style={{ background: palette.bg, color: palette.text, boxShadow: `0 4px 16px ${palette.glow}` }}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5' }) : icon}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="ds-page-title">{t('dashboard.title')}</h1>
          <p className="ds-page-subtitle mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button onClick={handleExportData} className="ds-btn ds-btn-secondary ds-btn-sm gap-2">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.export')}</span>
          </button>
          <button onClick={() => { if (!isAdmin) { alert(t('settings.sessionAdmin')); return; } fileInputRef.current?.click(); }} className="ds-btn ds-btn-secondary ds-btn-sm gap-2">
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.import')}</span>
          </button>
          <button onClick={() => alert(t('dashboard.syncWip'))} className="ds-btn ds-btn-primary ds-btn-sm gap-2">
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.syncBtn')}</span>
          </button>
          <div className="ds-card flex items-center gap-2 px-3 py-2 text-xs text-[var(--c-text-2)] font-medium">
            <Clock className="w-4 h-4 text-[var(--c-text-3)]" />
            <span className="hidden lg:inline">{formatDateTime(new Date(), language, { includeTime: true, dateStyle: 'full', timeStyle: 'short' })}</span>
            <span className="lg:hidden">{formatDateTime(new Date(), language, { includeTime: true, dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json,application/json" className="hidden" />

      {/* Photo bâtiment */}
      {settings.buildingImage && (
        <div className="w-full h-44 md:h-60 rounded-[var(--r-2xl)] overflow-hidden relative shadow-lg">
          <img src={settings.buildingImage} alt={t('dashboard.building')} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 md:p-8">
            <h2 className="text-white text-xl md:text-3xl font-black drop-shadow-lg">{settings.name || 'Notre Entreprise'}</h2>
            {settings.address && <p className="text-white/80 text-sm flex items-center mt-1 gap-1"><MapPin className="w-3.5 h-3.5" />{settings.address}</p>}
          </div>
        </div>
      )}

      {/* Accès rapide */}
      {settings.showDashboardShortcuts !== false && shortcutItems.length > 0 && (
        <div className="ds-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-[var(--c-brand)]" />
            <h2 className="font-bold text-[var(--c-text)] text-base">{t('dashboard.shortcuts')}</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {shortcutItems.map((item) => (
              <Link key={item.path} to={item.path}
                className="ds-card-interactive flex flex-col items-center gap-2 p-3 rounded-[var(--r-lg)] bg-[var(--c-surface-2)] hover:bg-[var(--c-brand-xlight)] group transition-all">
                <div className="text-[var(--c-brand)] group-hover:scale-110 transition-transform">{item.icon}</div>
                <span className="text-[10px] font-bold text-[var(--c-text-2)] group-hover:text-[var(--c-brand)] text-center uppercase leading-tight">{item.label}</span>
              </Link>
            ))}
          </div>
          {location.state?.moduleDisabled && (
            <p className="mt-3 ds-alert ds-alert-warning text-xs">{t('modules.routeDisabled')}</p>
          )}
        </div>
      )}

      {/* Stats cards */}
      <div className="ds-grid-stats">
        <StatCard title={t('dashboard.salesToday')} value={<CurrencyDisplay amount={stats.dailyTotal} from="XAF" />} icon={<TrendingUp />} color="bg-blue-600" trend={12} />
        <StatCard title={t('dashboard.salesCount')} value={stats.saleCount} icon={<ShoppingCart />} color="bg-green-600" />
        <StatCard title={t('dashboard.stockCritical')} value={stats.criticalCount} icon={<AlertCircle />} color="bg-orange-600" />
        <StatCard title={t('dashboard.totalProducts')} value={stats.activeProducts} icon={<Package />} color="bg-purple-600" />
      </div>

      {/* Listes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
        {/* Ventes récentes */}
        <div className="ds-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--c-text)] text-base">{t('dashboard.recentSales')}</h2>
            <button onClick={() => navigate('/history')} className="ds-btn ds-btn-ghost ds-btn-sm text-xs">{t('dashboard.viewAll')}</button>
          </div>
          <div className="space-y-1">
            {stats.recentSales.length > 0 ? (
              stats.recentSales.map(sale => (
                <div key={sale.id} className="ds-list-item">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${sale.status === SaleStatus.VALIDATED ? 'bg-[var(--c-success)]' : 'bg-[var(--c-text-3)]'}`}>
                    {sale.saleNumber.slice(-1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--c-text)] truncate">{sale.saleNumber}</p>
                    <p className="text-xs text-[var(--c-text-3)] truncate">
                      {new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {sale.clientName || t('dashboard.punctualClient')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-sm text-[var(--c-text)]"><CurrencyDisplay amount={sale.total} from="XAF" /></p>
                    <span className={`ds-badge text-[9px] ${sale.status === SaleStatus.VALIDATED ? 'ds-badge-success' : 'ds-badge-neutral'}`}>{sale.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-[var(--c-text-3)] text-sm">{t('dashboard.noSalesToday')}</div>
            )}
          </div>
        </div>

        {/* Stock critique */}
        <div className="ds-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[var(--c-text)] text-base">{t('dashboard.stockCritical')}</h2>
            <button onClick={() => navigate('/stock')} className="ds-btn ds-btn-ghost ds-btn-sm text-xs">{t('dashboard.manageStock')}</button>
          </div>
          <div className="space-y-1">
            {stats.criticalProducts.length > 0 ? (
              stats.criticalProducts.map(product => (
                <div key={product.id} className="ds-list-item">
                  <div className="w-9 h-9 rounded-[var(--r-md)] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(234,88,12,0.08)' }}>
                    <Package className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[var(--c-text)] truncate">{product.name}</p>
                    <p className="text-xs text-[var(--c-text-3)] truncate">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-black text-orange-500">{product.stock}</p>
                    <p className="text-[10px] text-[var(--c-text-3)]">/ {product.criticalThreshold}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <CheckCircle2 className="w-10 h-10 text-[var(--c-success)] opacity-30" />
                <p className="text-[var(--c-text-3)] text-sm">{t('dashboard.allInOrder')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmActionModal
        open={!!pending}
        actionId={pending?.actionId ?? 'importJson'}
        message={pending?.message ?? ''}
        level={pending?.level}
        neverAsk={neverAsk}
        onNeverAskChange={setNeverAsk}
        onCancel={cancel}
        onConfirm={confirm}
      />
    </div>
  );
};

export default Dashboard;