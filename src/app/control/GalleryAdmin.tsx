"use client";

import type { Snapshot } from "@/application/snapshot";
import { setGallery } from "../actions";
import type { ActionApi } from "./ControlApp";

export function GalleryAdmin({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const staff = snapshot.staff!;
  const status = snapshot.state.gallery.status;
  const results = snapshot.gallery.results;
  const max = Math.max(1, ...(results ?? []).map((r) => r.votes));

  return (
    <section className="stack">
      <div className="panel tick stack-sm">
        <div className="row between">
          <span className="label">Galería · {status}</span>
          <span className="mono muted">{staff.galleryVoters.length}/{staff.teams.length} grupos votaron</span>
        </div>
        <div className="vote-dots">
          {staff.teams.map((t) => (
            <span key={t.id} className={`vote-dot ${staff.galleryVoters.includes(t.id) ? "voted" : ""}`}>
              {t.label} {staff.galleryVoters.includes(t.id) ? "●" : "○"}
            </span>
          ))}
        </div>
        <div className="row wrap" style={{ gap: 8, marginTop: 6 }}>
          <button className="btn primary" disabled={status === "votando"} onClick={() => action.run(() => setGallery("votando"))}>Abrir votación</button>
          <button className="btn" disabled={status === "revelada"} onClick={() => action.run(() => setGallery("revelada"))}>Cerrar y revelar</button>
          <button className="btn ghost" disabled={status === "cerrada"} onClick={() => action.run(() => setGallery("cerrada"))}>Ocultar</button>
        </div>
      </div>

      {results && (
        <div className="panel bars">
          {results.map((r) => (
            <div key={r.teamId} className="bar">
              <span>G·{r.label}</span>
              <span className="track"><i style={{ width: `${(r.votes / max) * 100}%` }} /></span>
              <span style={{ textAlign: "right" }}>{r.votes}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
