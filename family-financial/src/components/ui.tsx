"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { CheckCircle2, Loader2, TriangleAlert, type LucideIcon } from "lucide-react";

/* ================= TOAST ================= */

interface Toast {
  id: number;
  title: string;
  kind: "success" | "error";
}

const ToastCtx = createContext<{ push: (title: string, kind?: Toast["kind"]) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((title: string, kind: Toast["kind"] = "success") => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, title, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-[90] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 lg:bottom-8 lg:left-auto lg:right-8 lg:translate-x-0 lg:items-end">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-forest-900 px-4 py-3 text-sm font-semibold text-cream shadow-[var(--shadow-pop)]"
            >
              {t.kind === "success" ? (
                <CheckCircle2 size={17} className="text-gold-500" />
              ) : (
                <TriangleAlert size={17} className="text-clay-500" />
              )}
              {t.title}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

/* ================= COUNT-UP NUMBER ================= */

export function CountUp({
  value,
  format,
  className,
}: {
  value: number;
  format: (n: number) => string;
  className?: string;
}) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => format(v));
  const [out, setOut] = useState(() => format(0));

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    const unsub = text.on("change", (v) => setOut(v));
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={className}>{out}</span>;
}

/* ================= SMALL PIECES ================= */

export function IconBadge({
  icon: Icon,
  color,
  bg,
  size = 40,
}: {
  icon: LucideIcon;
  color: string;
  bg: string;
  size?: number;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[14px]"
      style={{ width: size, height: size, background: bg, color }}
    >
      <Icon size={size * 0.45} strokeWidth={2.2} />
    </div>
  );
}

export function DeltaChip({ pct, invert }: { pct: number | null; invert?: boolean }) {
  if (pct === null || !isFinite(pct)) return null;
  const up = pct >= 0;
  const good = invert ? !up : up;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${
        good ? "bg-moss-100 text-moss-700" : "bg-clay-100 text-clay-600"
      }`}
    >
      {up ? "▲" : "▼"} {Math.abs(pct).toFixed(0)}%
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-paper text-muted">
        <Icon size={26} strokeWidth={1.8} />
      </div>
      <p className="font-display text-lg font-semibold text-ink">{title}</p>
      <p className="max-w-xs text-sm text-muted">{hint}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2.5 py-16 text-sm font-medium text-muted">
      <Loader2 size={18} className="animate-spin" />
      {label ?? "Memuat data…"}
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-line bg-cream p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`relative rounded-xl px-4 py-2 text-[13px] font-semibold transition-colors ${
            value === o.value ? "text-cream" : "text-muted hover:text-ink"
          }`}
        >
          {value === o.value && (
            <motion.span
              layoutId={undefined}
              className="absolute inset-0 rounded-xl bg-forest-900"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ================= DATE GROUP HELPERS ================= */

export function groupBy<T>(arr: T[], keyFn: (item: T) => string): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const item of arr) {
    const k = keyFn(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return [...map.entries()];
}
