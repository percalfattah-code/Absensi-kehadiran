import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  X,
  Star,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  MoreVertical,
  PlusSquare,
  Volume2,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { audioService } from '../services/audioService';

interface AndroidShortcutModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt: any;
  onInstallNative?: () => void;
}

export const AndroidShortcutModal: React.FC<AndroidShortcutModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  onInstallNative,
}) => {
  const [activeTab, setActiveTab] = useState<'CHROME' | 'SAMSUNG' | 'INFO'>('CHROME');
  const [soundTested, setSoundTested] = useState(false);

  if (!isOpen) return null;

  const handleTestAudio = async () => {
    await audioService.requestAudioPermissions();
    setSoundTested(true);
    setTimeout(() => setSoundTested(false), 4000);
  };

  const handleInstallClick = () => {
    audioService.unlock();
    if (deferredPrompt && onInstallNative) {
      onInstallNative();
    } else {
      audioService.playPromptDing();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="card-3d p-5 sm:p-6 max-w-lg w-full space-y-4 text-white relative border-violet-400/50 my-auto animate-fade-in shadow-2xl">
        {/* TOP ACCENT LINE */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-violet-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-purple-950 flex items-center justify-center font-bold shadow-md">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                Panduan Pasang Shortcut Android
              </h3>
              <p className="text-[10px] text-amber-300 font-bold">
                Jadikan Aplikasi Layar Utama HP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-violet-400 hover:text-white rounded-xl bg-violet-950 border border-violet-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* PROMINENT DIRECT 1-CLICK INSTALL IF SUPPORTED */}
        {deferredPrompt ? (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-violet-600/20 to-purple-600/20 border-2 border-amber-400/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-black">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Browser Mendukung Pemasangan 1-Klik Otomatis!</span>
            </div>
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 btn-3d-amber text-purple-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-lg"
            >
              <Download className="w-4 h-4 stroke-[3]" />
              <span>Pasang Shortcut ke Layar Utama Sekarang</span>
            </button>
          </div>
        ) : null}

        {/* BROWSER TAB SELECTOR */}
        <div className="flex rounded-xl bg-[#110526] p-1 border border-violet-800/60 text-xs font-black">
          <button
            onClick={() => setActiveTab('CHROME')}
            className={`flex-1 py-2 rounded-lg transition-all text-center ${
              activeTab === 'CHROME'
                ? 'btn-3d-violet text-amber-300'
                : 'text-violet-300 hover:text-white'
            }`}
          >
            Google Chrome
          </button>
          <button
            onClick={() => setActiveTab('SAMSUNG')}
            className={`flex-1 py-2 rounded-lg transition-all text-center ${
              activeTab === 'SAMSUNG'
                ? 'btn-3d-violet text-amber-300'
                : 'text-violet-300 hover:text-white'
            }`}
          >
            Samsung / Lainnya
          </button>
          <button
            onClick={() => setActiveTab('INFO')}
            className={`flex-1 py-2 rounded-lg transition-all text-center ${
              activeTab === 'INFO'
                ? 'btn-3d-violet text-amber-300'
                : 'text-violet-300 hover:text-white'
            }`}
          >
            Keuntungan
          </button>
        </div>

        {/* STEP-BY-STEP INSTRUCTIONS */}
        {activeTab === 'CHROME' && (
          <div className="space-y-3 bg-[#110526] p-4 rounded-2xl border border-violet-800/60 text-xs">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
              Perintah Menambahkan di Google Chrome (Android):
            </div>

            {/* STEP 1 */}
            <div className="flex items-start gap-3 bg-[#170833] p-2.5 rounded-xl border border-violet-700/40">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-white flex items-center gap-1.5">
                  <span>Ketuk Menu Titik Tiga</span>
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-violet-900 border border-violet-600 font-mono text-[10px] text-amber-300">
                    <MoreVertical className="w-3 h-3 inline" /> (⋮)
                  </span>
                </div>
                <p className="text-violet-300/80 text-[11px]">
                  Terletak di pojok kanan paling atas layar browser Chrome Anda.
                </p>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="flex items-start gap-3 bg-[#170833] p-2.5 rounded-xl border border-violet-700/40">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-white flex items-center gap-1.5">
                  <span>Pilih "Tambahkan ke Layar Utama"</span>
                  <PlusSquare className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                </div>
                <p className="text-violet-300/80 text-[11px]">
                  Atau opsi <i>"Instal Aplikasi"</i> / <i>"Add to Home screen"</i> pada daftar menu.
                </p>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="flex items-start gap-3 bg-[#170833] p-2.5 rounded-xl border border-violet-700/40">
              <div className="w-6 h-6 rounded-full bg-amber-400 text-purple-950 font-black text-[11px] flex items-center justify-center shrink-0">
                3
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-amber-300">
                  Ketuk "Tambah" / "Instal"
                </div>
                <p className="text-violet-300/80 text-[11px]">
                  Ikon aplikasi <b>Bintang Remaja</b> akan otomatis muncul di layar utama Android Anda!
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'SAMSUNG' && (
          <div className="space-y-3 bg-[#110526] p-4 rounded-2xl border border-violet-800/60 text-xs">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-1">
              Perintah Menambahkan di Samsung Internet / Browser Lain:
            </div>

            <div className="flex items-start gap-3 bg-[#170833] p-2.5 rounded-xl border border-violet-700/40">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                1
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-white">
                  Ketuk Tombol Garis Tiga (☰) di Bawah Layar
                </div>
                <p className="text-violet-300/80 text-[11px]">
                  Buka menu kontrol pada bar navigasi bawah browser Samsung.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-[#170833] p-2.5 rounded-xl border border-violet-700/40">
              <div className="w-6 h-6 rounded-full bg-violet-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                2
              </div>
              <div className="space-y-0.5">
                <div className="font-extrabold text-white">
                  Pilih "Tambahkan Halaman ke" → "Layar Depan"
                </div>
                <p className="text-violet-300/80 text-[11px]">
                  Pilih target penyimpanan ke Beranda Ponsel (Home screen).
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'INFO' && (
          <div className="space-y-2 bg-[#110526] p-4 rounded-2xl border border-violet-800/60 text-xs text-violet-200">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Akses Cepat 1x Ketuk tanpa Buka Browser Manual</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Tampilan Full Screen Tanpa Bilah URL (Seperti APK)</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Kamera Absensi & Notifikasi Suara Lebih Cepat</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Ringan, Hemat Memori, dan Tidak Membebani HP</span>
            </div>
          </div>
        )}

        {/* AUDIO TEST BUTTON (ALLOWS TESTING SOUND NOTIFICATIONS) */}
        <div className="p-3 bg-[#15072d] rounded-2xl border border-violet-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-[11px]">
              <div className="font-bold text-white">Uji Coba Notifikasi Suara</div>
              <div className="text-[10px] text-violet-300">Pastikan speaker HP menyala</div>
            </div>
          </div>
          <button
            onClick={handleTestAudio}
            className="px-3 py-1.5 btn-3d-violet text-amber-300 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{soundTested ? 'Memutar Suara...' : 'Tes Suara'}</span>
          </button>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="flex gap-2.5 pt-1">
          <button
            onClick={onClose}
            className="w-full py-3 btn-3d-amber text-purple-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg"
          >
            Saya Mengerti / Lanjutkan
          </button>
        </div>
      </div>
    </div>
  );
};
