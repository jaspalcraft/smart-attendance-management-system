import React, { useState } from 'react';
import { 
  X, 
  Send, 
  PhoneCall, 
  Mail, 
  Smartphone, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert
} from 'lucide-react';
import { Student } from '../types.ts';

interface PreviewAlertModalProps {
  student: Student;
  warningThreshold: number;
  onClose: () => void;
  onSendSMS: (student: Student, customMessage?: string) => Promise<any>;
  onSendEmail: (student: Student, customNotes?: string) => Promise<any>;
}

export const PreviewAlertModal: React.FC<PreviewAlertModalProps> = ({
  student,
  warningThreshold,
  onClose,
  onSendSMS,
  onSendEmail,
}) => {
  const [activePreview, setActivePreview] = useState<'sms' | 'email'>('sms');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);

  const isCritical = student.attendanceRate < 60;
  const targetPhone = student.parentPhone || student.phone;
  const targetEmail = student.parentEmail || student.email;

  // Calculated recovery sessions
  const diff = (warningThreshold * student.totalClasses - 100 * student.attendedClasses) / (100 - warningThreshold);
  const classesNeeded = Math.max(0, Math.ceil(diff));

  const smsText = `[CAMPUS ALERT] Dear ${student.parentName || 'Parent'}, attendance for ${student.name} (${student.rollNumber}) has fallen to ${student.attendanceRate}%, which is below the mandatory ${warningThreshold}% cutoff. Need ${classesNeeded} consecutive attended classes to regain compliance. Please contact academic advisor.`;

  const handleSend = async (channel: 'sms' | 'email' | 'both') => {
    setIsSending(true);
    setSendSuccessMessage(null);

    try {
      if (channel === 'sms' || channel === 'both') {
        await onSendSMS(student, smsText);
      }
      if (channel === 'email' || channel === 'both') {
        await onSendEmail(student);
      }

      setSendSuccessMessage(`Alert successfully dispatched via ${channel.toUpperCase()}!`);
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err) {
      setSendSuccessMessage('Dispatch error: ' + String(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Dispatch Low Attendance Warning: {student.name}
              </h3>
              <p className="text-xs text-slate-400">
                Roll: {student.rollNumber} &bull; Current Attendance: <strong className={isCritical ? 'text-rose-400' : 'text-amber-400'}>{student.attendanceRate}%</strong> (Cutoff: {warningThreshold}%)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Channel Switcher */}
        <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActivePreview('sms')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              activePreview === 'sms'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Phone SMS Preview</span>
          </button>
          <button
            onClick={() => setActivePreview('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
              activePreview === 'email'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Official Email Letterhead Preview</span>
          </button>
        </div>

        {/* Preview Container */}
        {activePreview === 'sms' ? (
          /* Phone Screen Mockup */
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 flex justify-center">
            <div className="w-full max-w-sm bg-slate-900 rounded-3xl border-2 border-slate-700 p-4 shadow-xl space-y-3 font-sans">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 border-b border-slate-800 pb-2">
                <span>9:41 AM</span>
                <span className="font-mono text-emerald-400 font-bold">5G &bull; 100%</span>
              </div>

              {/* Message Header */}
              <div className="text-center pt-1">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-indigo-400 mx-auto flex items-center justify-center font-bold text-xs ring-1 ring-slate-700">
                  CAMPUS
                </div>
                <div className="text-xs font-bold text-white mt-1">Registrar Alert System</div>
                <div className="text-[10px] text-slate-500 font-mono">To: {targetPhone}</div>
              </div>

              {/* SMS Speech Bubble */}
              <div className="p-3.5 rounded-2xl bg-indigo-600 text-white text-xs leading-relaxed shadow-md rounded-tl-sm mt-3">
                <p>{smsText}</p>
                <div className="text-[9px] text-indigo-200 text-right mt-1.5">Delivered &bull; Just now</div>
              </div>
            </div>
          </div>
        ) : (
          /* Formal Email Letterhead Mockup */
          <div className="bg-slate-950 rounded-2xl p-5 border border-slate-800 max-h-72 overflow-y-auto">
            <div className="bg-white rounded-xl p-5 text-slate-900 shadow-md text-xs space-y-3 font-sans">
              <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                <div>
                  <h4 className="font-black text-sm text-slate-900">DEPARTMENT OF ACADEMIC REGULATION</h4>
                  <p className="text-[10px] text-slate-500">Automated Attendance Advisory Bureau</p>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <div>Ref: ATT-WARN-{student.rollNumber}</div>
                  <div>Date: {new Date().toLocaleDateString()}</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>OFFICIAL ATTENDANCE DEFICIT NOTICE</span>
                </div>
                <p className="text-[11px] mt-1 text-rose-800">
                  Student <strong>{student.name}</strong> (Roll: {student.rollNumber}) has recorded an attendance rate of <strong>{student.attendanceRate}%</strong>, which is critically below the institutional {warningThreshold}% examination eligibility standard.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>Sessions Attended: <strong>{student.attendedClasses} / {student.totalClasses}</strong></div>
                <div>Recovery Target: <strong>Must attend next {classesNeeded} sessions</strong></div>
                <div>Course: <strong>{student.course}</strong></div>
                <div>Parent Contact: <strong>{targetEmail}</strong></div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                As per University Statute §14-B, failure to maintain attendance may result in debarment from the upcoming semester end examinations. Please schedule an appointment with the faculty advisor immediately.
              </p>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                <span>Registrar of Academic Affairs</span>
                <span>Signed Digitally &bull; AttendSmart Pro</span>
              </div>
            </div>
          </div>
        )}

        {/* Success / Status Message */}
        {sendSuccessMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{sendSuccessMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-400 text-center sm:text-left">
            Target: <span className="font-mono text-slate-200">{targetPhone}</span> &bull; <span className="text-slate-200">{targetEmail}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleSend('sms')}
              disabled={isSending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Send SMS Only</span>
            </button>

            <button
              onClick={() => handleSend('email')}
              disabled={isSending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Email Only</span>
            </button>

            <button
              onClick={() => handleSend('both')}
              disabled={isSending}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Dispatch Both</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
