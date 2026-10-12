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
    <div className="crystal-app-bg min-h-screen flex items-center justify-center p-4 py-10 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
      <div className={`${widthClass} w-full animate-slide-up`}>
        <div className="crystal-panel p-6 sm:p-8">
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

          {/* Navigation des actions d'authentification */}
          <nav className="flex flex-wrap justify-center gap-4 mb-8">
            <Link
              to="/login"
              style={{ width: '120px', height: '40px', borderRadius: '6px' }}
              className={`flex items-center justify-center text-sm font-semibold transition-colors duration-200 shadow-sm
                ${location.pathname === '/login' 
                  ? 'bg-blue-600 text-white shadow-blue-500/30 ring-2 ring-blue-600 ring-offset-2 dark:ring-offset-slate-800' 
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50'}`}
            >
              {t('auth.login')}
            </Link>
            <Link
              to="/register"
              style={{ width: '120px', height: '40px', borderRadius: '6px' }}
              className={`flex items-center justify-center text-sm font-semibold transition-colors duration-200 shadow-sm
                ${location.pathname === '/register' 
                  ? 'bg-green-600 text-white shadow-green-500/30 ring-2 ring-green-600 ring-offset-2 dark:ring-offset-slate-800' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'}`}
            >
              {t('auth.register')}
            </Link>
            <Link
              to="/forgot-password"
              style={{ width: '120px', height: '40px', borderRadius: '6px' }}
              className={`flex items-center justify-center text-sm font-semibold transition-colors duration-200 shadow-sm
                ${location.pathname === '/forgot-password' 
                  ? 'bg-gray-600 text-white shadow-gray-500/30 ring-2 ring-gray-600 ring-offset-2 dark:ring-offset-slate-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'}`}
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
