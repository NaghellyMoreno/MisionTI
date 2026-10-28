"use client";

import type { Snapshot } from "@/application/snapshot";
import { SEMAFORO_REWARD } from "@/domain/data/semaforo";
import type { Light } from "@/domain/types";
import { castLight } from "../actions";
import type { ActionApi } from "./TeamApp";

export const LIGHTS: { id: Light; name: string; meaning: string }[] = [
  { id: "verde", name: "Verde", meaning: "Mantener" },
  { id: "amarillo", name: "Amarillo", meaning: "Mantenimiento" },
  { id: "rojo", name: "Rojo", meaning: "Dar de baja" },
];

export function SemaforoTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const sc = snapshot.scenario;
  const mine = snapshot.team!.myLight;

  if (!sc) {
    return (
      <section className="stack">
        <span className="label coral">Juego Semáforo</span>
        <div className="empty">
          Cuando Camila abra una situación aparecerá aquí. Decidan en grupo: ¿mantener, mantenimiento o dar de baja?
        </div>
      </section>
    );
  }

  const revealed = sc.status === "revelado";
  const correct = revealed && mine === sc.answer;

  return (
    <section className="stack">
      <div className="row between">
        <span className="label coral">Situación {sc.id}</span>
        {sc.status === "votando" ? (
          <span className="chip amber live"><span className="dot" />Votando · {sc.voted}</span>
        ) : (
          <span className="chip">Revelada</span>
        )}
      </div>

      <div className="panel tick">
        <p className="scenario-text">{sc.text}</p>
      </div>

      <div className="lights" role="group" aria-label="Su decisión">
        {LIGHTS.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`light ${l.id}`}
            aria-pressed={mine === l.id}
            disabled={sc.status !== "votando" || action.pending}
            onClick={() => action.run(() => castLight(l.id))}
          >
            <span className="lamp" aria-hidden />
            {l.name}
            <span style={{ fontFamily: "var(--body)", fontWeight: 500, letterSpacing: 0, textTransform: "none", fontSize: 12, color: "var(--muted)" }}>
              {l.meaning}
            </span>
          </button>
        ))}
      </div>

      {sc.status === "votando" && (
        <p className="hint" style={{ margin: 0, textAlign: "center" }}>
          {mine ? "Voto registrado. Pueden cambiarlo hasta que se revele." : `Acertar suma ${SEMAFORO_REWARD} TC.`}
        </p>
      )}

      {revealed && (
        <div className={`panel ${correct ? "" : "alert"}`}>
          <strong className={correct ? "mint" : "coral"} style={{ fontFamily: "var(--display)", fontSize: 18 }}>
            {correct ? `¡Correcto! +${SEMAFORO_REWARD} TC` : mine ? "Esta vez no" : "No votaron"}
          </strong>
          <p style={{ margin: "6px 0 0" }}>
            Respuesta: <b style={{ textTransform: "capitalize" }}>{sc.answer}</b>. {sc.explanation}
          </p>
        </div>
      )}
    </section>
  );
}
