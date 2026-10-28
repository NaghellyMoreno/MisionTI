"use client";

import type { Snapshot } from "@/application/snapshot";
import { CRISIS_DECK } from "@/domain/crisis/deck";
import { dismissCrisis, triggerCrisis } from "../actions";
import type { ActionApi } from "./ControlApp";

export function CrisisTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const { activeCrisisId, appliedCrises } = snapshot.state;

  return (
    <section className="stack">
      <p className="muted" style={{ margin: 0 }}>
        Al lanzar una carta, su efecto se aplica automáticamente según lo que compró cada grupo y aparece en el proyector y en los celulares.
        Cada carta se juega una sola vez.
      </p>
      <div className="deck">
        {CRISIS_DECK.map((card) => {
          const active = activeCrisisId === card.id;
          const played = appliedCrises.includes(card.id);
          return (
            <article key={card.id} className={`panel card ${active ? "active" : played ? "played" : ""}`}>
              <div className="row between">
                <span className="label coral">{card.manual ? "Carta manual" : "Carta automática"}</span>
                {active ? <span className="chip coral live"><span className="dot" />En pantalla</span> : played && <span className="chip">Jugada</span>}
              </div>
              <h3>{card.title}</h3>
              <p className="muted">{card.flavor}</p>
              <p>{card.rule}</p>
              {active ? (
                <button className="btn block" onClick={() => action.run(() => dismissCrisis())}>Quitar de pantalla</button>
              ) : (
                <button className="btn danger block" disabled={played || action.pending} onClick={() => action.run(() => triggerCrisis(card.id))}>
                  {played ? "Ya se jugó" : "Lanzar carta"}
                </button>
              )}
              {card.manual && !played && <span className="hint">El bono se asigna después en Ajustes.</span>}
            </article>
          );
        })}
      </div>
    </section>
  );
}
