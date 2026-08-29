import React, { useState, useEffect } from 'react';
import { Github, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { githubService, GitHubConfig } from '../services/github';

interface GitHubSyncIndicatorProps {
  onOpenModal: () => void;
}

export const GitHubSyncIndicator: React.FC<GitHubSyncIndicatorProps> = ({ onOpenModal }) => {
  const [config, setConfig] = useState<GitHubConfig>(githubService.getConfig());
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const unsubscribe = githubService.subscribe((latestConfig) => {
      const prevStatus = config.lastStatus;
      setConfig(latestConfig);

      // Show toast on syncing or newly completed success
      if (latestConfig.lastStatus === 'syncing' || (prevStatus === 'syncing' && latestConfig.lastStatus === 'success')) {
        setShowToast(true);
        if (latestConfig.lastStatus === 'success') {
          const t = setTimeout(() => setShowToast(false), 4500);
          return () => clearTimeout(t);
        }
      }
    });
    return unsubscribe;
  }, [config.lastStatus]);

  const isConfigured = Boolean(config.token && config.owner && config.repo);

  if (!isConfigured) {
    return (
      <button
        onClick={onOpenModal}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-950/80 hover:bg-violet-900 border border-violet-700/60 text-violet-300 hover:text-white text-[11px] font-bold transition-all shadow-sm"
        title="Hubungkan ke Repository GitHub untuk Auto-Sync"
      >
        <Github className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden sm:inline">Hubungkan</span> GitHub
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={onOpenModal}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all shadow-sm ${
          config.lastStatus === 'syncing'
            ? 'bg-blue-950/90 text-blue-200 border-blue-500/60 animate-pulse'
            : config.lastStatus === 'error'
            ? 'bg-rose-950/90 text-rose-300 border-rose-500/60'
            : 'btn-3d-violet text-amber-300 border-violet-600'
        }`}
        title={`GitHub Sync: ${config.owner}/${config.repo} (${config.branch})`}
      >
        <Github className="w-3.5 h-3.5 text-amber-400" />
        {config.lastStatus === 'syncing' ? (
          <span className="flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
            <span className="hidden sm:inline">Syncing...</span>
          </span>
        ) : config.lastStatus === 'error' ? (
          <span className="flex items-center gap-1 text-rose-300">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>Sync Error</span>
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="hidden sm:inline">GitHub Auto-Sync</span>
            <span className="sm:hidden">GitHub</span>
          </span>
        )}
      </button>

      {/* Floating Auto-Sync Notification Toast */}
      {showToast && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div className="card-3d p-3.5 max-w-xs sm:max-w-sm rounded-2xl bg-[#14062a]/95 backdrop-blur-xl border border-violet-500/80 shadow-[0_10px_30px_rgba(0,0,0,0.8)] text-white text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-bold">
                <Github className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-[11px] uppercase tracking-wider font-black">
                  {config.lastStatus === 'syncing' ? 'Menyinkronkan...' : 'GitHub Ter-update'}
                </span>
              </div>
              {config.lastCommitUrl && (
                <a
                  href={config.lastCommitUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-violet-300 hover:text-amber-300 underline flex items-center gap-0.5"
                >
                  <span>Commit {config.lastCommitSha}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>
            <p className="text-[11px] text-violet-200/90 leading-tight">
              {config.lastStatus === 'syncing'
                ? 'Sedang menyimpan & commit perubahan data ke repository GitHub...'
                : 'Perubahan data aplikasi baru saja di-commit otomatis ke GitHub.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
