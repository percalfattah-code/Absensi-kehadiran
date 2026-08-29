import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Github,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Save,
  X,
  ExternalLink,
  Lock,
  DownloadCloud,
  UploadCloud,
  FileCode2,
  Sparkles,
  Info,
} from 'lucide-react';
import { githubService, GitHubConfig, SyncPayload } from '../services/github';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPayload: SyncPayload;
  onDataPulled?: (data: { members: any[]; attendance: any[]; announcements: any[]; session: any }) => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  currentPayload,
  onDataPulled,
}) => {
  const [config, setConfig] = useState<GitHubConfig>(githubService.getConfig());
  const [token, setToken] = useState(config.token);
  const [owner, setOwner] = useState(config.owner);
  const [repo, setRepo] = useState(config.repo);
  const [branch, setBranch] = useState(config.branch || 'main');
  const [autoSync, setAutoSync] = useState(config.autoSyncEnabled);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [pulling, setPulling] = useState(false);
  const [showTokenGuide, setShowTokenGuide] = useState(false);

  useEffect(() => {
    const unsubscribe = githubService.subscribe((latestConfig) => {
      setConfig(latestConfig);
      setToken(latestConfig.token);
      setOwner(latestConfig.owner);
      setRepo(latestConfig.repo);
      setBranch(latestConfig.branch || 'main');
      setAutoSync(latestConfig.autoSyncEnabled);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleSaveConfig = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    githubService.saveConfig({
      token: token.trim(),
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim() || 'main',
      autoSyncEnabled: autoSync,
    });
    setTestResult({
      success: true,
      message: 'Konfigurasi GitHub berhasil disimpan!',
    });
    setTimeout(() => setTestResult(null), 3000);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setSyncError(null);
    try {
      const res = await githubService.testConnection({
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
      });
      setTestResult({
        success: true,
        message: `Terhubung ke ${res.fullName} (Branch: ${res.targetBranch})! Izin simpan: ${res.permissions?.push !== false ? 'Tersedia ✓' : 'Perlu izin write'}`,
        details: res,
      });
      // Also auto-save if test succeeds
      githubService.saveConfig({
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
        autoSyncEnabled: autoSync,
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Gagal terhubung ke repository GitHub.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleManualPush = async () => {
    setSyncing(true);
    setSyncSuccess(null);
    setSyncError(null);
    try {
      // Save current input first
      githubService.saveConfig({
        token: token.trim(),
        owner: owner.trim(),
        repo: repo.trim(),
        branch: branch.trim() || 'main',
        autoSyncEnabled: autoSync,
      });

      const res = await githubService.syncNow(currentPayload, 'Manual Push dari Dashboard Admin');
      setSyncSuccess(`Semua file berhasil di-update & di-commit ke GitHub! (${res.updatedFiles?.length || 5} file tersinkron)`);
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      setSyncError(err.message || 'Gagal menyimpan data ke GitHub.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePullData = async () => {
    if (!window.confirm('Tarik data dari GitHub? Data lokal di browser akan diperbarui dengan versi terbaru dari file di GitHub.')) {
      return;
    }
    setPulling(true);
    setSyncSuccess(null);
    setSyncError(null);
    try {
      const data = await githubService.pullData();
      if (onDataPulled) {
        onDataPulled(data);
      }
      setSyncSuccess(`Data berhasil ditarik dari GitHub! (${data.members?.length || 0} anggota, ${data.attendance?.length || 0} rekap absensi)`);
      setTimeout(() => setSyncSuccess(null), 4000);
    } catch (err: any) {
      setSyncError(err.message || 'Gagal menarik data dari GitHub.');
    } finally {
      setPulling(false);
    }
  };

  const isConfigured = Boolean(token && owner && repo);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-['Poppins',sans-serif]">
      <div className="card-3d max-w-xl w-full my-auto p-5 sm:p-6 space-y-5 text-white relative max-h-[92vh] overflow-y-auto scrollbar-thin">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-violet-300 hover:text-white border border-violet-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 pr-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-violet-950 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider">
            <Github className="w-3.5 h-3.5" />
            <span>OTOMATISASI REPOSITORY</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>Sinkronisasi Otomatis GitHub</span>
          </h2>
          <p className="text-xs text-violet-200/80">
            Setiap kali Anda menambah atau mengedit data (anggota, absensi, pengumuman), data akan otomatis ter-update dan di-commit langsung ke repository GitHub.
          </p>
        </div>

        {/* Status Box */}
        <div className="p-3.5 rounded-2xl bg-[#120626] border border-violet-700/60 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full shrink-0 ${
              config.lastStatus === 'syncing'
                ? 'bg-blue-400 animate-ping'
                : isConfigured && config.lastStatus !== 'error'
                ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                : 'bg-amber-400'
            }`} />
            <div>
              <div className="font-extrabold text-white">
                {config.lastStatus === 'syncing'
                  ? 'Sedang Sinkronisasi ke GitHub...'
                  : isConfigured
                  ? 'GitHub Terhubung & Siap Auto-Sync'
                  : 'Belum Dikonfigurasi'}
              </div>
              <div className="text-[11px] text-violet-300 font-mono">
                {isConfigured ? `${owner}/${repo} (${branch})` : 'Masukkan token & nama repo di bawah'}
              </div>
            </div>
          </div>

          {config.lastCommitUrl && (
            <a
              href={config.lastCommitUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-violet-900/60 hover:bg-violet-800 text-amber-300 border border-violet-700 text-[11px] font-bold shrink-0 transition-colors"
            >
              <span>Lihat Commit</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Success/Error Alerts */}
        {syncSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncSuccess}</span>
          </div>
        )}

        {syncError && (
          <div className="p-3 rounded-xl bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{syncError}</span>
          </div>
        )}

        {testResult && (
          <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* FORM CONFIGURATION */}
        <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
          {/* GitHub Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-violet-300 font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>GitHub Personal Access Token (PAT) *</span>
              </label>
              <button
                type="button"
                onClick={() => setShowTokenGuide(!showTokenGuide)}
                className="text-[11px] text-amber-300 hover:underline flex items-center gap-1 font-semibold"
              >
                <Info className="w-3 h-3" />
                <span>{showTokenGuide ? 'Sembunyikan Panduan' : 'Cara Buat Token'}</span>
              </button>
            </div>

            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx atau github_pat_xxxx..."
              className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-mono text-xs"
            />

            {showTokenGuide && (
              <div className="mt-2 p-3 bg-violet-950/90 rounded-xl border border-violet-600 text-[11px] text-violet-200 space-y-1.5">
                <p className="font-bold text-amber-300">Langkah cepat membuat GitHub Token:</p>
                <ol className="list-decimal list-inside space-y-1 text-violet-200/90">
                  <li>Buka <a href="https://github.com/settings/tokens/new?scopes=repo&description=Bintang+Remaja+App" target="_blank" rel="noreferrer" className="text-amber-300 underline font-bold inline-flex items-center gap-0.5">GitHub Token Settings <ExternalLink className="w-2.5 h-2.5" /></a></li>
                  <li>Beri nama token (misal: <code>Bintang Remaja App</code>)</li>
                  <li>Centang scope <strong>repo</strong> (Full control of private repositories & contents)</li>
                  <li>Klik <strong>Generate token</strong> lalu salin token ke kolom di atas.</li>
                </ol>
              </div>
            )}
          </div>

          {/* Repo Owner & Repo Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-violet-300 font-bold mb-1.5">
                GitHub Owner / Username *
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Contoh: masekobanget"
                className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-mono"
              />
            </div>

            <div>
              <label className="block text-violet-300 font-bold mb-1.5">
                Nama Repository *
              </label>
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                placeholder="Contoh: karang-taruna-bintang-remaja"
                className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-mono"
              />
            </div>
          </div>

          {/* Branch & Auto-sync toggle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-violet-300 font-bold mb-1.5 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>Target Branch</span>
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="main"
                className="w-full bg-[#110526] text-white p-3 rounded-xl border border-violet-700/60 focus:outline-none focus:border-violet-400 font-mono"
              />
            </div>

            <div className="p-3 bg-[#110526] rounded-xl border border-violet-700/60 flex items-center justify-between sm:mt-5">
              <div>
                <div className="font-extrabold text-white text-[11px]">Auto-Sync Tiap Edit</div>
                <div className="text-[10px] text-violet-300">Otomatis update file GitHub</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-violet-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 border border-violet-700"></div>
              </label>
            </div>
          </div>

          {/* File Sync Structure Preview */}
          <div className="p-3 rounded-xl bg-[#14062a] border border-violet-800/80 space-y-1.5">
            <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <FileCode2 className="w-3.5 h-3.5" />
              <span>File yang otomatis tersimpan & ter-update di GitHub:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-violet-200/90 font-mono">
              <div className="flex items-center gap-1">📄 data/members.json</div>
              <div className="flex items-center gap-1">📄 data/attendance.json</div>
              <div className="flex items-center gap-1">📄 data/announcements.json</div>
              <div className="flex items-center gap-1">📄 data/session.json</div>
              <div className="col-span-2 flex items-center gap-1 text-amber-300">📦 data/bintang_remaja_database.json (Full Backup)</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !token || !owner || !repo}
              className="py-3 px-3 btn-3d-violet text-amber-300 font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Memeriksa...' : 'Tes Koneksi'}</span>
            </button>

            <button
              type="button"
              onClick={handleManualPush}
              disabled={syncing || !token || !owner || !repo}
              className="py-3 px-3 btn-3d-amber text-purple-950 font-black text-[11px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-md"
            >
              <UploadCloud className={`w-3.5 h-3.5 ${syncing ? 'animate-bounce' : ''}`} />
              <span>{syncing ? 'Menyimpan...' : 'Push ke GitHub'}</span>
            </button>

            <button
              type="button"
              onClick={handlePullData}
              disabled={pulling || !token || !owner || !repo}
              className="py-3 px-3 btn-3d-dark text-violet-200 hover:text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <DownloadCloud className={`w-3.5 h-3.5 ${pulling ? 'animate-spin' : ''}`} />
              <span>{pulling ? 'Menarik...' : 'Tarik dari GitHub'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
