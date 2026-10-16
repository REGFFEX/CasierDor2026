import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Save, CheckCircle2, AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import { authService } from '../utils/authService';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { useLanguage } from '../utils/languageContext';

const ChangePasswordSection: React.FC = () => {
  const { t } = useLanguage();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const supabaseAvailable = isSupabaseConfigured();

  const isNewPasswordStrong = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = currentPassword.length > 0 && isNewPasswordStrong && passwordsMatch && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      if (response.success) {
        setSuccess(response.message || 'Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(response.message || 'Erreur lors du changement de mot de passe');
      }
    } catch {
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4 bg-blue-50/50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">
          Changer le mot de passe
        </h4>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400">
        {supabaseAvailable
          ? 'Le mot de passe sera mis à jour sur votre compte cloud Supabase.'
          : 'Le mot de passe sera mis à jour localement sur cet appareil.'}
      </p>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mot de passe actuel */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Mot de passe actuel
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showCurrent ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full pl-10 pr-10 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                newPassword && !isNewPasswordStrong
                  ? 'border-red-300'
                  : 'border-gray-200 dark:border-slate-600'
              }`}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPassword && !isNewPasswordStrong && (
            <p className="text-xs text-red-500 ml-1">Le mot de passe doit contenir au moins 8 caractères</p>
          )}
        </div>

        {/* Confirmer */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Confirmer le nouveau mot de passe
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type={showNew ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full pl-10 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-700 dark:text-white ${
                confirmPassword && !passwordsMatch
                  ? 'border-red-300'
                  : 'border-gray-200 dark:border-slate-600'
              }`}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-xs text-red-500 ml-1">Les mots de passe ne correspondent pas</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            canSubmit
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200/50'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Modification...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Changer le mot de passe</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordSection;
