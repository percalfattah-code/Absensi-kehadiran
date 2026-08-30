import React, { useState, useEffect } from 'react';
import {
  Settings,
  Clock,
  Calendar,
  ShieldAlert,
  Trash2,
  Save,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
  Github,
  KeyRound,
  Image as ImageIcon,
  Upload,
  RotateCcw,
  Star,
  Flame,
  Sparkles,
  Crown,
  Users,
  Heart,
  Zap,
  Lock,
} from 'lucide-react';
import { AttendanceSession } from '../types';
import { githubService, GitHubConfig } from '../services/github';
import { AppLogo } from './AppLogo';

interface SessionSettingsProps {
  session: AttendanceSession;
  onUpdateSession: (updated: AttendanceSession) => Promise<void>;
  onClearAllData?: () => Promise<void>;
  onOpenGitHubModal?: () => void;
}

const PRESET_ICONS = [
  { id: 'star', label: 'Bintang', icon: Star },
  { id: 'shield', label: 'Perisai', icon: ShieldCheck },
  { id: 'flame', label: 'Api Semangat', icon: Flame },
  { id: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { id: 'crown', label: 'Mahkota', icon: Crown },
  { id: 'users', label: 'Pemuda Pemudi', icon: Users },
  { id: 'heart', label: 'Bakti Sosial', icon: Heart },
  { id: 'zap', label: 'Kilat Enerjik', icon: Zap },
];

export const SessionSettings: React.FC<SessionSettingsProps> = ({
  session,
  onUpdateSession,
  onClearAllData,
  onOpenGitHubModal,
}) => {
  const [sessionDate, setSessionDate] = useState(session.sessionDate);
  const [startTime, setStartTime] = useState(session.startTime);
  const [endTime, setEndTime] = useState(session.endTime);
  const [lateThreshold, setLateThreshold] = useState(session.lateThreshold);
  const [isOpen, setIsOpen] = useState(session.isOpen);

  // Password (PIN Admin) & Logo settings
  const [adminPin, setAdminPin] = useState(session.adminPin || '1234');
  const [appLogoIcon, setAppLogoIcon] = useState(session.appLogoIcon || 'star');
  const [appLogoUrl, setAppLogoUrl] = useState(session.appLogoUrl || '');

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(githubService.getConfig());

  useEffect(() => {
    return githubService.subscribe(setGhConfig);
  }, []);

  useEffect(() => {
    setAdminPin(session.adminPin || '1234');
    setAppLogoIcon(session.appLogoIcon || 'star');
    setAppLogoUrl(session.appLogoUrl || '');
    setSessionDate(session.sessionDate);
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setLateThreshold(session.lateThreshold);
    setIsOpen(session.isOpen);
  }, [session]);

  const isGhConfigured = Boolean(ghConfig.token && ghConfig.owner && ghConfig.repo);

  // Handle image upload for custom logo
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar (PNG, JPG, SVG, WebP)!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create canvas to resize logo for optimal storage
        const canvas = document.createElement('canvas');
        const maxSize = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/png');
          setAppLogoUrl(compressedDataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleResetLogoImage = () => {
    setAppLogoUrl('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    // Validate PIN (Must be 4 digits numeric)
    if (!/^\d{4}$/.test(adminPin)) {
      setPinError('PIN Admin harus terdiri dari 4 angka!');
      return;
    }

    await onUpdateSession({
      ...session,
      sessionDate,
      startTime,
      endTime,
      lateThreshold,
      isOpen,
      adminPin,
      appLogoIcon,
      appLogoUrl,
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
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
            <span>Pengaturan Dashboard & Aplikasi</span>
          </h2>
          <p className="text-xs text-violet-200/80 mt-1">
            Ubah password/PIN admin, atur icon logo aplikasi, dan kelola sesi absensi.
          </p>
        </div>
      </div>

      {/* GITHUB INTEGRATION CARD */}
      <div className="card-3d-subtle p-5 space-y-3 text-xs text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#110526] border border-violet-700/80 text-amber-400 flex items-center justify-center">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-white text-sm flex items-center gap-2">
                <span>Sinkronisasi Otomatis GitHub</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                  isGhConfigured ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-amber-950 text-amber-300 border border-amber-600'
                }`}>
                  {isGhConfigured ? 'Auto-Sync Aktif' : 'Belum Terhubung'}
                </span>
              </div>
              <div className="text-[11px] text-violet-300 mt-0.5">
                {isGhConfigured ? `Repository: ${ghConfig.owner}/${ghConfig.repo} (${ghConfig.branch})` : 'Setiap kali edit data, file di GitHub akan otomatis ter-commit.'}
              </div>
            </div>
          </div>

          {onOpenGitHubModal && (
            <button
              type="button"
              onClick={onOpenGitHubModal}
              className="px-3.5 py-2 btn-3d-amber text-purple-950 rounded-xl text-xs font-black shrink-0"
            >
              {isGhConfigured ? '⚙️ Atur' : 'Hubungkan'}
            </button>
          )}
        </div>
      </div>

      {/* MAIN SETTINGS FORM */}
      <form onSubmit={handleSave} className="space-y-6">
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 font-extrabold flex items-center gap-2 text-xs shadow-lg">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Pengaturan berhasil diperbarui dan tersinkronisasi ke seluruh HP/perangkat secara real-time!</span>
          </div>
        )}

        {/* SECTION 1: PENGATURAN PASSWORD (PIN) ADMIN */}
        <div className="card-3d-subtle p-6 space-y-4 text-xs text-white border-amber-500/40">
          <div className="flex items-center gap-2.5 border-b border-violet-800/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Keamanan & PIN Admin</h3>
              <p className="text-[11px] text-violet-300/80">
                Ubah 4-digit PIN yang digunakan untuk masuk ke mode admin.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-violet-300 font-bold mb-1.5 flex items-center justify-between">
                <span>PIN Admin Baru (4 Angka):</span>
                <span className="text-[10px] font-mono text-amber-400">Default: 1234</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={4}
                  pattern="\d{4}"
                  value={adminPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAdminPin(val);
                    setPinError(null);
                  }}
                  placeholder="Masukkan 4 digit PIN baru"
                  className="w-full bg-[#110526] text-amber-300 font-mono text-base font-bold tracking-widest p-3 pl-10 rounded-xl border border-amber-400/50 focus:outline-none focus:border-amber-300"
                />
                <Lock className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {pinError && (
              <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold">
                ⚠️ {pinError}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: PENGATURAN ICON LOGO APLIKASI */}
        <div className="card-3d-subtle p-6 space-y-5 text-xs text-white">
          <div className="flex items-center gap-2.5 border-b border-violet-800/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 text-violet-300 border border-violet-500/40 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-violet-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Icon & Logo Aplikasi</h3>
              <p className="text-[11px] text-violet-300/80">
                Pilih simbol logo atau unggah gambar kustom untuk tampilan aplikasi di HP anggota.
              </p>
            </div>
          </div>

          {/* Real-time Preview */}
          <div className="p-4 rounded-2xl bg-[#110526] border border-violet-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-violet-400 tracking-wider block mb-1">
                Preview Logo Aktif:
              </span>
              <div className="flex items-center gap-3">
                <AppLogo logoIcon={appLogoIcon} logoUrl={appLogoUrl} />
                <div>
                  <div className="font-extrabold text-white text-sm">
                    {appLogoUrl ? 'Logo Gambar Kustom' : `Icon Preset: ${PRESET_ICONS.find(i => i.id === appLogoIcon)?.label || 'Bintang'}`}
                  </div>
                  <div className="text-[10px] text-violet-300/70">
                    Ditampilkan pada header dan menu aplikasi
                  </div>
                </div>
              </div>
            </div>

            {appLogoUrl && (
              <button
                type="button"
                onClick={handleResetLogoImage}
                className="px-3 py-1.5 btn-3d-rose text-white text-[11px] font-bold rounded-xl flex items-center gap-1"
                title="Hapus gambar dan gunakan icon preset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Logo</span>
              </button>
            )}
          </div>

          {/* Option A: Preset Icons Grid */}
          <div className="space-y-2">
            <label className="block text-violet-300 font-bold">Pilih Icon Preset:</label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {PRESET_ICONS.map((p) => {
                const IconComp = p.icon;
                const isSelected = !appLogoUrl && appLogoIcon === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setAppLogoIcon(p.id);
                      setAppLogoUrl('');
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-amber-400/20 border-amber-400 text-amber-300 scale-105 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                        : 'bg-[#110526] border-violet-800/60 text-violet-300 hover:border-violet-400'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                    <span className="text-[9px] font-bold truncate max-w-full">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option B: Upload Custom Logo Image */}
          <div className="space-y-2 pt-1 border-t border-violet-800/60">
            <label className="block text-violet-300 font-bold">Atau Unggah Logo Gambar Kustom:</label>
            <label className="cursor-pointer p-4 rounded-2xl bg-[#110526] border-2 border-dashed border-violet-600/60 hover:border-amber-400 flex flex-col items-center justify-center gap-2 text-center transition-all group">
              <Upload className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-white">
                Klik untuk memilih file foto/logo dari perangkat
              </div>
              <div className="text-[10px] text-violet-400">
                Format disarankan: PNG/JPG/SVG transparan (otomatis dikompres & di-fit)
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* SECTION 3: PENGATURAN SESI ABSENSI */}
        <div className="card-3d-subtle p-6 space-y-4 text-xs text-white">
          <div className="flex items-center gap-2.5 border-b border-violet-800/60 pb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Waktu & Tanggal Sesi Absensi</h3>
              <p className="text-[11px] text-violet-300/80">
                Atur jadwal buka/tutup sesi dan jam batas keterlambatan.
              </p>
            </div>
          </div>

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
        </div>

        <button
          type="submit"
          className="w-full py-4 btn-3d-amber text-purple-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all"
        >
          <Save className="w-5 h-5 stroke-[2.5]" />
          <span>Simpan Semua Pengaturan (PIN, Logo & Sesi)</span>
        </button>
      </form>
    </div>
  );
};
