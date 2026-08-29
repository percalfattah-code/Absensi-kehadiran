import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Calendar, Clock, UserCheck, ShieldCheck, ArrowRight, FileText, Download, Sparkles } from 'lucide-react';
import { AttendanceRecord, Member } from '../types';
import { generateSingleAttendanceReceiptPdf, downloadOrSharePdf } from '../services/pdf';

interface SuccessViewProps {
  record: AttendanceRecord;
  member?: Member | null;
  onReset?: () => void;
  onDone?: () => void;
  onViewRekap?: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  record,
  member,
  onReset,
  onDone,
  onViewRekap,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleNext = () => {
    if (onReset) onReset();
    else if (onDone) onDone();
  };

  useEffect(() => {
    // Fire festive celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#fbbf24', '#10b981', '#ec4899', '#6366f1'],
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

  const handleDownloadProofPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdfRes = await generateSingleAttendanceReceiptPdf(record);
      await downloadOrSharePdf(pdfRes);
    } catch (e) {
      alert('Gagal mengunduh PDF bukti absensi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 py-4 pb-24 text-center">
      {/* 3D Celebration Icon Badge */}
      <div className="relative inline-flex items-center justify-center w-28 h-28 rounded-3xl bg-gradient-to-br from-emerald-400 to-green-600 text-white mx-auto shadow-[0_10px_0_0_#064e3b,0_20px_30px_rgba(0,0,0,0.6)] border-2 border-emerald-200">
        <CheckCircle2 className="w-16 h-16 animate-bounce" />
        <span className="absolute inset-0 rounded-3xl border-2 border-emerald-300 animate-ping opacity-40" />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300 uppercase tracking-widest bg-emerald-950/90 px-4 py-1 rounded-full border border-emerald-500/50 shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          ABSENSI BIOMETRIK BERHASIL ✓
        </span>
        <h2 className="text-3xl font-black text-white drop-shadow-[0_4px_12px_rgba(168,85,247,0.5)]">
          Terima kasih, {record.name}!
        </h2>
        <p className="text-xs sm:text-sm text-violet-200/80 max-w-sm mx-auto">
          Kehadiran Anda di Karang Taruna Bintang Remaja telah tercatat dengan verifikasi wajah.
        </p>
      </div>

      {/* 3D Digital Attendance Receipt Card */}
      <div className="card-3d p-6 text-left space-y-5 border-violet-400/40 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent" />

        <div className="flex items-center justify-between border-b border-violet-800/80 pb-3">
          <span className="text-xs font-black text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Bukti Struk Kehadiran
          </span>
          <span className={`px-3 py-1 text-xs font-black rounded-xl border ${
            record.status === 'HADIR'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
              : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
          }`}>
            {record.status}
          </span>
        </div>

        <div className="flex gap-4 items-center">
          {/* Captured Face Image with 3D border */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-[#100522] border-2 border-violet-500/40 shrink-0 shadow-[0_6px_0_0_#1a0633] flex items-center justify-center">
            {photoUrl ? (
              <img src={photoUrl} alt="Foto Absensi" className="w-full h-full object-cover" />
            ) : (
              <UserCheck className="w-10 h-10 text-violet-400" />
            )}
          </div>

          <div className="space-y-2.5 text-xs text-violet-200">
            <div>
              <div className="text-violet-400/80 text-[11px] font-medium">Nama Anggota:</div>
              <div className="font-black text-base text-white">{record.name}</div>
            </div>

            <div className="flex items-center gap-2 text-violet-200">
              <Calendar className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Tanggal: <b className="text-white">{record.date}</b></span>
            </div>

            <div className="flex items-center gap-2 text-violet-200">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Waktu: <b className="text-amber-300 font-mono">{record.time} WIB</b></span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-violet-300/80 bg-[#120524] p-3 rounded-2xl border border-violet-800/60 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Tervalidasi & tersinkronisasi otomatis dengan database Google Sheets.</span>
        </div>
      </div>

      {/* 3D Action Buttons */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleDownloadProofPdf}
          disabled={isGeneratingPdf}
          className="w-full py-4 btn-3d-amber text-purple-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all"
        >
          <FileText className="w-4 h-4 text-purple-950 stroke-[2.5]" />
          <span>{isGeneratingPdf ? 'Membuat Dokumen PDF...' : 'Simpan / Unduh Bukti PDF 📄'}</span>
        </button>

        <button
          onClick={handleNext}
          className="w-full py-4 btn-3d-violet text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all"
        >
          <span>Absensi Anggota Berikutnya</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
