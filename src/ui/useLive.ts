"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Snapshot } from "@/application/snapshot";

const CHANNEL = "mision-ti";
const EVENT = "changed";
const POLL_WITH_REALTIME = 15_000;
const POLL_WITHOUT_REALTIME = 3_000;
/** Una petición que no responde en este tiempo se cancela, para no bloquear las siguientes. */
const FETCH_TIMEOUT_MS = 8_000;
/** Con fallos seguidos, el sondeo se espacia (hasta 12 s) en vez de saturar una red lenta. */
const MAX_POLL_MS = 12_000;

/**
 * Mantiene la pantalla sincronizada: escucha los avisos de Supabase Realtime
 * y, como respaldo, consulta el estado periódicamente.
 */
const HEARTBEAT_MS = 15_000;

export function useLive(initial: Snapshot, options: { heartbeat?: boolean } = {}) {
  const [snapshot, setSnapshot] = useState(initial);
  const [online, setOnline] = useState(true);
  const [realtime, setRealtime] = useState(false);
  const offset = useRef(initial.serverNow - Date.now());
  const inflight = useRef<Promise<void> | null>(null);
  const failures = useRef(0);

  const refresh = useCallback(() => {
    if (inflight.current) return inflight.current;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    inflight.current = fetch("/api/state", { cache: "no-store", signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((s: Snapshot) => {
        offset.current = s.serverNow - Date.now();
        setSnapshot(s);
        setOnline(true);
        failures.current = 0;
      })
      .catch(() => {
        failures.current += 1;
        setOnline(false);
      })
      .finally(() => {
        clearTimeout(timeout);
        inflight.current = null;
      });
    return inflight.current;
  }, []);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    const client = createClient(url, key, { auth: { persistSession: false } });
    const channel = client
      .channel(CHANNEL)
      .on("broadcast", { event: EVENT }, () => void refresh())
      .subscribe((status) => {
        setRealtime(status === "SUBSCRIBED");
        if (status === "SUBSCRIBED") void refresh();
      });
    return () => {
      void client.removeChannel(channel);
    };
  }, [refresh]);

  useEffect(() => {
    const base = realtime ? POLL_WITH_REALTIME : POLL_WITHOUT_REALTIME;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const tick = async () => {
      // Con la pantalla apagada o la pestaña oculta no se gasta datos; al volver se actualiza (onFocus).
      if (!document.hidden) await refresh();
      if (stopped) return;
      const delay = Math.min(base * 2 ** Math.min(failures.current, 3), Math.max(base, MAX_POLL_MS));
      timer = setTimeout(() => void tick(), delay);
    };
    timer = setTimeout(() => void tick(), base);
    const onFocus = () => {
      if (!document.hidden) void refresh();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      stopped = true;
      clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [realtime, refresh]);

  // Señal de vida para la lista de asistencia (solo celulares de estudiantes).
  useEffect(() => {
    if (!options.heartbeat) return;
    const beat = () => {
      void fetch("/api/presence", { method: "POST", cache: "no-store" })
        .then((r) => setOnline(r.ok))
        .catch(() => setOnline(false));
    };
    beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    const onBack = () => {
      beat();
      void refresh();
    };
    window.addEventListener("online", onBack);
    document.addEventListener("visibilitychange", onBack);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", onBack);
      document.removeEventListener("visibilitychange", onBack);
    };
  }, [options.heartbeat, refresh]);

  const serverNow = useCallback(() => Date.now() + offset.current, []);
  return { snapshot, refresh, online, realtime, serverNow };
}

/** Re-renderiza cada `ms` milisegundos (para el temporizador). */
export function useTick(ms = 250) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
