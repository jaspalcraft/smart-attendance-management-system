import React from 'react';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon, 
  Send, 
  BellRing, 
  ArrowUpRight, 
  QrCode, 
  FileSpreadsheet, 
  Calendar, 
  PhoneCall, 
  Mail, 
  Clock,
  Sparkles
} from 'lucide-react';
import { Student, CourseClass, NotificationLog, AlertSetting } from '../types.ts';

interface DashboardViewProps {
  students: Student[];
  classes: CourseClass[];
  notifications: NotificationLog[];
  settings: AlertSetting;
  onNavigate: (tab: string) => void;
  onOpenAlertModal: (student: Student) => void;
  onQuickSweep: () => void;
  isSweeping: boolean;
  onExportCSV: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  classes,
  notifications,
  settings,
  onNavigate,
  onOpenAlertModal,
  onQuickSweep,
  isSweeping,
  onExportCSV,
}) => {
  // Calculations
  const totalStudents = students.length;
  const avgAttendance = totalStudents > 0 
    ? (students.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents).toFixed(1)
    : '0';

  const atRiskStudents = students.filter(
    (s) => s.attendanceRate < settings.warningThreshold && s.attendanceRate >= settings.criticalThreshold
  );
  const criticalStudents = students.filter((s) => s.attendanceRate < settings.criticalThreshold);
  const goodStudents = students.filter((s) => s.attendanceRate >= settings.warningThreshold);

  const totalAtRisk = atRiskStudents.length + criticalStudents.length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Low Attendance Emergency Alert Banner */}
      {totalAtRisk > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-900/90 via-slate-900 to-amber-950/90 border border-rose-600/30 p-5 shadow-xl text-white">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30 text-rose-400 mt-1">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    Low Attendance Alert System
                  </span>
                  <span className="text-xs text-slate-300">Policy Threshold: &lt;{settings.warningThreshold}%</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">
                  {totalAtRisk} Students Below Mandatory Attendance Threshold
                </h2>
                <p className="text-sm text-slate-300 mt-0.5">
                  {criticalStudents.length} students are in critical zone (&lt;{settings.criticalThreshold}%) and {atRiskStudents.length} in warning zone. Automated SMS and email notifications are ready for dispatch to parents and students.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                onClick={() => onNavigate('alerts-hub')}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition"
              >
                Inspect Low Attendance Hub
              </button>
              <button
                onClick={onQuickSweep}
                disabled={isSweeping}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-900/40 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSweeping ? 'Dispatching...' : 'Dispatch Automated Warnings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Students */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Enrolled</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalStudents}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across {classes.length} active courses</div>
        </div>

        {/* Avg Attendance */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Avg Attendance</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{avgAttendance}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Campus benchmark &gt;= 75%</div>
        </div>

        {/* Good Standing */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Good Standing</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-2xl font-bold text-white">{goodStudents.length}</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {totalStudents ? Math.round((goodStudents.length / totalStudents) * 100) : 0}% compliant
          </div>
        </div>

        {/* At-Risk (<75%) */}
        <div className="bg-slate-900/90 rounded-xl border border-amber-900/40 p-4 shadow-sm bg-gradient-to-b from-amber-950/20 to-transparent">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium">Warning (60-74%)</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300">{atRiskStudents.length}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Advisory alert triggered</div>
        </div>

        {/* Critical (<60%) */}
        <div className="bg-slate-900/90 rounded-xl border border-rose-900/50 p-4 shadow-sm bg-gradient-to-b from-rose-950/30 to-transparent">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-xs font-medium">Critical (&lt;60%)</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{criticalStudents.length}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Debarment risk notice</div>
        </div>

        {/* Notifications Dispatched */}
        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Alerts Sent</span>
            <BellRing className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-300">{notifications.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">SMS &amp; Email dispatches</div>
        </div>
      </div>

      {/* Attendance Distribution Visual Bar */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white">Institutional Attendance Health Spectrum</h3>
            <p className="text-xs text-slate-400">Distribution of enrolled students relative to mandatory 75% cutoff</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Safe (&gt;=75%): {goodStudents.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">Warning (60-74%): {atRiskStudents.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-300">Critical (&lt;60%): {criticalStudents.length}</span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 flex overflow-hidden ring-1 ring-slate-700">
          <div 
            style={{ width: `${totalStudents ? (goodStudents.length / totalStudents) * 100 : 0}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Good: ${goodStudents.length}`}
          />
          <div 
            style={{ width: `${totalStudents ? (atRiskStudents.length / totalStudents) * 100 : 0}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`Warning: ${atRiskStudents.length}`}
          />
          <div 
            style={{ width: `${totalStudents ? (criticalStudents.length / totalStudents) * 100 : 0}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`Critical: ${criticalStudents.length}`}
          />
        </div>
      </div>

      {/* Quick Launchpad & Attendance Workflows */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('mark-attendance')}
          className="group text-left p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-800/40 hover:border-indigo-600 transition shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-lg bg-indigo-600/20 text-indigo-400 group-hover:scale-110 transition">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition" />
          </div>
          <div className="text-sm font-bold text-white">Mark Attendance</div>
          <p className="text-xs text-slate-400 mt-1">Record session ledger with quick toggles or barcode scanner</p>
        </button>

        <button
          onClick={() => onNavigate('mark-attendance')}
          className="group text-left p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 to-slate-900 border border-cyan-800/40 hover:border-cyan-600 transition shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-lg bg-cyan-600/20 text-cyan-400 group-hover:scale-110 transition">
              <QrCode className="w-5 h-5 text-cyan-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition" />
          </div>
          <div className="text-sm font-bold text-white">Smart QR Session</div>
          <p className="text-xs text-slate-400 mt-1">Project dynamic QR code for instant student mobile check-in</p>
        </button>

        <button
          onClick={() => onNavigate('alerts-hub')}
          className="group text-left p-4 rounded-xl bg-gradient-to-br from-rose-950/60 to-slate-900 border border-rose-800/40 hover:border-rose-600 transition shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-lg bg-rose-600/20 text-rose-400 group-hover:scale-110 transition">
              <Send className="w-5 h-5 text-rose-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition" />
          </div>
          <div className="text-sm font-bold text-white">Automated Alert Hub</div>
          <p className="text-xs text-slate-400 mt-1">Review at-risk students and trigger mass SMS/Email alerts</p>
        </button>

        <button
          onClick={onExportCSV}
          className="group text-left p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-800/40 hover:border-emerald-600 transition shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2.5 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:scale-110 transition">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition" />
          </div>
          <div className="text-sm font-bold text-white">Export Audit CSV</div>
          <p className="text-xs text-slate-400 mt-1">Generate official CSV report of attendance and parent notices</p>
        </button>
      </div>

      {/* Two Columns: At-Risk Radar & Live Notifications Dispatch Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* At-Risk Students Radar */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Low Attendance Priority Radar</h3>
                <p className="text-xs text-slate-400">Students requiring immediate SMS/Email intervention</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('alerts-hub')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              View All ({totalAtRisk}) &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {[...criticalStudents, ...atRiskStudents].slice(0, 5).map((student) => {
              const isCrit = student.attendanceRate < settings.criticalThreshold;
              return (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition ${
                    isCrit 
                      ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                      : 'bg-amber-950/20 border-amber-900/30 hover:border-amber-700/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isCrit ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      {student.rollNumber.split('-').pop() || student.name[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        {student.name}
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                          isCrit ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/30 text-amber-300'
                        }`}>
                          {isCrit ? 'Critical Debarment' : 'Warning'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">
                        Roll: {student.rollNumber} &bull; Attended: {student.attendedClasses}/{student.totalClasses} classes
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className={`text-base font-bold ${isCrit ? 'text-rose-400' : 'text-amber-400'}`}>
                        {student.attendanceRate}%
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Cutoff: 75%
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenAlertModal(student)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                      title="Send instant SMS or Email alert"
                    >
                      <Send className="w-3 h-3" />
                      <span>Alert</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {totalAtRisk === 0 && (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-200">Excellent Attendance Record!</p>
                <p className="text-xs text-slate-400">All students are currently maintaining &gt;= 75% attendance.</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Notification Dispatch Feed */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Recent Notification Deliveries</h3>
                <p className="text-xs text-slate-400">Audit trail of automated SMS &amp; Email dispatches</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('notifications')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Full Log &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {notifications.slice(0, 5).map((notif) => (
              <div
                key={notif.id}
                className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg mt-0.5 ${
                    notif.channel === 'sms' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : notif.channel === 'email'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {notif.channel === 'sms' ? <PhoneCall className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{notif.studentName}</span>
                      <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 rounded bg-slate-700 text-slate-300">
                        {notif.channel.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                        &bull; {notif.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">{notif.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                      <span>To: {notif.recipientAddress}</span>
                      <span>&bull;</span>
                      <span>Ref: {notif.deliveryId || notif.id}</span>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 whitespace-nowrap flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {new Date(notif.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                No notification alerts logged yet. Run an automated sweep or send a manual alert.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
