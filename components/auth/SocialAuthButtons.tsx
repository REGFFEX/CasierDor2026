import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';

/**
 * Social authentication buttons (Google + Apple)
 * iOS-style design with glass effect.
 * Uses Supabase OAuth when configured, falls back to local-only mode otherwise.
 */
const SocialAuthButtons: React.FC = () => {
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured()) {
      // Local-only mode: no cloud OAuth available
      console.log('[Auth] Google sign-in skipped — Supabase not configured (local mode)');
      return;
    }
    setLoadingProvider('google');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) console.error('[Auth] Google OAuth error:', error.message);
    } catch (err) {
      console.error('[Auth] Google OAuth exception:', err);
    } finally {
      setLoadingProvider(null);
    }
  };

  const handleAppleLogin = async () => {
    if (!isSupabaseConfigured()) {
      console.log('[Auth] Apple sign-in skipped — Supabase not configured (local mode)');
      return;
    }
    setLoadingProvider('apple');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/` },
      });
      if (error) console.error('[Auth] Apple OAuth error:', error.message);
    } catch (err) {
      console.error('[Auth] Apple OAuth exception:', err);
    } finally {
      setLoadingProvider(null);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-[var(--c-border)]" />
        <span className="text-xs font-medium text-[var(--c-text-3)] uppercase tracking-wider">ou</span>
        <div className="flex-1 h-px bg-[var(--c-border)]" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loadingProvider !== null}
        className="auth-social-btn"
      >
        {loadingProvider === 'google' ? (
          <span className="w-5 h-5 border-2 border-[var(--c-border)] border-t-[var(--c-brand)] rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        <span>Continuer avec Google</span>
      </button>

      {/* Apple */}
      <button
        type="button"
        onClick={handleAppleLogin}
        disabled={loadingProvider !== null}
        className="auth-social-btn auth-social-btn-apple"
      >
        {loadingProvider === 'apple' ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        )}
        <span>Continuer avec Apple</span>
      </button>

      {!configured && (
        <p className="text-center text-xs text-[var(--c-text-3)] mt-2">
          Mode local — la connexion sociale nécessite Supabase
        </p>
      )}
    </div>
  );
};

export default SocialAuthButtons;
