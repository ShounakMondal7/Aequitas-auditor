import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useTranslation } from 'react-i18next';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (username: string, email?: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticate }) => {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Close modal on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleDemoSignIn = (demoName = 'Shounak Mondal', demoEmail = 'shounak.mondal@aequitas.ai') => {
    setAuthError(null);
    onAuthenticate(demoName, demoEmail);
    onClose();
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        const displayName = userInfo.name || userInfo.email?.split('@')[0] || 'Google Auditor';
        onAuthenticate(displayName, userInfo.email);
        onClose();
      } catch (err) {
        console.warn('Failed to retrieve full Google profile data, using fallback:', err);
        handleDemoSignIn('Google Auditor', 'auditor@gmail.com');
      }
    },
    onError: (error) => {
      console.warn('Google Login encountered an issue (origin mismatch or popup blocked):', error);
      setAuthError('Google Sign-In popup could not complete. Click below to continue with verified demo credentials.');
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveEmail = email.trim() || 'shounak.mondal@aequitas.ai';
    const namePart = effectiveEmail.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    onAuthenticate(formattedName, effectiveEmail);
    onClose();
  };

  const handleGuest = () => {
    onAuthenticate('Guest');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white text-slate-900 rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col md:flex-row relative border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-6 right-6 z-20 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-lg p-1"
          aria-label={t('modal.close', 'Close')}
        >
          ✕
        </button>

        {/* Left Form Panel */}
        <div className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-teal-500/30">
                A
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">{t('nav.aequitas', 'Aequitas')}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-1">
              {isSignUp ? t('auth.create_account', 'Create Auditor Account') : t('auth.sign_in', 'Auditor Sign In')}
            </h2>
            <p className="text-xs text-slate-500 mb-5">{t('auth.platform_subtitle', 'Autonomous AI Fairness & Bias Auditing Platform')}</p>

            {/* Instant 1-Click Demo Sign In Trigger */}
            <button
              type="button"
              onClick={() => handleDemoSignIn('Shounak Mondal', 'shounak.mondal@aequitas.ai')}
              className="w-full mb-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 hover:shadow-teal-500/35 transition-all cursor-pointer active:scale-95"
            >
              <span>⚡</span>
              <span>{t('auth.one_click_signin', '1-Click Sign In (Shounak Mondal - Lead AI Auditor)')}</span>
            </button>

            {authError && (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <p>{authError}</p>
                <button
                  type="button"
                  onClick={() => handleDemoSignIn('Shounak Mondal (Google)', 'shounak.mondal@gmail.com')}
                  className="w-full py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition cursor-pointer"
                >
                  Sign In with Demo Google Profile &rarr;
                </button>
              </div>
            )}

            {/* Standard Email / Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">{t('auth.email_label', 'Email address')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="shounak.mondal@aequitas.ai"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-600 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">{t('auth.password_label', 'Password')}</label>
                  <span className="text-[10px] text-slate-400">{t('auth.password_optional', '(Optional for demo)')}</span>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-teal-600 focus:bg-white text-slate-900 transition-all placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm transition-all shadow-md mt-1 cursor-pointer"
              >
                {isSignUp ? t('auth.btn_create_and_signin', 'Create Account & Sign In') : t('auth.btn_signin_email', 'Sign In with Email')}
              </button>
            </form>

            <div className="relative my-3.5 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative px-3 bg-white text-[10px] uppercase tracking-wider text-slate-400">{t('auth.or_divider', 'or')}</span>
            </div>

            {/* Google OAuth Trigger */}
            <button
              type="button"
              onClick={() => {
                try {
                  loginWithGoogle();
                } catch {
                  handleDemoSignIn('Google Auditor', 'auditor@gmail.com');
                }
              }}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-all space-x-2 cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{t('auth.signin_google', 'Sign in with Google')}</span>
            </button>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs">
            <p className="text-slate-500">
              {isSignUp ? t('auth.already_account', 'Already have an account?') : t('auth.dont_have_account', "Don't have an account?")}{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-teal-600 font-semibold hover:underline ml-1 cursor-pointer"
              >
                {isSignUp ? t('auth.sign_in_link', 'Sign in') : t('auth.sign_up_link', 'Sign up')}
              </button>
            </p>
            <button
              type="button"
              onClick={handleGuest}
              className="mt-2 sm:mt-0 text-slate-600 hover:text-teal-600 font-semibold transition-colors cursor-pointer"
            >
              {t('auth.continue_guest', 'Continue as Guest →')}
            </button>
          </div>
        </div>

        {/* Right Feature Panel */}
        <div className="md:w-1/2 bg-gradient-to-br from-[#06030F] to-[#12082b] relative hidden md:flex items-center justify-center p-12 overflow-hidden border-l border-slate-100">
          <div className="relative z-10 text-center text-white space-y-4 max-w-xs">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-500/20 backdrop-blur-md flex items-center justify-center border border-teal-500/30 shadow-xl shadow-teal-500/20">
              <span className="text-2xl">⚖️</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
              {t('auth.compliance_title', 'Aequitas AI Compliance')}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {t(
                'auth.compliance_desc',
                'Autonomous enterprise bias auditing adhering to the EU AI Act, India DPDP Act 2023, and global constitutional anti-discrimination laws (e.g., Article 15).'
              )}
            </p>
            <div className="pt-2 flex justify-center gap-2 text-[10px] text-teal-400 font-mono">
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{t('auth.compliance_tag1', 'Global: EU AI Act')}</span>
              <span className="px-2 py-1 rounded bg-white/5 border border-white/10">{t('auth.compliance_tag2', 'India: DPDP & Art. 15')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
