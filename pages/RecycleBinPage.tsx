import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, RefreshCcw, Search, Calendar, Package, Users, Receipt, ShieldAlert, Loader2, Filter, ArrowLeft } from 'lucide-react';
import { getStoreData, setStoreData, STORAGE_KEYS, restoreFromTrash, addActivity, DEFAULT_SETTINGS } from '../store';
import { TrashItem, LogAction, UserRole, StoreSettings } from '../types';
import { useLanguage } from '../utils/languageContext';
import HighlightQuery from '../components/HighlightQuery';
import PageBackButton from '../components/PageBackButton';
import { getActivityUserName } from '../utils/companyProfile';

const RecycleBinPage: React.FC = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [trash, setTrash] = useState<TrashItem[]>(getStoreData(STORAGE_KEYS.RECYCLE_BIN, []));
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState('ALL');
    const [isProcessing, setIsProcessing] = useState<string | null>(null);
    const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

    const filteredTrash = trash.filter(item => {
        const data = item.data;
        const searchString = `${data.name || ''} ${data.sku || ''} ${data.saleNumber || ''} ${item.module}`.toLowerCase();
        const matchesSearch = searchString.includes(searchQuery.toLowerCase());
        const matchesModule = filterModule === 'ALL' || item.module === filterModule;
        return matchesSearch && matchesModule;
    });

    const handleRestore = async (id: string) => {
        setIsProcessing(id);
        const result = restoreFromTrash(id);
        if (result.success) {
            setTrash(getStoreData(STORAGE_KEYS.RECYCLE_BIN, []));
        } else {
            alert(result.error);
        }
        setIsProcessing(null);
    };

    const handlePermanentDelete = (id: string) => {
        if (confirm(t('message.confirmPermanentDelete'))) {
            const updatedTrash = trash.filter(t => t.id !== id);
            const deletedItem = trash.find(t => t.id === id);
            setTrash(updatedTrash);
            setStoreData(STORAGE_KEYS.RECYCLE_BIN, updatedTrash);

            if (deletedItem) {
                addActivity({
                    userName: getActivityUserName(settings),
                    userRole: settings.userRole || UserRole.ADMIN,
                    action: LogAction.DELETE,
                    details: `Suppression définitive de ${deletedItem.module}: ${deletedItem.data.name || deletedItem.data.saleNumber || deletedItem.originalId}`,
                    module: 'TRASH'
                });
            }
        }
    };

    const getModuleIcon = (module: string) => {
        switch (module) {
            case 'PRODUCT': return <Package className="w-5 h-5" />;
            case 'CLIENT': return <Users className="w-5 h-5" />;
            case 'SALE': return <Receipt className="w-5 h-5" />;
            case 'USER': return <ShieldAlert className="w-5 h-5" />;
            default: return <Trash2 className="w-5 h-5" />;
        }
    };

    const getRemainingDays = (expiresAt: number) => {
        const diff = expiresAt - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center space-x-4">
                <PageBackButton />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Trash2 className="w-8 h-8 text-red-500" />
                        {t('trash.title')}
                    </h1>
                    <p className="text-gray-500">{t('trash.subtitle')}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('trash.searchPlaceholder')}
                        className="w-full pl-12 pr-4 py-3 bg-white border rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="px-6 py-3 bg-white border text-gray-600 font-bold rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="ALL">{t('filter.allModules') || 'Tous les modules'}</option>
                    <option value="PRODUCT">{t('nav.products')}</option>
                    <option value="CLIENT">{t('nav.clients')}</option>
                    <option value="SALE">{t('nav.sales')}</option>
                    <option value="USER">{t('nav.users')}</option>
                </select>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <th className="px-6 py-4">{t('trash.item')}</th>
                                <th className="px-6 py-4">{t('trash.module')}</th>
                                <th className="px-6 py-4">{t('trash.deletedAt')}</th>
                                <th className="px-6 py-4">{t('trash.expiresIn')}</th>
                                <th className="px-6 py-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTrash.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                        {t('trash.empty')}
                                    </td>
                                </tr>
                            ) : (
                                filteredTrash.map((item) => (
                                    <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-gray-100 text-gray-500 rounded-xl flex items-center justify-center">
                                                    {getModuleIcon(item.module)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">
                                                        <HighlightQuery text={item.data.name || item.data.saleNumber || item.originalId} query={searchQuery} />
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">ID: {item.originalId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-black px-2 py-1 bg-gray-100 rounded-lg text-gray-600 uppercase">
                                                <HighlightQuery text={item.module} query={searchQuery} />
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>{new Date(item.deletedAt).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`text-xs font-bold ${getRemainingDays(item.expiresAt) <= 3 ? 'text-red-500' : 'text-orange-500'}`}>
                                                {getRemainingDays(item.expiresAt)} {t('trash.days')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleRestore(item.id)}
                                                    disabled={isProcessing === item.id}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                                    title={t('trash.restore')}
                                                >
                                                    {isProcessing === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                                                    <span className="text-[10px] font-bold uppercase hidden sm:inline">{t('trash.restore')}</span>
                                                </button>
                                                <button
                                                    onClick={() => handlePermanentDelete(item.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title={t('button.deleteForever')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};

export default RecycleBinPage;
