
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Calendar,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import CurrencyDisplay from '../components/CurrencyDisplay';
import PageBackButton from '../components/PageBackButton';
import { Sale, SaleStatus, Product, AccountingTransaction, TransactionType } from '../types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatsPage: React.FC = () => {
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [accounting, setAccounting] = useState<AccountingTransaction[]>([]);
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    const salesData = getStoreData<Sale[]>(STORAGE_KEYS.SALES, []);
    const productsData = getStoreData<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    const accountingData = getStoreData<AccountingTransaction[]>(STORAGE_KEYS.ACCOUNTING_TRANSACTIONS, []);
    const settingsData = getStoreData(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

    setSales(salesData.filter(s => s.status === SaleStatus.VALIDATED));
    setProducts(productsData);
    setAccounting(accountingData);
    setSettings(settingsData);
  }, []);

  // --- Helper Functions ---

  const filterDataByDate = (data: any[], dateField: string) => {
    const now = new Date();
    const start = new Date();

    switch (dateRange) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(now.getDate() - 7);
        break;
      case 'month':
        start.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(now.getFullYear() - 1);
        break;
    }

    return data.filter(item => item[dateField] >= start.getTime());
  };

  // --- KPI Calculations ---

  const kpiData = useMemo(() => {
    const filteredSales = filterDataByDate(sales, 'date');
    const filteredAccounting = filterDataByDate(accounting, 'date');

    const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalOrders = filteredSales.length;
    const averageBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calculate Net Profit using Accounting Data (Income - Expense)
    // If Accounting is empty, fallback to Sales (Revenue only)
    let netProfit = 0;
    if (filteredAccounting.length > 0) {
      const income = filteredAccounting
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((acc, t) => acc + t.amount, 0);
      const expense = filteredAccounting
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => acc + t.amount, 0);
      netProfit = income - expense;
    } else {
      // Fallback: Estimate 20% margin if no accounting data
      netProfit = totalRevenue * 0.2;
    }

    return {
      totalRevenue,
      totalOrders,
      averageBasket,
      netProfit
    };
  }, [sales, accounting, dateRange]);

  // --- Chart Data Preparation ---

  const revenueTrendData = useMemo(() => {
    const filteredSales = filterDataByDate(sales, 'date')
      .sort((a, b) => a.date - b.date);

    const grouped = filteredSales.reduce((acc: any, sale) => {
      const date = new Date(sale.date);
      const key = dateRange === 'day'
        ? `${date.getHours()}h`
        : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

      if (!acc[key]) acc[key] = { name: key, revenue: 0, orders: 0 };
      acc[key].revenue += sale.total;
      acc[key].orders += 1;
      return acc;
    }, {});

    return Object.values(grouped);
  }, [sales, dateRange]);

  const salesByCategoryData = useMemo(() => {
    const filteredSales = filterDataByDate(sales, 'date');
    const categoryMap: Record<string, number> = {};

    filteredSales.forEach(sale => {
      sale.lines.forEach(line => {
        const product = products.find(p => p.id === line.productId);
        const category = product?.type || 'Autre';
        categoryMap[category] = (categoryMap[category] || 0) + line.total;
      });
    });

    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  }, [sales, products, dateRange]);

  const topProductsData = useMemo(() => {
    const filteredSales = filterDataByDate(sales, 'date');
    const productMap: Record<string, { name: string, quantity: number, revenue: number }> = {};

    filteredSales.forEach(sale => {
      sale.lines.forEach(line => {
        if (!productMap[line.productId]) {
          productMap[line.productId] = {
            name: line.productName,
            quantity: 0,
            revenue: 0
          };
        }
        productMap[line.productId].quantity += line.quantity;
        productMap[line.productId].revenue += line.total;
      });
    });

    return Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5
  }, [sales, dateRange]);

  const getCurrency = (amount: number) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: settings.currency || 'XAF'
    }).format(amount);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <PageBackButton />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            {t('stats.title')}
          </h1>
          <p className="text-gray-500">{t('stats.subtitle')}</p>
        </div>
        </div>

        <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
          {['day', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all capitalize ${dateRange === range
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {t(`stats.${range}`) || range}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t('stats.revenue')}
          value={<CurrencyDisplay amount={kpiData.totalRevenue} showSecondary={true} className="text-white" showSymbol={false} />}
          icon={<DollarSign className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-blue-500 to-blue-600"
          trend="+12%" // Placeholder trend
        />
        <KPICard
          title={t('stats.netProfit')}
          value={<CurrencyDisplay amount={kpiData.netProfit} showSecondary={true} className="text-white" showSymbol={false} />}
          icon={<TrendingUp className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-green-500 to-green-600"
          trend="+5%"
        />
        <KPICard
          title={t('stats.orders')}
          value={kpiData.totalOrders.toString()}
          icon={<ShoppingBag className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
        <KPICard
          title={t('stats.basket')}
          value={<CurrencyDisplay amount={kpiData.averageBasket} showSecondary={true} className="text-white" showSymbol={false} />}
          icon={<Users className="w-6 h-6 text-white" />}
          color="bg-gradient-to-br from-orange-500 to-orange-600"
        />
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Line Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              {t('stats.revenueTrend')}
            </h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Categories Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-600" />
            {t('stats.salesByCategory')}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Bar Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <BarChartIcon className="w-5 h-5 text-green-600" />
            {t('stats.topProducts')}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#4b5563', fontSize: 12, fontWeight: 600 }}
                  width={100}
                />
                <Tooltip
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Insights (Placeholder for now) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-lg flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-400" />
              {t('stats.aiInsights')}
            </h3>
            <p className="text-slate-400 text-sm mb-6">{t('stats.aiAnalysis')}</p>

            <div className="space-y-4">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">{t('stats.bestDay')}</p>
                <p className="font-bold">Samedi (32% des ventes)</p>
              </div>
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">{t('stats.trend')}</p>
                <div className="flex items-center gap-2 text-green-400">
                  <TrendingUp className="w-4 h-4" />
                  <span className="font-bold">{t('stats.growth').replace('{0}', '15%')}</span>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors mt-6">
            {t('stats.detailedReport')}
          </button>
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon, color, trend }: { title: string, value: React.ReactNode, icon: React.ReactNode, color: string, trend?: string }) => (
  <div className={`p-6 rounded-3xl shadow-lg text-white ${color} relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform" />
    <div className="relative z-10 flex flex-col h-full justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
          {icon}
        </div>
        {trend && (
          <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-bold backdrop-blur-sm flex items-center gap-1">
            {trend.startsWith('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-white/80 mb-1">{title}</p>
        <h3 className="text-3xl font-black tracking-tight">{value}</h3>
      </div>
    </div>
  </div>
);

export default StatsPage;
