"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { AGENDA } from "@/domain/data/agenda";
import { POP_SECTIONS } from "@/domain/data/questions";

/** Segundos antes del cierre en que aparece el aviso previo. */
const HEADS_UP_MS = 60_000;

/**
 * Aviso solo para el panel docente: indica el momento exacto (cierre del bloque)
 * en que toca lanzar la pregunta sorpresa sugerida por el cronograma.
 * Se oculta solo cuando se lanza una pregunta desde un minuto antes del cierre.
 */
export function PopAlert({
  snapshot,
  left,
  serverNow,
  onGo,
}: {
  snapshot: Snapshot;
  left: number;
  serverNow: () => number;
  onGo: () => void;
}) {
  const { agendaIndex, timer } = snapshot.state;
  const pop = AGENDA[agendaIndex]?.pop;
  const [dismissed, setDismissed] = useState<number | null>(null);
  const now = left <= 0;

  useEffect(() => {
    if (!pop || !now || dismissed === agendaIndex) return;
    const original = document.title;
    document.title = "🎯 ¡Pregunta sorpresa! · Control";
    return () => {
      document.title = original;
    };
  }, [pop, now, dismissed, agendaIndex]);

  if (!pop || timer.status === "idle" || dismissed === agendaIndex) return null;
  if (!now && (timer.status !== "running" || left > HEADS_UP_MS)) return null;

  const blockEnd = serverNow() + left;
  const launched = snapshot.staff!.popDetail.some((p) => new Date(p.sentAt).getTime() >= blockEnd - HEADS_UP_MS);
  if (launched) return null;

  const bank = POP_SECTIONS[pop];
  return (
    <div className={`pop-alert ${now ? "now" : "soon"}`} role="alert">
      <span className="pop-alert-icon" aria-hidden>🎯</span>
      <div className="grow">
        <strong>{now ? "¡Ahora! Lancen la pregunta sorpresa" : `En ${Math.ceil(left / 1000)} s toca la pregunta sorpresa`}</strong>
        <span>Banco «{bank}» · cierre de «{AGENDA[agendaIndex].title}»</span>
      </div>
      <button className={`btn sm ${now ? "danger" : ""}`} onClick={onGo}>Ir a lanzar</button>
      <button className="btn ghost sm" onClick={() => setDismissed(agendaIndex)} aria-label="Ocultar aviso">Ocultar</button>
    </div>
  );
}
