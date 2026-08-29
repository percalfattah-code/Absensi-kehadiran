import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Calendar, Clock, UserCheck, ShieldCheck, ArrowRight } from 'lucide-react';
import { AttendanceRecord } from '../types';

interface SuccessViewProps {
  record: AttendanceRecord;
  onDone: () => void;
  onViewRekap: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  record,
  onDone,
  onViewRekap,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>('');

  useEffect(() => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3B82F6', '#F59E0B', '#10B981', '#6366F1'],
      });
    } catch {
      // ignore
    }

    // Convert photo blob to object URL
    let url = '';
    if (record.photoBlob) {
      if (typeof record.photoBlob === 'string') {
        setPhotoUrl(record.photoBlob);
      } else {
        url = URL.createObjectURL(record.photoBlob);
        setPhotoUrl(url);
      }
    }

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [record]);

  return (
    <div className="max-w-md mx-auto space-y-5 py-4 pb-24 text-center">
      {/* Celebration Icon Badge */}
      <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-100 border-2 border-green-300 text-green-600 mx-auto shadow-md">
        <CheckCircle2 className="w-14 h-14 animate-bounce" />
        <span className="absolute inset-0 rounded-full border border-green-400/40 animate-ping opacity-30"></span>
      </div>

      <div>
        <span className="text-xs font-black text-green-700 uppercase tracking-widest bg-green-50 px-3.5 py-1 rounded-full border border-green-200">
          ABSENSI BERHASIL! ✓
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-3">
          Terima kasih, {record.name}!
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Kehadiran Anda di Karang Taruna Bintang Remaja telah berhasil dicatat.
        </p>
      </div>

      {/* Attendance Summary Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 text-left">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Bukti Kehadiran Biometric</span>
          <span className={`px-2.5 py-0.5 text-xs font-extrabold rounded-full ${
            record.status === 'HADIR'
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-amber-100 text-amber-700 border border-amber-200'
          }`}>
            {record.status}
          </span>
        </div>

        <div className="flex gap-4 items-center">
          {/* Captured Face Thumbnail */}
          <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-inner flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Foto Absensi" className="w-full h-full object-cover" />
            ) : (
              <UserCheck className="w-8 h-8 text-slate-400" />
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="text-slate-500">Nama Anggota:</div>
              <div className="font-bold text-sm text-slate-900">{record.name}</div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Tanggal: <b>{record.date}</b></span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-700">
              <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Waktu: <b>{record.time} WIB</b></span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
          <span>Data tersimpan aman di IndexedDB perangkat Android Anda.</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={onDone}
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-full shadow-md transition-all active:scale-[0.98]"
        >
          Absensi Anggota Lain
        </button>

        <button
          onClick={onViewRekap}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-full border border-slate-200 flex items-center justify-center gap-1.5 transition-all"
        >
          <span>Lihat Rekap Absensi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
