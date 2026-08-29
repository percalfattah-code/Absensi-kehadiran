import React from 'react';
import { Smartphone, Download, X, Star, CheckCircle2, Sparkles } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({
  isOpen,
  onClose,
  onInstall,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="card-3d p-6 max-w-sm w-full space-y-4 text-center text-white relative border-violet-400/50">
        <div className="flex items-center justify-between border-b border-violet-800/80 pb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-black text-white">BINTANG REMAJA PWA</h3>
          </div>
          <button onClick={onClose} className="p-1 text-violet-400 hover:text-white rounded-lg bg-violet-950">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-800 rounded-2xl mx-auto flex items-center justify-center border border-violet-400/40 shadow-[0_8px_16px_rgba(139,92,246,0.4)]">
          <Smartphone className="w-8 h-8 text-amber-300" />
        </div>

        <div className="space-y-1.5 text-xs">
          <h4 className="font-black text-sm text-white">Pasang ke Layar Utama Android / HP</h4>
          <p className="text-violet-200/70 leading-relaxed">
            Jalankan aplikasi seperti aplikasi Android asli, akses kamera lebih cepat, dan tersimpan offline.
          </p>
        </div>

        <div className="bg-[#120524] p-3.5 rounded-2xl border border-violet-800/60 text-left text-violet-200 text-[11px] space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Akses instan dari beranda ponsel</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Kamera deteksi biometrik wajah responsif</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sinkronisasi otomatis ke Google Sheets</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onInstall}
            className="w-full py-3.5 btn-3d-amber text-purple-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>Pasang Sekarang (PWA)</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 btn-3d-dark text-violet-300 rounded-xl font-bold text-xs"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
