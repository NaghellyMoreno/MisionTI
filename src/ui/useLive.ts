"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Snapshot } from "@/application/snapshot";

const CHANNEL = "mision-ti";
const EVENT = "changed";
const POLL_WITH_REALTIME = 15_000;
const POLL_WITHOUT_REALTIME = 3_000;

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

  const refresh = useCallback(() => {
    if (inflight.current) return inflight.current;
    inflight.current = fetch("/api/state", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((s: Snapshot) => {
        offset.current = s.serverNow - Date.now();
        setSnapshot(s);
        setOnline(true);
      })
      .catch(() => setOnline(false))
      .finally(() => {
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
    const id = setInterval(() => void refresh(), realtime ? POLL_WITH_REALTIME : POLL_WITHOUT_REALTIME);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
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
