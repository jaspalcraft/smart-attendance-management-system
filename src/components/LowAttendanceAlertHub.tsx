import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertOctagon, 
  Send, 
  PhoneCall, 
  Mail, 
  Filter, 
  Search, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { Student, AlertSetting, NotificationLog } from '../types.ts';

interface LowAttendanceAlertHubProps {
  students: Student[];
  settings: AlertSetting;
  onOpenAlertModal: (student: Student) => void;
  onDispatchAllAtRisk: () => void;
  isDispatching: boolean;
}

export const LowAttendanceAlertHub: React.FC<LowAttendanceAlertHubProps> = ({
  students,
  settings,
  onOpenAlertModal,
  onDispatchAllAtRisk,
  isDispatching,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // At-risk filtering
  const warningList = students.filter(
    (s) => s.attendanceRate < settings.warningThreshold && s.attendanceRate >= settings.criticalThreshold
  );
  const criticalList = students.filter((s) => s.attendanceRate < settings.criticalThreshold);
  const allAtRisk = [...criticalList, ...warningList];

  const displayedList = (
    filterType === 'all'
      ? allAtRisk
      : filterType === 'critical'
      ? criticalList
      : warningList
  ).filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.course.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper: calculate classes needed to reach 75%
  const calculateNeededClasses = (attended: number, total: number, targetRate = 75) => {
    // (attended + x) / (total + x) >= targetRate / 100
    // 100 * attended + 100 * x >= targetRate * total + targetRate * x
    // x * (100 - targetRate) >= targetRate * total - 100 * attended
    const diff = (targetRate * total - 100 * attended) / (100 - targetRate);
    return Math.max(0, Math.ceil(diff));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 rounded-2xl border border-rose-800/40 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                Early Warning &amp; Automated Intervention
              </span>
              <span className="text-xs text-slate-400">
                Institutional Cutoff: &lt;{settings.warningThreshold}%
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mt-1">Low Attendance Alert Radar</h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Automated multi-channel notification engine. Detects students who fall short of required attendance, calculates recovery sessions needed, and dispatches SMS alerts to parents and formal warning emails to students.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onDispatchAllAtRisk}
              disabled={isDispatching || allAtRisk.length === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-rose-900/40 transition disabled:opacity-50"
            >
              <Send className={`w-4 h-4 ${isDispatching ? 'animate-spin' : ''}`} />
              <span>{isDispatching ? 'Sending Mass Alerts...' : `Send Mass Alert to All (${allAtRisk.length})`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Summary Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-xl border border-slate-800">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All At-Risk ({allAtRisk.length})
          </button>
          <button
            onClick={() => setFilterType('critical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'critical'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Critical &lt;{settings.criticalThreshold}% ({criticalList.length})
          </button>
          <button
            onClick={() => setFilterType('warning')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Warning {settings.criticalThreshold}-{settings.warningThreshold}% ({warningList.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search at-risk students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* At Risk Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedList.map((student) => {
          const isCritical = student.attendanceRate < settings.criticalThreshold;
          const classesNeeded = calculateNeededClasses(
            student.attendedClasses,
            student.totalClasses,
            settings.warningThreshold
          );

          return (
            <div
              key={student.id}
              className={`rounded-2xl border p-5 transition shadow-sm ${
                isCritical
                  ? 'bg-gradient-to-br from-rose-950/30 to-slate-900 border-rose-800/40 hover:border-rose-700'
                  : 'bg-gradient-to-br from-amber-950/20 to-slate-900 border-amber-800/40 hover:border-amber-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isCritical
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
                        : 'bg-amber-600 text-white shadow-lg shadow-amber-900/50'
                    }`}
                  >
                    {student.rollNumber.split('-').pop() || student.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-base text-white flex items-center gap-2">
                      {student.name}
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {isCritical ? 'Critical Risk' : 'Attendance Warning'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Roll: <span className="font-mono text-slate-300">{student.rollNumber}</span> &bull; {student.course}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-2xl font-black ${
                      isCritical ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {student.attendanceRate}%
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Deficit: {(settings.warningThreshold - student.attendanceRate).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress and Recovery Metric */}
              <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Current Sessions Attended:</span>
                  <span className="font-semibold text-slate-200">
                    {student.attendedClasses} / {student.totalClasses} classes
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${student.attendanceRate}%` }}
                  />
                </div>

                {/* Recovery recommendation calculation */}
                <div className="flex items-center gap-1.5 text-xs text-amber-300/90 pt-1">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>
                    Must attend <strong>{classesNeeded}</strong> consecutive sessions without absence to reach {settings.warningThreshold}% requirement.
                  </span>
                </div>
              </div>

              {/* Parent & Contact Details */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Parent / Guardian:</span>
                  <span className="font-medium text-slate-200">{student.parentName}</span>
                  <div className="text-slate-400 flex items-center gap-1 mt-0.5 font-mono text-[11px]">
                    <PhoneCall className="w-3 h-3 text-emerald-400" />
                    {student.parentPhone}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">Parent Email:</span>
                  <div className="text-slate-400 flex items-center gap-1 mt-0.5 truncate text-[11px]">
                    <Mail className="w-3 h-3 text-cyan-400 shrink-0" />
                    <span className="truncate">{student.parentEmail}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <div className="text-[11px] text-slate-500">
                  {student.lastAlertSentAt ? (
                    <span>Last Alert: {new Date(student.lastAlertSentAt).toLocaleDateString()}</span>
                  ) : (
                    <span className="text-amber-400/80">No alert sent yet</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenAlertModal(student)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send SMS &amp; Email Alert</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {displayedList.length === 0 && (
          <div className="col-span-2 py-12 text-center bg-slate-900/80 rounded-2xl border border-slate-800">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No Students in this Filter Range</h3>
            <p className="text-xs text-slate-400 mt-1">All checked students satisfy the attendance parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
