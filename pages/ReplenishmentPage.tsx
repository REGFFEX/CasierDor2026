
import React, { useState, useEffect } from 'react';
import {
    Truck,
    Plus,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Package,
    Calendar,
    ArrowRight,
    AlertCircle,
    History as HistoryIcon
} from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import CurrencyDisplay from '../components/CurrencyDisplay';
import ScrollablePanel from '../components/ScrollablePanel';
import PageBackButton from '../components/PageBackButton';
import { getStoreData, setStoreData, STORAGE_KEYS, addActivity, DEFAULT_SETTINGS } from '../store';
import { getActivityUserName } from '../utils/companyProfile';
import {
    ReplenishmentOrder,
    ReplenishmentStatus,
    LogAction,
    Product,
    AccountingTransaction,
    TransactionType,
    TransactionCategory,
    UserRole
} from '../types';

const ReplenishmentPage: React.FC = () => {
    const { t } = useLanguage();
    const [orders, setOrders] = useState<ReplenishmentOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'history' | 'tobuy'>('history');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<ReplenishmentStatus | 'ALL'>('ALL');

    // Modal State
    const [newOrderSupplier, setNewOrderSupplier] = useState('');
    const [newOrderDate, setNewOrderDate] = useState(new Date().toISOString().split('T')[0]);
    const [newOrderItems, setNewOrderItems] = useState<{ productId: string, quantity: number, cost: number }[]>([]);
    const [newOrderStatus, setNewOrderStatus] = useState<ReplenishmentStatus>(ReplenishmentStatus.PENDING);

    // Auto-Restock State
    const [restockList, setRestockList] = useState<{ productId: string, name: string, currentStock: number, suggestedQty: number, cost: number, price: number }[]>([]);

    // Details Modal State
    const [selectedOrder, setSelectedOrder] = useState<ReplenishmentOrder | null>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    useEffect(() => {
        const orderData = getStoreData<ReplenishmentOrder[]>(STORAGE_KEYS.REPLENISHMENT_ORDERS, []);
        const productData = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
        setOrders(orderData.sort((a, b) => b.date - a.date));
        setProducts(productData);

        // Calculate Auto-Restock Suggestions
        const lowStockProducts = productData.filter(p => p.stock <= p.criticalThreshold);
        const suggestions = lowStockProducts.map(p => ({
            productId: p.id,
            name: p.name,
            currentStock: p.stock,
            suggestedQty: Math.max(10, (p.criticalThreshold * 3) - p.stock), // Simple heuristic
            cost: p.purchasePrice || 0,
            price: p.price
        }));
        setRestockList(suggestions);
    }, []);

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.supplier.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'ALL' || order.status === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const getStatusStyle = (status: ReplenishmentStatus) => {
        switch (status) {
            case ReplenishmentStatus.COMPLETED:
                return 'bg-green-50 text-green-600 border-green-100';
            case ReplenishmentStatus.PENDING:
                return 'bg-blue-50 text-blue-600 border-blue-100';
            case ReplenishmentStatus.CANCELLED:
                return 'bg-red-50 text-red-600 border-red-100';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusIcon = (status: ReplenishmentStatus) => {
        switch (status) {
            case ReplenishmentStatus.COMPLETED:
                return <CheckCircle2 className="w-4 h-4" />;
            case ReplenishmentStatus.PENDING:
                return <Clock className="w-4 h-4" />;
            case ReplenishmentStatus.CANCELLED:
                return <XCircle className="w-4 h-4" />;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <PageBackButton />
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Truck className="w-8 h-8 text-blue-600" />
                        {t('replenishment.title') || 'Réapprovisionnement Stock'}
                    </h1>
                    <p className="text-gray-500">{t('replenishment.subtitle') || 'Suivez vos arrivages et gérez vos bons de commande fournisseur.'}</p>
                </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-bold"
                >
                    <Plus className="w-5 h-5" />
                    {t('replenishment.newOrder') || 'Nouvel Arrivage'}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-2xl w-full max-w-md mx-auto mb-6">
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <HistoryIcon className="w-4 h-4" />
                    {t('replenishment.history') || 'Historique'}
                </button>
                <button
                    onClick={() => setActiveTab('tobuy')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'tobuy' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <div className="relative">
                        <Package className="w-4 h-4" />
                        {restockList.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                                {restockList.length}
                            </span>
                        )}
                    </div>
                    {t('replenishment.toBuy') || 'Liste d\'Achats'}
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-black text-gray-900">{orders.length}</div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">{t('replenishment.totalArrivals')}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-black text-gray-900">
                            {orders.filter(o => o.status === ReplenishmentStatus.PENDING).length}
                        </div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">{t('replenishment.pending')}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-2xl text-red-600">
                        <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-black text-gray-800">
                            {products.filter(p => p.stock <= p.criticalThreshold).length}
                        </div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">{t('replenishment.lowStock')}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-2xl text-green-600">
                        <HistoryIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-xl font-black text-gray-900">
                            {orders.filter(o => o.status === ReplenishmentStatus.COMPLETED).length}
                        </div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase">{t('replenishment.completed')}</p>
                    </div>
                </div>
            </div>

            {/* Content: History View */}
            {activeTab === 'history' && (
                <>
                    {/* Filters and Search */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full md:max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder={t('replenishment.searchPlaceholder')}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                            <button
                                onClick={() => setActiveFilter('ALL')}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${activeFilter === 'ALL' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {t('replenishment.all')}
                            </button>
                            {Object.values(ReplenishmentStatus).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setActiveFilter(status)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${activeFilter === status ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Orders Grid/List (History Only) */}
            {activeTab === 'history' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredOrders.length === 0 ? (
                        <div className="col-span-full bg-white rounded-3xl border border-gray-100 p-12 text-center">
                            <Truck className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 italic">{t('replenishment.empty')}</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
                                <div className="p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">
                                            {order.orderNumber}
                                        </span>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase ${getStatusStyle(order.status)}`}>
                                            {getStatusIcon(order.status)}
                                            {order.status}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{order.supplier}</h3>
                                    <div className="flex items-center gap-2 text-gray-400 text-xs mb-4">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {new Date(order.date).toLocaleDateString()}
                                    </div>
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">{t('replenishment.items')}</span>
                                            <span className="font-bold text-gray-900">{order.items.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-400">{t('replenishment.total')}</span>
                                            <span className="font-black text-blue-600">
                                                <CurrencyDisplay amount={order.totalAmount} showSecondary />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase">{t('replenishment.lastUpdate')}: {new Date(order.updatedAt).toLocaleDateString()}</span>
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setIsDetailsModalOpen(true);
                                        }}
                                        className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all text-gray-500"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}

                </div>
            )}

            {/* To Buy View */}
            {activeTab === 'tobuy' && (
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                {t('replenishment.lowStockTitle') || 'Articles en Rupture / Stock Bas'}
                            </h3>
                            <p className="text-sm text-gray-500">{t('replenishment.lowStockDesc') || 'Généré automatiquement basé sur vos seuils d\'alerte.'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    // Logic to add a product manually
                                    const productId = prompt("Entrez l'ID ou le nom du produit à ajouter (simulation pour l'instant, idéalement un modal de sélection)");
                                    if (productId) {
                                        const product = products.find(p => p.name.toLowerCase().includes(productId.toLowerCase()) || p.id === productId);
                                        if (product) {
                                            if (restockList.find(i => i.productId === product.id)) {
                                                alert("Produit déjà dans la liste");
                                                return;
                                            }
                                            setRestockList([...restockList, {
                                                productId: product.id,
                                                name: product.name,
                                                currentStock: product.stock,
                                                suggestedQty: 1,
                                                cost: product.purchasePrice || 0,
                                                price: product.price
                                            }]);
                                        } else {
                                            alert("Produit non trouvé");
                                        }
                                    }
                                }}
                                className="px-4 py-2 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> {t('replenishment.addArticle') || 'Ajouter un article'}
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-2"
                            >
                                <Calendar className="w-4 h-4" /> {t('replenishment.print')}
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400">{t('replenishment.article')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">{t('replenishment.currentStock')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-center">{t('replenishment.criticalThreshold')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-blue-600 text-center bg-blue-50/10">{t('replenishment.estimatedTotal')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-green-600 text-center bg-green-50/10">{t('replenishment.sellingPrice')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-blue-600 text-center bg-blue-50/30">{t('replenishment.suggestedQty')}</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase text-gray-400 text-right">{t('replenishment.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {restockList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                                            {t('replenishment.emptyToBuy') || 'Tout semble en ordre ! Aucun article ne nécessite un réapprovisionnement immédiat.'}
                                        </td>
                                    </tr>
                                ) : (
                                    restockList.map((item, idx) => (
                                        <tr key={item.productId} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-red-100 text-red-700 font-bold px-2 py-1 rounded-lg text-xs">
                                                    {item.currentStock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-500 text-sm">
                                                {products.find(p => p.id === item.productId)?.criticalThreshold}
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-blue-600 bg-blue-50/10">
                                                <CurrencyDisplay amount={item.cost * item.suggestedQty} />
                                            </td>
                                            <td className="px-6 py-4 text-center font-bold text-green-600 bg-green-50/10">
                                                <CurrencyDisplay amount={item.price} className="text-green-600" />
                                            </td>
                                            <td className="px-6 py-4 text-center bg-blue-50/10">
                                                <input
                                                    type="number"
                                                    value={item.suggestedQty}
                                                    onChange={(e) => {
                                                        const newVal = parseInt(e.target.value) || 0;
                                                        const newList = [...restockList];
                                                        newList[idx].suggestedQty = newVal;
                                                        setRestockList(newList);
                                                    }}
                                                    className="w-20 text-center font-bold text-blue-600 border border-blue-200 rounded-lg py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        setRestockList(restockList.filter(i => i.productId !== item.productId));
                                                    }}
                                                    className="text-red-400 hover:text-red-600 font-medium text-xs hover:underline"
                                                >
                                                    Retirer
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {restockList.length > 0 && (
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <button
                                onClick={() => {
                                    // Pre-fill modal with restock list
                                    setNewOrderSupplier('');
                                    setNewOrderDate(new Date().toISOString().split('T')[0]);
                                    setNewOrderItems(restockList.map(item => ({
                                        productId: item.productId,
                                        quantity: item.suggestedQty,
                                        cost: item.cost
                                    })));
                                    setNewOrderStatus(ReplenishmentStatus.PENDING);
                                    setIsAddModalOpen(true);
                                }}
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all"
                            >
                                <Truck className="w-5 h-5" />
                                Créer le Bon de Commande
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Add Order Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                <Truck className="w-6 h-6 text-blue-600" />
                                {t('replenishment.newOrder') || 'Nouvel Arrivage / Commande'}
                            </h2>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <XCircle className="w-6 h-6 text-gray-400" />
                            </button>
                        </div>

                        <ScrollablePanel className="flex-1" maxHeight="calc(90vh - 11rem)" innerClassName="p-6 space-y-6">
                            {/* Header Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('replenishment.supplier')}</label>
                                    <input
                                        type="text"
                                        value={newOrderSupplier}
                                        onChange={(e) => setNewOrderSupplier(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none transition-all font-bold"
                                        placeholder="Ex: Brasserie du Congo"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('replenishment.date')}</label>
                                    <input
                                        type="date"
                                        value={newOrderDate}
                                        onChange={(e) => setNewOrderDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">{t('replenishment.status')}</label>
                                    <select
                                        value={newOrderStatus}
                                        onChange={(e) => setNewOrderStatus(e.target.value as ReplenishmentStatus)}
                                        className="w-full px-4 py-3 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none transition-all font-bold"
                                    >
                                        <option value={ReplenishmentStatus.PENDING}>{t('replenishment.status.pending')}</option>
                                        <option value={ReplenishmentStatus.COMPLETED}>{t('replenishment.status.completed')}</option>
                                    </select>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900">{t('replenishment.items')}</h3>
                                    <button
                                        onClick={() => setNewOrderItems([...newOrderItems, { productId: products[0]?.id || '', quantity: 1, cost: products[0]?.purchasePrice || 0 }])}
                                        className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1"
                                    >
                                        <Plus className="w-4 h-4" /> {t('replenishment.addArticle') || 'Ajouter un article'}
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                    {newOrderItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center animate-in slide-in-from-left-2 duration-300">
                                            <div className="flex-1">
                                                <select
                                                    value={item.productId}
                                                    onChange={(e) => {
                                                        const newItems = [...newOrderItems];
                                                        newItems[idx].productId = e.target.value;
                                                        // Update cost with the new product's purchase price
                                                        const selectedProduct = products.find(p => p.id === e.target.value);
                                                        if (selectedProduct) {
                                                            newItems[idx].cost = selectedProduct.purchasePrice || 0;
                                                        }
                                                        setNewOrderItems(newItems);
                                                    }}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => {
                                                        const newItems = [...newOrderItems];
                                                        newItems[idx].quantity = parseInt(e.target.value) || 0;
                                                        setNewOrderItems(newItems);
                                                    }}
                                                    placeholder={t('replenishment.quantity')}
                                                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-center font-bold"
                                                />
                                            </div>
                                            <div className="w-32 active:scale-95 transition-transform">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={item.cost}
                                                        onChange={(e) => {
                                                            const newItems = [...newOrderItems];
                                                            newItems[idx].cost = parseInt(e.target.value) || 0;
                                                            setNewOrderItems(newItems);
                                                        }}
                                                        placeholder={t('replenishment.costPrice')}
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 text-right pr-8 font-mono"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold"></span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newItems = newOrderItems.filter((_, i) => i !== idx);
                                                    setNewOrderItems(newItems);
                                                }}
                                                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))}
                                    {newOrderItems.length === 0 && (
                                        <p className="text-center text-gray-400 text-sm italic py-4">Aucun article dans la commande</p>
                                    )}
                                </div>

                                <div className="flex justify-end items-center gap-4 text-sm">
                                    <span className="text-gray-500">{t('replenishment.totalEstimated')}:</span>
                                    <span className="text-xl font-black text-gray-900">
                                        <CurrencyDisplay amount={newOrderItems.reduce((acc, item) => acc + (item.quantity * item.cost), 0)} />
                                    </span>
                                </div>
                            </div>
                        </ScrollablePanel>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                            >
                                {t('button.cancel')}
                            </button>
                            <button
                                onClick={() => {
                                    if (!newOrderSupplier || newOrderItems.length === 0) {
                                        alert('Veuillez remplir le fournisseur et ajouter au moins un article.');
                                        return;
                                    }

                                    const totalAmount = newOrderItems.reduce((acc, item) => acc + (item.quantity * item.cost), 0);

                                    const newOrder: ReplenishmentOrder = {
                                        id: Math.random().toString(36).substr(2, 9),
                                        orderNumber: `CMD-${Date.now().toString().slice(-6)}`,
                                        date: new Date(newOrderDate).getTime(),
                                        supplier: newOrderSupplier,
                                        items: newOrderItems.map(item => ({
                                            productId: item.productId,
                                            productName: products.find(p => p.id === item.productId)?.name || 'Inconnu',
                                            quantity: item.quantity,
                                            costPrice: item.cost,
                                            total: item.quantity * item.cost
                                        })),
                                        totalAmount,
                                        status: newOrderStatus,
                                        createdAt: Date.now(),
                                        updatedAt: Date.now()
                                    };

                                    // 1. Save Order
                                    const updatedOrders = [newOrder, ...orders];
                                    setOrders(updatedOrders);
                                    setStoreData(STORAGE_KEYS.REPLENISHMENT_ORDERS, updatedOrders);

                                    // 2. If Completed, Update Stock and Add Expense
                                    if (newOrderStatus === ReplenishmentStatus.COMPLETED) {
                                        // Update Stock
                                        const updatedProducts = products.map(p => {
                                            const item = newOrderItems.find(i => i.productId === p.id);
                                            if (item) {
                                                return { ...p, stock: p.stock + item.quantity };
                                            }
                                            return p;
                                        });
                                        setProducts(updatedProducts);
                                        setStoreData(STORAGE_KEYS.PRODUCTS, updatedProducts);

                                        // Add Accounting Expense
                                        const accountingTransactions = getStoreData<AccountingTransaction[]>(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS, []);
                                        const newTransaction: AccountingTransaction = {
                                            id: Math.random().toString(36).substr(2, 9),
                                            date: new Date(newOrderDate).getTime(),
                                            type: TransactionType.EXPENSE,
                                            category: TransactionCategory.PURCHASE,
                                            amount: totalAmount,
                                            description: `Achat Stock - ${newOrderSupplier} (${newOrder.orderNumber})`,
                                            referenceId: newOrder.id,
                                            createdAt: Date.now()
                                        };
                                        setStoreData(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS, [newTransaction, ...accountingTransactions]);

                                        const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
                                        addActivity({
                                            action: LogAction.REPLENISHMENT, // Ensure this exists or use STOCK_ADJUST
                                            details: `Réception Commande ${newOrder.orderNumber} - ${newOrderSupplier}`,
                                            userRole: settings.userRole || UserRole.ADMIN,
                                            userName: getActivityUserName(settings),
                                            module: 'STOCK'
                                        });
                                    } else {
                                        const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
                                        addActivity({
                                            action: LogAction.CREATE,
                                            details: `Création Commande ${newOrder.orderNumber} - ${newOrderSupplier}`,
                                            userRole: settings.userRole || UserRole.ADMIN,
                                            userName: getActivityUserName(settings),
                                            module: 'STOCK'
                                        });
                                    }

                                    setIsAddModalOpen(false);
                                }}
                                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {newOrderStatus === ReplenishmentStatus.COMPLETED ? t('replenishment.confirmReceipt') : t('replenishment.createOrder')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Details Modal */}
            {isDetailsModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Truck className="w-6 h-6 text-blue-600" />
                                    Commande {selectedOrder.orderNumber}
                                </h2>
                                <p className="text-sm text-gray-500">{new Date(selectedOrder.date).toLocaleDateString()} • {selectedOrder.supplier}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`px-3 py-1 rounded-full border text-xs font-black uppercase ${getStatusStyle(selectedOrder.status)}`}>
                                    {selectedOrder.status}
                                </div>
                                <button
                                    onClick={() => setIsDetailsModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-2"
                                >
                                    <XCircle className="w-6 h-6 text-gray-400" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-xs font-black uppercase text-gray-400">{t('replenishment.article')}</th>
                                        <th className="px-4 py-3 text-xs font-black uppercase text-gray-400 text-center">{t('replenishment.quantity')}</th>
                                        <th className="px-4 py-3 text-xs font-black uppercase text-gray-400 text-right">{t('replenishment.costPrice')}</th>
                                        <th className="px-4 py-3 text-xs font-black uppercase text-gray-400 text-right">{t('replenishment.total')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {selectedOrder.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-bold text-gray-900">{item.productName}</td>
                                            <td className="px-4 py-3 text-center font-mono">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right font-mono"><CurrencyDisplay amount={item.costPrice} /></td>
                                            <td className="px-4 py-3 text-right font-bold"><CurrencyDisplay amount={item.total} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="border-t border-gray-100">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-right font-bold text-gray-500 uppercase">{t('replenishment.totalOrder')}</td>
                                        <td className="px-4 py-4 text-right font-black text-xl text-blue-600">
                                            <CurrencyDisplay amount={selectedOrder.totalAmount} showSecondary />
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            {selectedOrder.status === ReplenishmentStatus.PENDING && (
                                <>
                                    <button
                                        onClick={() => {
                                            if (confirm(t('replenishment.confirmCancel'))) {
                                                const updatedOrders = orders.map(o =>
                                                    o.id === selectedOrder.id ? { ...o, status: ReplenishmentStatus.CANCELLED, updatedAt: Date.now() } : o
                                                );
                                                setOrders(updatedOrders);
                                                setStoreData(STORAGE_KEYS.REPLENISHMENT_ORDERS, updatedOrders);

                                                // Log
                                                const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
                                                addActivity({
                                                    action: LogAction.UPDATE,
                                                    details: `Annulation Commande ${selectedOrder.orderNumber}`,
                                                    userRole: settings.userRole || UserRole.ADMIN,
                                                    userName: getActivityUserName(settings),
                                                    module: 'STOCK'
                                                });

                                                setIsDetailsModalOpen(false);
                                            }
                                        }}
                                        className="px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        {t('replenishment.cancelOrder')}
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm(t('replenishment.confirmReceiptDesc'))) {
                                                // 1. Update Order Status
                                                const updatedOrders = orders.map(o =>
                                                    o.id === selectedOrder.id ? { ...o, status: ReplenishmentStatus.COMPLETED, receivedAt: Date.now(), updatedAt: Date.now() } : o
                                                );
                                                setOrders(updatedOrders);
                                                setStoreData(STORAGE_KEYS.REPLENISHMENT_ORDERS, updatedOrders);

                                                // 2. Update Stock
                                                const updatedProducts = products.map(p => {
                                                    const item = selectedOrder.items.find(i => i.productId === p.id);
                                                    if (item) {
                                                        return { ...p, stock: p.stock + item.quantity };
                                                    }
                                                    return p;
                                                });
                                                setProducts(updatedProducts);
                                                setStoreData(STORAGE_KEYS.PRODUCTS, updatedProducts);

                                                // 3. Add Accounting Expense
                                                const accountingTransactions = getStoreData<AccountingTransaction[]>(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS, []);
                                                const newTransaction: AccountingTransaction = {
                                                    id: Math.random().toString(36).substr(2, 9),
                                                    date: Date.now(),
                                                    type: TransactionType.EXPENSE,
                                                    category: TransactionCategory.PURCHASE,
                                                    amount: selectedOrder.totalAmount,
                                                    description: `Paiement Commande ${selectedOrder.orderNumber} - ${selectedOrder.supplier}`,
                                                    referenceId: selectedOrder.id,
                                                    createdAt: Date.now()
                                                };
                                                setStoreData(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS, [newTransaction, ...accountingTransactions]);

                                                // 4. Log
                                                const settings = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
                                                addActivity({
                                                    action: LogAction.REPLENISHMENT,
                                                    details: `Réception confirmée ${selectedOrder.orderNumber}`,
                                                    userRole: settings.userRole || UserRole.ADMIN,
                                                    userName: getActivityUserName(settings),
                                                    module: 'STOCK'
                                                });

                                                setIsDetailsModalOpen(false);
                                            }
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        Confirmer Réception
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => setIsDetailsModalOpen(false)}
                                className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReplenishmentPage;
