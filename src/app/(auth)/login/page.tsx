"use client";

import React, { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Anchor, ShieldCheck, Lock, Mail, AlertCircle, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAction(null, formData);
      if (res?.error) {
        setError(res.error);
        setIsPending(false);
      }
    } catch {
      // Redirect throws an error in Next.js server actions which is expected on success
    }
  };

  const setDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#071320] via-[#0b1f3a] to-[#122e50] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Crest */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#122e50] to-[#1e4e85] border-2 border-[#d4af37]/60 shadow-xl shadow-black/40 text-[#d4af37] mb-2">
            <Anchor className="w-9 h-9 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            FLEET<span className="text-[#d4af37]">TRACK</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-[#d4af37] font-bold">
            Naval Administrative Budget System
          </p>
          <p className="text-xs text-slate-400">
            Secure Annual Allocation &amp; Expenditure Portal (৳ BDT)
          </p>
        </div>

        {/* Login Card */}
        <Card className="border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl text-slate-100">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-white">Official Sign In</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Enter your authorized naval credentials to access your ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Official Email Address
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="officer@fleettrack.mil.bd"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-950/60 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4 text-slate-400" />}
                  className="bg-slate-950/60 border-slate-700 text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                variant="naval"
                disabled={isPending}
                className="w-full h-11 text-sm font-semibold bg-gradient-to-r from-[#173e6b] to-[#1e528d] hover:from-[#1e528d] hover:to-[#286cb8] text-white border border-[#d4af37]/30"
              >
                {isPending ? "Authenticating..." : "Sign In to Portal"}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                Demo Accounts (1-Click Test)
              </span>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDemoUser("admin@fleettrack.mil.bd")}
                  className="p-2 text-left rounded-lg bg-slate-950/80 border border-slate-700/80 hover:border-[#d4af37] transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#d4af37]">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    HQ Admin
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Cmdr Tariqul (Full HQ)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoUser("sadia.rahman@fleettrack.mil.bd")}
                  className="p-2 text-left rounded-lg bg-slate-950/80 border border-orange-500/30 hover:border-orange-400 transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-orange-300">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Ceiling Reached (98%)
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Lt Cdr Sadia Rahman</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoUser("faisal.ahmed@fleettrack.mil.bd")}
                  className="p-2 text-left rounded-lg bg-slate-950/80 border border-amber-500/30 hover:border-amber-400 transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Near Limit (96%)
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Cdr Faisal Ahmed</p>
                </button>

                <button
                  type="button"
                  onClick={() => setDemoUser("asif.mamun@fleettrack.mil.bd")}
                  className="p-2 text-left rounded-lg bg-slate-950/80 border border-emerald-500/30 hover:border-emerald-400 transition-all group"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Healthy (25%)
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Sub-Lt Asif Al-Mamun</p>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 text-center pt-1">
                All accounts use standard password: <code className="text-slate-300 font-mono">password123</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security watermark */}
        <p className="text-center text-[11px] text-slate-500">
          Bangladesh Navy Administrative Directorate &bull; Official Classified Financial Portal
        </p>
      </div>
    </div>
  );
}
