import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  BookOpen, 
  BellRing, 
  Settings, 
  BarChart3, 
  Send, 
  QrCode,
  LogOut,
  LogIn,
  Radio
} from 'lucide-react';
import { AppUser } from '../types.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: AppUser | null;
  onLogin: () => void;
  onLogout: () => void;
  atRiskCount: number;
  onTriggerSweep: () => void;
  isSweeping: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogin,
  onLogout,
  atRiskCount,
  onTriggerSweep,
  isSweeping,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'mark-attendance', label: 'Mark Attendance', icon: CheckCircle2 },
    { 
      id: 'alerts-hub', 
      label: 'Low Attendance Alert', 
      icon: AlertTriangle, 
      badge: atRiskCount > 0 ? atRiskCount : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'classes', label: 'Classes', icon: BookOpen },
    { id: 'notifications', label: 'SMS & Email Logs', icon: BellRing },
    { id: 'settings', label: 'Alert Settings', icon: Settings },
    { id: 'java-backend', label: '☕ Java Backend', icon: Radio },
  ];

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      {/* Top Banner with Service Status & Auto-Alert Quick Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/10">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  AttendSmart Pro
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Automated Alerts
                </span>
              </div>
              <p className="text-xs text-slate-400">Smart Attendance &amp; Multi-Channel Warning System</p>
            </div>
          </div>

          {/* Quick Actions & Auth */}
          <div className="flex items-center space-x-3">
            {/* Live Gateway Telemetry */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium">SMS &amp; Email Gateway Active</span>
            </div>

            {/* Quick Sweep Button */}
            <button
              onClick={onTriggerSweep}
              disabled={isSweeping}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
                atRiskCount > 0 
                  ? 'bg-gradient-to-r from-rose-600 to-orange-600 text-white hover:from-rose-500 hover:to-orange-500 ring-2 ring-rose-500/30 shadow-rose-900/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
              title="Runs automated scan on all students and sends SMS/Email alerts to those below threshold"
            >
              <Send className={`w-3.5 h-3.5 ${isSweeping ? 'animate-spin' : ''}`} />
              <span>{isSweeping ? 'Scanning & Sending...' : 'Auto Alert Sweep'}</span>
              {atRiskCount > 0 && (
                <span className="bg-white/20 px-1.5 py-0.2 rounded-md font-bold text-[11px]">
                  {atRiskCount} At Risk
                </span>
              )}
            </button>

            {/* User Session */}
            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-indigo-400/30 overflow-hidden">
                  {currentUser.photoURL ? (
                    <img src={currentUser.photoURL} alt={currentUser.displayName || ''} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.displayName?.[0] || 'U'
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {currentUser.displayName || currentUser.email}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">{currentUser.role}</div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in with Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
