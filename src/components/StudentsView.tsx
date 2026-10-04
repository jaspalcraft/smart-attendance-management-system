import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Send, 
  PhoneCall, 
  Mail, 
  GraduationCap, 
  CheckCircle, 
  AlertTriangle, 
  AlertOctagon,
  Calendar,
  X
} from 'lucide-react';
import { Student } from '../types.ts';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';

interface StudentsViewProps {
  students: Student[];
  onOpenAlertModal: (student: Student) => void;
  warningThreshold: number;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  onOpenAlertModal,
  warningThreshold,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<'all' | 'A' | 'B'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'good' | 'warning' | 'critical'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [inspectStudent, setInspectStudent] = useState<Student | null>(null);

  // New Student Form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    rollNumber: '',
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    course: 'B.Tech Computer Science',
    semester: 'Semester 5',
    section: 'A',
    totalClasses: 36,
    attendedClasses: 30,
  });

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = selectedSection === 'all' || s.section === selectedSection;
    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'good' && s.attendanceRate >= warningThreshold) ||
      (selectedStatus === 'warning' && s.attendanceRate < warningThreshold && s.attendanceRate >= 60) ||
      (selectedStatus === 'critical' && s.attendanceRate < 60);

    return matchesSearch && matchesSection && matchesStatus;
  });

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.rollNumber) return;

    const rate = Number(
      ((newStudent.attendedClasses / Math.max(1, newStudent.totalClasses)) * 100).toFixed(1)
    );
    let status: 'good' | 'warning' | 'critical' = 'good';
    if (rate < 60) status = 'critical';
    else if (rate < warningThreshold) status = 'warning';

    const id = 'std-' + Date.now().toString().slice(-6);
    const studentDoc: Student = {
      id,
      name: newStudent.name,
      rollNumber: newStudent.rollNumber,
      email: newStudent.email || `${newStudent.rollNumber.toLowerCase()}@campus.edu`,
      phone: newStudent.phone || '+1 (555) 000-0000',
      parentName: newStudent.parentName || 'Parent/Guardian',
      parentPhone: newStudent.parentPhone || '+1 (555) 111-2222',
      parentEmail: newStudent.parentEmail || 'guardian@parentmail.org',
      course: newStudent.course,
      semester: newStudent.semester,
      section: newStudent.section,
      totalClasses: Number(newStudent.totalClasses),
      attendedClasses: Number(newStudent.attendedClasses),
      attendanceRate: rate,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'students', id), studentDoc);
      setShowAddModal(false);
      setNewStudent({
        name: '',
        rollNumber: '',
        email: '',
        phone: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        course: 'B.Tech Computer Science',
        semester: 'Semester 5',
        section: 'A',
        totalClasses: 36,
        attendedClasses: 30,
      });
    } catch (err) {
      console.error('Failed to create student:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Student Directory
            </span>
            <span className="text-xs text-slate-400">Total Enrolled: {students.length}</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Enrolled Students &amp; Guardian Contacts</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, roll number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status selector */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="good">Safe (&gt;={warningThreshold}%)</option>
            <option value="warning">Warning (60-74%)</option>
            <option value="critical">Critical (&lt;60%)</option>
          </select>

          {/* Section selector */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Sections</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Student Name &amp; ID</th>
                <th className="py-3 px-4">Course &amp; Section</th>
                <th className="py-3 px-4">Parent / Guardian Contact</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStudents.map((student) => {
                const isCrit = student.attendanceRate < 60;
                const isWarn = student.attendanceRate < warningThreshold && !isCrit;

                return (
                  <tr key={student.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-white text-xs sm:text-sm">{student.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.rollNumber} &bull; {student.email}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div>{student.course}</div>
                      <div className="text-[11px] text-slate-500">
                        {student.semester} &bull; Sec {student.section}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <div className="font-medium text-slate-200">{student.parentName}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-emerald-400" />
                        {student.parentPhone}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${
                          isCrit ? 'text-rose-400' : isWarn ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {student.attendanceRate}%
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden hidden sm:block">
                          <div
                            className={`h-full ${
                              isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {student.attendedClasses}/{student.totalClasses} classes
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        isCrit
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isWarn
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}>
                        {isCrit ? 'Critical' : isWarn ? 'Warning' : 'Good'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectStudent(student)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition"
                        >
                          Profile
                        </button>
                        {(isCrit || isWarn) && (
                          <button
                            onClick={() => onOpenAlertModal(student)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/40 transition flex items-center gap-1"
                            title="Send immediate SMS/Email alert"
                          >
                            <Send className="w-3 h-3" />
                            <span>Alert</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Enroll New Student</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                    placeholder="e.g. Liam Johnson"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Roll / Student ID *</label>
                  <input
                    type="text"
                    required
                    value={newStudent.rollNumber}
                    onChange={(e) => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                    placeholder="e.g. 2024-CS-09"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Student Email</label>
                  <input
                    type="email"
                    value={newStudent.email}
                    onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    placeholder="student@campus.edu"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Student Phone</label>
                  <input
                    type="tel"
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
                  Parent / Guardian Alert Contacts
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[11px] text-slate-400 mb-1">Parent Name</label>
                    <input
                      type="text"
                      value={newStudent.parentName}
                      onChange={(e) => setNewStudent({ ...newStudent, parentName: e.target.value })}
                      placeholder="Guardian Name"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[11px] text-slate-400 mb-1">Parent Phone (SMS)</label>
                    <input
                      type="tel"
                      value={newStudent.parentPhone}
                      onChange={(e) => setNewStudent({ ...newStudent, parentPhone: e.target.value })}
                      placeholder="+1 555-..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-[11px] text-slate-400 mb-1">Parent Email</label>
                    <input
                      type="email"
                      value={newStudent.parentEmail}
                      onChange={(e) => setNewStudent({ ...newStudent, parentEmail: e.target.value })}
                      placeholder="parent@mail.com"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Total Classes Held</label>
                  <input
                    type="number"
                    value={newStudent.totalClasses}
                    onChange={(e) => setNewStudent({ ...newStudent, totalClasses: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Attended Classes</label>
                  <input
                    type="number"
                    value={newStudent.attendedClasses}
                    onChange={(e) => setNewStudent({ ...newStudent, attendedClasses: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/40"
                >
                  Save Student to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Student Profile Drawer */}
      {inspectStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Student Academic Profile</h3>
              <button
                onClick={() => setInspectStudent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {inspectStudent.name[0]}
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">{inspectStudent.name}</h4>
                  <p className="text-xs text-slate-400 font-mono">Roll: {inspectStudent.rollNumber}</p>
                  <p className="text-xs text-slate-400">{inspectStudent.course} &bull; Sec {inspectStudent.section}</p>
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Attendance Standing</span>
                  <span className={`text-base font-bold ${
                    inspectStudent.attendanceRate < 60 ? 'text-rose-400' : inspectStudent.attendanceRate < warningThreshold ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {inspectStudent.attendanceRate}%
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {inspectStudent.attendedClasses} attended out of {inspectStudent.totalClasses} total sessions.
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-300 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <div className="font-semibold text-slate-200">Parent / Emergency Information:</div>
                <div>Parent: <span className="text-white font-medium">{inspectStudent.parentName}</span></div>
                <div>SMS Phone: <span className="text-white font-mono">{inspectStudent.parentPhone}</span></div>
                <div>Email: <span className="text-white">{inspectStudent.parentEmail}</span></div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={() => {
                    const s = inspectStudent;
                    setInspectStudent(null);
                    onOpenAlertModal(s);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send SMS / Email Alert Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
