import React from 'react';
import { Camera, LayoutDashboard, Users, ClipboardList, Settings } from 'lucide-react';
import { ViewMode } from '../types';

interface NavigationProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems: { id: ViewMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'absensi', label: 'Absensi', icon: Camera },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'anggota', label: 'Anggota', icon: Users },
    { id: 'rekap', label: 'Rekap', icon: ClipboardList },
    { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <>
      {/* Top Navigation Bar for Desktop (md screens and up) */}
      <nav className="hidden md:block bg-blue-900 border-b border-blue-800 py-2.5">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all ${
                  isActive
                    ? 'bg-blue-800 text-white font-bold shadow-inner border border-blue-700/60'
                    : 'text-blue-200 hover:text-white hover:bg-blue-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'opacity-80'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (Android smartphone optimized) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-blue-900/95 backdrop-blur-lg border-t border-blue-800 px-2 py-2 shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
                  isActive
                    ? 'text-amber-400 font-bold scale-105'
                    : 'text-blue-200 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'opacity-80'}`} />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1.5 w-6 h-1 bg-amber-400 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
