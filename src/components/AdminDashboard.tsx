import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Zap,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Sparkles,
  Megaphone,
  Send,
  Calendar,
  Github,
  GitBranch,
  ExternalLink,
  UploadCloud,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { AttendanceSession, AttendanceRecord, Member, EventAnnouncement } from '../types';
import { githubService, GitHubConfig } from '../services/github';

interface AdminDashboardProps {
  session: AttendanceSession | null;
  members?: Member[];
  allMembers?: Member[];
  records: AttendanceRecord[];
  announcements?: EventAnnouncement[];
  countdownText?: string;
  onToggleSession?: () => void;
  onExportPdf?: () => void;
  onNavigate?: (view: any) => void;
  onOpenGitHubModal?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  session,
  members = [],
  allMembers = [],
  records,
  announcements = [],
  countdownText = '00:00:00',
  onToggleSession,
  onExportPdf,
  onNavigate,
  onOpenGitHubModal,
}) => {
  const [ghConfig, setGhConfig] = useState<GitHubConfig>(githubService.getConfig());
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    return githubService.subscribe(setGhConfig);
  }, []);

  const memberList = members.length > 0 ? members : allMembers;
  const totalMembers = memberList.length;
  const attendedCount = records.length;
  const missingCount = Math.max(0, totalMembers - attendedCount);
  const percentage = totalMembers > 0 ? Math.round((attendedCount / totalMembers) * 100) : 0;
  const latestAnnouncement = announcements.length > 0 ? announcements[0] : null;
  const isGhConfigured = Boolean(ghConfig.token && ghConfig.owner && ghConfig.repo);

  const handleQuickGitHubPush = async () => {
    if (!isGhConfigured) {
      if (onOpenGitHubModal) onOpenGitHubModal();
      return;
    }
    setIsManualSyncing(true);
    setSyncFeedback(null);
    try {
      await githubService.syncNow(
        {
          members: memberList,
          records,
          announcements,
          session,
        },
        'Quick Push dari Dashboard'
      );
      setSyncFeedback('Data berhasil di-update ke GitHub!');
      setTimeout(() => setSyncFeedback(null), 3500);
    } catch (err: any) {
      setSyncFeedback('Gagal: ' + (err.message || 'Error'));
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* 3D HERO HEADER */}
      <div className="card-3d p-6 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KONTROL PENUH PENGURUS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">Dashboard Monitoring</h2>
          <p className="text-xs text-violet-200/80">
            Pantau kehadiran anggota Karang Taruna Bintang Remaja secara real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {onNavigate && (
            <button
              onClick={() => onNavigate('pengaturan')}
              className="px-4 py-3.5 btn-3d-violet text-amber-300 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Pengaturan PIN & Logo</span>
            </button>
          )}

          {onOpenGitHubModal && (
            <button
              onClick={onOpenGitHubModal}
              className="px-4 py-3.5 btn-3d-violet text-violet-200 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <Github className="w-4 h-4 text-amber-400" />
              <span>GitHub Sync</span>
            </button>
          )}

          {onNavigate && (
            <button
              onClick={() => onNavigate('pengumuman')}
              className="px-4 py-3.5 btn-3d-amber text-purple-950 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg"
            >
              <Megaphone className="w-4 h-4" />
              <span>Kirim Pemberitahuan</span>
            </button>
          )}

          {onToggleSession && session && (
            <button
              onClick={onToggleSession}
              className={`px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                session.isOpen
                  ? 'btn-3d-rose text-white'
                  : 'btn-3d-emerald text-white'
              }`}
            >
              {session.isOpen ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>Tutup Sesi Absensi</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Buka Sesi Absensi</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* GITHUB AUTO-SYNC HERO BANNER */}
      <div className="card-3d p-4 sm:p-5 bg-gradient-to-r from-[#170630] via-[#220a44] to-[#16062f] border-violet-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#0e031c] border border-violet-600/80 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-white">Sinkronisasi Otomatis GitHub</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                ghConfig.lastStatus === 'syncing'
                  ? 'bg-blue-950 text-blue-300 border-blue-600 animate-pulse'
                  : isGhConfigured
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                  : 'bg-amber-950 text-amber-300 border-amber-600'
              }`}>
                {ghConfig.lastStatus === 'syncing'
                  ? 'Sedang Sync...'
                  : isGhConfigured
                  ? 'Auto-Sync Aktif'
                  : 'Belum Terhubung'}
              </span>
            </div>
            <p className="text-[11px] text-violet-300/90 mt-0.5">
              {isGhConfigured
                ? `Tersambung ke repo "${ghConfig.owner}/${ghConfig.repo}" (branch: ${ghConfig.branch || 'main'}). Tiap ada perubahan data di aplikasi, file GitHub langsung ter-update.`
                : 'Hubungkan Personal Access Token agar semua editan data otomatis tersimpan dan ter-commit ke GitHub.'}
            </p>
            {ghConfig.lastCommitUrl && (
              <div className="text-[10px] text-amber-300/90 mt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Terakhir ter-update: Commit <strong>{ghConfig.lastCommitSha}</strong></span>
                <a
                  href={ghConfig.lastCommitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-white flex items-center gap-0.5 font-bold"
                >
                  Buka di GitHub <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            )}
            {syncFeedback && (
              <div className="text-[10px] font-bold text-emerald-300 mt-1">
                {syncFeedback}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
          <button
            onClick={handleQuickGitHubPush}
            disabled={isManualSyncing}
            className="flex-1 md:flex-initial px-3.5 py-2.5 btn-3d-amber text-purple-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <UploadCloud className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-bounce' : ''}`} />
            <span>{isManualSyncing ? 'Menyimpan...' : 'Push Sekarang'}</span>
          </button>
          {onOpenGitHubModal && (
            <button
              onClick={onOpenGitHubModal}
              className="px-3.5 py-2.5 btn-3d-dark text-violet-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <span>⚙️ Pengaturan</span>
            </button>
          )}
        </div>
      </div>

      {/* QUICK AGENDA BROADCAST BANNER */}
      {latestAnnouncement && (
        <div className="card-3d p-4 bg-gradient-to-r from-violet-950 via-[#1f0b3b] to-purple-950 border-amber-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400 text-amber-300 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-violet-900 text-amber-300 border border-violet-700">
                  Agenda Terbaru
                </span>
                <span className="text-xs font-black text-white">{latestAnnouncement.title}</span>
              </div>
              <div className="text-[11px] text-violet-300 mt-0.5">
                📅 {latestAnnouncement.eventDate} • ⏰ {latestAnnouncement.eventTime || '19:30 WIB'} • 📍 {latestAnnouncement.location || 'Balai Karang Taruna'}
              </div>
            </div>
          </div>

          {onNavigate && (
            <button
              onClick={() => onNavigate('pengumuman')}
              className="px-4 py-2 btn-3d-violet text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast ke Anggota</span>
            </button>
          )}
        </div>
      )}

      {/* 3D METRIC STAT CARDS (4-GRID) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Anggota */}
        <div className="card-3d-subtle p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300">Total Anggota</span>
            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-white">{totalMembers}</div>
            <div className="text-[10px] text-violet-400 font-medium mt-0.5">Terdaftar aktif</div>
          </div>
        </div>

        {/* Stat 2: Hadir Hari Ini */}
        <div className="card-3d-subtle p-4 sm:p-5 flex flex-col justify-between space-y-3 border-emerald-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300">Sudah Hadir</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300">{attendedCount}</div>
            <div className="text-[10px] text-emerald-400/80 font-medium mt-0.5">Terverifikasi wajah</div>
          </div>
        </div>

        {/* Stat 3: Belum Hadir */}
        <div className="card-3d-subtle p-4 sm:p-5 flex flex-col justify-between space-y-3 border-amber-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300">Belum Hadir</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300">{missingCount}</div>
            <div className="text-[10px] text-amber-400/80 font-medium mt-0.5">Menunggu absensi</div>
          </div>
        </div>

        {/* Stat 4: Persentase */}
        <div className="card-3d-subtle p-4 sm:p-5 flex flex-col justify-between space-y-3 border-fuchsia-500/30">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-fuchsia-300">Persentase</span>
            <div className="w-9 h-9 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-400 flex items-center justify-center shadow-inner">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-black text-fuchsia-300">{percentage}%</div>
            <div className="text-[10px] text-fuchsia-400/80 font-medium mt-0.5">Tingkat kehadiran</div>
          </div>
        </div>
      </div>

      {/* 3D PROGRESS BAR & SESSION INFO */}
      <div className="card-3d p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Progress Kehadiran Hari Ini
          </span>
          <span className="font-mono font-black text-amber-300">{attendedCount} dari {totalMembers} Anggota ({percentage}%)</span>
        </div>

        {/* 3D Progress Bar Track */}
        <div className="w-full h-4 bg-[#100522] rounded-full overflow-hidden p-0.5 border border-violet-700/60 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(217,70,239,0.8)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* RECENT ATTENDANCE LOG TABLE (3D CARD) */}
      <div className="card-3d-subtle p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Riwayat Kehadiran Terakhir</span>
          </h3>
          <span className="text-xs text-violet-300/70 font-medium">
            {records.length} data tercatat
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
          {records.length === 0 ? (
            <div className="text-center py-8 text-xs text-violet-400 bg-[#120626]/60 rounded-2xl border border-violet-800/40 p-4">
              Belum ada data absensi untuk sesi hari ini.
            </div>
          ) : (
            records.slice(0, 10).map((r) => (
              <div
                key={r.id}
                className="p-3 bg-[#15072d] hover:bg-[#1e0a3e] rounded-xl border border-violet-800/60 flex items-center justify-between text-xs transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-900 text-amber-300 font-bold flex items-center justify-center text-[11px] border border-violet-700">
                    {r.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-extrabold text-white">{r.name}</div>
                    <div className="text-[10px] text-violet-400 font-mono">{r.date} • {r.time} WIB</div>
                  </div>
                </div>

                <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border ${
                  r.status === 'HADIR'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                }`}>
                  {r.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
