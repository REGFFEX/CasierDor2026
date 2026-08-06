
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './utils/themeContext';
import { LanguageProvider } from './utils/languageContext';
import { AuthProvider } from './utils/authContext';
import { useLanguage } from './utils/languageContext';
import Layout from './components/Layout';
import ModuleRouteGuard from './components/ModuleRouteGuard';
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const NewSale = React.lazy(() => import('./pages/NewSale'));
const ProductList = React.lazy(() => import('./pages/ProductList'));
const ClientsPage = React.lazy(() => import('./pages/ClientsPage'));
const HistoryPage = React.lazy(() => import('./pages/HistoryPage'));
const AccountingPage = React.lazy(() => import('./pages/AccountingPage'));
const ReplenishmentPage = React.lazy(() => import('./pages/ReplenishmentPage'));
const RecycleBinPage = React.lazy(() => import('./pages/RecycleBinPage'));
const ActivityPage = React.lazy(() => import('./pages/ActivityPage'));
const StockPage = React.lazy(() => import('./pages/StockPage'));
const StatsPage = React.lazy(() => import('./pages/StatsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const PermissionsPage = React.lazy(() => import('./pages/PermissionsPage'));
const UsersManagementPage = React.lazy(() => import('./pages/UsersManagementPage'));
const TouchScreenDiagnosticsPage = React.lazy(() => import('./pages/TouchScreenDiagnosticsPage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const LegalPage = React.lazy(() => import('./pages/LegalPage'));
const PrivacyPolicyPage = React.lazy(() => import('./pages/PrivacyPolicyPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const RegisterPage = React.lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const AccountChoicePage = React.lazy(() => import('./pages/AccountChoicePage'));
const RecoverySetupPage = React.lazy(() => import('./pages/RecoverySetupPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const StorageSetupPage = React.lazy(() => import('./pages/StorageSetupPage'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
    <div className="animate-pulse flex flex-col items-center">
      <div className="h-12 w-12 bg-blue-200 dark:bg-blue-800 rounded-full mb-4"></div>
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
);
import { initializeStore } from './store';
import { useAuth } from './utils/authContext';
import { initDirectoryStructure } from './utils/fileManager';

// Composant pour protéger les routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  const { t } = useLanguage();

  // Vérifier si l'authentification est désactivée
  const isAuthDisabled = localStorage.getItem('auth_disabled') === 'true';

  console.log('[ProtectedRoute] État auth:', {
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    isAuthDisabled,
    user: state.user?.email
  });

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-900 dark:text-white">{t('message.loading')}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t('auth.verifying')}</div>
        </div>
      </div>
    );
  }

  // Si l'authentification est désactivée, autoriser l'accès
  if (isAuthDisabled) {
    console.log('[ProtectedRoute] Authentification désactivée - Accès autorisé');
    return <>{children}</>;
  }

  if (!state.isAuthenticated) {
    console.log('[ProtectedRoute] Redirection vers /login');
    return <Navigate to="/login" replace />;
  }

  console.log('[ProtectedRoute] Accès autorisé');
  return <>{children}</>;
};

// Composant pour les routes publiques (rediriger si déjà connecté)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAuth();

  // Vérifier si l'authentification est désactivée
  const isAuthDisabled = localStorage.getItem('auth_disabled') === 'true';

  // Si l'authentification est désactivée, rediriger vers l'application
  if (isAuthDisabled) {
    return <Navigate to="/" replace />;
  }

  if (state.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

import { SidebarProvider } from './utils/sidebarContext';

function App() {
  useEffect(() => {
    initializeStore();
    // Préchargement asynchrone des modules pour des transitions fluides et instantanées
    const preloadPages = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500));
        await Promise.all([
          import('./pages/SettingsPage'),
          import('./pages/NewSale'),
          import('./pages/ProductList'),
          import('./pages/HistoryPage'),
        ]);
        console.log('[App] Modules préchargés avec succès en arrière-plan');
      } catch (err) {
        console.warn('[App] Erreur lors du préchargement des modules:', err);
      }
    };
    preloadPages();
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <SidebarProvider>
          <HashRouter>
            <React.Suspense fallback={<PageLoader />}>
              <Routes>
              {/* Routes publiques */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPasswordPage />
                  </PublicRoute>
                }
              />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/account-choice"
                element={
                  <PublicRoute>
                    <AccountChoicePage />
                  </PublicRoute>
                }
              />

              <Route
                path="/storage-setup"
                element={
                  <ProtectedRoute>
                    <StorageSetupPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/recovery-setup"
                element={
                  <ProtectedRoute>
                    <RecoverySetupPage />
                  </ProtectedRoute>
                }
              />

              {/* Routes protégées */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ModuleRouteGuard />
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/new-sale" element={<NewSale />} />
                        <Route path="/products" element={<ProductList />} />
                        <Route path="/clients" element={<ClientsPage />} />
                        <Route path="/history" element={<HistoryPage />} />
                        <Route path="/accounting" element={<AccountingPage />} />
                        <Route path="/replenishment" element={<ReplenishmentPage />} />
                        <Route path="/trash" element={<RecycleBinPage />} />
                        <Route path="/activity" element={<ActivityPage />} />
                        <Route path="/stock" element={<StockPage />} />
                        <Route path="/stats" element={<StatsPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="/permissions" element={<PermissionsPage />} />
                        <Route path="/users" element={<UsersManagementPage />} />
                        <Route path="/touch-diagnostics" element={<TouchScreenDiagnosticsPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/legal" element={<LegalPage />} />
                        <Route path="/privacy" element={<PrivacyPolicyPage />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
              </Routes>
            </React.Suspense>
          </HashRouter>
          </SidebarProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
