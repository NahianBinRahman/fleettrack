import React from "react";
import { Anchor } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-2xl bg-[#0d2847] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] animate-pulse">
          <Anchor className="w-7 h-7 stroke-[2.2]" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-[#d4af37]/30 animate-ping opacity-25" />
      </div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-4">
        Synchronizing Naval Ledgers...
      </p>
    </div>
  );
}
