import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, LogIn } from 'lucide-react';

interface LoginProps {
  onGoogleLogin: () => Promise<void> | void;
  error?: string | null;
}

export const Login: React.FC<LoginProps> = ({ onGoogleLogin, error }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      await onGoogleLogin();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(79,70,229,0.18),transparent_35%),radial-gradient(circle_at_15%_80%,rgba(6,182,212,0.10),transparent_30%)]" />

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-xl font-bold">AttendSmart Pro</h1>
              <p className="text-sm text-slate-400">
                Smart Attendance & Multi-Channel Warning System
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold mb-6">
            <ShieldCheck className="w-4 h-4" />
            Secure Faculty & Academic Access
          </div>

          <h2 className="text-5xl font-black leading-tight tracking-tight">
            Secure Faculty &
            <br />
            Academic Access
          </h2>

          <p className="mt-6 max-w-xl text-base leading-7 text-slate-400">
            Log in to monitor student attendance trends, dispatch automated
            SMS and email warning notices, and manage department roll calls.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="font-semibold text-white">
                Automated Low Attendance Alerts
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Immediate SMS and email warnings when attendance falls below
                the configured threshold.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="font-semibold text-white">
                Live QR & Session Markings
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Mark lectures, labs, and tutorials with one-click attendance
                recording.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="font-semibold text-white">
                Enterprise Backend Synchronization
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Firebase Cloud Firestore synchronization with the Java Spring
                Boot backend.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto">
          <div className="mb-6 lg:hidden flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h1 className="font-bold">AttendSmart Pro</h1>
              <p className="text-xs text-slate-400">
                Smart Attendance Management System
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl">
            <div className="mb-7">
              <h3 className="text-2xl font-bold">Sign in to Account</h3>
              <p className="text-sm text-slate-400 mt-2">
                Use your Google account to continue to the dashboard.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl border border-rose-800/60 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-3.5 text-sm font-semibold transition"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white text-[#4285F4] font-bold">
                G
              </span>

              {isLoading ? 'Signing in...' : 'Continue with Google'}

              {!isLoading && <LogIn className="w-4 h-4 ml-auto" />}
            </button>

            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-800" />
              <span className="text-[10px] uppercase tracking-widest text-slate-500">
                Secure Authentication
              </span>
              <div className="h-px flex-1 bg-slate-800" />
            </div>

            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 text-xs text-slate-400">
              Your Google session is securely managed by Firebase
              Authentication. Once signed in, you can return to the
              application without logging in again until you sign out.
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-500 mt-5">
            AttendSmart Pro • Smart Attendance Management System
          </p>
        </div>
      </div>
    </div>
  );
};
