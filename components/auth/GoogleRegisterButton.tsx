import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../../utils/supabaseClient';

/**
 * Google sign-up button for the registration page.
 * Initiates Google OAuth with a redirect back to /register.
 * Sets a sessionStorage flag so RegisterPage knows to pre-fill from Google.
 */
const GoogleRegisterButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  const handleGoogleRegister = async () => {
    if (!configured) {
      console.log('[Auth] Google sign-up skipped — Supabase not configured (local mode)');
      return;
    }
    setLoading(true);
    sessionStorage.setItem('google_register_pending', 'true');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/#/register`,
        },
      });
      if (error) {
        console.error('[Auth] Google OAuth error:', error.message);
        sessionStorage.removeItem('google_register_pending');
        setLoading(false);
      }
    } catch (err) {
      console.error('[Auth] Google OAuth exception:', err);
      sessionStorage.removeItem('google_register_pending');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleGoogleRegister}
        disabled={loading || !configured}
        className="auth-social-btn"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-[var(--c-border)] border-t-[var(--c-brand)] rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        <span>S'inscrire avec Google</span>
      </button>
      {!configured && (
        <p className="text-center text-xs text-[var(--c-text-3)] mt-2">
          Mode local — l'inscription Google nécessite Supabase
        </p>
      )}
    </>
  );
};

export default GoogleRegisterButton;
