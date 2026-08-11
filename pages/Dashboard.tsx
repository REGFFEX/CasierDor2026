
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

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <div className={`flex items-center mt-2 text-xs font-semibold ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
            <span>{Math.abs(trend)}% {t('dashboard.vsYesterday')}</span>
          </div>
        )}
      </div>
      <div className={`p-4 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleExportData}
            className="btn-3d flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-bold"
            title={t('dashboard.export')}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.export')}</span>
          </button>
          <button
            onClick={() => {
              if (!isAdmin) {
                alert(t('settings.sessionAdmin'));
                return;
              }
              fileInputRef.current?.click();
            }}
            className="btn-3d flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-bold"
            title={t('dashboard.import')}
          >
            <UploadCloud className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.import')}</span>
          </button>
          <button
            onClick={() => alert(t('dashboard.syncWip'))}
            className="btn-3d flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-xl shadow-sm border border-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-bold"
            title={t('dashboard.syncBtn')}
          >
            <CloudSync className="w-4 h-4" />
            <span className="hidden sm:inline">{t('dashboard.syncBtn')}</span>
          </button>
          <div className="flex items-center space-x-3 text-sm font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="hidden lg:inline">{formatDateTime(new Date(), language, { includeTime: true, dateStyle: 'full', timeStyle: 'short' })}</span>
            <span className="lg:hidden">{formatDateTime(new Date(), language, { includeTime: true, dateStyle: 'short', timeStyle: 'short' })}</span>
          </div>
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleImportData} accept=".json,application/json" className="hidden" />

      {/* Bannière de l'entreprise / Photo du bâtiment */}
      {settings.buildingImage && (
        <div className="w-full h-48 md:h-64 rounded-[2rem] overflow-hidden relative shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <img src={settings.buildingImage} alt={t('dashboard.building')} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6 md:p-8">
             <h2 className="text-white text-2xl md:text-3xl font-black drop-shadow-lg">{settings.name || 'Notre Entreprise'}</h2>
             {settings.address && <p className="text-white/90 text-sm font-bold flex items-center mt-1"><MapPin className="w-4 h-4 mr-1" /> {settings.address}</p>}
          </div>
        </div>
      )}

      {settings.showDashboardShortcuts !== false && shortcutItems.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">{t('dashboard.shortcuts')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {shortcutItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`btn-3d flex flex-col items-center p-4 rounded-2xl bg-white hover:${item.bgColor?.split(' ')[0] || 'bg-blue-50'} border-b-4 ${item.borderColor || 'border-blue-600'} shadow-sm transition-all overflow-hidden relative group`}
              >
                <div className={`mb-2 ${item.color || 'text-blue-600'} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                <span className="text-[10px] font-bold text-gray-700 text-center uppercase leading-tight z-10">{item.label}</span>
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${item.bgColor?.split(' ')[0] || 'bg-blue-50'}`} />
              </Link>
            ))}
          </div>
          {location.state?.moduleDisabled && (
            <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
              {t('modules.routeDisabled')}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.salesToday')}
          value={<CurrencyDisplay amount={stats.dailyTotal} from="XAF" />}
          icon={<TrendingUp className="w-6 h-6" />}
          color="bg-blue-600"
          trend={12}
        />
        <StatCard
          title={t('dashboard.salesCount')}
          value={stats.saleCount}
          icon={<ShoppingCart className="w-6 h-6" />}
          color="bg-green-600"
        />
        <StatCard
          title={t('dashboard.stockCritical')}
          value={stats.criticalCount}
          icon={<AlertCircle className="w-6 h-6" />}
          color="bg-orange-600"
        />
        <StatCard
          title={t('dashboard.totalProducts')}
          value={stats.activeProducts}
          icon={<Package className="w-6 h-6" />}
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">{t('dashboard.recentSales')}</h2>
            <button onClick={() => navigate('/history')} className="text-sm text-blue-600 font-semibold hover:underline">{t('dashboard.viewAll')}</button>
          </div>
          <div className="space-y-4">
            {stats.recentSales.length > 0 ? (
              stats.recentSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${sale.status === SaleStatus.VALIDATED ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                      {sale.saleNumber.slice(-1)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{sale.saleNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(sale.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {sale.clientName || t('dashboard.punctualClient')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm"><CurrencyDisplay amount={sale.total} from="XAF" /></p>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${sale.status === SaleStatus.VALIDATED ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                      {sale.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-400 text-sm">{t('dashboard.noSalesToday')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">{t('dashboard.stockCritical')}</h2>
            <button onClick={() => navigate('/stock')} className="text-sm text-blue-600 font-semibold hover:underline">{t('dashboard.manageStock')}</button>
          </div>
          <div className="space-y-4">
            {stats.criticalProducts.length > 0 ? (
              stats.criticalProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 rounded-xl border border-orange-100 bg-orange-50/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-orange-100">
                      <Package className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku} • {product.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-orange-600">{product.stock}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{t('stock.threshold')}: {product.criticalThreshold}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20" />
                <p className="text-gray-400 text-sm">{t('dashboard.allInOrder')}</p>
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
