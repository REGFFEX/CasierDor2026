
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './utils/themeContext';
import { LanguageProvider } from './utils/languageContext';
import { AuthProvider } from './utils/authContext';
import { useLanguage } from './utils/languageContext';
import Layout from './components/Layout';
import ModuleRouteGuard from './components/ModuleRouteGuard';
import Dashboard from './pages/Dashboard';
import NewSale from './pages/NewSale';
import ProductList from './pages/ProductList';
import ClientsPage from './pages/ClientsPage';
import HistoryPage from './pages/HistoryPage';
import AccountingPage from './pages/AccountingPage';
import ReplenishmentPage from './pages/ReplenishmentPage';
import RecycleBinPage from './pages/RecycleBinPage';
import ActivityPage from './pages/ActivityPage';
import StockPage from './pages/StockPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage';
import PermissionsPage from './pages/PermissionsPage';
import UsersManagementPage from './pages/UsersManagementPage';
import TouchScreenDiagnosticsPage from './pages/TouchScreenDiagnosticsPage';
import AboutPage from './pages/AboutPage';
import LegalPage from './pages/LegalPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AccountChoicePage from './pages/AccountChoicePage';
import RecoverySetupPage from './pages/RecoverySetupPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import StorageSetupPage from './pages/StorageSetupPage';
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

function App() {
  useEffect(() => {
    initializeStore();
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <HashRouter>
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
          </HashRouter>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;
