"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  FileBarChart,
  User,
  Users,
  Calendar,
  History,
  Settings,
  LogOut,
  Anchor,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "PERSONNEL";
  serviceId: string;
  rank?: string | null;
  unit?: string | null;
}

interface SidebarProps {
  user: UserProfile;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const personnelNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "My Budget", href: "/my-budget", icon: Wallet },
    { label: "Expenses", href: "/expenses", icon: Receipt },
    { label: "Reports", href: "/reports", icon: FileBarChart },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const adminNavItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Personnel", href: "/admin/personnel", icon: Users },
    { label: "All Expenses", href: "/admin/expenses", icon: Receipt },
    { label: "Financial Years", href: "/admin/financial-years", icon: Calendar },
    { label: "Reports", href: "/admin/reports", icon: FileBarChart },
    { label: "Audit Log", href: "/admin/audit-log", icon: History },
    { label: "Settings", href: "/admin/settings", icon: Settings },
  ];

  const currentNavItems = isAdmin && pathname.startsWith("/admin") ? adminNavItems : personnelNavItems;

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#091726] text-white border-r border-[#152e4d] shrink-0 min-h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#152e4d] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#163860] to-[#255792] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shadow-md shadow-black/30">
          <Anchor className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold tracking-wider text-base text-white">
              FLEET<span className="text-[#d4af37]">TRACK</span>
            </span>
            <span className="px-1.5 py-0.2 text-[9px] font-bold tracking-wider uppercase bg-[#d4af37]/15 text-[#d4af37] rounded border border-[#d4af37]/30">
              BDT ৳
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium tracking-tight">
            Naval Budget Admin
          </p>
        </div>
      </div>

      {/* Admin Switcher / Mode indicator if Admin */}
      {isAdmin && (
        <div className="px-4 pt-4">
          <div className="p-2 rounded-xl bg-[#0e243d] border border-[#1b3d66] flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300 px-1 font-semibold">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                Command Mode
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                Admin
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <Link
                href="/admin"
                className={cn(
                  "py-1.5 px-2 rounded-lg text-center transition-all font-medium text-[11px]",
                  pathname.startsWith("/admin")
                    ? "bg-[#1d4879] text-white shadow-xs font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#163860]/40"
                )}
              >
                HQ Admin
              </Link>
              <Link
                href="/dashboard"
                className={cn(
                  "py-1.5 px-2 rounded-lg text-center transition-all font-medium text-[11px]",
                  !pathname.startsWith("/admin")
                    ? "bg-[#1d4879] text-white shadow-xs font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#163860]/40"
                )}
              >
                Officer View
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {isAdmin && pathname.startsWith("/admin") ? "Headquarters Menu" : "Officer Portal"}
        </div>
        {currentNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group",
                isActive
                  ? "bg-[#173b64] text-white shadow-xs border-l-3 border-[#d4af37] pl-3"
                  : "text-slate-400 hover:text-white hover:bg-[#102947]"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive ? "text-[#d4af37]" : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Officer Footer Profile */}
      <div className="p-4 border-t border-[#152e4d] bg-[#071320]/60 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1b3d66] to-[#0d2847] border border-[#d4af37]/40 flex items-center justify-center text-xs font-bold text-[#d4af37]">
            {user.rank ? user.rank.slice(0, 2).toUpperCase() : "NAV"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-100 truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {user.serviceId} {user.rank ? `• ${user.rank}` : ""}
            </p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  );
}
