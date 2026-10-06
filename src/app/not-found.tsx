import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Anchor, ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#163860] border-2 border-[#d4af37]/60 flex items-center justify-center text-[#d4af37] mb-6 shadow-xl">
        <Anchor className="w-9 h-9 stroke-[2.2]" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37]">
        404 &bull; Record Not Found
      </span>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-2">
        Page or Voucher Not Found
      </h1>
      <p className="text-sm text-slate-400 max-w-md mt-2 mb-6 leading-relaxed">
        The requested voucher, administrative path, or naval ledger entry does not exist or may have been restricted under statutory directives.
      </p>

      <Link href="/dashboard">
        <Button variant="naval" size="lg">
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Return to Officer Portal
        </Button>
      </Link>
    </div>
  );
}
