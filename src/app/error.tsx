"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("System Runtime Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 mb-6 shadow-xl">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
        System Operational Exception
      </span>
      <h1 className="text-2xl sm:text-3xl font-black text-white mt-2">
        An Unexpected Error Occurred
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-2 mb-6 leading-relaxed">
        The application encountered an unexpected runtime error while processing financial ledgers. Administrative audit logs have captured the diagnostic context.
      </p>

      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => reset()} className="text-slate-900 bg-white">
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Retry Operation
        </Button>
        <Link href="/dashboard">
          <Button variant="naval">
            <Home className="w-4 h-4 mr-1.5" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
