
import React from 'react';
import type { AppModuleId } from './utils/modules';
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Users,
  History,
  Box,
  BarChart3,
  Settings,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Truck,
  Shield,
  Info,
  FileText,
  Eye,
  BadgeDollarSign
} from 'lucide-react';

export const APP_NAME = "Casier d'Or";
export const DEFAULT_CURRENCY = "XAF";

// Navigation items avec clés de traduction et classification couleur
export const getNavigationItems = (t: (key: string) => string): NavigationItem[] => [
  { id: 'dashboard' as AppModuleId, label: t('nav.dashboard'), path: '/', icon: <LayoutDashboard className="w-5 h-5" />, primary: true, color: 'text-indigo-600 dark:text-indigo-400', bgColor: 'bg-indigo-50 dark:bg-indigo-900/30', borderColor: 'border-indigo-600' },
  { id: 'sales' as AppModuleId, label: t('nav.sales'), path: '/new-sale', icon: <PlusCircle className="w-5 h-5" />, primary: true, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/30', borderColor: 'border-blue-600' },
  { id: 'products' as AppModuleId, label: t('nav.products'), path: '/products', icon: <Package className="w-5 h-5" />, primary: true, color: 'text-amber-500 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-900/30', borderColor: 'border-amber-500' },
  { id: 'clients' as AppModuleId, label: t('nav.clients'), path: '/clients', icon: <Users className="w-5 h-5" />, primary: true, color: 'text-emerald-500 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-900/30', borderColor: 'border-emerald-500' },
  { id: 'history' as AppModuleId, label: t('nav.history'), path: '/history', icon: <History className="w-5 h-5" />, primary: false, color: 'text-purple-500 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/30', borderColor: 'border-purple-500' },
  { id: 'stock' as AppModuleId, label: t('nav.stock'), path: '/stock', icon: <Box className="w-5 h-5" />, primary: false, color: 'text-cyan-500 dark:text-cyan-400', bgColor: 'bg-cyan-50 dark:bg-cyan-900/30', borderColor: 'border-cyan-500' },
  { id: 'accounting' as AppModuleId, label: t('nav.accounting'), path: '/accounting', icon: <BadgeDollarSign className="w-5 h-5" />, primary: false, color: 'text-rose-500 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-900/30', borderColor: 'border-rose-500' },
  { id: 'replenishment' as AppModuleId, label: t('nav.replenishment'), path: '/replenishment', icon: <Truck className="w-5 h-5" />, primary: false, color: 'text-fuchsia-500 dark:text-fuchsia-400', bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900/30', borderColor: 'border-fuchsia-500' },
  { id: 'stats' as AppModuleId, label: t('nav.stats'), path: '/stats', icon: <BarChart3 className="w-5 h-5" />, primary: false, color: 'text-orange-500 dark:text-orange-400', bgColor: 'bg-orange-50 dark:bg-orange-900/30', borderColor: 'border-orange-500' },
  { id: 'activity' as AppModuleId, label: t('nav.activity'), path: '/activity', icon: <Clock className="w-5 h-5" />, primary: false, color: 'text-teal-500 dark:text-teal-400', bgColor: 'bg-teal-50 dark:bg-teal-900/30', borderColor: 'border-teal-500' },
  { id: 'trash' as AppModuleId, label: t('nav.trash'), path: '/trash', icon: <Trash2 className="w-5 h-5" />, primary: false, color: 'text-red-500 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-900/30', borderColor: 'border-red-500' },
  { id: 'users' as AppModuleId, label: t('nav.users'), path: '/users', icon: <Shield className="w-5 h-5" />, primary: false, color: 'text-sky-500 dark:text-sky-400', bgColor: 'bg-sky-50 dark:bg-sky-900/30', borderColor: 'border-sky-500' },
  { id: 'settings' as AppModuleId, label: t('nav.settings'), path: '/settings', icon: <Settings className="w-5 h-5" />, primary: false, color: 'text-slate-600 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-800', borderColor: 'border-slate-500' },
  { id: 'about' as AppModuleId, label: t('nav.about'), path: '/about', icon: <Info className="w-5 h-5" />, primary: false, color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-900/30', borderColor: 'border-slate-400' },
  { id: 'legal' as AppModuleId, label: t('nav.legal'), path: '/legal', icon: <FileText className="w-5 h-5" />, primary: false, color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-900/30', borderColor: 'border-slate-400' },
  { id: 'privacy' as AppModuleId, label: t('nav.privacy'), path: '/privacy', icon: <Eye className="w-5 h-5" />, primary: false, color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-50 dark:bg-slate-900/30', borderColor: 'border-slate-400' },
];

// Type pour les items de navigation
export type NavigationItem = {
  id?: AppModuleId;
  label: string;
  path: string;
  icon: React.ReactNode;
  primary: boolean;
  color?: string; // Classe couleur Tailwind principale (ex: text-blue-500)
  bgColor?: string; // Classe fond Tailwind (ex: bg-blue-50)
  borderColor?: string; // Classe bordure Tailwind (ex: border-blue-500)
};

// Devises supportées avec taux réels 2026
export const SUPPORTED_CURRENCIES = [
  { code: 'XAF', name: 'Franc CFA', symbol: 'FCFA', rate: 1 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 655.957 },
  { code: 'USD', name: 'Dollar américain', symbol: '$', rate: 559.996 },
  { code: 'GBP', name: 'Livre sterling', symbol: '£', rate: 747.070 },
  { code: 'CHF', name: 'Franc suisse', symbol: '₣', rate: 696.189 },
  { code: 'CAD', name: 'Dollar canadien', symbol: 'C$', rate: 405.042 },
  { code: 'JPY', name: 'Yen japonais', symbol: '¥', rate: 3.5798 },
  { code: 'CNY', name: 'Yuan chinois', symbol: '¥', rate: 79.396 },
];

