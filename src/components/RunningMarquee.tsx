import React from 'react';
import { Sparkles, Zap, Star } from 'lucide-react';

export const RunningMarquee: React.FC = () => {
  const marqueeItems = Array(12).fill('POWERED BY ALFATTAH');

  return (
    <div className="bg-gradient-to-r from-[#120524] via-[#240a45] to-[#120524] text-amber-300 py-1.5 px-2 overflow-hidden border-b border-violet-500/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)] relative z-30 select-none">
      <div className="animate-marquee flex items-center whitespace-nowrap">
        {/* First Loop */}
        <div className="flex items-center gap-8 shrink-0 pr-8">
          {marqueeItems.map((text, idx) => (
            <div key={`m1-${idx}`} className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                {text}
              </span>
              <span className="text-violet-500 font-bold">★</span>
            </div>
          ))}
        </div>

        {/* Duplicate Loop for Seamless Infinite Scroll */}
        <div className="flex items-center gap-8 shrink-0 pr-8">
          {marqueeItems.map((text, idx) => (
            <div key={`m2-${idx}`} className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase">
              <Zap className="w-3.5 h-3.5 text-fuchsia-400 animate-bounce" />
              <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                {text}
              </span>
              <span className="text-violet-500 font-bold">★</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
