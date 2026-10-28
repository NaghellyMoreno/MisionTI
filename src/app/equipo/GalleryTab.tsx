"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { CASES } from "@/domain/data/catalog";
import { GALLERY_VOTES } from "@/domain/rules";
import { castGalleryVote } from "../actions";
import type { ActionApi } from "./TeamApp";

export function GalleryTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const me = snapshot.team!;
  const status = snapshot.gallery.status;
  const [picks, setPicks] = useState<string[]>(me.myGallery);
  useEffect(() => setPicks(me.myGallery), [me.myGallery.join(",")]);

  const toggle = (id: string) =>
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < GALLERY_VOTES ? [...p, id] : [p[1], id]));

  if (status === "revelada" && snapshot.gallery.results) {
    const max = Math.max(1, ...snapshot.gallery.results.map((r) => r.votes));
    return (
      <section className="stack">
        <span className="label">Resultados de la Galería</span>
        <div className="panel bars">
          {snapshot.gallery.results.map((r) => (
            <div key={r.teamId} className="bar">
              <span className={r.teamId === me.team.id ? "accent" : ""}>G·{r.label}</span>
              <span className="track"><i style={{ width: `${(r.votes / max) * 100}%` }} /></span>
              <span style={{ textAlign: "right" }}>{r.votes}</span>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const others = snapshot.ranking.filter((r) => r.teamId !== me.team.id).sort((a, b) => a.teamId.localeCompare(b.teamId));
  const saved = me.myGallery.length === GALLERY_VOTES && me.myGallery.every((id) => picks.includes(id));

  return (
    <section className="stack">
      <div className="row between">
        <span className="label">Galería de lienzos</span>
        {status === "votando" ? <span className="chip amber live"><span className="dot" />Votando</span> : <span className="chip">Cerrada</span>}
      </div>

      {status !== "votando" ? (
        <div className="empty">Cuando los lienzos estén en la pared, José abrirá la votación. Cada grupo elige los {GALLERY_VOTES} mejores (no el propio).</div>
      ) : (
        <>
          <p className="muted" style={{ margin: 0 }}>
            Recorran la galería y elijan las {GALLERY_VOTES} mejores hojas de ruta. Pueden cambiar su voto hasta el cierre.
          </p>
          <div className="pick-grid">
            {others.map((r) => (
              <button key={r.teamId} type="button" className="pick" aria-pressed={picks.includes(r.teamId)} onClick={() => toggle(r.teamId)}>
                <span className="num">{r.label}</span>
                <span className="case">{CASES.find((c) => c.id === r.caseId)?.name}</span>
              </button>
            ))}
          </div>
          <button
            className="btn primary block"
            disabled={picks.length !== GALLERY_VOTES || saved || action.pending}
            onClick={() => action.run(() => castGalleryVote(picks))}
          >
            {saved ? "Voto registrado ✓" : `Votar (${picks.length}/${GALLERY_VOTES})`}
          </button>
        </>
      )}
    </section>
  );
}
