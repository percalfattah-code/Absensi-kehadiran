import React from 'react';
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Play,
  Square,
  BarChart3,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { AttendanceSession, AttendanceRecord, Member } from '../types';

interface AdminDashboardProps {
  session: AttendanceSession;
  allMembers: Member[];
  records: AttendanceRecord[];
  countdownText: string;
  onToggleSession: () => void;
  onExportPdf: () => void;
  onNavigate: (view: 'anggota' | 'rekap' | 'pengaturan') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  allMembers,
  records,
  countdownText,
  onToggleSession,
  onExportPdf,
  onNavigate,
}) => {
  const totalMembers = allMembers.length;
  const attendedCount = records.length;
  const missingCount = Math.max(0, totalMembers - attendedCount);

  const percentage = totalMembers > 0 ? Math.round((attendedCount / totalMembers) * 100) : 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-blue-900 p-5 rounded-3xl border border-blue-800 shadow-md text-white">
        <div>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Dashboard Pengurus</span>
          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">BINTANG REMAJA</h2>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Sistem Absensi Kehadiran Karang Taruna
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSession}
            className={`px-4 py-2.5 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm active:scale-95 ${
              session.isOpen
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {session.isOpen ? (
              <>
                <Square className="w-4 h-4 fill-white text-white" />
                <span>Tutup Sesi Absensi</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white text-white" />
                <span>Buka Sesi Absensi</span>
              </>
            )}
          </button>

          <button
            onClick={onExportPdf}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 rounded-full text-xs font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <FileText className="w-4 h-4 text-blue-950" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Main Status & Countdown Card */}
      <div className="relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <span className={`w-3.5 h-3.5 rounded-full ${session.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <div>
              <div className="text-xs text-slate-500 font-semibold">Status Sesi Absensi</div>
              <div className="text-base font-bold text-slate-900 flex items-center gap-2">
                {session.isOpen ? (
                  <span className="text-green-600">🟢 SEDANG DIBUKA</span>
                ) : (
                  <span className="text-red-600">🔴 ABSENSI DITUTUP</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
            <Clock className="w-4 h-4 text-amber-600" />
            <div className="text-xs text-slate-700">
              Waktu: <b className="text-slate-900">{session.startTime} - {session.endTime} WIB</b>
            </div>
          </div>
        </div>

        {/* Big Countdown Display */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <div>
            <div className="text-xs text-slate-500 font-semibold">Sisa Waktu Absensi:</div>
            <div className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-blue-900 mt-1">
              {countdownText}
            </div>
          </div>

          <div className="w-full sm:w-auto bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Batas Tepat Waktu:</span>
              <span className="font-bold text-green-700">{session.lateThreshold} WIB</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-500">Tanggal Sesi:</span>
              <span className="font-bold text-slate-900">{session.sessionDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Anggota */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Total Anggota</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalMembers}</div>
          <div className="text-[11px] text-slate-500">Anggota Terdaftar</div>
        </div>

        {/* Sudah Absen */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Sudah Absen</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-black text-green-600">{attendedCount}</div>
          <div className="text-[11px] text-green-700 font-bold">{percentage}% Kehadiran</div>
        </div>

        {/* Belum Absen */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Belum Absen</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600">{missingCount}</div>
          <div className="text-[11px] text-slate-500">Belum Mengisi</div>
        </div>

        {/* Persentase */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Persentase</span>
            <BarChart3 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600">{percentage}%</div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-1 border border-slate-200">
            <div className="bg-amber-400 h-full transition-all" style={{ width: `${percentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => onNavigate('anggota')}
          className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left transition-all shadow-sm flex items-center justify-between group"
        >
          <div>
            <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
              Manajemen Anggota
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Kelola data anggota Karang Taruna</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('rekap')}
          className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left transition-all shadow-sm flex items-center justify-between group"
        >
          <div>
            <div className="font-bold text-sm text-slate-900 group-hover:text-green-600 transition-colors">
              Rekap & PDF Absensi
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Lihat log foto & cetak rekap</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
        </button>

        <button
          onClick={() => onNavigate('pengaturan')}
          className="bg-white hover:bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left transition-all shadow-sm flex items-center justify-between group"
        >
          <div>
            <div className="font-bold text-sm text-slate-900 group-hover:text-amber-600 transition-colors">
              Pengaturan Sesi
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Atur jam mulai & batas keterlambatan</div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
        </button>
      </div>
    </div>
  );
};
