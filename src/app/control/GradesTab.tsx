"use client";

import { useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { COMPONENT_LABELS } from "@/domain/grading";
import type { GradeWeights } from "@/domain/types";
import { setCanvasScore, setWeights } from "../actions";
import type { ActionApi } from "./ControlApp";

const KEYS: (keyof GradeWeights)[] = ["sorpresa", "quiz", "lienzo", "juego"];
const fmt = (n: number | null | undefined) => (n === null || n === undefined ? "—" : n.toFixed(1).replace(".", ","));

export function GradesTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const staff = snapshot.staff!;
  const [weights, setW] = useState<GradeWeights>(snapshot.state.weights);
  const sum = KEYS.reduce((s, k) => s + (weights[k] || 0), 0);
  const canvas = snapshot.state.canvasScores;

  return (
    <section className="stack">
      <div className="panel tick stack-sm">
        <div className="row between wrap">
          <span className="label">Nota del lienzo por grupo (rúbrica, 0 a 5)</span>
          <span className="hint">La pone José; vacía = aún sin calificar</span>
        </div>
        <div className="canvas-grid">
          {staff.teams.map((t) => (
            <label key={t.id} className="canvas-cell">
              <span className="mono">G·{t.label}</span>
              <input
                className="input mono"
                type="number"
                min={0}
                max={5}
                step={0.1}
                defaultValue={canvas[t.id] ?? ""}
                placeholder="—"
                onBlur={(e) => {
                  const raw = e.target.value.replace(",", ".").trim();
                  const value = raw === "" ? null : Number(raw);
                  if (value === (canvas[t.id] ?? null)) return;
                  action.run(() => setCanvasScore(t.id, value));
                }}
              />
            </label>
          ))}
        </div>
      </div>

      <form
        className="panel stack-sm"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(() => setWeights(weights));
        }}
      >
        <span className="label">Pesos de la nota final</span>
        <div className="weights">
          {KEYS.map((k) => (
            <label key={k} className="field">
              <span className="hint">{COMPONENT_LABELS[k]}</span>
              <input className="input mono" type="number" min={0} max={100} value={weights[k]} onChange={(e) => setW({ ...weights, [k]: Number(e.target.value) })} />
            </label>
          ))}
        </div>
        <div className="row between">
          <span className={`mono ${sum === 100 ? "mint" : "coral"}`}>Suma: {sum} %</span>
          <button className="btn sm" disabled={sum !== 100 || action.pending}>Guardar pesos</button>
        </div>
      </form>

      <div className="row between wrap">
        <span className="label">Notas por estudiante</span>
        <a className="btn primary sm" href="/api/notas" download>⬇ Descargar para Excel</a>
      </div>
      <div className="panel table-wrap" style={{ padding: 6 }}>
        <table className="table">
          <thead>
            <tr>
              <th>Grupo</th>
              <th>Estudiante</th>
              <th title={COMPONENT_LABELS.sorpresa}>Sorpresa</th>
              <th title={COMPONENT_LABELS.quiz}>Quiz</th>
              <th title={COMPONENT_LABELS.lienzo}>Lienzo</th>
              <th title={COMPONENT_LABELS.juego}>Juego</th>
              <th style={{ textAlign: "right" }}>Nota</th>
            </tr>
          </thead>
          <tbody>
            {staff.grades.map((g) => (
              <tr key={g.studentId}>
                <td className="mono">{g.teamLabel}</td>
                <td>
                  {g.name}
                  {!g.attended && <span className="chip coral" style={{ marginLeft: 6 }}>no se conectó</span>}
                </td>
                <td className="mono">{fmt(g.components.sorpresa)} <span className="dim">({g.sorpresa.correct}/{g.sorpresa.asked})</span></td>
                <td className="mono">{fmt(g.components.quiz)} <span className="dim">({g.quiz.correct})</span></td>
                <td className="mono">{fmt(g.components.lienzo)}</td>
                <td className="mono">{fmt(g.components.juego)}</td>
                <td className="mono" style={{ textAlign: "right", fontSize: 18 }}>
                  <b className={g.final !== null && g.final < 3 ? "coral" : ""}>{fmt(g.final)}</b>
                  {g.partial && <span className="dim" title="Calculada con los componentes disponibles">*</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="hint" style={{ margin: 0 }}>
        * Nota parcial: si a alguien no le tocó pregunta sorpresa o el lienzo aún no tiene nota, ese componente se excluye y su peso se reparte entre los demás.
      </p>
    </section>
  );
}
