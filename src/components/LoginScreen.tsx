import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  KeyRound,
  ArrowRight,
  FileSpreadsheet,
  Users,
  Camera,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Zap,
  Star,
  Layers,
  Fingerprint,
  Settings,
  Flame,
  Smartphone,
  Download,
  Volume2,
} from 'lucide-react';
import { RoleMode } from '../types';
import { GoogleSheetsSyncState } from '../services/googleSheets';
import { audioService } from '../services/audioService';

interface LoginScreenProps {
  onSelectRole: (role: RoleMode, adminPinSuccess?: boolean) => void;
  sheetsConfig: GoogleSheetsSyncState;
  onConnectGoogleSheets: () => void;
  deferredPrompt?: any;
  onOpenShortcutModal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSelectRole,
  sheetsConfig,
  onConnectGoogleSheets,
  deferredPrompt,
  onOpenShortcutModal,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleAdminClick = () => {
    audioService.unlock();
    setPinInput('');
    setPinError(false);
    setShowPinModal(true);
  };

  const handleMemberClick = () => {
    audioService.unlock();
    audioService.playPromptDing();
    onSelectRole('MEMBER');
  };

  const handleTestAudio = async () => {
    await audioService.requestAudioPermissions();
  };

  const handleNumpadPress = (val: string) => {
    audioService.unlock();
    if (val === 'C') {
      setPinInput('');
      setPinError(false);
      return;
    }
    if (val === 'BACK') {
      setPinInput((prev) => prev.slice(0, -1));
      setPinError(false);
      return;
    }
    if (pinInput.length < 4) {
      const next = pinInput + val;
      setPinInput(next);
      setPinError(false);
      if (next.length === 4) {
        if (next === '1234') {
          audioService.playSuccessChime();
          setTimeout(() => {
            setShowPinModal(false);
            onSelectRole('ADMIN', true);
          }, 200);
        } else {
          audioService.playErrorBuzzer();
          setPinError(true);
          setTimeout(() => setPinInput(''), 600);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0d071a] text-violet-50 flex flex-col justify-between p-4 sm:p-6 relative overflow-hidden font-sans select-none">
      {/* 3D Radiant Ambient Glows */}
      <div className="absolute -top-36 -left-36 w-[32rem] h-[32rem] bg-violet-600/25 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-36 left-1/4 w-[36rem] h-[36rem] bg-purple-800/20 rounded-full blur-[130px] pointer-events-none" />

      {/* Top Action Ribbon: Shortcut HP & Audio Test */}
      <div className="max-w-4xl w-full mx-auto relative z-20 flex flex-wrap items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
          </span>
          <span className="text-[11px] font-extrabold text-amber-300">
            Karang Taruna Bintang Remaja
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTestAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 btn-3d-violet text-amber-300 rounded-xl text-xs font-black shadow-md transition-all"
            title="Tes Suara Notifikasi & TTS"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Tes Suara 🔊</span>
          </button>

          {onOpenShortcutModal && (
            <button
              onClick={() => {
                audioService.unlock();
                onOpenShortcutModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 btn-3d-amber text-purple-950 rounded-xl text-xs font-black shadow-md transition-all"
              title="Perintah Pasang Shortcut Android"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Pasang Shortcut HP 📲</span>
            </button>
          )}
        </div>
      </div>

      {/* Top Brand Banner */}
      <div className="max-w-4xl w-full mx-auto my-auto py-6 sm:py-8 space-y-6 relative z-10">
        <div className="text-center space-y-3">
          {/* Floating 3D Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-950/80 border border-violet-500/40 text-violet-300 text-xs font-black tracking-widest uppercase shadow-[0_4px_12px_rgba(139,92,246,0.3)] backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="bg-gradient-to-r from-violet-200 via-fuchsia-200 to-amber-200 bg-clip-text text-transparent">
              SISTEM PRESENSI BIOMETRIK 3D
            </span>
          </div>

          <div className="relative inline-block">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white drop-shadow-[0_8px_20px_rgba(147,51,234,0.4)]">
              BINTANG <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">REMAJA</span>
            </h1>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 rounded-full shadow-[0_0_12px_rgba(217,70,239,0.8)]" />
          </div>

          <p className="text-xs sm:text-sm text-violet-200/80 max-w-lg mx-auto leading-relaxed font-medium pt-2">
            Pilih jalur akses login: <b className="text-violet-300">Anggota</b> untuk verifikasi kehadiran wajah, atau <b className="text-amber-300">Admin</b> untuk kendali penuh aplikasi.
          </p>
        </div>

        {/* ANDROID SHORTCUT PROMPT CALLOUT IN LOGIN SCREEN */}
        {onOpenShortcutModal && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1b083b] via-[#240c4a] to-[#170633] border border-amber-400/50 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center font-black shrink-0 shadow-md">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <span>Perintah Tambah Shortcut HP Android</span>
                </div>
                <p className="text-[11px] text-violet-200/90">
                  Jadikan aplikasi beranda HP agar absensi dan kamera wajah langsung terbuka dalam 1-klik!
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                audioService.unlock();
                onOpenShortcutModal();
              }}
              className="w-full sm:w-auto px-4 py-2 btn-3d-amber text-purple-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5 stroke-[3]" />
              <span>Buka Petunjuk Pasang</span>
            </button>
          </div>
        )}

        {/* 2-WAY 3D CARD LOGIN SELECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
          {/* 3D CARD 1: LOGIN ANGGOTA (KHUSUS ABSENSI) */}
          <motion.div
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={handleMemberClick}
            className="group cursor-pointer card-3d p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-violet-400/60"
          >
            {/* Glossy top edge light */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-300/80 to-transparent" />
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-violet-500/20 rounded-full blur-2xl group-hover:bg-violet-500/35 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-800 text-white flex items-center justify-center shadow-[0_8px_16px_rgba(139,92,246,0.4)] border border-violet-300/40 group-hover:scale-105 transition-transform">
                  <Fingerprint className="w-8 h-8 text-amber-300" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-500/20 text-violet-200 border border-violet-400/30 shadow-sm">
                  1-Klik Masuk
                </span>
              </div>

              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300 mb-1 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-violet-400" />
                  PORTAL KHUSUS ANGGOTA
                </div>
                <h2 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                  <span>Login Anggota</span>
                  <ArrowRight className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
                </h2>
                <p className="text-xs text-violet-200/70 mt-2 leading-relaxed">
                  Akses mandiri untuk anggota Karang Taruna. Khusus untuk melakukan absensi kehadiran biometrik wajah (deteksi senyum/kedip) dan mendapatkan bukti kehadiran real-time.
                </p>
              </div>

              {/* Functional feature pills */}
              <div className="pt-3 border-t border-violet-800/60 grid grid-cols-2 gap-2 text-[11px] text-violet-300/90 font-semibold">
                <div className="flex items-center gap-2 bg-violet-950/60 p-2 rounded-xl border border-violet-800/50">
                  <Camera className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Absensi Biometrik</span>
                </div>
                <div className="flex items-center gap-2 bg-violet-950/60 p-2 rounded-xl border border-violet-800/50">
                  <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Lihat Pengumuman</span>
                </div>
              </div>
            </div>

            <button className="mt-6 w-full py-4 btn-3d-violet font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg">
              <span>MASUK SEBAGAI ANGGOTA</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>

          {/* 3D CARD 2: LOGIN ADMIN (KONTROL PENUH DENGAN PIN) */}
          <motion.div
            whileHover={{ y: -6, scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            onClick={handleAdminClick}
            className="group cursor-pointer card-3d p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:border-amber-400/60 border-amber-500/40"
          >
            {/* Glossy amber top edge light */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent" />
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-purple-950 flex items-center justify-center shadow-[0_8px_16px_rgba(245,158,11,0.3)] border border-amber-200/60 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-8 h-8 fill-purple-950 text-amber-300" />
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PIN Pengurus
                </span>
              </div>

              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  KONTROL PENUH PENGURUS
                </div>
                <h2 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                  <span>Login Sebagai Admin</span>
                  <ArrowRight className="w-5 h-5 text-amber-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all" />
                </h2>
                <p className="text-xs text-amber-100/70 mt-2 leading-relaxed">
                  Khusus Ketua, Sekretaris & Pengurus Karang Taruna. Memiliki kontrol penuh: kelola anggota, atur jam sesi, ekspor rekap PDF & sinkronisasi Google Sheets.
                </p>
              </div>

              {/* Functional feature pills */}
              <div className="pt-3 border-t border-amber-900/60 grid grid-cols-2 gap-2 text-[11px] text-amber-200 font-semibold">
                <div className="flex items-center gap-2 bg-amber-950/60 p-2 rounded-xl border border-amber-800/50">
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">Kelola Data Anggota</span>
                </div>
                <div className="flex items-center gap-2 bg-amber-950/60 p-2 rounded-xl border border-amber-800/50">
                  <FileSpreadsheet className="w-4 h-4 text-green-400 shrink-0" />
                  <span className="truncate">Google Sheets Sync</span>
                </div>
              </div>
            </div>

            <button className="mt-6 w-full py-4 btn-3d-amber font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 stroke-[3]" />
              <span>MASUK PANEL PENGURUS (PIN)</span>
            </button>
          </motion.div>
        </div>

        {/* 3D GOOGLE SHEETS CLOUD PERSISTENCE CARD */}
        <div className="card-3d-subtle p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-900/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">Fullstack Google Sheets Storage</span>
                {sheetsConfig.isConnected ? (
                  <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Terhubung
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[10px] font-black rounded-full">
                    Siap Sinkron
                  </span>
                )}
              </div>
              <p className="text-xs text-violet-300/70">
                Penyimpanan cloud otomatis terintegrasi. Rekap kehadiran dan biodata anggota dapat diekspor langsung ke spreadsheet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            {sheetsConfig.spreadsheetUrl ? (
              <a
                href={sheetsConfig.spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 btn-3d-emerald text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Buka Google Sheet 📊</span>
              </a>
            ) : (
              <button
                onClick={onConnectGoogleSheets}
                className="w-full sm:w-auto px-5 py-3 btn-3d-dark text-violet-200 hover:text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Hubungkan Google Sheets</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3D ADMIN PIN KEYPAD MODAL */}
      <AnimatePresence>
        {showPinModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="card-3d p-6 max-w-sm w-full space-y-5 text-white relative border-violet-400/40"
            >
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(251,191,36,0.3)]">
                  <KeyRound className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white">Autentikasi Pengurus</h3>
                <p className="text-xs text-violet-200/70">
                  Masukkan 4 digit PIN Admin untuk membuka kendali penuh. <br />
                  (PIN Default: <code className="text-amber-300 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">1234</code>)
                </p>
              </div>

              {/* PIN Code Dots Display */}
              <div className="flex justify-center items-center gap-3 py-2">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full transition-all duration-200 ${
                        filled
                          ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-125'
                          : 'bg-violet-950 border border-violet-700'
                      }`}
                    />
                  );
                })}
              </div>

              {pinError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center flex items-center justify-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>PIN Salah! Masukkan PIN 1234</span>
                </motion.div>
              )}

              {/* 3D Tactile Numpad */}
              <div className="grid grid-cols-3 gap-2.5 pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleNumpadPress(val)}
                    className={`py-3 rounded-xl font-black text-sm transition-all ${
                      val === 'C'
                        ? 'btn-3d-rose text-white text-xs'
                        : val === 'BACK'
                        ? 'btn-3d-dark text-violet-300 text-xs'
                        : 'btn-3d-dark text-white text-base hover:text-amber-300'
                    }`}
                  >
                    {val === 'BACK' ? '⌫' : val}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-full py-3 bg-violet-950/80 hover:bg-violet-900 text-violet-300 rounded-xl font-bold text-xs border border-violet-800 transition-all"
                >
                  Batal / Kembali
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="text-center text-[11px] text-violet-400/50 font-medium z-10 pt-4">
        © 2026 Karang Taruna Bintang Remaja • Vibrant Violet 3D Edition • Powered by ALFATTAH
      </div>
    </div>
  );
};
