import React from 'react';
import { Camera, LayoutDashboard, Users, ClipboardList, Settings, Lock, Megaphone, ShieldCheck, UserCheck } from 'lucide-react';
import { ViewMode, RoleMode } from '../types';

interface NavigationProps {
  currentView: ViewMode;
  roleMode: RoleMode;
  onViewChange: (view: ViewMode) => void;
  onOpenAdminLogin: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  roleMode,
  onViewChange,
  onOpenAdminLogin,
}) => {
  // Admin sees full control navigation; Member has focused Absensi view
  const adminNavItems: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'absensi', label: 'Absensi', icon: Camera },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'anggota', label: 'Kelola Anggota', icon: Users },
    { id: 'rekap', label: 'Rekap Data', icon: ClipboardList },
    { id: 'pengumuman', label: 'Pemberitahuan', icon: Megaphone },
    { id: 'pengaturan', label: 'Pengaturan Sesi', icon: Settings },
  ];

  if (roleMode === 'MEMBER') {
    // Anggota hanya bisa melakukan absensi!
    return (
      <nav className="fixed bottom-3 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto bg-[#180933]/90 backdrop-blur-xl border border-violet-500/30 shadow-[0_10px_25px_rgba(0,0,0,0.6)] rounded-2xl p-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-600/30 border border-violet-400/30 rounded-xl text-xs font-black text-violet-200">
            <Camera className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>PORTAL ABSENSI ANGGOTA</span>
          </div>

          <button
            onClick={onOpenAdminLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 btn-3d-amber text-xs font-black rounded-xl uppercase tracking-wider text-purple-950"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Masuk Admin</span>
          </button>
        </div>
      </nav>
    );
  }

  // ADMIN FULL NAVIGATION BAR
  return (
    <>
      {/* Desktop Top/Middle Nav in Vibrant Violet 3D */}
      <nav className="hidden md:block bg-[#16072e]/95 backdrop-blur-md border-b border-violet-500/30 py-2.5 sticky top-[57px] z-30 shadow-md">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 relative ${
                    isActive
                      ? 'btn-3d-violet text-white shadow-[0_4px_12px_rgba(168,85,247,0.4)]'
                      : 'text-violet-300/80 hover:text-white hover:bg-violet-900/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'opacity-80'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Full Control Admin</span>
            </span>
          </div>
        </div>
      </nav>

      {/* Mobile Sticky Bottom Nav in Vibrant Violet 3D */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#14062a]/95 backdrop-blur-xl border-t border-violet-500/30 px-1 py-1.5 shadow-[0_-10px_25px_rgba(0,0,0,0.7)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-amber-300 font-black scale-105'
                    : 'text-violet-300/70 hover:text-white'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-violet-600/40 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] mt-0.5 font-bold tracking-tight">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 w-4 h-1 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
