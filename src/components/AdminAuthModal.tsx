import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, KeyRound, Lock, AlertCircle, X, Check } from 'lucide-react';

interface AdminAuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
  adminPin?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  onClose,
  onSuccess,
  adminPin = '1234',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setPin('');
      setError(false);
      return;
    }
    if (val === 'BACK') {
      setPin((p) => p.slice(0, -1));
      setError(false);
      return;
    }
    if (pin.length < 4) {
      const next = pin + val;
      setPin(next);
      setError(false);
      if (next.length === 4) {
        if (next === adminPin) {
          setTimeout(() => {
            onSuccess();
          }, 150);
        } else {
          setError(true);
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 15 }}
        className="card-3d p-6 max-w-sm w-full space-y-5 text-white relative border-violet-400/50"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-violet-400 hover:text-white rounded-xl bg-violet-950/60 border border-violet-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center mx-auto shadow-[0_4px_12px_rgba(251,191,36,0.3)]">
            <ShieldCheck className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-xl font-black text-white">Autentikasi Mode Admin</h3>
          <p className="text-xs text-violet-200/70">
            Masukkan 4-digit PIN Admin Karang Taruna untuk membuka kontrol penuh.
          </p>
        </div>

        {/* PIN Code Dots Indicator */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  filled
                    ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-125'
                    : 'bg-violet-950 border border-violet-700'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold text-center flex items-center justify-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4" />
            <span>PIN Salah! Masukkan PIN Admin yang benar.</span>
          </motion.div>
        )}

        {/* 3D Numpad */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'BACK'].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handleNumpad(val)}
              className={`py-3 rounded-xl font-black transition-all ${
                val === 'C'
                  ? 'btn-3d-rose text-white text-xs'
                  : val === 'BACK'
                  ? 'btn-3d-dark text-violet-300 text-xs'
                  : 'btn-3d-dark text-white text-base hover:text-amber-300'
              }`}
            >
              {val === 'BACK' ? '⌫' : val}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-violet-950/80 hover:bg-violet-900 text-violet-300 rounded-xl font-bold text-xs border border-violet-800 transition-all"
        >
          Tutup
        </button>
      </motion.div>
    </div>
  );
};
