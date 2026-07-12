import React from 'react';
import AuthLanguageSelector from '../AuthLanguageSelector';

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50/80 to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex items-center justify-center p-4 py-10">
      <div className={`${widthClass} w-full`}>
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(59,130,246,0.12),0_8px_24px_rgba(167,139,250,0.08)] border border-white/60 dark:border-slate-700/50 p-6 sm:p-8">
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
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
