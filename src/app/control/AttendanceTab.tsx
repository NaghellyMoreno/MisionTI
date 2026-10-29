"use client";

import type { Snapshot } from "@/application/snapshot";
import { CASES } from "@/domain/data/catalog";

/** Quién está conectado antes de empezar (y durante la clase). */
export function AttendanceTab({ snapshot }: { snapshot: Snapshot }) {
  const staff = snapshot.staff!;
  const online = snapshot.roster.filter((r) => r.online).length;
  const missing = snapshot.roster.filter((r) => !r.online);

  return (
    <section className="stack">
      <div className="board row between wrap">
        <div className="stack-sm" style={{ gap: 2 }}>
          <span className="label">Conectados ahora</span>
          <span className="coins" style={{ fontSize: 48 }}>
            {online}
            <span className="unit">de {snapshot.roster.length}</span>
          </span>
        </div>
        <p className="muted" style={{ margin: 0, maxWidth: "38ch", fontSize: 14 }}>
          Un estudiante aparece en verde si su celular dio señal en los últimos 45 segundos. Si alguien se cae, vuelve a verde solo al reconectar.
        </p>
      </div>

      {missing.length > 0 && (
        <div className="panel alert stack-sm">
          <span className="label coral">Faltan por conectarse ({missing.length})</span>
          <p style={{ margin: 0 }}>{missing.map((m) => m.name).join(" · ")}</p>
        </div>
      )}

      <div className="attendance">
        {staff.teams.map((t) => (
          <div key={t.id} className="panel att-team">
            <div className="row between">
              <span className="mono" style={{ fontSize: 20 }}>G·{t.label}</span>
              <span className="hint">{CASES.find((c) => c.id === t.caseId)?.name}</span>
            </div>
            {snapshot.roster
              .filter((r) => r.teamId === t.id)
              .map((r) => (
                <div key={r.id} className={`att-row ${r.online ? "on" : ""}`}>
                  <i aria-hidden />
                  <span>{r.name}</span>
                  <span className="hint">{r.online ? "conectado" : "sin señal"}</span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
