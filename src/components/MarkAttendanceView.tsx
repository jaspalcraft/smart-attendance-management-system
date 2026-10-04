import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  HelpCircle, 
  Save, 
  Sparkles, 
  QrCode, 
  Scan, 
  Search, 
  Calendar, 
  BookOpen, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Student, CourseClass, AttendanceRecord, AttendanceStatus, StudentSessionRecord } from '../types.ts';
import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';

interface MarkAttendanceViewProps {
  students: Student[];
  classes: CourseClass[];
  warningThreshold: number;
  onAttendanceSubmitted: (record: AttendanceRecord, newlyAtRisk: Student[]) => void;
}

export const MarkAttendanceView: React.FC<MarkAttendanceViewProps> = ({
  students,
  classes,
  warningThreshold,
  onAttendanceSubmitted,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [sessionType, setSessionType] = useState<'lecture' | 'lab' | 'tutorial'>('lecture');
  const [searchQuery, setSearchQuery] = useState('');
  const [markingMode, setMarkingMode] = useState<'roster' | 'qr' | 'scanner'>('roster');

  // Roster state: mapping studentId -> { status, remarks }
  const [roster, setRoster] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Scanner state
  const [scannerInput, setScannerInput] = useState('');
  const [scannerLogs, setScannerLogs] = useState<string[]>([]);

  // QR state
  const [qrToken, setQrToken] = useState('ATT-' + Math.random().toString(36).substring(2, 8).toUpperCase());
  const [qrSecondsLeft, setQrSecondsLeft] = useState(60);

  // Audio synthesis for barcode scanner feedback
  const playBeep = (success = true) => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = success ? 'sine' : 'sawtooth';
      osc.frequency.value = success ? 880 : 300;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext unavailable
    }
  };

  // Initialize roster whenever students change
  useEffect(() => {
    const initial: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    students.forEach((s) => {
      initial[s.id] = { status: 'present', remarks: '' };
    });
    setRoster(initial);
  }, [students]);

  // QR token countdown timer
  useEffect(() => {
    if (markingMode !== 'qr') return;
    const interval = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          setQrToken('ATT-' + Math.random().toString(36).substring(2, 8).toUpperCase());
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [markingMode]);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRoster((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRoster((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    setRoster((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((id) => {
        updated[id] = { ...updated[id], status };
      });
      return updated;
    });
  };

  // Barcode / Roll Number rapid scan handler
  const handleScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scannerInput.trim().toLowerCase();
    if (!query) return;

    const matched = students.find(
      (s) =>
        s.rollNumber.toLowerCase() === query ||
        s.rollNumber.toLowerCase().endsWith(query) ||
        s.name.toLowerCase().includes(query) ||
        s.id.toLowerCase() === query
    );

    if (matched) {
      handleStatusChange(matched.id, 'present');
      playBeep(true);
      setScannerLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] CHECK-IN: ${matched.name} (${matched.rollNumber}) Marked PRESENT`,
        ...prev.slice(0, 8),
      ]);
      setScannerInput('');
    } else {
      playBeep(false);
      setScannerLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] UNKNOWN BADGE/ROLL: "${scannerInput}" not found in roster`,
        ...prev.slice(0, 8),
      ]);
      setScannerInput('');
    }
  };

  // QR Code simulation
  const handleSimulateQrScan = () => {
    // Pick an absent or random student
    const absentCandidate = students.find((s) => roster[s.id]?.status !== 'present') || students[0];
    if (absentCandidate) {
      handleStatusChange(absentCandidate.id, 'present');
      playBeep(true);
      setScannerLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] QR SCAN AUTHENTICATED: ${absentCandidate.name} verified via Mobile App`,
        ...prev.slice(0, 8),
      ]);
    }
  };

  // Calculate live session statistics
  const total = students.length;
  const presentCount = Object.values(roster).filter((r) => r.status === 'present').length;
  const absentCount = Object.values(roster).filter((r) => r.status === 'absent').length;
  const lateCount = Object.values(roster).filter((r) => r.status === 'late').length;
  const excusedCount = Object.values(roster).filter((r) => r.status === 'excused').length;
  const percentage = total > 0 ? Math.round(((presentCount + lateCount) / total) * 100) : 0;

  // Filter students by search
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Submit attendance and update Firebase
  const handleSubmitAttendance = async () => {
    if (!selectedClass) return;
    setIsSubmitting(true);
    setSubmissionSuccess(false);

    try {
      const studentRecords: StudentSessionRecord[] = students.map((s) => ({
        studentId: s.id,
        rollNumber: s.rollNumber,
        studentName: s.name,
        status: roster[s.id]?.status || 'present',
        remarks: roster[s.id]?.remarks || '',
        timestamp: new Date().toISOString(),
      }));

      const recordId = `att-${selectedClass.id}-${selectedDate}-${sessionType}`;
      const record: AttendanceRecord = {
        id: recordId,
        classId: selectedClass.id,
        className: selectedClass.name,
        date: selectedDate,
        sessionType,
        markedBy: selectedClass.instructorName,
        markedByEmail: selectedClass.instructorEmail,
        studentRecords,
        summary: {
          total,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          percentage,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Save Attendance Record to Firestore
      await setDoc(doc(db, 'attendance', recordId), record);

      // 2. Recompute each student's cumulative attendance statistics
      const newlyAtRiskList: Student[] = [];

      for (const student of students) {
        const sessionStatus = roster[student.id]?.status || 'present';
        const isAttended = sessionStatus === 'present' || sessionStatus === 'late';
        
        const newTotal = (student.totalClasses || 0) + 1;
        const newAttended = (student.attendedClasses || 0) + (isAttended ? 1 : 0);
        const newRate = Number(((newAttended / newTotal) * 100).toFixed(1));

        let newStatus: 'good' | 'warning' | 'critical' = 'good';
        if (newRate < 60) newStatus = 'critical';
        else if (newRate < warningThreshold) newStatus = 'warning';

        // Check if student just dropped below threshold
        if (newRate < warningThreshold && student.attendanceRate >= warningThreshold) {
          newlyAtRiskList.push({
            ...student,
            totalClasses: newTotal,
            attendedClasses: newAttended,
            attendanceRate: newRate,
            status: newStatus,
          });
        }

        // Update in Firestore
        await updateDoc(doc(db, 'students', student.id), {
          totalClasses: newTotal,
          attendedClasses: newAttended,
          attendanceRate: newRate,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }

      setSubmissionSuccess(true);
      onAttendanceSubmitted(record, newlyAtRiskList);
      setTimeout(() => setSubmissionSuccess(false), 5000);
    } catch (err) {
      console.error('Failed to submit attendance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Header Controls */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Attendance Registry
              </span>
              <span className="text-xs text-slate-400">Class &amp; Session Configuration</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Smart Attendance Marking Console</h2>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center p-1 bg-slate-800 rounded-xl border border-slate-700">
            <button
              onClick={() => setMarkingMode('roster')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                markingMode === 'roster'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Interactive Roster</span>
            </button>
            <button
              onClick={() => setMarkingMode('qr')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                markingMode === 'qr'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Dynamic QR Session</span>
            </button>
            <button
              onClick={() => setMarkingMode('scanner')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                markingMode === 'scanner'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              <span>Barcode / RFID Scanner</span>
            </button>
          </div>
        </div>

        {/* Filter / Selector Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Course / Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}: {c.name} ({c.room})
                </option>
              ))}
            </select>
            {selectedClass && (
              <p className="text-[11px] text-slate-400 mt-1">
                Instructor: {selectedClass.instructorName} &bull; {selectedClass.schedule}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Session Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">Defaulted to today's active session</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Session Classification
            </label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value as 'lecture' | 'lab' | 'tutorial')}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize"
            >
              <option value="lecture">Lecture Session</option>
              <option value="lab">Hands-on Lab Practice</option>
              <option value="tutorial">Problem Tutorial / Seminar</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Categorizes academic contact hours</p>
          </div>
        </div>
      </div>

      {/* Live Session Metrics Ticker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 text-center">
          <div className="text-xs text-slate-400">Total Enrolled</div>
          <div className="text-xl font-bold text-white mt-0.5">{total}</div>
        </div>
        <div className="bg-emerald-950/20 rounded-xl border border-emerald-900/40 p-3 text-center">
          <div className="text-xs text-emerald-400">Present (P)</div>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">{presentCount}</div>
        </div>
        <div className="bg-rose-950/20 rounded-xl border border-rose-900/40 p-3 text-center">
          <div className="text-xs text-rose-400">Absent (A)</div>
          <div className="text-xl font-bold text-rose-400 mt-0.5">{absentCount}</div>
        </div>
        <div className="bg-amber-950/20 rounded-xl border border-amber-900/40 p-3 text-center">
          <div className="text-xs text-amber-400">Late (L)</div>
          <div className="text-xl font-bold text-amber-400 mt-0.5">{lateCount}</div>
        </div>
        <div className="bg-indigo-950/20 rounded-xl border border-indigo-900/40 p-3 text-center col-span-2 sm:col-span-1">
          <div className="text-xs text-indigo-300">Session Rate</div>
          <div className="text-xl font-bold text-indigo-300 mt-0.5">{percentage}%</div>
        </div>
      </div>

      {/* Mode 2: Dynamic QR Code Presentation Mode */}
      {markingMode === 'qr' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-8 shadow-sm text-center">
          <div className="max-w-md mx-auto space-y-4">
            <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Live Classroom Projection
            </span>
            <h3 className="text-xl font-bold text-white">Scan QR Code to Check In</h3>
            <p className="text-xs text-slate-400">
              Students point their campus mobile camera to securely log their attendance. The security token refreshes dynamically every minute to prevent code sharing.
            </p>

            {/* Generated QR Mockup Screen */}
            <div className="relative inline-block p-6 rounded-2xl bg-white shadow-2xl ring-8 ring-indigo-500/20">
              {/* Dynamic QR canvas illustration */}
              <div className="w-56 h-56 bg-slate-900 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="grid grid-cols-6 gap-2 w-full h-full p-2 bg-white rounded-lg">
                  {/* Stylized QR Matrix */}
                  <div className="col-span-2 row-span-2 bg-slate-900 rounded-sm"></div>
                  <div className="col-span-2 bg-slate-900 rounded-sm"></div>
                  <div className="col-span-2 row-span-2 bg-slate-900 rounded-sm"></div>
                  <div className="col-span-1 bg-slate-900"></div>
                  <div className="col-span-1 bg-slate-900"></div>
                  <div className="col-span-2 bg-slate-900"></div>
                  <div className="col-span-2 bg-slate-900"></div>
                  <div className="col-span-2 bg-slate-900"></div>
                  <div className="col-span-2 row-span-2 bg-slate-900 rounded-sm"></div>
                  <div className="col-span-2 bg-slate-900"></div>
                  <div className="col-span-2 bg-slate-900"></div>
                  <div className="col-span-2 bg-slate-900"></div>
                </div>

                <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none"></div>
              </div>

              <div className="mt-3 text-xs font-mono font-bold text-slate-900 flex items-center justify-center gap-2">
                <span>{qrToken}</span>
                <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded-full font-sans">
                  {qrSecondsLeft}s
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleSimulateQrScan}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Simulate Student Phone Scan</span>
              </button>
              <button
                onClick={() => setQrSecondsLeft(60)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Refresh Token</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Rapid Barcode / RFID Scanner Mode */}
      {markingMode === 'scanner' && (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 shadow-sm">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="text-center">
              <span className="text-xs uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Hardware / Rapid Input Interface
              </span>
              <h3 className="text-xl font-bold text-white mt-2">RFID &amp; Barcode Scanner Console</h3>
              <p className="text-xs text-slate-400 mt-1">
                Scan student ID badges or type roll number and press Enter to mark present immediately.
              </p>
            </div>

            <form onSubmit={handleScannerSubmit} className="relative mt-4">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="Scan badge or type Roll No. (e.g. 2024-CS-03 or CS-01)..."
                  value={scannerInput}
                  onChange={(e) => setScannerInput(e.target.value)}
                  className="w-full bg-slate-800 border-2 border-indigo-500 rounded-2xl px-5 py-3.5 text-base text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 font-mono tracking-wide placeholder:font-sans placeholder:text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Scan className="w-4 h-4" />
                  <span>Log Badge</span>
                </button>
              </div>
            </form>

            {/* Quick Roll Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-2 justify-center text-xs text-slate-400">
              <span>Quick Test Badges:</span>
              {students.slice(0, 4).map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setScannerInput(s.rollNumber);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-mono text-[11px]"
                >
                  {s.rollNumber}
                </button>
              ))}
            </div>

            {/* Real-time Scanner Terminal Log */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 font-mono text-xs">
              <div className="text-slate-500 mb-2 flex items-center justify-between border-b border-slate-800 pb-1">
                <span>TERMINAL AUDIT STREAM</span>
                <span className="text-emerald-400">READER ONLINE</span>
              </div>
              <div className="space-y-1.5 min-h-[120px] max-h-[160px] overflow-y-auto">
                {scannerLogs.length === 0 ? (
                  <span className="text-slate-600 italic">Ready for input... scan student ID badge.</span>
                ) : (
                  scannerLogs.map((log, i) => (
                    <div
                      key={i}
                      className={log.includes('PRESENT') ? 'text-emerald-400' : 'text-rose-400'}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Student Roster */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 shadow-sm overflow-hidden">
        {/* Actions bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/50">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student or roll no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => markAll('present')}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/60 text-xs font-semibold transition"
            >
              Mark All Present
            </button>
            <button
              onClick={() => markAll('absent')}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-400 border border-rose-800/60 text-xs font-semibold transition"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student &amp; Roll Number</th>
                <th className="py-3 px-4">Historical Rate</th>
                <th className="py-3 px-4 text-center">Attendance Status</th>
                <th className="py-3 px-4">Session Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.map((student) => {
                const currentStatus = roster[student.id]?.status || 'present';
                const isAtRisk = student.attendanceRate < warningThreshold;
                const isCritical = student.attendanceRate < 60;

                return (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isCritical ? 'bg-rose-900/80 text-rose-200' : isAtRisk ? 'bg-amber-900/80 text-amber-200' : 'bg-slate-800 text-slate-200'
                        }`}>
                          {student.rollNumber.split('-').pop() || student.name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs sm:text-sm flex items-center gap-2">
                            {student.name}
                            {isCritical && (
                              <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded font-bold">
                                Critical Alert
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {student.rollNumber} &bull; {student.course}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          isCritical ? 'text-rose-400' : isAtRisk ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {student.attendanceRate}%
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full ${
                              isCritical ? 'bg-rose-500' : isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {student.attendedClasses}/{student.totalClasses} attended
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'present')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-emerald-400'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>P</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'absent')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-rose-400'
                          }`}
                        >
                          <X className="w-3 h-3" />
                          <span>A</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'late')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === 'late'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-amber-400'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          <span>L</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStatusChange(student.id, 'excused')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                            currentStatus === 'excused'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-blue-400'
                          }`}
                        >
                          <HelpCircle className="w-3 h-3" />
                          <span>E</span>
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional remarks (e.g. sick leave)..."
                        value={roster[student.id]?.remarks || ''}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Submit & Save Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            Submitting records updates student attendance percentages and automatically flags dropoffs below {warningThreshold}%.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {submissionSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Session saved &amp; synced to Firebase!
              </span>
            )}
            <button
              onClick={handleSubmitAttendance}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording & Evaluating...' : 'Submit Session Attendance'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
