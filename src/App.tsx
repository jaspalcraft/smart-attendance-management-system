import React, { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  signInWithPopup, 
  signOut, 
  googleProvider, 
  onAuthStateChanged,
  handleFirestoreError,
  OperationType
} from './firebase.ts';
import { 
  Student, 
  CourseClass, 
  AttendanceRecord, 
  NotificationLog, 
  AlertSetting, 
  AppUser 
} from './types.ts';
import { 
  seedInitialDatabaseIfEmpty, 
  INITIAL_SETTINGS, 
  INITIAL_CLASSES, 
  INITIAL_STUDENTS 
} from './services/seedData.ts';
import { 
  sendStudentSMS, 
  sendStudentEmail, 
  dispatchAutomatedSweep 
} from './services/notificationService.ts';

// Components
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { MarkAttendanceView } from './components/MarkAttendanceView.tsx';
import { LowAttendanceAlertHub } from './components/LowAttendanceAlertHub.tsx';
import { StudentsView } from './components/StudentsView.tsx';
import { ClassesView } from './components/ClassesView.tsx';
import { NotificationLogsView } from './components/NotificationLogsView.tsx';
import { AlertSettingsView } from './components/AlertSettingsView.tsx';
import { JavaBackendExplorer } from './components/JavaBackendExplorer.tsx';
import { PreviewAlertModal } from './components/PreviewAlertModal.tsx';
import { AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { Login } from './components/Login.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Core Data State
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [classes, setClasses] = useState<CourseClass[]>(INITIAL_CLASSES);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [settings, setSettings] = useState<AlertSetting>(INITIAL_SETTINGS);

  // UI & Action States
  const [selectedStudentForAlert, setSelectedStudentForAlert] = useState<Student | null>(null);
  const [newlyAtRiskModal, setNewlyAtRiskModal] = useState<Student[]>([]);
  const [isSweeping, setIsSweeping] = useState(false);
  const [isDispatchingMass, setIsDispatchingMass] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [globalBannerMessage, setGlobalBannerMessage] = useState<string | null>(null);

  // 1. Initial Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const isAdmin = user.email === 'yjassi93@gmail.com';
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          role: isAdmin ? 'admin' : 'teacher',
        });
      } else {
        setCurrentUser(null);
      }
      setIsAuthLoading(false);
    });

    if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-sm text-slate-400">Checking your session...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onGoogleLogin={handleLogin} />;
  }

  return () => unsubscribe();
  }, [currentUser]);

  // 2. Initial Database Seeding & Firestore Live Snapshot Listeners
  useEffect(() => {
    if (!currentUser) {
      return;
    }

    seedInitialDatabaseIfEmpty();

    // Listen to Students
    const unsubStudents = onSnapshot(
      collection(db, 'students'),
      (snap) => {
        if (!snap.empty) {
          const list: Student[] = [];
          snap.forEach((d) => list.push(d.data() as Student));
          // Sort by rollNumber
          list.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
          setStudents(list);
        }
      },
      (error) => {
        console.warn('Students listener error (using local state):', error);
      }
    );

    // Listen to Classes
    const unsubClasses = onSnapshot(
      collection(db, 'classes'),
      (snap) => {
        if (!snap.empty) {
          const list: CourseClass[] = [];
          snap.forEach((d) => list.push(d.data() as CourseClass));
          setClasses(list);
        }
      },
      (error) => {
        console.warn('Classes listener notice:', error);
      }
    );

    // Listen to Notifications
    const notifsQuery = query(collection(db, 'notifications'), orderBy('sentAt', 'desc'), limit(100));
    const unsubNotifs = onSnapshot(
      notifsQuery,
      (snap) => {
        if (!snap.empty) {
          const list: NotificationLog[] = [];
          snap.forEach((d) => list.push(d.data() as NotificationLog));
          setNotifications(list);
        }
      },
      (error) => {
        console.warn('Notifications query notice:', error);
      }
    );

    // Listen to Settings
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'global-settings'),
      (snap) => {
        if (snap.exists()) {
          setSettings(snap.data() as AlertSetting);
        }
      },
      (error) => {
        console.warn('Settings query notice:', error);
      }
    );

    return () => {
      unsubStudents();
      unsubClasses();
      unsubNotifs();
      unsubSettings();
    };
  }, []);

  // Handlers for Auth
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-in failed:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Automated Sweep Trigger
  const handleTriggerSweep = async () => {
    setIsSweeping(true);
    try {
      const result = await dispatchAutomatedSweep(students, settings);
      setGlobalBannerMessage(
        `Automated sweep completed: Evaluated ${result.totalSwept} students, dispatched ${result.alertsDispatched} automated SMS & Email alerts!`
      );
      setTimeout(() => setGlobalBannerMessage(null), 6000);
    } catch (err) {
      console.error('Sweep execution error:', err);
    } finally {
      setIsSweeping(false);
    }
  };

  // Mass Alert to all At-Risk
  const handleDispatchAllAtRisk = async () => {
    setIsDispatchingMass(true);
    try {
      const atRisk = students.filter((s) => s.attendanceRate < settings.warningThreshold);
      let count = 0;
      for (const st of atRisk) {
        if (settings.smsEnabled) {
          await sendStudentSMS(st);
          count++;
        }
        if (settings.emailEnabled) {
          await sendStudentEmail(st);
          count++;
        }
      }
      setGlobalBannerMessage(`Mass warning dispatched! Total ${count} notifications sent to at-risk students & parents.`);
      setTimeout(() => setGlobalBannerMessage(null), 6000);
    } catch (err) {
      console.error('Mass dispatch failed:', err);
    } finally {
      setIsDispatchingMass(false);
    }
  };

  // Test Notification Dispatch
  const handleSendTestNotification = async (channel: 'sms' | 'email', target: string) => {
    setIsSendingTest(true);
    try {
      if (channel === 'sms') {
        const dummy: Student = {
          ...students[0],
          name: 'Test Student',
          parentPhone: target,
          attendanceRate: 64.5,
        };
        await sendStudentSMS(dummy, `[TEST ALERT] Smart Attendance System Gateway Verification`);
      } else {
        const dummy: Student = {
          ...students[0],
          name: 'Test Student',
          parentEmail: target,
          attendanceRate: 64.5,
        };
        await sendStudentEmail(dummy, `Gateway deliverability verification`);
      }
    } finally {
      setIsSendingTest(false);
    }
  };

  // CSV Report Generator
  const handleExportCSV = () => {
    const headers = [
      'Roll Number',
      'Student Name',
      'Course',
      'Section',
      'Attended Classes',
      'Total Classes',
      'Attendance Percentage',
      'Attendance Status',
      'Parent Name',
      'Parent Phone',
      'Parent Email',
      'Last Alert Sent',
    ];

    const rows = students.map((s) => [
      `"${s.rollNumber}"`,
      `"${s.name}"`,
      `"${s.course}"`,
      `"${s.section}"`,
      s.attendedClasses,
      s.totalClasses,
      `${s.attendanceRate}%`,
      s.status.toUpperCase(),
      `"${s.parentName}"`,
      `"${s.parentPhone}"`,
      `"${s.parentEmail}"`,
      `"${s.lastAlertSentAt || 'Never'}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Attendance Submission Callback
  const handleAttendanceSubmitted = (_record: AttendanceRecord, newlyAtRisk: Student[]) => {
    if (newlyAtRisk.length > 0) {
      setNewlyAtRiskModal(newlyAtRisk);
    }
  };

  const atRiskCount = students.filter((s) => s.attendanceRate < settings.warningThreshold).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Global Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        atRiskCount={atRiskCount}
        onTriggerSweep={handleTriggerSweep}
        isSweeping={isSweeping}
      />

      {/* Global Notification Banner */}
      {globalBannerMessage && (
        <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 px-4 py-2.5 text-xs flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{globalBannerMessage}</span>
          </div>
          <button onClick={() => setGlobalBannerMessage(null)} className="text-emerald-400 hover:text-white font-bold ml-4">
            &times;
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            students={students}
            classes={classes}
            notifications={notifications}
            settings={settings}
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAlertModal={(s) => setSelectedStudentForAlert(s)}
            onQuickSweep={handleTriggerSweep}
            isSweeping={isSweeping}
            onExportCSV={handleExportCSV}
          />
        )}

        {activeTab === 'mark-attendance' && (
          <MarkAttendanceView
            students={students}
            classes={classes}
            warningThreshold={settings.warningThreshold}
            onAttendanceSubmitted={handleAttendanceSubmitted}
          />
        )}

        {activeTab === 'alerts-hub' && (
          <LowAttendanceAlertHub
            students={students}
            settings={settings}
            onOpenAlertModal={(s) => setSelectedStudentForAlert(s)}
            onDispatchAllAtRisk={handleDispatchAllAtRisk}
            isDispatching={isDispatchingMass}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            onOpenAlertModal={(s) => setSelectedStudentForAlert(s)}
            warningThreshold={settings.warningThreshold}
          />
        )}

        {activeTab === 'classes' && (
          <ClassesView
            classes={classes}
            onSelectClassForAttendance={(classId) => {
              setActiveTab('mark-attendance');
            }}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationLogsView
            notifications={notifications}
            onSendTestNotification={handleSendTestNotification}
            isSendingTest={isSendingTest}
          />
        )}

        {activeTab === 'settings' && (
          <AlertSettingsView
            settings={settings}
            onUpdateSettings={(newSettings) => setSettings(newSettings)}
          />
        )}

        {activeTab === 'java-backend' && <JavaBackendExplorer />}
      </main>

      {/* Modal: Single Student Alert Preview & Dispatch */}
      {selectedStudentForAlert && (
        <PreviewAlertModal
          student={selectedStudentForAlert}
          warningThreshold={settings.warningThreshold}
          onClose={() => setSelectedStudentForAlert(null)}
          onSendSMS={sendStudentSMS}
          onSendEmail={sendStudentEmail}
        />
      )}

      {/* Modal: Newly Dropped At-Risk Students Prompt */}
      {newlyAtRiskModal.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/60 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Attendance Deficit Detected!
                </h3>
                <p className="text-xs text-rose-300">
                  {newlyAtRiskModal.length} student(s) have dropped below the {settings.warningThreshold}% requirement.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
              {newlyAtRiskModal.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/80 last:border-0">
                  <div>
                    <span className="font-semibold text-white">{s.name}</span>
                    <span className="text-slate-400 ml-2">({s.rollNumber})</span>
                  </div>
                  <span className="font-bold text-rose-400">{s.attendanceRate}%</span>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-300">
              Would you like to dispatch automated SMS and email warning notices to their parents right now?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setNewlyAtRiskModal([])}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Dismiss for Now
              </button>
              <button
                onClick={async () => {
                  const toAlert = [...newlyAtRiskModal];
                  setNewlyAtRiskModal([]);
                  for (const s of toAlert) {
                    await sendStudentSMS(s);
                    await sendStudentEmail(s);
                  }
                  setGlobalBannerMessage(`Automated notices dispatched to parents of ${toAlert.length} student(s)!`);
                  setTimeout(() => setGlobalBannerMessage(null), 6000);
                }}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-rose-900/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Dispatch Parent Alerts</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>AttendSmart Pro &bull; Smart Attendance Management System with Low Attendance Alerts</div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>React.js</span>
            <span>&bull;</span>
            <span>Node.js / Java Spring Boot Engine</span>
            <span>&bull;</span>
            <span>Firebase Cloud Firestore</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
