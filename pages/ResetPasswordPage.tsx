import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Save, CheckCircle, AlertCircle, ArrowLeft, ShieldCheck, Download } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { getStoreData, setStoreData, STORAGE_KEYS, DEFAULT_SETTINGS } from '../store';
import { StoreSettings } from '../types';
import AuthLanguageSelector from '../components/AuthLanguageSelector';
import { authService } from '../utils/authService';
import {
  generateRecoveryKey,
  rotateRecoveryKey,
  saveRecoveryKeyFile,
  getRecoverySecurityPrefs,
} from '../utils/recoveryKeyService';
import KeyFilePasswordFields from '../components/KeyFilePasswordFields';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newKeyOffered, setNewKeyOffered] = useState(false);
  const [pendingNewKey, setPendingNewKey] = useState<string | null>(null);
  const [keyFilePassword, setKeyFilePassword] = useState('');
  const [keyFilePasswordConfirm, setKeyFilePasswordConfirm] = useState('');
  const [settings] = useState<StoreSettings>(() =>
    getStoreData<StoreSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );

  const isStrong = password.length >= 8;
  const hasRecoverySession = sessionStorage.getItem('casierdor_recovery_session') === 'active';

  useEffect(() => {
    if (!hasRecoverySession) {
      navigate('/forgot-password', { replace: true });
    }
  }, [hasRecoverySession, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'));
      return;
    }

    if (!isStrong) {
      setError(t('auth.passwordStrong'));
      return;
    }

    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const admin = authService.findPrimaryAdmin();
      const targetEmail = admin?.email || settings.email;
      if (!targetEmail) {
        setError(t('auth.loginError'));
        return;
      }

      const updated = await authService.updatePasswordByEmail(targetEmail, password);
      if (!updated) {
        setError(t('error.system'));
        return;
      }

      const newRecoveryKey = generateRecoveryKey();
      const method = (settings.recoveryConfig?.method === 'both' ? 'both' : 'key') as 'key' | 'both';
      await rotateRecoveryKey(newRecoveryKey, method);

      sessionStorage.removeItem('casierdor_recovery_session');
      setSuccess(true);
      setNewKeyOffered(true);
      setPendingNewKey(newRecoveryKey);
    } catch {
      setError(t('error.system'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewKey = async () => {
    if (!pendingNewKey) return;
    const prefs = getRecoverySecurityPrefs();
    if (prefs.useKeyFilePassword) {
      if (keyFilePassword.length < 4 || keyFilePassword !== keyFilePasswordConfirm) {
        setError(t('auth.passwordsDoNotMatch'));
        return;
      }
    }
    const method = settings.recoveryConfig?.method || 'key';
    const ok = await saveRecoveryKeyFile(
      pendingNewKey,
      method,
      prefs.useKeyFilePassword ? keyFilePassword : undefined
    );
    if (!ok && prefs.useKeyFilePassword) {
      setError(t('auth.setupError'));
      return;
    }
    navigate('/login', { replace: true });
  };

  if (!hasRecoverySession) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-in fade-in slide-in-from-top-8 duration-700">
          <div className="w-20 h-20 bg-white dark:bg-slate-700 rounded-2xl shadow-xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">
            {t('auth.resetPassword')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">{t('auth.forgotPasswordSubtitle')}</p>

          <div className="mt-6">
            <AuthLanguageSelector />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-white/20 backdrop-blur-lg">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 rounded-2xl flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700 dark:text-red-300 text-sm font-bold">{error}</span>
            </div>
          )}

          {success ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('message.success')}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t('auth.passwordsSaved')}</p>
              {newKeyOffered && (
                <div className="space-y-3 text-left">
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                    {t('auth.recoveryKeyStorageHint')}
                  </p>
                  {getRecoverySecurityPrefs().useKeyFilePassword && (
                    <KeyFilePasswordFields
                      password={keyFilePassword}
                      confirm={keyFilePasswordConfirm}
                      onPasswordChange={setKeyFilePassword}
                      onConfirmChange={setKeyFilePasswordConfirm}
                    />
                  )}
                  <button
                    type="button"
                    onClick={handleSaveNewKey}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>{t('auth.selectKeySaveLocation')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login', { replace: true })}
                    className="w-full py-2 text-sm text-gray-500 hover:text-blue-600"
                  >
                    {t('button.backToLogin')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  {t('auth.password')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-slate-700 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none font-bold dark:text-white"
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-4 bg-gray-50 dark:bg-slate-700 border-2 rounded-2xl outline-none font-bold dark:text-white ${
                      confirmPassword && password !== confirmPassword
                        ? 'border-red-400'
                        : 'border-transparent focus:border-blue-500'
                    }`}
                    placeholder={t('auth.passwordPlaceholder')}
                    required
                  />
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 font-bold ml-1">{t('auth.passwordsDoNotMatch')}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading || !isStrong || password !== confirmPassword}
                className={`w-full py-4 rounded-2xl font-black text-lg uppercase tracking-wide flex items-center justify-center space-x-2 ${
                  isLoading || !isStrong || password !== confirmPassword
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-xl'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('status.loading')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>{t('button.save')}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {!success && (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-blue-600"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('button.backToLogin')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
