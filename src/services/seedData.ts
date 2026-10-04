import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { Student, CourseClass, AlertSetting, NotificationLog } from '../types.ts';

export const INITIAL_CLASSES: CourseClass[] = [
  {
    id: 'class-cs301',
    name: 'Advanced Data Structures & Algorithms',
    code: 'CS-301',
    instructorName: 'Dr. Sarah Mitchell',
    instructorId: 'prof-sarah',
    instructorEmail: 's.mitchell@university.edu',
    schedule: 'Mon, Wed, Fri (10:00 AM - 11:30 AM)',
    room: 'Hall B-204',
    totalSessions: 36,
    department: 'Computer Science & Engineering',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'class-cs304',
    name: 'Database Management Systems & Cloud Stores',
    code: 'CS-304',
    instructorName: 'Prof. Raymond Vance',
    instructorId: 'prof-vance',
    instructorEmail: 'r.vance@university.edu',
    schedule: 'Tue, Thu (02:00 PM - 03:30 PM)',
    room: 'Lab CS-03',
    totalSessions: 30,
    department: 'Computer Science & Engineering',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'class-cs402',
    name: 'Artificial Intelligence & Neural Networks',
    code: 'CS-402',
    instructorName: 'Dr. Emily Zhang',
    instructorId: 'prof-zhang',
    instructorEmail: 'e.zhang@university.edu',
    schedule: 'Mon, Wed (01:00 PM - 02:30 PM)',
    room: 'Auditorium 1',
    totalSessions: 32,
    department: 'Computer Science & Engineering',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'class-cs205',
    name: 'Computer Networks & Security Protocols',
    code: 'CS-205',
    instructorName: 'Prof. David Lawson',
    instructorId: 'prof-lawson',
    instructorEmail: 'd.lawson@university.edu',
    schedule: 'Tue, Thu (11:00 AM - 12:30 PM)',
    room: 'Lab Net-01',
    totalSessions: 28,
    department: 'Information Technology',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-101',
    name: 'Aarav Sharma',
    rollNumber: '2024-CS-01',
    email: 'aarav.sharma@campus.edu',
    phone: '+1 (555) 234-8901',
    parentName: 'Rajesh Sharma',
    parentPhone: '+1 (555) 987-1234',
    parentEmail: 'rajesh.sharma@parentmail.org',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'A',
    totalClasses: 36,
    attendedClasses: 33,
    attendanceRate: 91.7,
    status: 'good',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-102',
    name: 'Sophia Chen',
    rollNumber: '2024-CS-02',
    email: 'sophia.chen@campus.edu',
    phone: '+1 (555) 345-6789',
    parentName: 'David Chen',
    parentPhone: '+1 (555) 876-5432',
    parentEmail: 'd.chen.family@gmail.com',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'A',
    totalClasses: 36,
    attendedClasses: 25,
    attendanceRate: 69.4,
    status: 'warning',
    lastAlertSentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-103',
    name: 'Marcus Brody',
    rollNumber: '2024-CS-03',
    email: 'marcus.brody@campus.edu',
    phone: '+1 (555) 456-7890',
    parentName: 'Eleanor Brody',
    parentPhone: '+1 (555) 765-4321',
    parentEmail: 'eleanor.brody@corporate.com',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'A',
    totalClasses: 36,
    attendedClasses: 19,
    attendanceRate: 52.8,
    status: 'critical',
    lastAlertSentAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-104',
    name: 'Priya Patel',
    rollNumber: '2024-CS-04',
    email: 'priya.patel@campus.edu',
    phone: '+1 (555) 567-8901',
    parentName: 'Sanjay Patel',
    parentPhone: '+1 (555) 654-3210',
    parentEmail: 'sanjay.patel88@gmail.com',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'A',
    totalClasses: 36,
    attendedClasses: 35,
    attendanceRate: 97.2,
    status: 'good',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-105',
    name: 'Ethan Walker',
    rollNumber: '2024-CS-05',
    email: 'ethan.walker@campus.edu',
    phone: '+1 (555) 678-9012',
    parentName: 'Catherine Walker',
    parentPhone: '+1 (555) 543-2109',
    parentEmail: 'c.walker@familynet.org',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'A',
    totalClasses: 36,
    attendedClasses: 26,
    attendanceRate: 72.2,
    status: 'warning',
    lastAlertSentAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-106',
    name: 'Zainab Fatima',
    rollNumber: '2024-CS-06',
    email: 'zainab.fatima@campus.edu',
    phone: '+1 (555) 789-0123',
    parentName: 'Tariq Fatima',
    parentPhone: '+1 (555) 432-1098',
    parentEmail: 'tariq.fatima@outlook.com',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'B',
    totalClasses: 36,
    attendedClasses: 31,
    attendanceRate: 86.1,
    status: 'good',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-107',
    name: 'Lucas Silva',
    rollNumber: '2024-CS-07',
    email: 'lucas.silva@campus.edu',
    phone: '+1 (555) 890-1234',
    parentName: 'Helena Silva',
    parentPhone: '+1 (555) 321-0987',
    parentEmail: 'helena.silva@post.br',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'B',
    totalClasses: 36,
    attendedClasses: 20,
    attendanceRate: 55.6,
    status: 'critical',
    lastAlertSentAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'std-108',
    name: 'Chloe Dubois',
    rollNumber: '2024-CS-08',
    email: 'chloe.dubois@campus.edu',
    phone: '+1 (555) 901-2345',
    parentName: 'Jean Dubois',
    parentPhone: '+1 (555) 210-9876',
    parentEmail: 'jean.dubois@mail.fr',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'B',
    totalClasses: 36,
    attendedClasses: 34,
    attendanceRate: 94.4,
    status: 'good',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_SETTINGS: AlertSetting = {
  id: 'global-settings',
  warningThreshold: 75,
  criticalThreshold: 60,
  autoAlertsEnabled: true,
  notifyParents: true,
  notifyStudents: true,
  smsEnabled: true,
  emailEnabled: true,
  frequency: 'daily',
  senderEmail: 'registrar.attendance@university.edu',
  senderPhone: '+1 (800) 555-CAMPUS',
  customTemplate: 'Notice: Student {name} ({roll}) attendance is {rate}%. Below the mandatory {threshold}% threshold.',
  updatedAt: new Date().toISOString(),
};

export const INITIAL_NOTIFICATIONS: NotificationLog[] = [
  {
    id: 'notif-001',
    studentId: 'std-103',
    studentName: 'Marcus Brody',
    recipientType: 'both',
    channel: 'both',
    recipientAddress: '+1 (555) 765-4321 / eleanor.brody@corporate.com',
    subject: 'URGENT: Low Attendance Academic Warning - Marcus Brody (52.8%)',
    message: '[ALERT] Dear Eleanor Brody, attendance for Marcus Brody (2024-CS-03) has fallen to 52.8%, critically below the mandatory 75% threshold.',
    status: 'delivered',
    attendanceRate: 52.8,
    triggerReason: 'low_attendance_threshold',
    sentAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    deliveryId: 'SMS-7X9P2K',
  },
  {
    id: 'notif-002',
    studentId: 'std-107',
    studentName: 'Lucas Silva',
    recipientType: 'parent',
    channel: 'email',
    recipientAddress: 'helena.silva@post.br',
    subject: 'Low Attendance Warning: Academic Advisory Notice - Lucas Silva (55.6%)',
    message: 'Official warning notice dispatched to parent. Minimum 75% required for semester exam eligibility.',
    status: 'delivered',
    attendanceRate: 55.6,
    triggerReason: 'low_attendance_threshold',
    sentAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
    deliveryId: 'EML-3M8Q1L',
  },
  {
    id: 'notif-003',
    studentId: 'std-102',
    studentName: 'Sophia Chen',
    recipientType: 'student',
    channel: 'sms',
    recipientAddress: '+1 (555) 345-6789',
    subject: 'Attendance Shortfall Alert',
    message: 'Sophia, your attendance is 69.4%. You need 3 consecutive sessions to restore good standing (>75%).',
    status: 'delivered',
    attendanceRate: 69.4,
    triggerReason: 'automated_sweep',
    sentAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 72 * 3600000).toISOString(),
    deliveryId: 'SMS-9H4J1B',
  },
];

export async function seedInitialDatabaseIfEmpty() {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (!studentsSnap.empty) {
      return; // Already populated
    }

    // Seed students
    const batch = writeBatch(db);
    INITIAL_STUDENTS.forEach((student) => {
      const ref = doc(db, 'students', student.id);
      batch.set(ref, student, { merge: true });
    });

    // Seed classes
    INITIAL_CLASSES.forEach((cls) => {
      const ref = doc(db, 'classes', cls.id);
      batch.set(ref, cls, { merge: true });
    });

    // Seed settings
    const settingsRef = doc(db, 'settings', INITIAL_SETTINGS.id);
    batch.set(settingsRef, INITIAL_SETTINGS, { merge: true });

    // Seed notifications
    INITIAL_NOTIFICATIONS.forEach((notif) => {
      const ref = doc(db, 'notifications', notif.id);
      batch.set(ref, notif, { merge: true });
    });

    await batch.commit();
  } catch (err) {
    console.warn('Initial database seed notice (continuing with local cache):', err);
  }
}
