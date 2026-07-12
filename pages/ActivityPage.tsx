import React, { useState } from 'react';
import { History, Search, Filter, Calendar, User as UserIcon, Tag, Info, ArrowDownAz, ArrowUpAz, Clock } from 'lucide-react';
import PageBackButton from '../components/PageBackButton';
import { getStoreData, STORAGE_KEYS } from '../store';
import { Activity, LogAction, UserRole } from '../types';
import { useLanguage } from '../utils/languageContext';
import HighlightQuery from '../components/HighlightQuery';

const ActivityPage: React.FC = () => {
    const { t } = useLanguage();
    const [activities] = useState<Activity[]>(getStoreData(STORAGE_KEYS.ACTIVITIES, []));
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState('all');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const filteredActivities = activities
        .filter(act => {
            const searchStr = `${act.userName} ${act.details} ${act.module} ${act.action}`.toLowerCase();
            const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
            const matchesModule = filterModule === 'all' || act.module === filterModule;
            return matchesSearch && matchesModule;
        })
        .sort((a, b) => {
            return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
        });

    const getActionColor = (action: LogAction | string) => {
        switch (action) {
            case LogAction.CREATE: return 'bg-green-100 text-green-700 border-green-200';
            case LogAction.UPDATE: return 'bg-blue-100 text-blue-700 border-blue-200';
            case LogAction.DELETE: return 'bg-red-100 text-red-700 border-red-200';
            case LogAction.RESTORE: return 'bg-purple-100 text-purple-700 border-purple-200';
            case LogAction.SALE: return 'bg-amber-100 text-amber-700 border-amber-200';
            case LogAction.STOCK_ADJUST: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getModuleIcon = (module: string) => {
        // Icons based on module name
        const m = module.toUpperCase();
        if (m.includes('PRODUCT')) return <Tag className="w-4 h-4" />;
        if (m.includes('CLIENT')) return <UserIcon className="w-4 h-4" />;
        if (m.includes('SALE')) return <History className="w-4 h-4" />;
        return <Info className="w-4 h-4" />;
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <PageBackButton />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <History className="w-8 h-8 text-blue-600" />
                            {t('activity.title')}
                        </h1>
                        <p className="text-gray-500">{t('activity.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                        className="p-3 bg-white border rounded-xl shadow-sm border-gray-100 hover:bg-gray-50 transition-all flex items-center gap-2"
                    >
                        {sortOrder === 'newest' ? <ArrowDownAz className="w-5 h-5" /> : <ArrowUpAz className="w-5 h-5" />}
                        <span className="text-xs font-bold uppercase">{sortOrder === 'newest' ? t('activity.newest') : t('activity.oldest')}</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 no-print">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder={t('activity.searchPlaceholder')}
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
                    <option value="all">{t('filter.allModules') || 'Tous les modules'}</option>
                    <option value="PRODUCT">Produits</option>
                    <option value="CLIENT">Clients</option>
                    <option value="SALE">Ventes</option>
                    <option value="STOCK">Stocks</option>
                    <option value="TRASH">Corbeille</option>
                    <option value="USER">Utilisateurs</option>
                    <option value="ACCOUNTING">Comptabilité</option>
                    <option value="STOCK">Stock / Réappro</option>
                    <option value="SETTINGS">Paramètres</option>
                    <option value="AUTH">Connexion</option>
                    <option value="SYSTEM">Système</option>
                </select>
            </div>

            <div className="relative space-y-4">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-100 hidden sm:block" />

                {filteredActivities.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
                        <Clock className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 italic">{t('activity.empty')}</p>
                    </div>
                ) : (
                    filteredActivities.map((activity) => (
                        <div key={activity.id} className="relative pl-0 sm:pl-12 group">
                            {/* Timeline dot */}
                            <div className="absolute left-5 top-6 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white shadow-sm hidden sm:block z-10 transition-transform group-hover:scale-125" />

                            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <UserIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 leading-tight">
                                                <HighlightQuery text={activity.userName} query={searchQuery} />
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{activity.userRole}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold bg-gray-50 px-3 py-1.5 rounded-full">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>{new Date(activity.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${getActionColor(activity.action)}`}>
                                            <HighlightQuery text={activity.action} query={searchQuery} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-50">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                        <HighlightQuery text={activity.details} query={searchQuery} />
                                    </p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white rounded-lg border border-gray-100 text-[10px] font-bold text-gray-500 uppercase">
                                            {getModuleIcon(activity.module)}
                                            <HighlightQuery text={activity.module} query={searchQuery} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivityPage;
