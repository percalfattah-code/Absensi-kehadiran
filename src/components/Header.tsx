import React from 'react';
import {
  Star,
  ShieldCheck,
  Smartphone,
  Lock,
  Unlock,
  UserCheck,
  FileSpreadsheet,
  LogOut,
  Sparkles,
  Volume2,
  Download,
} from 'lucide-react';
import { AttendanceSession, RoleMode } from '../types';
import { GoogleSheetsSyncState } from '../services/googleSheets';
import { audioService } from '../services/audioService';

interface HeaderProps {
  session: AttendanceSession | null;
  deferredPrompt: any;
  onInstallClick: () => void;
  isOffline: boolean;
  roleMode: RoleMode;
  sheetsConfig: GoogleSheetsSyncState;
  onOpenAdminLogin: () => void;
  onLockAdminMode: () => void;
  onLogoutToLoginScreen: () => void;
  onConnectGoogleSheets: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  deferredPrompt,
  onInstallClick,
  isOffline,
  roleMode,
  sheetsConfig,
  onOpenAdminLogin,
  onLockAdminMode,
  onLogoutToLoginScreen,
  onConnectGoogleSheets,
}) => {
  const isSessionOpen = session?.isOpen ?? false;

  const handleTestSound = async () => {
    await audioService.requestAudioPermissions();
  };

  const handleOpenShortcutGuide = () => {
    audioService.unlock();
    onInstallClick();
  };

  return (
    <header className="bg-[#15072b] text-white border-b border-violet-500/30 sticky top-0 z-40 px-3 sm:px-4 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
        {/* Branding & Logo */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onLogoutToLoginScreen}
            className="group relative w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-purple-950 flex items-center justify-center font-bold shrink-0 shadow-[0_4px_0_0_#92400e,0_8px_15px_rgba(245,158,11,0.4)] border border-amber-200/60 hover:scale-105 active:scale-95 transition-all"
            title="Kembali ke Menu Login Awal"
          >
            <Star className="w-5 h-5 sm:w-6 sm:h-6 fill-purple-950" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSessionOpen ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isSessionOpen ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
            </span>
          </button>

          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-base font-black text-white uppercase tracking-wider leading-tight flex items-center gap-1">
                <span>BINTANG REMAJA</span>
              </h1>
              {isOffline && (
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/40">
                  Offline
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-violet-300 font-medium line-clamp-1 flex items-center gap-1">
              {roleMode === 'ADMIN' ? (
                <>
                  <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                  <span className="text-amber-300 font-bold">Panel Kontrol Pengurus</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3 h-3 text-violet-400 shrink-0" />
                  <span>Portal Absensi Anggota</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right Action Badges & Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Mode Switcher Button */}
          {roleMode === 'ADMIN' ? (
            <button
              onClick={onLockAdminMode}
              className="flex items-center gap-1 px-3 py-1.5 btn-3d-amber text-purple-950 font-black text-xs rounded-xl transition-all"
              title="Kunci Mode Admin & Beralih ke Anggota"
            >
              <Unlock className="w-3.5 h-3.5 text-purple-950" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1 px-3 py-1.5 btn-3d-dark text-amber-300 font-bold text-xs rounded-xl transition-all"
              title="Masuk Mode Admin (PIN)"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Masuk Admin</span>
            </button>
          )}

          {/* Switch Role / Exit to Initial Login Screen Button */}
          <button
            onClick={onLogoutToLoginScreen}
            className="flex items-center gap-1 px-2.5 py-1.5 btn-3d-dark text-violet-200 hover:text-white font-bold text-xs rounded-xl transition-all"
            title="Keluar ke Menu Role Login Awal"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Ganti Role</span>
          </button>
        </div>
      </div>
    </header>
  );
};
