import React, { useState } from 'react';
import { Settings, Clock, Calendar, ShieldAlert, Trash2, Save, CheckCircle2 } from 'lucide-react';
import { AttendanceSession } from '../types';

interface SessionSettingsProps {
  session: AttendanceSession;
  onUpdateSession: (updated: AttendanceSession) => Promise<void>;
  onClearAllData: () => Promise<void>;
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
      {/* Header Banner */}
      <div className="bg-blue-900 p-5 rounded-3xl border border-blue-800 shadow-md flex items-center justify-between text-white">
        <div>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Konfigurasi Sistem</span>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>Pengaturan Sesi Absensi</span>
          </h2>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Atur jadwal, jam mulai, jam selesai, dan batas keterlambatan.
          </p>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5 text-xs text-slate-900">
        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 text-green-800 font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span>Pengaturan sesi berhasil diperbarui!</span>
          </div>
        )}

        {/* Tanggal Sesi */}
        <div>
          <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>Tanggal Sesi Absensi</span>
          </label>
          <input
            type="date"
            required
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white font-mono text-sm"
          />
        </div>

        {/* Time Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-green-600" />
              <span>Jam Mulai</span>
            </label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Batas Tepat Waktu</span>
            </label>
            <input
              type="time"
              required
              value={lateThreshold}
              onChange={(e) => setLateThreshold(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white font-mono text-sm"
            />
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">Setelah jam ini: TERLAMBAT</span>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-600" />
              <span>Jam Selesai</span>
            </label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full bg-slate-50 text-slate-900 p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-600 focus:bg-white font-mono text-sm"
            />
            <span className="text-[10px] text-slate-500 mt-1 block font-medium">Setelah jam ini: SESI DITUTUP</span>
          </div>
        </div>

        {/* Open Status Toggle */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="font-bold text-slate-900">Status Sesi Absensi</div>
            <div className="text-[11px] text-slate-500">Aktifkan untuk mengizinkan anggota melakukan absensi</div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => setIsOpen(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-full flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 text-sm"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan Sesi</span>
        </button>
      </form>

      {/* Danger Zone: Clear Data */}
      <div className="bg-red-50/50 p-6 rounded-3xl border border-red-200 shadow-sm space-y-3 text-xs text-slate-900">
        <div className="flex items-center gap-2 text-red-700 font-extrabold text-sm">
          <ShieldAlert className="w-5 h-5 text-red-600" />
          <span>Privasi & Pembersihan Storage IndexedDB</span>
        </div>
        <p className="text-slate-600 leading-relaxed font-medium">
          Semua foto biometrik dan data absensi disimpan secara lokal di IndexedDB browser Anda. Jika Anda ingin mengosongkan seluruh histori absensi untuk memulai sesi baru, gunakan tombol di bawah ini.
        </p>

        <button
          type="button"
          onClick={async () => {
            if (confirm('APAKAH ANDA YAKIN? Seluruh data absensi dan foto lokal akan dihapus permanen!')) {
              await onClearAllData();
              alert('Seluruh data absensi berhasil dibersihkan.');
            }
          }}
          className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-full flex items-center gap-2 transition-all shadow-sm active:scale-95"
        >
          <Trash2 className="w-4 h-4 text-white" />
          <span>Hapus Seluruh Data Absensi & Foto</span>
        </button>
      </div>
    </div>
  );
};
