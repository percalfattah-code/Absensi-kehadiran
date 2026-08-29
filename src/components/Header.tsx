import React from 'react';
import { Star, ShieldCheck, Download, Smartphone } from 'lucide-react';
import { AttendanceSession } from '../types';

interface HeaderProps {
  session: AttendanceSession | null;
  deferredPrompt: any;
  onInstallClick: () => void;
  isOffline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  deferredPrompt,
  onInstallClick,
  isOffline,
}) => {
  const isSessionOpen = session?.isOpen ?? false;

  return (
    <header className="bg-blue-900 text-white border-b border-blue-800 sticky top-0 z-40 px-4 py-3 shadow-md">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Branding & Logo */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-amber-400 text-blue-950 flex items-center justify-center shadow-lg font-bold shrink-0">
            <Star className="w-6 h-6 fill-blue-950 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSessionOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isSessionOpen ? 'bg-green-400' : 'bg-red-500'}`}></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-white uppercase tracking-wider leading-tight">
                BINTANG REMAJA
              </h1>
              {isOffline && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/40">
                  Offline
                </span>
              )}
            </div>
            <p className="text-[11px] text-blue-200 font-medium line-clamp-1">
              Sistem Absensi Digital Karang Taruna
            </p>
          </div>
        </div>

        {/* Right Status Badge & PWA Install Button */}
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button
              onClick={onInstallClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold text-xs rounded-full shadow-md transition-all active:scale-95"
              title="Install ke Home Screen Android"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border ${
            isSessionOpen
              ? 'bg-green-500/20 text-green-300 border-green-400/40'
              : 'bg-red-500/20 text-red-300 border-red-400/40'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isSessionOpen ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span>{isSessionOpen ? 'Absensi Buka' : 'Tutup'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
