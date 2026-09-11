"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  ChartPie,
  Gem,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transaksi", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/aset", label: "Aset", icon: Gem },
  { href: "/laporan", label: "Laporan", icon: ChartPie },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 shadow-[0_8px_20px_-6px_rgba(201,162,39,0.55)]">
        <span className="font-display text-[22px] font-bold text-forest-950">P</span>
        <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[2.5px] border-forest-900 bg-moss-500" />
      </div>
      <div className="leading-tight">
        <p className="font-display text-[22px] font-semibold tracking-tight text-cream">Pundi</p>
        <p className="text-[11px] font-medium tracking-[0.14em] text-cream/45 uppercase">Kas Keluarga</p>
      </div>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col bg-forest-900 lg:flex">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-moss-600/25 blur-[80px]" />
        <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full bg-gold-500/12 blur-[70px]" />
      </div>

      <div className="relative px-7 pt-8 pb-6">
        <Logo />
      </div>

      <nav className="relative flex-1 space-y-1.5 px-4">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3.5 rounded-2xl px-4 py-3 text-[14.5px] font-semibold transition-colors ${
                active ? "text-cream" : "text-cream/50 hover:text-cream/90"
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl border border-cream/10 bg-cream/[0.07]"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <item.icon
                size={19}
                strokeWidth={2.2}
                className={`relative z-10 transition-colors ${
                  active ? "text-gold-500" : "text-cream/40 group-hover:text-cream/70"
                }`}
              />
              <span className="relative z-10">{item.label}</span>
              {active && (
                <motion.span
                  layoutId="nav-dot"
                  className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-gold-500"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="relative px-5 pb-7">
        <div className="rounded-2xl border border-cream/10 bg-cream/[0.05] p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-moss-500 to-forest-700 font-display text-sm font-bold text-cream">
              KW
            </div>
            <div className="leading-tight">
              <p className="text-[13.5px] font-bold text-cream">Keluarga Wijaya</p>
              <p className="text-[11.5px] font-medium text-cream/45">4 anggota · Jakarta</p>
            </div>
          </div>
          <p className="mt-3 border-t border-cream/10 pt-3 text-[11.5px] leading-relaxed text-cream/40">
            “Sedikit demi sedikit, lama-lama menjadi bukit.”
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 lg:hidden">
      <nav className="flex items-center justify-around rounded-3xl border border-forest-800 bg-forest-900/95 px-2 py-2.5 shadow-[var(--shadow-pop)] backdrop-blur-lg">
        {NAV.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center gap-1 rounded-2xl px-4 py-1.5"
            >
              {active && (
                <motion.span
                  layoutId="mnav-pill"
                  className="absolute inset-0 rounded-2xl bg-cream/10"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <item.icon
                size={20}
                strokeWidth={2.1}
                className={`relative z-10 ${active ? "text-gold-500" : "text-cream/45"}`}
              />
              <span
                className={`relative z-10 text-[10px] font-bold tracking-wide ${
                  active ? "text-cream" : "text-cream/45"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
