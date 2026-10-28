"use client";

import type { Snapshot } from "@/application/snapshot";
import { LEGAL_ROUTES } from "@/domain/data/catalog";
import { findItem } from "@/domain/rules";
import { signed } from "@/ui/parts";

const time = (iso: string) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

export function AssetsTab({ snapshot }: { snapshot: Snapshot }) {
  const me = snapshot.team!;
  const owned = me.purchases.filter((p) => p.status === "aprobada");
  const pending = me.purchases.filter((p) => p.status === "pendiente");

  return (
    <section className="stack">
      <span className="label">Inventario tecnológico</span>
      {owned.length === 0 && pending.length === 0 ? (
        <div className="empty">Aún no han adquirido recursos.</div>
      ) : (
        <div className="stack-sm">
          {[...owned, ...pending].map((p) => {
            const item = findItem(p.itemId);
            return (
              <div key={p.id} className="panel" style={{ padding: 14 }}>
                <div className="row between">
                  <strong>{item.name}</strong>
                  <span className={`chip ${p.status === "aprobada" ? "mint" : "amber"}`}>
                    {p.status === "aprobada" ? "Adquirido" : "En revisión"}
                  </span>
                </div>
                <div className="item-sub">
                  {item.method} · {LEGAL_ROUTES.find((r) => r.id === p.legalRoute)?.name} · {item.price} TC
                </div>
                <p className="quote">{p.justification}</p>
              </div>
            );
          })}
        </div>
      )}

      <span className="label mint" style={{ marginTop: 8 }}>Bitácora de TecnoCoins</span>
      <div className="panel" style={{ paddingBlock: 6 }}>
        {me.ledger.map((e) => (
          <div key={e.id} className="ledger-row">
            <div>
              <div>{e.note}</div>
              <div className="when">{time(e.createdAt)} · {e.kind}</div>
            </div>
            <span className={`mono ${e.amount < 0 ? "delta-neg" : "delta-pos"}`}>{signed(e.amount)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
