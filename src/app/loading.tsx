import React from "react";
import { Anchor } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071320] via-[#0b1f3a] to-[#0f2a4d] flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#d4af37]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Main Nautical Gyroscope & Compass Loader */}
      <div className="relative flex items-center justify-center w-36 h-36 mb-6">
        {/* Outermost Rotating Dashed Compass Ring */}
        <div className="absolute inset-0 rounded-full border border-dashed border-[#d4af37]/30 animate-[spin_12s_linear_infinite]" />

        {/* Sonar Radar Pulse Ring */}
        <div className="absolute inset-2 rounded-full border border-blue-400/20 animate-ping opacity-30" />

        {/* Counter-rotating Middle Azimuth Ring */}
        <div className="absolute inset-4 rounded-full border-2 border-t-[#d4af37] border-r-blue-400/40 border-b-transparent border-l-blue-500/30 animate-[spin_4s_linear_infinite_reverse]" />

        {/* Inner Glowing Shield Hub */}
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#0d2847] to-[#1a4577] border-2 border-[#d4af37]/70 shadow-2xl shadow-black/60 flex items-center justify-center text-[#d4af37] group">
          <Anchor className="w-10 h-10 stroke-[2.2] drop-shadow-[0_0_12px_rgba(212,175,55,0.6)] animate-pulse" />
          
          {/* Micro Compass Degree Ticks */}
          <span className="absolute -top-1 w-1 h-1.5 bg-[#d4af37] rounded-full" />
          <span className="absolute -bottom-1 w-1 h-1.5 bg-[#d4af37] rounded-full" />
          <span className="absolute -left-1 w-1.5 h-1 bg-[#d4af37] rounded-full" />
          <span className="absolute -right-1 w-1.5 h-1 bg-[#d4af37] rounded-full" />
        </div>
      </div>

      {/* Institutional Branding Typography */}
      <div className="space-y-1.5 z-10">
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm font-extrabold tracking-widest uppercase text-white font-mono">
            FLEET<span className="text-[#d4af37]">TRACK</span>
          </span>
          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#d4af37]/20 text-[#d4af37] rounded border border-[#d4af37]/40">
            SECURE LEDGER
          </span>
        </div>
        <p className="text-xs text-slate-300 font-medium tracking-wide">
          Naval Administrative Directorate &bull; Budget System
        </p>
      </div>

      {/* Shimmering Metallic Loading Progress Line */}
      <div className="w-56 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden relative z-10 border border-slate-700/60">
        <div className="h-full bg-gradient-to-r from-transparent via-[#d4af37] to-transparent w-full animate-[shimmer_1.8s_infinite] -translate-x-full" />
      </div>

      <p className="text-[11px] text-slate-400 mt-2.5 font-mono z-10 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        Synchronizing authenticated ledger balances (৳ BDT)...
      </p>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
