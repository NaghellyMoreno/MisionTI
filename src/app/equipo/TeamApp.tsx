"use client";

import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { currentAgenda, activeCrisis } from "@/application/snapshot";
import { CASES } from "@/domain/data/catalog";
import { Brand, Clock, Coins, Icon, Signal, useAction, useCountdown, useToasts } from "@/ui/parts";
import { useLive } from "@/ui/useLive";
import { logout } from "../actions";
import { MarketTab } from "./MarketTab";
import { AssetsTab } from "./AssetsTab";
import { SemaforoTab } from "./SemaforoTab";
import { GalleryTab } from "./GalleryTab";

type Tab = "mercado" | "activos" | "semaforo" | "galeria";

export function TeamApp({ initial }: { initial: Snapshot }) {
  const live = useLive(initial);
  const { snapshot } = live;
  const toasts = useToasts();
  const action = useAction(toasts.push, live.refresh);
  const [tab, setTab] = useState<Tab>("mercado");

  const me = snapshot.team!;
  const company = CASES.find((c) => c.id === me.team.caseId)!;
  const rank = snapshot.ranking.find((r) => r.teamId === me.team.id);
  const agenda = currentAgenda(snapshot.state);
  const countdown = useCountdown(snapshot.state, live.serverNow);
  const crisis = activeCrisis(snapshot.state);
  const myCrisisHit = crisis ? me.ledger.find((e) => e.kind === "crisis" && e.note.startsWith(crisis.title)) : null;

  const semaforoLive = snapshot.state.semaforo.status === "votando";
  const galleryLive = snapshot.state.gallery.status === "votando";

  // Cuando el equipo docente abre una votación, se lleva al grupo a esa pestaña una vez.
  const lastOpen = useRef({ semaforo: snapshot.state.semaforo.scenarioId, gallery: snapshot.state.gallery.status });
  useEffect(() => {
    const prev = lastOpen.current;
    if (semaforoLive && prev.semaforo !== snapshot.state.semaforo.scenarioId) setTab("semaforo");
    if (galleryLive && prev.gallery !== "votando") setTab("galeria");
    lastOpen.current = { semaforo: snapshot.state.semaforo.scenarioId, gallery: snapshot.state.gallery.status };
  }, [semaforoLive, galleryLive, snapshot.state.semaforo.scenarioId, snapshot.state.gallery.status]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: "mercado", label: "Mercado", icon: Icon.market, badge: snapshot.state.marketOpen && tab !== "mercado" },
    { id: "activos", label: "Activos", icon: Icon.assets },
    { id: "semaforo", label: "Semáforo", icon: Icon.light, badge: semaforoLive && tab !== "semaforo" },
    { id: "galeria", label: "Galería", icon: Icon.gallery, badge: galleryLive && tab !== "galeria" },
  ];

  return (
    <>
      <header className="topbar">
        <Brand href="/equipo" />
        <div className="row" style={{ gap: 10 }}>
          <Signal online={live.online} realtime={live.realtime} />
          <form action={logout}>
            <button className="btn ghost sm" type="submit">Salir</button>
          </form>
        </div>
      </header>

      <main className="team-app">
        <section className="board stack-sm" aria-label="Saldo del grupo">
          <div className="row between">
            <span className="label">Grupo {me.team.label} · {company.name}</span>
            {rank && <span className="chip mint mono">#{rank.position} de {snapshot.ranking.length}</span>}
          </div>
          <div className="hero-balance">
            <Coins value={me.balance} />
          </div>
          <div className="hero-meta muted" style={{ fontSize: 13 }}>
            <span>{me.team.members.join(" · ")}</span>
          </div>
        </section>

        <section className={`panel now-strip phase-${agenda.current.phase}`}>
          <div className="grow stack-sm" style={{ gap: 6 }}>
            <span className="chip phase-chip" style={{ justifySelf: "start" }}><span className="dot" />{agenda.current.phase}</span>
            <strong style={{ fontFamily: "var(--display)", fontWeight: 600, lineHeight: 1.25 }}>{agenda.current.title}</strong>
            <div className="progress"><i style={{ width: `${countdown.ratio * 100}%` }} /></div>
          </div>
          <Clock left={countdown.left} status={countdown.status} />
        </section>

        {company.express && (
          <details className="panel tick express">
            <summary>
              <span className="label">Su lienzo exprés</span>
              <span className="hint">Ver las 6 preguntas</span>
            </summary>
            <p className="muted" style={{ margin: "10px 0 8px" }}>{company.express.note}</p>
            <ol className="express-list">
              {company.express.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ol>
          </details>
        )}

        {crisis && (
          <section className="panel alert tick stack-sm" role="alert">
            <span className="label coral">Crisis activa</span>
            <h2 className="h-display" style={{ fontSize: 22 }}>{crisis.title}</h2>
            <p className="muted" style={{ margin: 0 }}>{crisis.flavor}</p>
            <p style={{ margin: 0 }}>{crisis.rule}</p>
            {myCrisisHit && (
              <p className="mono" style={{ margin: 0 }}>
                Efecto en su grupo: <b className={myCrisisHit.amount < 0 ? "delta-neg" : "delta-pos"}>{myCrisisHit.amount > 0 ? "+" : "−"}{Math.abs(myCrisisHit.amount)} TC</b>
              </p>
            )}
          </section>
        )}

        {tab === "mercado" && <MarketTab snapshot={snapshot} action={action} />}
        {tab === "activos" && <AssetsTab snapshot={snapshot} />}
        {tab === "semaforo" && <SemaforoTab snapshot={snapshot} action={action} />}
        {tab === "galeria" && <GalleryTab snapshot={snapshot} action={action} />}
      </main>

      <nav className="tabbar" aria-label="Secciones">
        {tabs.map((t) => (
          <button key={t.id} type="button" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
            {t.icon}
            {t.label}
            {t.badge && <span className="badge" aria-label="activo ahora" />}
          </button>
        ))}
      </nav>
      {toasts.view}
    </>
  );
}

export type ActionApi = ReturnType<typeof useAction>;
