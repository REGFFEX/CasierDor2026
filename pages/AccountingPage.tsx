import React, { useState, useEffect } from 'react';
import CurrencyDisplay from '../components/CurrencyDisplay';
import ScrollablePanel from '../components/ScrollablePanel';
import PageBackButton from '../components/PageBackButton';
import { enumLabel } from '../utils/enumLabels';
import {
    Wallet,
    Plus,
    Filter,
    ArrowUpCircle,
    ArrowDownCircle,
    Search,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    Calculator,
    PieChart,
    X,
    Save
} from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, setStoreData, STORAGE_KEYS, addActivity, DEFAULT_SETTINGS } from '../store';
import { getActivityUserName } from '../utils/companyProfile';
import {
    AccountingTransaction,
    TransactionType,
    TransactionCategory,
    LogAction,
    UserRole
} from '../types';

const AccountingPage: React.FC = () => {
    const { t } = useLanguage();
    const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    const [activeMode, setActiveMode] = useState<'ACCOUNTING' | 'FINANCIAL' | 'MIXED'>('MIXED');
    const [transactions, setTransactions] = useState<AccountingTransaction[]>([]);
    const [activeTab, setActiveTab] = useState<'journal' | 'ledger' | 'balance'>('journal');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<TransactionCategory | 'ALL'>('ALL');
    const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year'>('month');

    useEffect(() => {
        const data = getStoreData<AccountingTransaction[]>(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS, []);
        setTransactions(data.sort((a, b) => b.date - a.date));
    }, []);

    const totalIncome = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const handleExport = () => {
        const headers = ['Date', 'Heure', 'Type', 'Catégorie', 'Montant', 'Description'];
        const csvContent = [
            headers.join(';'),
            ...transactions.map(t => [
                new Date(t.date).toLocaleDateString(),
                new Date(t.date).toLocaleTimeString(),
                t.type,
                t.category,
                t.amount,
                `"${t.description.replace(/"/g, '""')}"`
            ].join(';'))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `comptabilite_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <PageBackButton />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Calculator className="w-8 h-8 text-blue-600" />
                        {t('accounting.title')}
                    </h1>
                    <p className="text-gray-500">{t('accounting.subtitle')}</p>
                </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 font-medium"
                    >
                        <Download className="w-4 h-4" />
                        {t('button.export')}
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        {t('accounting.addTransaction')}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-2 py-1 rounded-lg">{t('accounting.income')}</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 line-clamp-1">
                        <CurrencyDisplay amount={totalIncome} showSecondary={true} />
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{t('accounting.totalIncome')}</p>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                            <TrendingDown className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 px-2 py-1 rounded-lg">{t('accounting.expense')}</span>
                    </div>
                    <div className="text-2xl font-black text-gray-900 line-clamp-1">
                        <CurrencyDisplay amount={totalExpense} showSecondary={true} />
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{t('accounting.totalExpense')}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl shadow-lg shadow-blue-100 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-100 bg-white/10 px-2 py-1 rounded-lg">{t('accounting.balance')}</span>
                    </div>
                    <div className="text-2xl font-black line-clamp-1">
                        <CurrencyDisplay amount={balance} className="text-white" showSecondary={true} />
                    </div>
                    <p className="text-blue-100 text-xs mt-1">{t('accounting.currentBalance')}</p>
                </div>
            </div>

            {/* Mode Selector */}
            <div className="flex justify-center mb-8 no-print">
                <div className="bg-gray-100 p-1 rounded-2xl flex gap-1">
                    <button
                        onClick={() => setActiveMode('ACCOUNTING')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeMode === 'ACCOUNTING' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {t('accounting.mode.accounting')}
                    </button>
                    <button
                        onClick={() => setActiveMode('MIXED')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeMode === 'MIXED' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {t('accounting.mode.mixed')}
                    </button>
                    <button
                        onClick={() => setActiveMode('FINANCIAL')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeMode === 'FINANCIAL' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        {t('accounting.mode.financial')}
                    </button>
                </div>
            </div>

            {/* Navigation Tabs (Dynamic based on Mode) */}
            <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-2xl mx-auto no-print overflow-x-auto scrollbar-hide">
                {(activeMode === 'ACCOUNTING' || activeMode === 'MIXED') && (
                    <button
                        onClick={() => setActiveTab('journal')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'journal' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <PieChart className="w-4 h-4" />
                        {t('accounting.tab.journal')}
                    </button>
                )}
                {(activeMode === 'ACCOUNTING' || activeMode === 'MIXED') && (
                    <button
                        onClick={() => setActiveTab('ledger')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'ledger' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Calculator className="w-4 h-4" />
                        {t('accounting.tab.ledger')}
                    </button>
                )}
                {(activeMode === 'FINANCIAL' || activeMode === 'MIXED') && (
                    <button
                        onClick={() => setActiveTab('balance')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'balance' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        {t('accounting.tab.reports')}
                    </button>
                )}
            </div>

            {/* Content Tab: Journal (Transactions) */}
            {activeTab === 'journal' && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('stock.searchPlaceholder')}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-gray-600 font-bold shadow-sm hover:bg-gray-50 transition-all">
                            <Filter className="w-5 h-5" />
                            {t('stock.filter')}
                        </button>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <th className="px-6 py-4">{t('accounting.table.date')}</th>
                                        <th className="px-6 py-4">{t('accounting.table.category')}</th>
                                        <th className="px-6 py-4">{t('accounting.table.desc')}</th>
                                        <th className="px-6 py-4 text-right">{t('accounting.table.amount')}</th>
                                        <th className="px-6 py-4">{t('accounting.table.status')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                                {t('accounting.noTransactions')}
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.map((t) => (
                                            <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {new Date(t.date).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400">
                                                        {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">
                                                        {t.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 font-medium line-clamp-1">
                                                        {t.description}
                                                    </div>
                                                </td>
                                                <td className={`px-6 py-4 text-right text-sm font-black ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500'
                                                    }`}>
                                                    {t.type === TransactionType.INCOME ? '+' : '-'} {t.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        {t.type === TransactionType.INCOME ? (
                                                            <ArrowUpCircle className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <ArrowDownCircle className="w-4 h-4 text-red-500" />
                                                        )}
                                                        <span className="text-[10px] font-bold text-gray-500 uppercase">
                                                            {t.type}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Tab: General Ledger */}
            {activeTab === 'ledger' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.values(TransactionCategory).map((category) => {
                            const categoryTransactions = transactions.filter(t => t.category === category);
                            const categoryTotal = categoryTransactions.reduce((sum, t) => sum + (t.type === TransactionType.INCOME ? t.amount : -t.amount), 0);

                            if (categoryTransactions.length === 0) return null;

                            return (
                                <div key={category} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                        <h3 className="font-bold text-gray-900">{category}</h3>
                                        <span className={`text-xs font-black px-2 py-1 rounded-lg ${categoryTotal >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {categoryTotal >= 0 ? '+' : ''}{categoryTotal.toLocaleString()} FCFA
                                        </span>
                                    </div>
                                    <div className="p-0 flex-1 overflow-y-auto max-h-[300px]">
                                        <table className="w-full text-left text-xs">
                                            <tbody className="divide-y divide-gray-50">
                                                {categoryTransactions.map(t => (
                                                    <tr key={t.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-gray-500">{new Date(t.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-900 line-clamp-1">{t.description}</td>
                                                        <td className={`px-4 py-3 text-right font-bold ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500'}`}>
                                                            {t.amount.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-3 bg-gray-50/50 border-t border-gray-50 text-center">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">{categoryTransactions.length} {t('accounting.operations')}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Content Tab: Financial Reports */}
            {activeTab === 'balance' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                {t('accounting.distribution.revenue')}
                            </h3>
                            <div className="space-y-6">
                                {/* Dummy charts or progress bars for now */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                        <span>Ventes directes</span>
                                        <span>75%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-600 rounded-full w-[75%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                        <span>Services / Autres</span>
                                        <span>25%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-blue-400 rounded-full w-[25%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                {t('accounting.distribution.expense')}
                            </h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                        <span>Achats Stock</span>
                                        <span>60%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full w-[60%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                        <span>Charges Fixes</span>
                                        <span>30%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-orange-400 rounded-full w-[30%]"></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
                                        <span>Autres</span>
                                        <span>10%</span>
                                    </div>
                                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-gray-400 rounded-full w-[10%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-purple-600" />
                                {t('accounting.financial.summary')}
                            </h3>
                            <select className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-600 outline-none">
                                <option>Ce mois</option>
                                <option>Cette année</option>
                                <option>Tout</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="flex flex-col gap-2 p-4 bg-green-50 rounded-2xl border border-green-100">
                                <span className="text-xs font-bold text-green-600 uppercase tracking-widest">{t('accounting.financial.netMargin')}</span>
                                <span className="text-3xl font-black text-green-700">
                                    {Math.round((balance / (totalIncome || 1)) * 100)}%
                                </span>
                                <span className="text-[10px] text-green-600 font-medium">{t('accounting.financial.netMarginDesc')}</span>
                            </div>
                            <div className="flex flex-col gap-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t('accounting.financial.avgTransaction')}</span>
                                <span className="text-3xl font-black text-blue-700">
                                    {Math.round(totalIncome / (transactions.length || 1)).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-blue-600 font-medium">{t('accounting.financial.avgTransactionDesc')}</span>
                            </div>
                            <div className="flex flex-col gap-2 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">{t('accounting.financial.projection')}</span>
                                <span className="text-3xl font-black text-purple-700">
                                    {(balance * 1.2).toLocaleString()}
                                </span>
                                <span className="text-[10px] text-purple-600 font-medium">{settings.currency} {t('accounting.financial.projectionDesc')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Add Transaction Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b shrink-0">
                            <h2 className="text-xl font-bold text-gray-900">{t('accounting.form.title')}</h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <ScrollablePanel maxHeight="calc(92vh - 5rem)" innerClassName="p-6">
                        <form className="space-y-4" onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const newTransaction: AccountingTransaction = {
                                id: crypto.randomUUID(),
                                date: new Date(formData.get('date') as string).getTime(),
                                type: formData.get('type') as TransactionType,
                                category: formData.get('category') as TransactionCategory,
                                amount: parseFloat(formData.get('amount') as string),
                                description: formData.get('description') as string,
                                createdAt: Date.now()
                            };

                            const updatedTransactions = [...transactions, newTransaction];
                            setTransactions(updatedTransactions);
                            setStoreData(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS, updatedTransactions);
                            const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
                            addActivity({
                                action: LogAction.ACCOUNTING_RECORD,
                                details: `Nouvelle opération: ${newTransaction.description} (${newTransaction.amount} FCFA)`,
                                userRole: settings.userRole || UserRole.ADMIN,
                                userName: getActivityUserName(settings),
                                module: 'ACCOUNTING'
                            });
                            setIsAddModalOpen(false);
                        }}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('accounting.form.type')}</label>
                                    <select name="type" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500">
                                        {Object.values(TransactionType).map((tt) => (
                                            <option key={tt} value={tt}>{enumLabel(t, 'transactionType', tt)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('accounting.form.date')}</label>
                                    <input
                                        type="date"
                                        name="date"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('accounting.form.category')}</label>
                                <select name="category" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500">
                                    {Object.values(TransactionCategory).map((c) => (
                                        <option key={c} value={c}>{enumLabel(t, 'transactionCategory', c)}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('accounting.form.amount')} ({settings.currency})</label>
                                <input
                                    type="number"
                                    name="amount"
                                    placeholder={t('accounting.form.placeholder.amount') || "Ex: 50000"}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-lg outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    min="0"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">{t('accounting.form.desc')}</label>
                                <input
                                    type="text"
                                    name="description"
                                    placeholder={t('accounting.form.placeholder.desc') || "Ex: Vente de 50 casiers"}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    {t('button.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                                >
                                    <Save className="w-5 h-5" />
                                    {t('button.save')}
                                </button>
                            </div>
                        </form>
                        </ScrollablePanel>
                    </div>
                </div>
            )}
        </div>
    );
};


export default AccountingPage;
