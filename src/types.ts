export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  course: string;
  semester: string;
  section: string;
  totalClasses: number;
  attendedClasses: number;
  attendanceRate: number; // percentage (0 - 100)
  status: 'good' | 'warning' | 'critical';
  lastAlertSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseClass {
  id: string;
  name: string;
  code: string;
  instructorName: string;
  instructorId: string;
  instructorEmail: string;
  schedule: string;
  room: string;
  totalSessions: number;
  department: string;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface StudentSessionRecord {
  studentId: string;
  rollNumber: string;
  studentName: string;
  status: AttendanceStatus;
  remarks?: string;
  timestamp?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  sessionType: 'lecture' | 'lab' | 'tutorial';
  markedBy: string;
  markedByEmail: string;
  studentRecords: StudentSessionRecord[];
  summary: {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    percentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationLog {
  id: string;
  studentId: string;
  studentName: string;
  recipientType: 'student' | 'parent' | 'both';
  channel: 'sms' | 'email' | 'both';
  recipientAddress: string; // phone or email or combined
  subject: string;
  message: string;
  status: 'delivered' | 'simulated' | 'failed' | 'pending';
  attendanceRate: number;
  triggerReason: 'low_attendance_threshold' | 'daily_absence' | 'manual_alert' | 'automated_sweep';
  sentAt: string;
  createdAt: string;
  deliveryId?: string;
}

export interface AlertSetting {
  id: string;
  warningThreshold: number; // e.g. 75 (%)
  criticalThreshold: number; // e.g. 60 (%)
  autoAlertsEnabled: boolean;
  notifyParents: boolean;
  notifyStudents: boolean;
  smsEnabled: boolean;
  emailEnabled: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  senderEmail: string;
  senderPhone: string;
  customTemplate?: string;
  updatedAt: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'teacher' | 'student';
}
