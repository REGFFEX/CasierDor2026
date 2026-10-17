import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthLanguageSelector from '../AuthLanguageSelector';
import { useLanguage } from '../../utils/languageContext';

interface AuthShellProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl';
}

const AuthShell: React.FC<AuthShellProps> = ({
  icon,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  const widthClass = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-3xl' }[maxWidth];
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <div className="crystal-app-bg min-h-[100dvh] flex items-start sm:items-center justify-center p-4 py-10 pt-[max(1.5rem,env(safe-area-inset-top,0px))] pb-[max(2rem,env(safe-area-inset-bottom,0px))]">
      <div className={`${widthClass} w-full animate-slide-up`}>
        <div className="auth-glass-panel p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-blue-400/30">
              {icon}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">{subtitle}</p>
            )}
            <div className="mt-4">
              <AuthLanguageSelector />
            </div>
          </div>

          {/* Navigation des actions d'authentification — iOS segmented control */}
          <nav className="ds-segmented mb-6">
            <Link
              to="/login"
              className={`ds-segmented-item ${location.pathname === '/login' ? 'active' : ''}`}
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/register"
              className={`ds-segmented-item ${location.pathname === '/register' ? 'active' : ''}`}
            >
              {t('auth.register')}
            </Link>
            <Link
              to="/forgot-password"
              className={`ds-segmented-item ${location.pathname === '/forgot-password' ? 'active' : ''}`}
            >
              {t('auth.forgotPasswordShort')}
            </Link>
          </nav>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
