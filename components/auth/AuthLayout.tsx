import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../utils/languageContext';

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { t } = useLanguage();
  const location = useLocation();

  const getButtonClass = (path: string, colorClass: string) => {
    const isActive = location.pathname === path;
    const baseClass = "flex items-center justify-center w-[120px] h-[40px] rounded-[6px] text-sm font-semibold transition-all duration-200";
    
    if (isActive) {
      return `${baseClass} ${colorClass} text-white shadow-md transform scale-105`;
    }
    return `${baseClass} bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900 px-4 py-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-400/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="w-full max-w-md z-10">
        
        {/* Navigation - Boutons Carrés */}
        <div className="flex justify-center items-center space-x-2 mb-8">
          <Link to="/login" className={getButtonClass('/login', 'bg-blue-600 hover:bg-blue-700')}>
            Connexion
          </Link>
          <Link to="/register" className={getButtonClass('/register', 'bg-green-600 hover:bg-green-700')}>
            Inscription
          </Link>
          <Link to="/forgot-password" className={getButtonClass('/forgot-password', 'bg-gray-600 hover:bg-gray-700')}>
            Récupération
          </Link>
        </div>

        {/* Content Wrapper */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-800/50 p-6 md:p-8">
          {(title || subtitle) && (
            <div className="text-center mb-6">
              {title && <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>}
              {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
            </div>
          )}

          {children}

          {/* Social Auth (Google / Apple) */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">{t('auth.orContinueWith', 'Ou continuer avec')}</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none transition-colors"
                onClick={() => console.log('Google Auth to be implemented with Supabase')}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none transition-colors"
                onClick={() => console.log('Apple Auth to be implemented with Supabase')}
              >
                <svg className="h-5 w-5 mr-2 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-1.2.58-2.34 1.28-3.09.77-.83 1.9-1.4 2.98-1.55.04.14.06.28.06.41zm-4.56 15.35c-.73.01-1.58-.41-2.2-.41-.65 0-1.79.52-2.67.52-1.18 0-2.32-.68-2.92-1.76-1.22-2.14-.59-4.75.39-6.17.68-1 1.66-1.56 2.78-1.56 1.01 0 1.83.42 2.45.42.63 0 1.63-.5 2.82-.5 1.2 0 2.29.56 2.91 1.44-2.5 1.53-2.07 5.08.53 6.17-.61 1.5-1.4 3.12-2.73 3.14l-1.36-.29z"/>
                </svg>
                Apple
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
