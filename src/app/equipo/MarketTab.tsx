"use client";

import { useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { CASES, CATALOG, LEGAL_ROUTES } from "@/domain/data/catalog";
import { PurchasePolicy, findItem } from "@/domain/rules";
import { Coins } from "@/ui/parts";
import { requestPurchase } from "../actions";
import type { ActionApi } from "./TeamApp";

const STATUS_CHIP = {
  pendiente: { cls: "amber", text: "En revisión" },
  aprobada: { cls: "mint", text: "Adquirido" },
  rechazada: { cls: "coral", text: "Rechazada" },
} as const;

export function MarketTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const me = snapshot.team!;
  const company = CASES.find((c) => c.id === me.team.caseId)!;
  const [open, setOpen] = useState<string | null>(null);
  const [route, setRoute] = useState("");
  const [why, setWhy] = useState("");

  const reserved = me.purchases.filter((p) => p.status === "pendiente").reduce((s, p) => s + findItem(p.itemId).price, 0);
  const available = me.balance - reserved;
  const latest = (itemId: string) => me.purchases.find((p) => p.itemId === itemId);

  const toggle = (id: string) => {
    setOpen((cur) => (cur === id ? null : id));
    setRoute("");
    setWhy("");
  };

  return (
    <section className="stack">
      <div className="row between wrap">
        <span className="label">Mercado tecnológico</span>
        {snapshot.state.marketOpen ? (
          <span className="chip mint live"><span className="dot" />Abierto</span>
        ) : (
          <span className="chip"><span className="dot" />Cerrado</span>
        )}
      </div>

      <div className="panel raised row between" style={{ padding: 14 }}>
        <div className="stack-sm" style={{ gap: 2 }}>
          <span className="hint">Disponible para comprar</span>
          <Coins value={available} className="" />
        </div>
        {reserved > 0 && <span className="chip amber mono">{reserved} TC en revisión</span>}
      </div>

      {company.isPublic && (
        <p className="hint" style={{ margin: 0 }}>
          Son una entidad pública: sus compras deben seguir una ruta de contratación estatal.
        </p>
      )}

      {!snapshot.state.marketOpen && (
        <div className="empty">El mercado abre durante el Nivel 2. Mientras tanto, revisen el catálogo y planeen.</div>
      )}

      <div className="stack-sm">
        {CATALOG.map((item) => {
          const last = latest(item.id);
          const taken = last && last.status !== "rechazada";
          const affordable = available >= item.price;
          const isOpen = open === item.id;
          const canAsk = snapshot.state.marketOpen && !taken && affordable;
          const valid = route && why.trim().length >= PurchasePolicy.MIN_JUSTIFICATION;
          return (
            <article key={item.id} className={`item ${!affordable && !taken ? "unaffordable" : ""}`} data-open={isOpen}>
              <button type="button" className="item-head" onClick={() => toggle(item.id)} aria-expanded={isOpen}>
                <span className="stack-sm" style={{ gap: 2 }}>
                  <span className="item-name">{item.name}</span>
                  <span className="item-sub">
                    {item.method}
                    {item.note ? ` · ${item.note}` : ""}
                  </span>
                  {last && (
                    <span className={`chip ${STATUS_CHIP[last.status].cls}`} style={{ justifySelf: "start", marginTop: 6 }}>
                      {STATUS_CHIP[last.status].text}
                    </span>
                  )}
                </span>
                <span className="item-price">{item.price}<span className="dim" style={{ fontSize: 12 }}> TC</span></span>
              </button>

              {isOpen && (
                <div className="item-body">
                  {last?.status === "rechazada" && last.staffNote && <p className="quote coral">{last.staffNote}</p>}
                  {taken ? (
                    <p className="hint" style={{ margin: 0 }}>Este recurso ya está en su inventario o en revisión.</p>
                  ) : !snapshot.state.marketOpen ? (
                    <p className="hint" style={{ margin: 0 }}>El mercado está cerrado.</p>
                  ) : !affordable ? (
                    <p className="hint coral" style={{ margin: 0 }}>Les faltan {item.price - available} TC para este recurso.</p>
                  ) : (
                    <form
                      className="stack-sm"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!valid) return;
                        action.run(() => requestPurchase(item.id, route, why), () => setOpen(null));
                      }}
                    >
                      <label className="field">
                        <span className="label plain">Ruta de adquisición</span>
                        <select className="select" value={route} onChange={(e) => setRoute(e.target.value)} required>
                          <option value="" disabled>Elijan la ruta legal…</option>
                          {LEGAL_ROUTES.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </label>
                      <label className="field">
                        <span className="label plain">¿Por qué lo necesita {company.name}?</span>
                        <textarea
                          className="textarea"
                          value={why}
                          onChange={(e) => setWhy(e.target.value)}
                          placeholder="Conecten la compra con su diagnóstico…"
                          maxLength={400}
                        />
                        <span className="hint">{why.trim().length}/{PurchasePolicy.MIN_JUSTIFICATION} caracteres mínimos</span>
                      </label>
                      <button className="btn primary block" type="submit" disabled={!canAsk || !valid || action.pending}>
                        Solicitar por {item.price} TC
                      </button>
                    </form>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
