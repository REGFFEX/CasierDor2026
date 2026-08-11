
import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Filter, Info } from 'lucide-react';
import ScrollablePanel from '../components/ScrollablePanel';
import ProductInfoModal from '../components/ProductInfoModal';
import ConfirmActionModal from '../components/ConfirmActionModal';
import PageBackButton from '../components/PageBackButton';
import { getStoreData, setStoreData, addActivity, moveToTrash, DEFAULT_SETTINGS, STORAGE_KEYS } from '../store';
import { Product, ProductType, LogAction, UserRole, StoreSettings } from '../types';
import CurrencyDisplay from '../components/CurrencyDisplay';
import HighlightQuery from '../components/HighlightQuery';
import { useLanguage } from '../utils/languageContext';
import { enumLabel } from '../utils/enumLabels';
import { getActivityUserName } from '../utils/companyProfile';

const ProductList: React.FC = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>(getStoreData(STORAGE_KEYS.PRODUCTS, []));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [sortBy, setSortBy] = useState<'recent' | 'old' | 'price_asc' | 'price_desc'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [settings, setSettings] = useState<StoreSettings>(getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [showTypeManager, setShowTypeManager] = useState(false);
  const [selectedProductInfo, setSelectedProductInfo] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

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
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0;
    });

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
  };

  const confirmDeleteAction = () => {
    if (productToDelete) {
      const newProducts = products.filter(p => p.id !== productToDelete.id);
      setProducts(newProducts);
      setStoreData(STORAGE_KEYS.PRODUCTS, newProducts);
      moveToTrash(productToDelete, 'PRODUCT');
      setProductToDelete(null);
    }
  };

  const ProductForm = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<Partial<Product>>(editingProduct || {
      sku: '',
      name: '',
      image: '',
      type: ProductType.BEVERAGE,
      price: 0,
      stock: 0,
      criticalThreshold: 10,
      purchasePrice: 0,
      active: true
    });

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert(t('settings.selectValidImage'));
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compression en JPEG pour économiser de la place
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFormData({ ...formData, image: dataUrl });
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        alert(t('settings.imageLoadError'));
      };
      reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      let newProducts;
      if (editingProduct) {
        newProducts = products.map(p => p.id === editingProduct.id ? { ...p, ...formData, updatedAt: Date.now() } as Product : p);
      } else {
        const newProd: Product = {
          ...formData,
          id: Math.random().toString(36).substr(2, 9),
          createdAt: Date.now(),
          updatedAt: Date.now()
        } as Product;
        newProducts = [newProd, ...products];
      }
      setProducts(newProducts);
      setStoreData(STORAGE_KEYS.PRODUCTS, newProducts);

      // Log l'activité
      addActivity({
        userName: getActivityUserName(settings),
        userRole: settings.userRole || UserRole.ADMIN,
        action: editingProduct ? LogAction.UPDATE : LogAction.CREATE,
        details: `${editingProduct ? t('stock.updateLog', { name: formData.name }) : t('stock.creationLog', { name: formData.name })}`,
        module: 'PRODUCT'
      });

      setIsModalOpen(false);
      setEditingProduct(null);
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200 max-h-[92vh] flex flex-col">
          <div className="p-6 sm:p-8 border-b flex items-center justify-between bg-gray-50 shrink-0">
            <h2 className="text-xl font-bold text-gray-900">{editingProduct ? t('stock.editProduct') : t('stock.addProduct')}</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">{t('button.close')}</button>
          </div>
          <ScrollablePanel maxHeight="calc(92vh - 5.5rem)" innerClassName="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.codeSKU')} *</label>
                <input
                  required
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sku}
                  onChange={e => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.type')}</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                >
                  {Object.values(ProductType).map((pt) => <option key={pt} value={pt}>{enumLabel(t, 'productType', pt)}</option>)}
                  {settings.customProductTypes?.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.productName')} *</label>
              <input
                required
                className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('settings.logoLabel') || 'Product Image'}</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="w-full sm:w-32 h-32 rounded-2xl border border-gray-200 overflow-hidden bg-gray-100 shadow-sm flex items-center justify-center ring-1 ring-gray-100">
                    {formData.image ? (
                      <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 uppercase font-bold">{t('button.noImage') || 'No image'}</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t('form.upload')}
                    </button>
                    <button
                      type="button"
                      className="w-full sm:w-auto px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all"
                      onClick={() => setFormData({ ...formData, image: '' })}
                    >
                      {t('button.clear')}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.unitPrice')} (FCFA)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.purchasePrice') || 'Prix Achat'} (FCFA)</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.purchasePrice || 0}
                  onChange={e => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.initialStock')}</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.criticalThreshold')}</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.criticalThreshold}
                  onChange={e => setFormData({ ...formData, criticalThreshold: Number(e.target.value) })}
                />
              </div>
            </div>
            <button type="submit" className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 mt-4">
              {editingProduct ? t('stock.updateButton') : t('stock.saveProduct')}
            </button>
            </form>
          </ScrollablePanel>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <PageBackButton />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('stock.title')}</h1>
            <p className="text-gray-500">{t('stock.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="fixed bottom-24 right-6 z-40 md:static md:z-auto flex items-center justify-center p-4 md:px-6 md:py-3 bg-blue-600 text-white font-bold rounded-full md:rounded-xl shadow-xl shadow-blue-200 transition-all hover:-translate-y-0.5 md:hover:-translate-y-1"
        >
          <Plus className="w-6 h-6 md:w-5 md:h-5" />
          <span className="hidden md:inline md:ml-2">{t('stock.newProduct')}</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t('stock.searchPlaceholder')}
            className="w-full pl-12 pr-4 py-3 bg-white border rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 px-6 py-3 border font-bold rounded-xl shadow-sm transition-all ${showFilters ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
        >
          <Filter className="w-5 h-5" />
          <span>{t('stock.filtersAndSort')}</span>
        </button>
      </div>

      {showFilters && (
        <div className="p-6 bg-white border border-gray-100 rounded-3xl shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.category')}</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFilterType('')}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${!filterType ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {t('stock.allCategories')}
                </button>
                {Object.values(ProductType).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setFilterType(pt)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${filterType === pt ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    {enumLabel(t, 'productType', pt)}
                  </button>
                ))}
                {settings.customProductTypes?.map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${filterType === t ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
              <div className="space-y-1 flex-1 max-w-xs">
                <label className="text-[10px] font-bold text-gray-400 uppercase">{t('stock.sortBy')}</label>
                <select className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl outline-none text-sm font-bold" value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                  <option value="recent">{t('stock.mostRecent')}</option>
                  <option value="old">{t('stock.oldest')}</option>
                  <option value="price_asc">{t('stock.priceAscending')}</option>
                  <option value="price_desc">{t('stock.priceDescending')}</option>
                </select>
              </div>
            <div className="mt-auto">
              <button
                onClick={() => setShowTypeManager(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t('stock.manageTypes')}</span>
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-transparent md:bg-white md:rounded-3xl md:border md:border-gray-100 md:shadow-sm overflow-hidden">
        {/* Vue Mobile : Cartes (cachées sur PC) */}
        <div className="md:hidden space-y-3 pb-24 px-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-bold">{t('stock.noProductFound') || 'Aucun produit'}</p>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className={`bg-white border border-gray-100 p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] flex flex-col gap-3 relative ${!product.active ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-blue-400"><Package className="w-6 h-6" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 truncate">
                      <HighlightQuery text={product.name} query={searchQuery} />
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-100 rounded-md text-gray-600">{product.type}</span>
                      <span className="text-[9px] font-bold text-gray-400 flex items-center">
                        SKU: <HighlightQuery text={product.sku} query={searchQuery} />
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-base font-black text-blue-600">
                      <CurrencyDisplay amount={product.price} from="XAF" />
                    </div>
                    <div className="flex flex-col items-end mt-1">
                      <span className={`text-xs font-black ${product.stock <= product.criticalThreshold ? 'text-orange-600' : 'text-green-600'}`}>
                        {product.stock} en stock
                      </span>
                      {product.stock <= product.criticalThreshold && (
                        <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5">Faible</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 mt-1">
                  <button
                    onClick={() => setSelectedProductInfo(product)}
                    className="flex-1 py-2 text-xs font-bold bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" /> Info
                  </button>
                  <button
                    onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                    className="flex-1 py-2 text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl flex items-center justify-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteClick(product)}
                    className="px-4 py-2 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Vue Desktop : Tableau */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">{t('stock.product')}</th>
                <th className="px-6 py-4">{t('stock.type')}</th>
                <th className="px-6 py-4">{t('stock.unitPrice')}</th>
                <th className="px-6 py-4">{t('stock.purchasePrice') || 'Prix Achat'}</th>
                <th className="px-6 py-4">{t('stock.currentStock')}</th>
                <th className="px-6 py-4">{t('stock.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map(product => (
                <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${!product.active ? 'opacity-50 grayscale' : ''}`}>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm flex items-center justify-center">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-blue-600"><Package className="w-5 h-5" /></div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          <HighlightQuery text={product.name} query={searchQuery} />
                        </p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">
                          SKU: <HighlightQuery text={product.sku} query={searchQuery} />
                          {product.createdAt && (
                            <span className="ml-2 text-[9px] lowercase italic opacity-70">
                              • {t('stock.createdOn')} {new Date(product.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-lg text-gray-600">{product.type}</span>
                  </td>
                  <td className="px-6 py-5 font-bold text-gray-900">
                    <CurrencyDisplay amount={product.price} from="XAF" />
                  </td>
                  <td className="px-6 py-5 font-bold text-gray-500">
                    <CurrencyDisplay amount={product.purchasePrice || 0} from="XAF" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-black ${product.stock <= product.criticalThreshold ? 'text-orange-600' : 'text-green-600'
                        }`}>
                        {product.stock}
                      </span>
                      {product.stock <= product.criticalThreshold && (
                        <span className="bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded">{t('stock.lowStock')}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedProductInfo(product)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title={t('stock.productInfo') || 'Info'}
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(product)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {isModalOpen && <ProductForm />}

      {/* Modal Gestion des types */}
      {selectedProductInfo && (
        <ProductInfoModal product={selectedProductInfo} onClose={() => setSelectedProductInfo(null)} />
      )}
      {showTypeManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 bg-gray-50 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold">{t('stock.productTypes')}</h2>
              <button onClick={() => setShowTypeManager(false)} className="text-gray-400 hover:text-gray-600">{t('button.close')}</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input
                  id="new-type-input"
                  type="text"
                  placeholder={t('stock.newTypePlaceholder')}
                  className="flex-1 px-4 py-2 bg-gray-50 border rounded-xl outline-none"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('new-type-input') as HTMLInputElement;
                    if (input.value && !settings.customProductTypes.includes(input.value)) {
                      const newTypes = [...settings.customProductTypes, input.value];
                      const updatedSettings = { ...settings, customProductTypes: newTypes };
                      setSettings(updatedSettings);
                      setStoreData(STORAGE_KEYS.SETTINGS, updatedSettings);
                      input.value = '';
                    }
                  }}
                  className="p-2 bg-blue-600 text-white rounded-xl shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {settings.customProductTypes.map(t => (
                  <div key={t} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="text-sm font-bold text-gray-700">{t}</span>
                    <button
                      onClick={() => {
                        const newTypes = settings.customProductTypes.filter(type => type !== t);
                        const updatedSettings = { ...settings, customProductTypes: newTypes };
                        setSettings(updatedSettings);
                        setStoreData(STORAGE_KEYS.SETTINGS, updatedSettings);
                      }}
                      className="text-red-500 hover:bg-red-50 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmActionModal
        open={!!productToDelete}
        actionId={`delete-product-${productToDelete?.id}`}
        title={t('confirm.deleteTitle') || 'Confirmation'}
        message={t('stock.confirmDelete', { name: productToDelete?.name || '' })}
        onCancel={() => setProductToDelete(null)}
        onConfirm={confirmDeleteAction}
      />
    </div>
  );
};

export default ProductList;
