import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { useAuth } from '../utils/authContext';
import { LoginCredentials, StoreSettings, UserRole } from '../types';
import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { checkLockout } from '../utils/securityUtils';
import AuthShell from '../components/auth/AuthShell';
import AuthCrystalButton from '../components/auth/AuthCrystalButton';
import { resolveCompanyProfile, getBusinessTypeLabel } from '../utils/companyProfile';
import { isStorageConfigured } from '../utils/storageDirectory';

const LoginPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const settings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const freshSettings = getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);

    const lockoutStatus = checkLockout(formData.email, freshSettings.loginAttempts || {});
    if (lockoutStatus.isLocked) {
      setError(t('auth.lockoutMessage', { minutes: lockoutStatus.remainingMin }));
      return;
    }

    setIsLoading(true);

    try {
      const response = await login(formData);

      if (response.success && response.user) {
        setSuccess(t('auth.loginSuccess'));

        const updatedSettings = {
          ...freshSettings,
          loginAttempts: {
            ...freshSettings.loginAttempts,
            [formData.email]: { count: 0, lastAttempt: Date.now(), isLocked: false },
          },
        };
        setStoreData(STORAGE_KEYS.SETTINGS, updatedSettings);

        if (response.user.role === UserRole.ADMIN && freshSettings.securityActive === false) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('showSecurityModal'));
          }, 1500);
        }

        setTimeout(() => {
          if (!isStorageConfigured()) {
            navigate('/storage-setup', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }, 1000);
      } else {
        const currentAttempts = freshSettings.loginAttempts?.[formData.email]?.count || 0;
        const newCount = currentAttempts + 1;
        const isNowLocked = newCount >= 5;

        const updatedSettings = {
          ...freshSettings,
          loginAttempts: {
            ...freshSettings.loginAttempts,
            [formData.email]: {
              count: newCount,
              lastAttempt: Date.now(),
              isLocked: isNowLocked,
            },
          },
        };
        setStoreData(STORAGE_KEYS.SETTINGS, updatedSettings);

        if (isNowLocked) {
          setError(t('error.tooManyAttempts'));
        } else {
          const remaining = 5 - newCount;
          setError(
            `${response.message || t('auth.loginError')} (${t('auth.attemptsRemaining', { count: remaining })})`
          );
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('auth.loginError'));
    } finally {
      setIsLoading(false);
    }
  };

  const company = resolveCompanyProfile(settings);
  const activityLabel = getBusinessTypeLabel(t, company.businessType) || t('auth.loginSubtitleDefault');
  const companyLine = [company.companyName, activityLabel].filter(Boolean).join(' — ');

  return (
    <AuthShell
      icon={
        <span className="font-bold text-xl">
          {company.companyName ? company.companyName.substring(0, 2).toUpperCase() : 'CO'}
        </span>
      }
      title={t('auth.login')}
      subtitle={companyLine || activityLabel}
      maxWidth="md"
    >

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder={t('auth.emailPlaceholder')}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={t('auth.password')}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <div className="mt-1 text-right">
                <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="rememberMe"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {t('auth.rememberMe')}
              </label>
            </div>

            <AuthCrystalButton type="submit" loading={isLoading}>
              {t('auth.login')}
            </AuthCrystalButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                {t('auth.register')}
              </Link>
            </p>
          </div>

          {settings.enableTestAccounts && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{t('auth.testAccountsTitle')}</p>
              <div className="space-y-1 text-xs">
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>{t('auth.testAdminLabel')}</strong> admin@casierdor.app / admin123
                </div>
                <div className="text-gray-700 dark:text-gray-300">
                  <strong>{t('auth.testUserLabel')}</strong> user@casierdor.app / user123
                </div>
              </div>
            </div>
          )}
    </AuthShell>
  );
};

export default LoginPage;
