import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// ── FadeIn: viewport'a girince kademeli reveal ───────────────────────────────
export function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let io: IntersectionObserver | undefined;
    // Safety net: reveal even if IntersectionObserver/rAF never fires (hidden windows, old browsers).
    const fallback = window.setTimeout(() => setShown(true), 1500);
    try {
      io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setShown(true);
            io?.disconnect();
          }
        },
        { threshold: 0.08 }
      );
      io.observe(el);
    } catch {
      setShown(true);
    }
    return () => {
      window.clearTimeout(fallback);
      io?.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className={`${className} ${shown ? "fx-fade-up" : "opacity-0"}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ── PageHeader: gradient bantlı, animasyonlu sayfa başlığı ───────────────────
export function PageHeader({ icon: Icon, title, description, actions }: { icon?: React.ComponentType<any>; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="fx-header-band -m-4 sm:-m-6 mb-6 sm:mb-8 px-4 sm:px-6 pt-6 pb-6 sm:rounded-b-2xl border-b border-primary/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4 min-w-0">
          {Icon && (
            <span className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 fx-float">
              <Icon className="h-6 w-6" />
            </span>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
              <span className="fx-gradient-text">{title}</span>
            </h1>
            {description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 sm:ml-auto shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

// ── CountUp: sayıları yumuşakça artıran gösterim ─────────────────────────────
export function CountUp({ value, format = (n: number) => String(Math.round(n)), duration = 900, className = "" }: { value: number; format?: (n: number) => string; duration?: number; className?: string }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || duration <= 0) {
      setDisplay(value);
      return;
    }
    // Fallback for environments where rAF is frozen (hidden windows).
    const fallback = window.setTimeout(() => setDisplay(value), duration + 120);
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(fallback);
    };
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}

// ── TiltCard: fareyle 3D eğilme efekti ───────────────────────────────────────
export function TiltCard({ children, className = "", max = 8 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  };
  const onLeave = () => {
    if (ref.current) ref.current.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`fx-tilt ${className}`}>
      {children}
    </div>
  );
}

// ── EmptyState: tasarlanmış boş/yakında durumu ───────────────────────────────
export function EmptyState({ icon: Icon, title, body, actionLabel, onAction, soon = false }: { icon: React.ComponentType<any>; title: string; body: string; actionLabel?: string; onAction?: () => void; soon?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-2xl bg-primary/20 blur-2xl" aria-hidden />
        <div className={`relative flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/25 text-primary ${soon ? "fx-float" : ""}`}>
          <Icon className="h-10 w-10" />
        </div>
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      {soon && (
        <span className="mt-2 inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
          Yolda — bu modül hazırlandığı modül listesinde
        </span>
      )}
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors fx-pulse-glow">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ── PageShell: her iç sayfa için ortak iskelet (header + kademeli içerik) ────
export function PageShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  return (
    <div key={location} className="p-4 sm:p-6">
      {children}
    </div>
  );
}
