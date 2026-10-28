"use client";

import { useCallback, useState, useTransition, type ReactNode } from "react";
import { AGENDA } from "@/domain/data/agenda";
import { minutesToMs, remainingMs } from "@/domain/rules";
import type { GameState } from "@/domain/types";
import type { ActionResult } from "@/app/actions";
import { useTick } from "./useLive";

/* ---------- Marca ---------- */
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <a className="brand" href={href} aria-label="Misión TI, inicio">
      <i className="brand-mark" aria-hidden />
      <span className="brand-text">MISIÓN<span>_</span>TI</span>
    </a>
  );
}

/* ---------- TecnoCoins: 085 TC ---------- */
export function Coins({ value, digits = 3, unit = true, className = "" }: { value: number; digits?: number; unit?: boolean; className?: string }) {
  const negative = value < 0;
  const raw = Math.abs(value).toString();
  const lead = raw.length < digits ? "0".repeat(digits - raw.length) : "";
  return (
    <span className={`coins ${className}`} aria-label={`${value} TecnoCoins`}>
      {negative && "−"}
      <span className="lead">{lead}</span>
      {raw}
      {unit && <span className="unit">TC</span>}
    </span>
  );
}

export const signed = (n: number) => (n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : "0");

/* ---------- Temporizador compartido ---------- */
export function useCountdown(state: GameState, serverNow: () => number) {
  useTick(state.timer.status === "running" ? 250 : 1000);
  const total = minutesToMs(AGENDA[state.agendaIndex]?.minutes ?? 1);
  const left = remainingMs(state.timer, serverNow());
  return { left, total, status: state.timer.status, ratio: Math.min(Math.max(1 - left / total, 0), 1) };
}

export function formatClock(ms: number) {
  const neg = ms < 0;
  const s = Math.ceil(Math.abs(ms) / 1000);
  return `${neg ? "+" : ""}${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function Clock({ left, status, className = "" }: { left: number; status: string; className?: string }) {
  const tone = status === "idle" ? "idle" : left < 0 ? "over" : left <= 120_000 ? "warn" : "";
  return (
    <span className={`timer ${tone} ${className}`} role="timer" aria-live="off">
      {formatClock(left)}
    </span>
  );
}

/* ---------- Estado de conexión ---------- */
export function Signal({ online, realtime }: { online: boolean; realtime: boolean }) {
  const cls = !online ? "off" : realtime ? "" : "poll";
  const text = !online ? "sin conexión" : realtime ? "en vivo" : "sincronizando";
  return (
    <span className={`signal ${cls}`}>
      <i aria-hidden />
      {text}
    </span>
  );
}

/* ---------- Avisos ---------- */
type Toast = { id: number; text: string; error: boolean };

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, error = false) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, error }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), error ? 5000 : 3200);
  }, []);
  const view = (
    <div className="toast-wrap" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.error ? "error" : ""}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
  return { push, view };
}

/**
 * Ejecuta una acción del servidor, muestra el resultado y refresca la pantalla.
 * Centraliza este flujo para que ningún componente lo repita (DRY / SRP).
 */
export function useAction(push: (text: string, error?: boolean) => void, refresh: () => Promise<void> | void) {
  const [pending, start] = useTransition();
  const run = useCallback(
    (action: () => Promise<ActionResult>, onOk?: () => void) =>
      start(async () => {
        const result = await action();
        if (result.ok) {
          if (result.message) push(result.message);
          onOk?.();
        } else push(result.error, true);
        await refresh();
      }),
    [push, refresh],
  );
  return { run, pending };
}

/* ---------- Iconos (trazos simples, sin librerías) ---------- */
const svg = (d: ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);
export const Icon = {
  market: svg(<><path d="M4 7h16l-1.5 9.5a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5L4 7Z" /><path d="M9 7V5a3 3 0 0 1 6 0v2" /></>),
  assets: svg(<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>),
  light: svg(<><rect x="8" y="2.5" width="8" height="19" rx="4" /><circle cx="12" cy="7" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="17" r="1.6" /></>),
  gallery: svg(<><rect x="3" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" /><path d="m14.5 17 2 2 4-4" /></>),
};
