import React, { FormEvent, useState } from 'react';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  ShieldCheck,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '../firebase.ts';

interface LoginProps {
  onGoogleLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGoogleLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isCreatingAccount) {
        await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      } else {
        await signInWithEmailAndPassword(auth, normalizedEmail, password);
      }
    } catch (err: unknown) {
      const code = err && typeof err === 'object' && 'code' in err
        ? String((err as { code?: unknown }).code)
        : '';

      const messages: Record<string, string> = {
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/user-not-found': 'No account exists for this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account already exists for this email.',
        'auth/weak-password': 'Password must be at least 6 characters.',
        'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase yet.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
      };

      setError(messages[code] ?? 'Unable to authenticate. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/10">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="mt-5 text-2xl font-bold tracking-tight">AttendSmart Pro</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your attendance dashboard
          </p>
        </div>

        <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-7 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-white">
                {isCreatingAccount ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-xs text-slate-400">
                {isCreatingAccount
                  ? 'Create an account to use the dashboard.'
                  : 'Enter your email and password to continue.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 pl-10 pr-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-medium text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isCreatingAccount ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 pl-10 pr-11 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 px-3 py-2.5 text-xs text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 transition"
            >
              {isCreatingAccount
                ? <UserPlus className="w-4 h-4" />
                : <LogIn className="w-4 h-4" />}
              {isSubmitting
                ? 'Please wait...'
                : isCreatingAccount
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[11px] uppercase tracking-wider text-slate-500">or</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <button
            type="button"
            onClick={onGoogleLogin}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-800 text-slate-100 text-sm font-semibold py-3 transition"
          >
            <span className="font-bold">G</span>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => {
              setIsCreatingAccount((value) => !value);
              setError('');
            }}
            className="w-full mt-4 text-xs text-indigo-400 hover:text-indigo-300"
          >
            {isCreatingAccount
              ? 'Already have an account? Sign in'
              : 'Need an account? Create one'}
          </button>
        </div>

        <p className="mt-5 text-center text-[11px] text-slate-500">
          Your dashboard and attendance data are protected behind authentication.
        </p>
      </div>
    </div>
  );
};
