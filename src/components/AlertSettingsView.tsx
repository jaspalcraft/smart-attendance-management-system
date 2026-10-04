import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  Sliders, 
  BellRing, 
  Mail, 
  PhoneCall, 
  CheckCircle2, 
  Users, 
  Clock, 
  ShieldAlert
} from 'lucide-react';
import { AlertSetting } from '../types.ts';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';

interface AlertSettingsViewProps {
  settings: AlertSetting;
  onUpdateSettings: (newSettings: AlertSetting) => void;
}

export const AlertSettingsView: React.FC<AlertSettingsViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<AlertSetting>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    const updated: AlertSetting = {
      ...formData,
      warningThreshold: Number(formData.warningThreshold),
      criticalThreshold: Number(formData.criticalThreshold),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'settings', updated.id), updated);
      onUpdateSettings(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Institutional Policy
          </span>
          <span className="text-xs text-slate-400">Rules &amp; Delivery Automation</span>
        </div>
        <h2 className="text-xl font-bold text-white mt-1">Low Attendance Alert Configuration</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Define university cutoffs, automated SMS/Email triggers, and parent notification rules.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Threshold Sliders */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Attendance Threshold Cutoffs</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Warning Threshold */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Advisory Warning Threshold
                </label>
                <span className="text-sm font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                  {formData.warningThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="90"
                step="1"
                value={formData.warningThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, warningThreshold: Number(e.target.value) })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Students below this percentage trigger warning SMS &amp; Email alerts to students and parents.
              </p>
            </div>

            {/* Critical Threshold */}
            <div className="space-y-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-200">
                  Critical Debarment Threshold
                </label>
                <span className="text-sm font-bold text-rose-400 px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30">
                  {formData.criticalThreshold}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="75"
                step="1"
                value={formData.criticalThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, criticalThreshold: Number(e.target.value) })
                }
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                High-priority academic alert with official debarment notice issued to Dean &amp; guardians.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Automated Dispatch Channels */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <BellRing className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Delivery Channels &amp; Automation</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">SMS Notification Gateway</div>
                  <div className="text-[11px] text-slate-400">Instant mobile SMS alerts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.smsEnabled}
                onChange={(e) => setFormData({ ...formData, smsEnabled: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Email Notification Gateway</div>
                  <div className="text-[11px] text-slate-400">Formal warning letter delivery</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.emailEnabled}
                onChange={(e) => setFormData({ ...formData, emailEnabled: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Recipients */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Notify Parents / Guardians</div>
                <div className="text-[11px] text-slate-400">Send alerts directly to registered parent contacts</div>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyParents}
                onChange={(e) => setFormData({ ...formData, notifyParents: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Notify Enrolled Students</div>
                <div className="text-[11px] text-slate-400">Send alerts directly to student mobile/inbox</div>
              </div>
              <input
                type="checkbox"
                checked={formData.notifyStudents}
                onChange={(e) => setFormData({ ...formData, notifyStudents: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Sender Addresses */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Official Sender Credentials</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Official Campus SMS Sender ID
              </label>
              <input
                type="text"
                value={formData.senderPhone}
                onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Official Registrar / Dean Email
              </label>
              <input
                type="email"
                value={formData.senderEmail}
                onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Save Footer */}
        <div className="flex items-center justify-between p-4 bg-slate-900/90 rounded-2xl border border-slate-800">
          <div>
            {saveSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Alert policies updated &amp; synchronized across nodes!
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Updating...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
