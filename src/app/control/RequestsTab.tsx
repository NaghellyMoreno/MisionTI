"use client";

import { useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { CASES, LEGAL_ROUTES } from "@/domain/data/catalog";
import { findItem } from "@/domain/rules";
import type { Purchase } from "@/domain/types";
import { resolvePurchase } from "../actions";
import type { ActionApi } from "./ControlApp";

const time = (iso: string) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

export function RequestsTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const staff = snapshot.staff!;
  const pending = staff.purchases.filter((p) => p.status === "pendiente").reverse(); // la más antigua primero
  const resolved = staff.purchases.filter((p) => p.status !== "pendiente");

  return (
    <section className="stack">
      {!snapshot.state.marketOpen && pending.length === 0 && (
        <div className="empty">El mercado está cerrado. Ábranlo desde el panel lateral para recibir solicitudes.</div>
      )}
      {snapshot.state.marketOpen && pending.length === 0 && <div className="empty">Sin solicitudes pendientes.</div>}

      <div className="queue">
        {pending.map((p) => (
          <Request key={p.id} purchase={p} snapshot={snapshot} action={action} />
        ))}
      </div>

      {resolved.length > 0 && (
        <>
          <span className="label" style={{ marginTop: 8 }}>Resueltas</span>
          <div className="panel table-wrap" style={{ padding: 6 }}>
            <table className="table">
              <thead>
                <tr><th>Hora</th><th>Grupo</th><th>Recurso</th><th>Ruta</th><th>Estado</th><th>Por</th></tr>
              </thead>
              <tbody>
                {resolved.map((p) => {
                  const item = findItem(p.itemId);
                  const team = staff.teams.find((t) => t.id === p.teamId);
                  return (
                    <tr key={p.id}>
                      <td className="mono dim">{time(p.resolvedAt ?? p.createdAt)}</td>
                      <td className="mono">{team?.label}</td>
                      <td>{item.name} <span className="dim">· {item.price} TC</span></td>
                      <td className="muted">{LEGAL_ROUTES.find((r) => r.id === p.legalRoute)?.name}</td>
                      <td><span className={`chip ${p.status === "aprobada" ? "mint" : "coral"}`}>{p.status}</span></td>
                      <td className="muted">{p.resolvedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

function Request({ purchase, snapshot, action }: { purchase: Purchase; snapshot: Snapshot; action: ActionApi }) {
  const [note, setNote] = useState("");
  const staff = snapshot.staff!;
  const item = findItem(purchase.itemId);
  const team = staff.teams.find((t) => t.id === purchase.teamId)!;
  const company = CASES.find((c) => c.id === team.caseId)!;
  const route = LEGAL_ROUTES.find((r) => r.id === purchase.legalRoute)!;
  const balance = snapshot.ranking.find((r) => r.teamId === team.id)?.balance ?? 0;
  const after = balance - item.price;
  const routeWarning = company.isPublic && !route.public;

  return (
    <article className="panel tick req">
      <div className="req-team">
        {team.label}
        <small>{time(purchase.createdAt)}</small>
      </div>
      <div className="stack-sm" style={{ gap: 4 }}>
        <div className="row wrap" style={{ gap: 8 }}>
          <strong style={{ fontSize: 17 }}>{item.name}</strong>
          <span className="chip">{item.method}</span>
          <span className={`chip ${routeWarning ? "coral" : ""}`}>{route.name}</span>
          {company.express && <span className="chip mint">Caso exprés · juega sola</span>}
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          {company.name} · saldo <span className="mono">{balance}</span> → <span className={`mono ${after < 0 ? "coral" : ""}`}>{after}</span> TC
        </span>
        {routeWarning && <span className="coral" style={{ fontSize: 13 }}>Entidad pública con ruta privada: la auditoría la castigaría.</span>}
        <p className="quote">{purchase.justification}</p>
        <input className="input" placeholder="Comentario para el grupo (opcional)" value={note} onChange={(e) => setNote(e.target.value)} style={{ marginTop: 6 }} />
      </div>
      <div className="req-actions">
        <span className="mono" style={{ fontSize: 26, textAlign: "right" }}>−{item.price}<span className="dim" style={{ fontSize: 12 }}> TC</span></span>
        <button className="btn primary" disabled={action.pending || after < 0} onClick={() => action.run(() => resolvePurchase(purchase.id, true, note))}>
          Aprobar
        </button>
        <button className="btn danger" disabled={action.pending} onClick={() => action.run(() => resolvePurchase(purchase.id, false, note))}>
          Rechazar
        </button>
      </div>
    </article>
  );
}
