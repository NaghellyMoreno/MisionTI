"use client";

import { useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { CANVAS_FIELDS, RUBRIC, RUBRIC_LEVELS } from "@/domain/data/canvas";
import { rubricScore } from "@/domain/grading";
import { CanvasBoard } from "@/ui/CanvasBoard";
import { focusGallery, setRubricScore } from "../actions";
import type { ActionApi } from "./ControlApp";

const fmt = (n: number | undefined) => (n === undefined ? "—" : n.toFixed(1).replace(".", ","));

/** Lienzos de todos los grupos: avance en vivo, rúbrica de José y qué se proyecta en la Galería. */
export function CanvasAdmin({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const canvases = snapshot.canvases ?? [];
  const [selected, setSelected] = useState(canvases[0]?.teamId ?? "");
  const canvas = canvases.find((c) => c.teamId === selected) ?? canvases[0];
  const rubric = snapshot.state.rubric?.[canvas?.teamId ?? ""] ?? {};
  const galleryOpen = snapshot.state.gallery.status !== "cerrada";
  const focus = snapshot.state.galleryFocus;

  if (!canvas) return <div className="empty">Aún no hay grupos.</div>;

  return (
    <section className="canvas-admin">
      <nav className="canvas-list" aria-label="Grupos">
        {canvases.map((c) => {
          const score = rubricScore(snapshot.state.rubric?.[c.teamId]);
          return (
            <button key={c.teamId} className="canvas-pick" aria-current={c.teamId === canvas.teamId ? "true" : undefined} onClick={() => setSelected(c.teamId)}>
              <span className="mono">G·{c.label}</span>
              <span className="canvas-progress" aria-label={`${c.filled} de ${CANVAS_FIELDS.length} casillas`}>
                {CANVAS_FIELDS.map((f) => (
                  <i key={f.id} className={c.fields[f.id]?.text.trim() ? "on" : ""} />
                ))}
              </span>
              <span className="mono dim">{fmt(score)}</span>
            </button>
          );
        })}
      </nav>

      <div className="stack">
        <div className="panel">
          <CanvasBoard canvas={canvas} size="md" />
        </div>
        <div className="row wrap" style={{ gap: 8 }}>
          <button
            className={`btn sm ${focus === canvas.teamId ? "on" : "primary"}`}
            disabled={!galleryOpen || action.pending}
            title={galleryOpen ? "" : "Disponible cuando abran la Galería"}
            onClick={() => action.run(() => focusGallery(canvas.teamId))}
          >
            {focus === canvas.teamId ? "En el proyector" : "Proyectar este lienzo"}
          </button>
          <button className="btn sm ghost" disabled={!galleryOpen || focus === null || action.pending} onClick={() => action.run(() => focusGallery(null))}>
            Rotación automática
          </button>
          {!galleryOpen && <span className="hint">Los lienzos se proyectan cuando abran la Galería.</span>}
        </div>
      </div>

      <div className="panel tick stack-sm rubric">
        <div className="row between">
          <span className="label">Rúbrica · G·{canvas.label}</span>
          <span className="coins" style={{ fontSize: 28 }}>{fmt(rubricScore(rubric))}<span className="unit">/ 5</span></span>
        </div>
        <span className="hint">La nota del lienzo es el promedio de los criterios calificados.</span>
        {RUBRIC.map((c) => (
          <div key={c.id} className="rubric-row">
            <div>
              <strong>{c.name}</strong>
              <div className="hint">5: {c.excellent} · 1: {c.poor}</div>
            </div>
            <div className="rubric-scale" role="group" aria-label={c.name}>
              {RUBRIC_LEVELS.map((n) => (
                <button
                  key={n}
                  className="rubric-dot mono"
                  aria-pressed={rubric[c.id] === n}
                  disabled={action.pending}
                  onClick={() => action.run(() => setRubricScore(canvas.teamId, c.id, rubric[c.id] === n ? null : n))}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
