import React, { useState } from 'react';
import { BookOpen, Plus, Calendar, Clock, MapPin, User, CheckCircle, X } from 'lucide-react';
import { CourseClass } from '../types.ts';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.ts';

interface ClassesViewProps {
  classes: CourseClass[];
  onSelectClassForAttendance: (classId: string) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({
  classes,
  onSelectClassForAttendance,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    code: '',
    instructorName: '',
    instructorEmail: '',
    schedule: 'Mon, Wed (10:00 AM - 11:30 AM)',
    room: 'Hall B-201',
    totalSessions: 36,
    department: 'Computer Science',
  });

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name || !newClass.code) return;

    const id = 'class-' + newClass.code.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const classDoc: CourseClass = {
      id,
      name: newClass.name,
      code: newClass.code,
      instructorName: newClass.instructorName || 'Academic Faculty',
      instructorId: 'inst-' + Date.now().toString().slice(-4),
      instructorEmail: newClass.instructorEmail || 'faculty@campus.edu',
      schedule: newClass.schedule,
      room: newClass.room,
      totalSessions: Number(newClass.totalSessions) || 30,
      department: newClass.department,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'classes', id), classDoc);
      setShowAddModal(false);
      setNewClass({
        name: '',
        code: '',
        instructorName: '',
        instructorEmail: '',
        schedule: 'Mon, Wed (10:00 AM - 11:30 AM)',
        room: 'Hall B-201',
        totalSessions: 36,
        department: 'Computer Science',
      });
    } catch (err) {
      console.error('Failed to create class:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Academic Curricula
            </span>
            <span className="text-xs text-slate-400">{classes.length} Courses Active</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Course Classes &amp; Session Schedules</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Course Subject</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 hover:border-slate-700 transition space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {c.code}
                </span>
                <h3 className="text-base font-bold text-white mt-1.5">{c.name}</h3>
                <p className="text-xs text-slate-400">{c.department}</p>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                  {c.totalSessions} Sessions
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">{c.instructorName}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{c.room}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 text-slate-400 pt-1 border-t border-slate-800/80">
                <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>{c.schedule}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => onSelectClassForAttendance(c.id)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Mark Attendance for this Class</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add New Academic Course</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS-405"
                  value={newClass.code}
                  onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Computing & Distributed Systems"
                  value={newClass.name}
                  onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Instructor Name</label>
                  <input
                    type="text"
                    placeholder="Prof. Name"
                    value={newClass.instructorName}
                    onChange={(e) => setNewClass({ ...newClass, instructorName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Room / Hall</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 3A"
                    value={newClass.room}
                    onChange={(e) => setNewClass({ ...newClass, room: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Schedule</label>
                <input
                  type="text"
                  value={newClass.schedule}
                  onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                >
                  Save Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
