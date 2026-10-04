import { collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase.ts';
import { Student, NotificationLog, AlertSetting } from '../types.ts';

export interface DispatchResult {
  success: boolean;
  deliveryId?: string;
  channel: 'sms' | 'email' | 'both';
  message: string;
  error?: string;
}

export async function sendStudentSMS(student: Student, customMessage?: string): Promise<DispatchResult> {
  const targetPhone = student.parentPhone || student.phone;
  
  try {
    const response = await fetch('/api/sms/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: student.name,
        rollNumber: student.rollNumber,
        phone: targetPhone,
        attendanceRate: student.attendanceRate,
        parentName: student.parentName,
        customMessage,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to dispatch SMS via gateway');
    }

    // Record log in Firestore
    const notifId = 'notif-sms-' + Date.now();
    const notifLog: NotificationLog = {
      id: notifId,
      studentId: student.id,
      studentName: student.name,
      recipientType: student.parentPhone ? 'parent' : 'student',
      channel: 'sms',
      recipientAddress: targetPhone,
      subject: `SMS Alert (${student.attendanceRate}%)`,
      message: data.message || `Automated low attendance SMS sent to ${targetPhone}`,
      status: 'delivered',
      attendanceRate: student.attendanceRate,
      triggerReason: 'low_attendance_threshold',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      deliveryId: data.deliveryId,
    };

    try {
      await setDoc(doc(db, 'notifications', notifId), notifLog);
      // Update student lastAlertSentAt
      await updateDoc(doc(db, 'students', student.id), {
        lastAlertSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (fsErr) {
      console.warn('Firestore logging notice:', fsErr);
    }

    return {
      success: true,
      deliveryId: data.deliveryId,
      channel: 'sms',
      message: `SMS successfully delivered to ${targetPhone}`,
    };
  } catch (error) {
    return {
      success: false,
      channel: 'sms',
      message: 'Failed to deliver SMS',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function sendStudentEmail(student: Student, customNotes?: string): Promise<DispatchResult> {
  const targetEmail = student.parentEmail || student.email;

  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: student.name,
        rollNumber: student.rollNumber,
        email: student.email,
        parentEmail: student.parentEmail,
        attendanceRate: student.attendanceRate,
        course: student.course,
        attendedClasses: student.attendedClasses,
        totalClasses: student.totalClasses,
        customNotes,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to dispatch email');
    }

    // Record log in Firestore
    const notifId = 'notif-eml-' + Date.now();
    const notifLog: NotificationLog = {
      id: notifId,
      studentId: student.id,
      studentName: student.name,
      recipientType: student.parentEmail ? 'parent' : 'student',
      channel: 'email',
      recipientAddress: targetEmail,
      subject: data.subject || `URGENT: Low Attendance Notice - ${student.name}`,
      message: `Official Academic Warning dispatched to ${targetEmail}. Current rate: ${student.attendanceRate}%`,
      status: 'delivered',
      attendanceRate: student.attendanceRate,
      triggerReason: 'low_attendance_threshold',
      sentAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      deliveryId: data.deliveryId,
    };

    try {
      await setDoc(doc(db, 'notifications', notifId), notifLog);
      await updateDoc(doc(db, 'students', student.id), {
        lastAlertSentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } catch (fsErr) {
      console.warn('Firestore logging notice:', fsErr);
    }

    return {
      success: true,
      deliveryId: data.deliveryId,
      channel: 'email',
      message: `Official Academic Warning Email delivered to ${targetEmail}`,
    };
  } catch (error) {
    return {
      success: false,
      channel: 'email',
      message: 'Failed to deliver Email',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function dispatchAutomatedSweep(
  students: Student[],
  settings: AlertSetting
): Promise<{ totalSwept: number; alertsDispatched: number; logs: string[] }> {
  const atRisk = students.filter((s) => s.attendanceRate < settings.warningThreshold);
  const logs: string[] = [];
  let alertsDispatched = 0;

  for (const student of atRisk) {
    if (settings.smsEnabled) {
      const res = await sendStudentSMS(student);
      if (res.success) {
        alertsDispatched++;
        logs.push(`[SMS] Delivered to ${student.name} (${student.parentPhone || student.phone})`);
      }
    }

    if (settings.emailEnabled) {
      const res = await sendStudentEmail(student);
      if (res.success) {
        alertsDispatched++;
        logs.push(`[EMAIL] Warning dispatched to ${student.name} (${student.parentEmail || student.email})`);
      }
    }
  }

  return {
    totalSwept: students.length,
    alertsDispatched,
    logs,
  };
}
