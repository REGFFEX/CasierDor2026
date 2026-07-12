
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ArrowUpRight, ArrowDownLeft, History, AlertTriangle, PlusCircle, MinusCircle, Search, Filter, Info } from 'lucide-react';
import ProductInfoModal from '../components/ProductInfoModal';
import PageBackButton from '../components/PageBackButton';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { Product, ProductType, StoreSettings } from '../types';
import HighlightQuery from '../components/HighlightQuery';
import { enumLabel } from '../utils/enumLabels';

const StockPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>(getStoreData(STORAGE_KEYS.PRODUCTS, []));
  const [movements, setMovements] = useState<any[]>(getStoreData(STORAGE_KEYS.MOVEMENTS, []));
  const [isAdjusting, setIsAdjusting] = useState<Product | null>(null);
  const [adjType, setAdjType] = useState<'IN' | 'OUT'>('IN');
  const [adjQty, setAdjQty] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'old' | 'price' | 'critical'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [settings] = useState<StoreSettings>(getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [infoProduct, setInfoProduct] = useState<Product | null>(null);

  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = !filterType || p.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'recent') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'old') return (a.createdAt || 0) - (b.createdAt || 0);
      if (sortBy === 'price') return b.price - a.price;
      if (sortBy === 'critical') {
        const aStatus = a.stock <= a.criticalThreshold ? 1 : 0;
        const bStatus = b.stock <= b.criticalThreshold ? 1 : 0;
        return bStatus - aStatus;
      }
      return 0;
    });

  const handleAdjust = () => {
    if (!isAdjusting || adjQty <= 0) return;

    const finalQty = adjType === 'IN' ? adjQty : -adjQty;
    const newProducts = products.map(p => {
      if (p.id === isAdjusting.id) {
        return { ...p, stock: p.stock + finalQty };
      }
      return p;
    });

    const newMov = {
      id: Math.random().toString(36).substr(2, 9),
      productId: isAdjusting.id,
      productName: isAdjusting.name,
      type: adjType === 'IN' ? 'IN' : 'OUT',
      quantity: adjQty,
      date: Date.now(),
      prevStock: isAdjusting.stock,
      newStock: isAdjusting.stock + finalQty
    };

    setProducts(newProducts);
    setStoreData(STORAGE_KEYS.PRODUCTS, newProducts);
    setMovements([newMov, ...movements]);
    setStoreData(STORAGE_KEYS.MOVEMENTS, [newMov, ...movements]);
    setIsAdjusting(null);
    setAdjQty(0);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <PageBackButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('stock.title')}</h1>
            <p className="text-gray-500">{t('stock.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 no-print">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('stock.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 bg-white border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-6 py-3 border font-bold rounded-2xl shadow-sm transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter className="w-5 h-5" />
          <span>{t('stock.filter')}</span>
        </button>
      </div>

      {showFilters && (
        <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.category')}</label>
            <select className="px-4 py-2 bg-gray-50 border rounded-xl outline-none text-xs font-bold" value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">{t('stock.category.all')}</option>
              {Object.values(ProductType).map((pt) => <option key={pt} value={pt}>{enumLabel(t, 'productType', pt)}</option>)}
              {settings.customProductTypes?.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.sortBy')}</label>
            <select className="px-4 py-2 bg-gray-50 border rounded-xl outline-none text-xs font-bold" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
              <option value="recent">{t('stock.sort.recent')}</option>
              <option value="old">{t('stock.sort.old')}</option>
              <option value="price">{t('stock.sort.price')}</option>
              <option value="critical">{t('stock.sort.stock')}</option>
            </select>
          </div>
          <button
            onClick={() => { setFilterType(''); setSortBy('recent'); setSearchQuery(''); }}
            className="mt-auto px-4 py-2 text-red-500 text-[10px] font-bold uppercase hover:bg-red-50 rounded-xl transition-all"
          >
            {t('stock.reset')}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Stock List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-bold flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>{t('stock.currentStatus')}</span>
          </h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredProducts.map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border border-gray-100 shadow-sm shrink-0 bg-gray-50 flex items-center justify-center">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center font-black text-sm ${p.stock <= p.criticalThreshold ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                          {p.stock}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        <HighlightQuery text={p.name} query={searchQuery} />
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        {t('stock.threshold')}: {p.criticalThreshold} • {t('stock.sku')}: <HighlightQuery text={p.sku} query={searchQuery} />
                        {p.createdAt && (
                          <span className="ml-2 lowercase italic opacity-70">
                            • {t('stock.createdOn')} {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setInfoProduct(p)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      aria-label={t('stock.productInfo')}
                    >
                      <Info className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setIsAdjusting(p); setAdjType('IN'); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all">
                      <PlusCircle className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setIsAdjusting(p); setAdjType('OUT'); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all">
                      <MinusCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="space-y-4">
          <h2 className="font-bold flex items-center space-x-2">
            <History className="w-5 h-5 text-purple-600" />
            <span>{t('stock.recentMovements')}</span>
          </h2>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {movements.length === 0 ? (
              <p className="text-center py-8 text-gray-400 text-sm">{t('stock.noMovements')}</p>
            ) : (
              movements.map(m => (
                <div key={m.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">{new Date(m.date).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}</p>
                    <p className="text-sm font-bold">{m.productName}</p>
                    <p className="text-[10px] text-gray-400">Stock: {m.prevStock} → {m.newStock}</p>
                  </div>
                  <div className={`flex items-center space-x-1 font-black ${m.type === 'Entrée' || m.type === 'IN' ? 'text-green-600' : 'text-red-600'}`}>
                    {m.type === 'Entrée' || m.type === 'IN' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    <span>{m.quantity}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {isAdjusting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('stock.adjustment')} : {isAdjusting.name}</h2>
              <button onClick={() => setIsAdjusting(null)} className="p-2 bg-gray-200 rounded-full"><PlusCircle className="w-4 h-4 rotate-45" /></button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex rounded-2xl bg-gray-100 p-1">
                <button onClick={() => setAdjType('IN')} className={`flex-1 py-3 font-bold rounded-xl transition-all ${adjType === 'IN' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500'}`}>{t('stock.entry').toUpperCase()}</button>
                <button onClick={() => setAdjType('OUT')} className={`flex-1 py-3 font-bold rounded-xl transition-all ${adjType === 'OUT' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-500'}`}>{t('stock.exit').toUpperCase()}</button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.qtyToAdjust')}</label>
                <input type="number" className="w-full px-4 py-4 bg-gray-50 border rounded-2xl text-2xl font-black text-center outline-none focus:ring-2 focus:ring-blue-500" value={adjQty} onChange={e => setAdjQty(parseInt(e.target.value) || 0)} autoFocus />
              </div>
              <button onClick={handleAdjust} className={`w-full py-4 text-white font-bold rounded-2xl shadow-xl transition-all ${adjType === 'IN' ? 'bg-blue-600 shadow-blue-100' : 'bg-red-600 shadow-red-100'}`}>
                {t('stock.confirmAdjustment')}
              </button>
            </div>
          </div>
        </div>
      )}
      {infoProduct && <ProductInfoModal product={infoProduct} onClose={() => setInfoProduct(null)} />}
    </div>
  );
};

export default StockPage;
