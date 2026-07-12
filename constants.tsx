
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

// Navigation items avec clés de traduction
export const getNavigationItems = (t: (key: string) => string) => [
  { id: 'dashboard' as AppModuleId, label: t('nav.dashboard'), path: '/', icon: <LayoutDashboard className="w-5 h-5" />, primary: true },
  { id: 'sales' as AppModuleId, label: t('nav.sales'), path: '/new-sale', icon: <PlusCircle className="w-5 h-5" />, primary: true },
  { id: 'products' as AppModuleId, label: t('nav.products'), path: '/products', icon: <Package className="w-5 h-5" />, primary: true },
  { id: 'clients' as AppModuleId, label: t('nav.clients'), path: '/clients', icon: <Users className="w-5 h-5" />, primary: true },
  { id: 'history' as AppModuleId, label: t('nav.history'), path: '/history', icon: <History className="w-5 h-5" />, primary: false },
  { id: 'stock' as AppModuleId, label: t('nav.stock'), path: '/stock', icon: <Box className="w-5 h-5" />, primary: false },
  { id: 'accounting' as AppModuleId, label: t('nav.accounting'), path: '/accounting', icon: <BadgeDollarSign className="w-5 h-5" />, primary: false },
  { id: 'replenishment' as AppModuleId, label: t('nav.replenishment'), path: '/replenishment', icon: <Truck className="w-5 h-5" />, primary: false },
  { id: 'stats' as AppModuleId, label: t('nav.stats'), path: '/stats', icon: <BarChart3 className="w-5 h-5" />, primary: false },
  { id: 'activity' as AppModuleId, label: t('nav.activity'), path: '/activity', icon: <Clock className="w-5 h-5" />, primary: false },
  { id: 'trash' as AppModuleId, label: t('nav.trash'), path: '/trash', icon: <Trash2 className="w-5 h-5" />, primary: false },
  { id: 'users' as AppModuleId, label: t('nav.users'), path: '/users', icon: <Shield className="w-5 h-5" />, primary: false },
  { id: 'settings' as AppModuleId, label: t('nav.settings'), path: '/settings', icon: <Settings className="w-5 h-5" />, primary: false },
  { id: 'about' as AppModuleId, label: t('nav.about'), path: '/about', icon: <Info className="w-5 h-5" />, primary: false },
  { id: 'legal' as AppModuleId, label: t('nav.legal'), path: '/legal', icon: <FileText className="w-5 h-5" />, primary: false },
  { id: 'privacy' as AppModuleId, label: t('nav.privacy'), path: '/privacy', icon: <Eye className="w-5 h-5" />, primary: false },
];

// Type pour les items de navigation
export type NavigationItem = {
  id?: AppModuleId;
  label: string;
  path: string;
  icon: React.ReactNode;
  primary: boolean;
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

