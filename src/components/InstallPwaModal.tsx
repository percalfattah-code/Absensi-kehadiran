import React from 'react';
import { Smartphone, Download, X, Star, CheckCircle2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-sm w-full shadow-2xl space-y-4 text-center text-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-base font-extrabold text-blue-900">BINTANG REMAJA PWA</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="w-16 h-16 bg-blue-900 rounded-2xl mx-auto flex items-center justify-center border border-blue-800 shadow-md">
          <Smartphone className="w-8 h-8 text-amber-400" />
        </div>

        <div className="space-y-2 text-xs">
          <h4 className="font-extrabold text-sm text-slate-900">Tambahkan ke Home Screen Android</h4>
          <p className="text-slate-600 font-medium leading-relaxed">
            Jalankan aplikasi seperti app native tanpa perlu membuka alamat web secara manual. Bebas kuota setelah dimuat & mendukung absensi offline!
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-left text-slate-700 text-[11px] space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span className="font-semibold">Akses instant dari layar HP Android</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span className="font-semibold">Kamera & liveness verification cepat</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
            <span className="font-semibold">Penyimpanan IndexedDB lokal aman</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onInstall}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-blue-950 font-extrabold text-xs rounded-full flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <Download className="w-4 h-4 text-blue-950" />
            <span>Install Sekarang</span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};
