import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Key, Upload } from 'lucide-react';
import { useLanguage } from '../utils/languageContext';
import { useAuth } from '../utils/authContext';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import AuthLanguageSelector from '../components/AuthLanguageSelector';
import AuthShell from '../components/auth/AuthShell';
import AuthCrystalButton from '../components/auth/AuthCrystalButton';
import RecoverySecurityOptions from '../components/RecoverySecurityOptions';
import KeyFilePasswordFields from '../components/KeyFilePasswordFields';
import {
  validateRecoveryKey,
  loadRecoveryKeyFromFile,
  getRecoverySecurityPrefs,
} from '../utils/recoveryKeyService';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { forgotPassword } = useAuth();
  const supabaseAvailable = isSupabaseConfigured();
  const [method, setMethod] = useState<'email' | 'key'>('key');
  const [email, setEmail] = useState('');
  const [recoveryKey, setRecoveryKey] = useState('');
  const [filePassword, setFilePassword] = useState('');
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null);
  const [manualConfirmNeeded, setManualConfirmNeeded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const processFileContent = async (content: string, pwd?: string) => {
    const result = await loadRecoveryKeyFromFile(content, pwd);
    if (result.needsFilePassword) {
      setPendingFileContent(content);
      setError('');
      setSuccess('');
      return;
    }
    setPendingFileContent(null);
    if (result.requiresManualEntry) {
      setManualConfirmNeeded(true);
      setRecoveryKey('');
      setSuccess(t('auth.manualKeyConfirmHint'));
      setError('');
      return;
    }
    if (result.recoveryKey) {
      setRecoveryKey(result.recoveryKey);
      setManualConfirmNeeded(false);
      setMethod('key');
      setSuccess(t('auth.recoveryKeyLoaded'));
      setError('');
    } else {
      setError(t('error.invalidFile'));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const prefs = getRecoverySecurityPrefs();
        await processFileContent(content, prefs.useKeyFilePassword ? filePassword : undefined);
      } catch {
        setError(t('error.fileRead'));
      }
    };
    reader.readAsText(file);
  };

  const unlockPendingFile = async () => {
    if (!pendingFileContent || !filePassword) return;
    await processFileContent(pendingFileContent, filePassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (method === 'email') {
        if (!supabaseAvailable) {
          setError(t('auth.emailRecoveryDisabledHint'));
          return;
        }
        const response = await forgotPassword({ email: email.toLowerCase().trim() });
        if (response.success) {
          setSuccess(response.message || t('auth.passwordResetSent'));
        } else {
          setError(response.message || t('error.system'));
        }
        return;
      }

      const valid = await validateRecoveryKey(recoveryKey);
      if (valid) {
        sessionStorage.setItem('casierdor_recovery_session', 'active');
        setSuccess(t('auth.recoveryKeySuccess'));
        setTimeout(() => {
          navigate('/reset-password');
        }, 1500);
      } else {
        setError(t('auth.invalidRecoveryKey'));
      }
    } catch {
      setError(t('error.system'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      icon={<Key className="w-8 h-8" />}
      title={t('auth.forgotPasswordTitle')}
      subtitle={t('auth.forgotPasswordSubtitle')}
      maxWidth="md"
    >

          <div className="flex p-1 bg-gray-100 dark:bg-slate-700 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setMethod('key')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center space-x-2 ${
                method === 'key'
                  ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>{t('auth.recoveryKeyRecommended')}</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('email')}
              disabled={!supabaseAvailable}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-center space-x-2 ${
                method === 'email'
                  ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              } ${!supabaseAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={supabaseAvailable ? '' : t('auth.emailRecoveryUnavailable')}
            >
              <Mail className="w-4 h-4" />
              <span>{t('auth.email')}</span>
            </button>
          </div>

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
            {method === 'email' ? (
              !supabaseAvailable ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">{t('auth.emailRecoveryUnavailable')}</p>
                  <p>{t('auth.emailRecoveryDisabledHint')}</p>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="auth-input pl-11"
                      placeholder={t('auth.emailPlaceholder')}
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Un email de réinitialisation sera envoyé à cette adresse.
                  </p>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.recoveryKeyRecommended')}
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={recoveryKey}
                      onChange={(e) => setRecoveryKey(e.target.value)}
                      className="auth-input pl-11 font-mono text-sm"
                      placeholder={t('auth.recoveryKeyPlaceholder')}
                      required={method === 'key'}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>
                </div>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-800 text-gray-500 uppercase">
                      {t('status.or')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center space-x-2 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700/50 transition-all text-gray-600 dark:text-gray-300"
                >
                  <Upload className="w-5 h-5" />
                  <span>{t('form.uploadFile')}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".key,.txt,application/json"
                />

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('auth.recoveryKeyStorageHint')}
                </p>

                {pendingFileContent && (
                  <KeyFilePasswordFields
                    password={filePassword}
                    confirm={filePassword}
                    onPasswordChange={setFilePassword}
                    onConfirmChange={setFilePassword}
                  />
                )}
                {pendingFileContent && (
                  <button
                    type="button"
                    onClick={unlockPendingFile}
                    className="w-full py-2 text-sm font-bold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    {t('button.validate')}
                  </button>
                )}

                {manualConfirmNeeded && (
                  <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                    {t('auth.manualKeyConfirmHint')}
                  </p>
                )}
              </div>
            )}

            <RecoverySecurityOptions compact />

            <AuthCrystalButton type="submit" loading={isLoading} disabled={method === 'email' && !supabaseAvailable}>
              {t('button.validate')}
            </AuthCrystalButton>
          </form>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
