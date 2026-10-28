"use client";

import type { Snapshot } from "@/application/snapshot";
import { SCENARIOS } from "@/domain/data/semaforo";
import { closeScenario, openScenario, revealScenario } from "../actions";
import type { ActionApi } from "./ControlApp";

export function SemaforoAdmin({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const staff = snapshot.staff!;
  const { semaforo, awardedScenarios } = snapshot.state;
  const current = SCENARIOS.find((s) => s.id === semaforo.scenarioId);
  const voteOf = (teamId: string) => staff.scenarioVotes.find((v) => v.teamId === teamId)?.choice;

  return (
    <section className="stack">
      {current && (
        <div className="panel tick stack-sm">
          <div className="row between">
            <span className="label coral">Situación {current.id} · {semaforo.status}</span>
            <span className="mono muted">{staff.scenarioVotes.length}/{staff.teams.length} votos</span>
          </div>
          <p className="scenario-text" style={{ fontSize: 18 }}>{current.text}</p>
          <p className="muted" style={{ margin: 0 }}>
            Respuesta: <b style={{ textTransform: "capitalize" }}>{current.answer}</b> · {current.explanation}
          </p>
          <div className="vote-dots">
            {staff.teams.map((t) => {
              const v = voteOf(t.id);
              return (
                <span key={t.id} className={`vote-dot ${v ?? ""}`} title={v ?? "sin voto"}>
                  {t.label} {v ? "●" : "○"}
                </span>
              );
            })}
          </div>
          <div className="row" style={{ gap: 8, marginTop: 6 }}>
            {semaforo.status === "votando" && (
              <button className="btn primary" disabled={action.pending} onClick={() => action.run(() => revealScenario())}>
                Revelar y pagar aciertos
              </button>
            )}
            <button className="btn" onClick={() => action.run(() => closeScenario())}>Cerrar situación</button>
          </div>
        </div>
      )}

      <span className="label">Situaciones</span>
      <div className="stack-sm">
        {SCENARIOS.map((s) => {
          const done = awardedScenarios.includes(s.id);
          const isCurrent = current?.id === s.id;
          return (
            <div key={s.id} className="panel row" style={{ padding: 14, opacity: done && !isCurrent ? 0.6 : 1 }}>
              <span className="mono dim">{s.id}</span>
              <span className="grow">{s.text}</span>
              <span className={`chip ${s.answer === "verde" ? "mint" : s.answer === "amarillo" ? "amber" : "coral"}`}>{s.answer}</span>
              <button className="btn sm" disabled={isCurrent || action.pending} onClick={() => action.run(() => openScenario(s.id))}>
                {done ? "Repetir" : "Abrir"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
