import React, { useState } from 'react';
import { 
  BellRing, 
  PhoneCall, 
  Mail, 
  CheckCircle2, 
  Clock, 
  Send, 
  Search, 
  Radio, 
  ShieldCheck, 
  Terminal,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { NotificationLog } from '../types.ts';

interface NotificationLogsViewProps {
  notifications: NotificationLog[];
  onSendTestNotification: (channel: 'sms' | 'email', target: string) => Promise<void>;
  isSendingTest: boolean;
}

export const NotificationLogsView: React.FC<NotificationLogsViewProps> = ({
  notifications,
  onSendTestNotification,
  isSendingTest,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'all' | 'sms' | 'email'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testTarget, setTestTarget] = useState('+1 (555) 987-1234');
  const [testChannel, setTestChannel] = useState<'sms' | 'email'>('sms');
  const [testResult, setTestResult] = useState<string | null>(null);

  const filteredLogs = notifications.filter((notif) => {
    const matchesChannel = selectedChannel === 'all' || notif.channel === selectedChannel;
    const matchesSearch =
      notif.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.recipientAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (notif.deliveryId && notif.deliveryId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      notif.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesChannel && matchesSearch;
  });

  const handleRunTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTarget) return;
    setTestResult(null);
    try {
      await onSendTestNotification(testChannel, testTarget);
      setTestResult(`Successfully dispatched test ${testChannel.toUpperCase()} packet to ${testTarget}`);
      setTimeout(() => setTestResult(null), 6000);
    } catch (err) {
      setTestResult('Failed to deliver test payload: ' + String(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Multi-Channel Telemetry
            </span>
            <span className="text-xs text-slate-400">Total Dispatched: {notifications.length}</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Automated SMS &amp; Email Dispatch Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable audit trail of low-attendance alert notifications delivered to students and parents.
          </p>
        </div>
      </div>

      {/* Gateway Status & Live Test Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gateway Telemetry Cards */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Gateway Connectivity
            </h3>
            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              OPERATIONAL
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                  <PhoneCall className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Twilio / SMS Gateway</div>
                  <div className="text-[10px] text-slate-400">Global Telecom Carrier Route</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">ACTIVE</span>
            </div>

            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">SendGrid / SMTP Relay</div>
                  <div className="text-[10px] text-slate-400">Official Campus Domain</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-blue-400 font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Live Test Dispatcher */}
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-cyan-400" />
              Send Live Test Alert
            </h3>
            <span className="text-[10px] text-slate-400">Verify carrier deliverability</span>
          </div>

          <form onSubmit={handleRunTest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Target Channel</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTestChannel('sms');
                      setTestTarget('+1 (555) 987-1234');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition border ${
                      testChannel === 'sms'
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    SMS Phone
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTestChannel('email');
                      setTestTarget('guardian.test@campus.edu');
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold transition border ${
                      testChannel === 'email'
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    Email Address
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] text-slate-400 mb-1">
                  Recipient {testChannel === 'sms' ? 'Phone Number' : 'Email Address'}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type={testChannel === 'sms' ? 'tel' : 'email'}
                    required
                    value={testTarget}
                    onChange={(e) => setTestTarget(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isSendingTest}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-900/30 transition whitespace-nowrap"
                  >
                    {isSendingTest ? 'Dispatching...' : 'Send Test Packet'}
                  </button>
                </div>
              </div>
            </div>

            {testResult && (
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
                <span>{testResult}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Logs Table Controls */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedChannel('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedChannel === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Alerts ({notifications.length})
            </button>
            <button
              onClick={() => setSelectedChannel('sms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedChannel === 'sms'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              SMS Only ({notifications.filter((n) => n.channel === 'sms').length})
            </button>
            <button
              onClick={() => setSelectedChannel('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedChannel === 'email'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Email Only ({notifications.filter((n) => n.channel === 'email').length})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search logs by student, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Channel &amp; Status</th>
                <th className="py-3 px-4">Student &amp; Rate</th>
                <th className="py-3 px-4">Recipient Destination</th>
                <th className="py-3 px-4">Message Excerpt</th>
                <th className="py-3 px-4">Delivery Ref / Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${
                        log.channel === 'sms'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {log.channel === 'sms' ? (
                          <PhoneCall className="w-3.5 h-3.5" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white uppercase font-mono">
                          {log.channel}
                        </span>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          {log.status.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-semibold text-white text-xs">{log.studentName}</div>
                    <div className="text-[11px] text-rose-400 font-bold">
                      {log.attendanceRate}% Attendance
                    </div>
                  </td>

                  <td className="py-3 px-4 text-xs font-mono text-slate-300">
                    <div className="truncate max-w-[180px]">{log.recipientAddress}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-sans">
                      Target: {log.recipientType}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-xs text-slate-300">
                    <p className="line-clamp-2 max-w-sm text-[11px]">{log.message}</p>
                  </td>

                  <td className="py-3 px-4 text-xs text-slate-400 font-mono">
                    <div className="text-indigo-400 text-[11px]">
                      {log.deliveryId || log.id}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1 font-sans mt-0.5">
                      <Clock className="w-3 h-3" />
                      {new Date(log.sentAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
