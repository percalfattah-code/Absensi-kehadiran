import React, { useState } from 'react';
import { Settings, Clock, Calendar, ShieldAlert, Trash2, Save, CheckCircle2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { AttendanceSession } from '../types';

interface SessionSettingsProps {
  session: AttendanceSession;
  onUpdateSession: (updated: AttendanceSession) => Promise<void>;
  onClearAllData?: () => Promise<void>;
}

export const SessionSettings: React.FC<SessionSettingsProps> = ({
  session,
  onUpdateSession,
  onClearAllData,
}) => {
  const [sessionDate, setSessionDate] = useState(session.sessionDate);
  const [startTime, setStartTime] = useState(session.startTime);
  const [endTime, setEndTime] = useState(session.endTime);
  const [lateThreshold, setLateThreshold] = useState(session.lateThreshold);
  const [isOpen, setIsOpen] = useState(session.isOpen);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSession({
      ...session,
      sessionDate,
      startTime,
      endTime,
      lateThreshold,
      isOpen,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-24 max-w-2xl mx-auto">
      {/* 3D HEADER */}
      <div className="card-3d p-6 relative overflow-hidden text-white flex items-center justify-between">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-950 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KONTROL PENGURUS</span>
          </div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>Pengaturan Sesi Absensi</span>
          </h2>
          <p className="text-xs text-violet-200/80 mt-1">
            Atur tanggal sesi, jam buka, jam tutup, dan batas keterlambatan.
          </p>
        </div>
      </div>

      {/* 3D SETTINGS FORM */}
      <form onSubmit={handleSave} className="card-3d-subtle p-6 space-y-5 text-xs text-white">
        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Pengaturan sesi berhasil diperbarui!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-violet-300 font-bold mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Tanggal Sesi</span>
            </label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400"
            />
          </div>

          <div>
            <label className="block text-violet-300 font-bold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Batas Terlambat</span>
            </label>
            <input
              type="time"
              value={lateThreshold}
              onChange={(e) => setLateThreshold(e.target.value)}
              className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-violet-300 font-bold mb-1.5">Jam Mulai Sesi</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-mono"
            />
          </div>

          <div>
            <label className="block text-violet-300 font-bold mb-1.5">Jam Selesai Sesi</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-mono"
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#110526] border border-violet-700/60 flex items-center justify-between">
          <div>
            <div className="font-extrabold text-white text-sm">Status Sesi Absensi</div>
            <div className="text-[11px] text-violet-300/70">
              {isOpen ? 'Sesi sedang DIBUKA untuk anggota' : 'Sesi sedang DITUTUP (anggota tidak bisa absen)'}
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-violet-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 border border-violet-700"></div>
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-4 btn-3d-amber text-purple-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4 stroke-[2.5]" />
          <span>Simpan Perubahan Sesi</span>
        </button>
      </form>
    </div>
  );
};
