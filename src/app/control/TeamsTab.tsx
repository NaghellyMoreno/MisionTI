"use client";

import type { Snapshot } from "@/application/snapshot";
import { CASES } from "@/domain/data/catalog";
import { findItem } from "@/domain/rules";
import { Coins, signed } from "@/ui/parts";

const time = (iso: string) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

export function TeamsTab({ snapshot }: { snapshot: Snapshot }) {
  const staff = snapshot.staff!;
  const label = (id: string) => staff.teams.find((t) => t.id === id)?.label ?? id;

  return (
    <section className="stack">
      <div className="panel table-wrap" style={{ padding: 6 }}>
        <table className="table">
          <thead>
            <tr><th>#</th><th>Grupo</th><th>Empresa</th><th>Integrantes</th><th>Activos</th><th style={{ textAlign: "right" }}>Saldo</th></tr>
          </thead>
          <tbody>
            {snapshot.ranking.map((r) => {
              const team = staff.teams.find((t) => t.id === r.teamId)!;
              const owned = staff.purchases.filter((p) => p.teamId === r.teamId && p.status === "aprobada");
              return (
                <tr key={r.teamId}>
                  <td className="mono dim">{r.position}</td>
                  <td className="mono" style={{ fontSize: 18 }}>{r.label}</td>
                  <td>
                    {CASES.find((c) => c.id === r.caseId)?.name}
                    {CASES.find((c) => c.id === r.caseId)?.express && <span className="chip mint" style={{ marginLeft: 6 }}>Exprés</span>}
                  </td>
                  <td className="muted" style={{ fontSize: 13 }}>{team.members.join(", ")}</td>
                  <td>
                    <div className="row wrap" style={{ gap: 4 }}>
                      {owned.length ? owned.map((p) => <span key={p.id} className="chip">{findItem(p.itemId).name}</span>) : <span className="dim">—</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: "right", fontSize: 20 }}><Coins value={r.balance} unit={false} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <span className="label mint">Bitácora general</span>
      <div className="panel" style={{ paddingBlock: 6, maxHeight: 420, overflowY: "auto" }}>
        {staff.ledger.map((e) => (
          <div key={e.id} className="ledger-row">
            <div>
              <div><span className="mono">G·{label(e.teamId)}</span> · {e.note}</div>
              <div className="when">{time(e.createdAt)} · {e.kind}</div>
            </div>
            <span className={`mono ${e.amount < 0 ? "delta-neg" : "delta-pos"}`}>{signed(e.amount)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
