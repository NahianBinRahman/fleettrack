"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Anchor,
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
  ShieldCheck,
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

interface MobileNavProps {
  user: UserProfile;
}

export function MobileNav({ user }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      {/* Top Mobile Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#091726] text-white border-b border-[#152e4d] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="p-1.5 rounded-lg bg-[#112946] text-slate-200 hover:text-white focus:outline-none"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#163860] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Anchor className="w-3.5 h-3.5" />
            </div>
            <span className="font-extrabold tracking-wider text-sm text-white">
              FLEET<span className="text-[#d4af37]">TRACK</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href={pathname.startsWith("/admin") ? "/dashboard" : "/admin"}
              className="text-[11px] font-semibold px-2 py-1 rounded bg-[#163860] text-blue-200 border border-blue-400/30"
            >
              {pathname.startsWith("/admin") ? "Officer View" : "Admin"}
            </Link>
          )}
          <div className="w-7 h-7 rounded-full bg-[#1b3d66] border border-[#d4af37]/30 flex items-center justify-center text-[10px] font-bold text-[#d4af37]">
            {user.rank ? user.rank.slice(0, 2).toUpperCase() : "NAV"}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer Sheet */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[#091726] text-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-[#152e4d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#163860] border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Anchor className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm text-white">
                FLEET<span className="text-[#d4af37]">TRACK</span>
              </span>
              <p className="text-[10px] text-slate-400">Naval Budget System</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-lg bg-[#112946] text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Quick Switcher */}
        {isAdmin && (
          <div className="p-3 mx-3 my-2 rounded-xl bg-[#0e243d] border border-[#1b3d66]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#d4af37] font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Administrative Command
            </div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "py-1.5 text-center rounded-lg font-medium text-xs",
                  pathname.startsWith("/admin")
                    ? "bg-[#1d4879] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                HQ Admin
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className={cn(
                  "py-1.5 text-center rounded-lg font-medium text-xs",
                  !pathname.startsWith("/admin")
                    ? "bg-[#1d4879] text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Officer
              </Link>
            </div>
          </div>
        )}

        {/* Links */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#173b64] text-white border-l-3 border-[#d4af37]"
                    : "text-slate-400 hover:text-white hover:bg-[#102947]"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-[#d4af37]" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Officer Profile & Sign out */}
        <div className="p-4 border-t border-[#152e4d] bg-[#071320] space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#1b3d66] border border-[#d4af37]/40 flex items-center justify-center text-xs font-bold text-[#d4af37]">
              {user.rank ? user.rank.slice(0, 2).toUpperCase() : "NAV"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user.serviceId} {user.rank ? `• ${user.rank}` : ""}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
