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
import { VoteTab } from "./VoteTab";
import { ClassTab } from "./ClassTab";
import { GuestTab } from "./GuestTab";
import { CanvasTab } from "./CanvasTab";
import { CANVAS_FIELDS } from "@/domain/data/canvas";
import { PopOverlay } from "./PopOverlay";

type Tab = "clase" | "lienzo" | "mercado" | "invitado" | "votar" | "activos";

export function TeamApp({ initial }: { initial: Snapshot }) {
  const live = useLive(initial, { heartbeat: true });
  const { snapshot } = live;
  const toasts = useToasts();
  const action = useAction(toasts.push, live.refresh);
  const [tab, setTab] = useState<Tab>("clase");

  const me = snapshot.team!;
  const company = CASES.find((c) => c.id === me.team.caseId)!;
  const rank = snapshot.ranking.find((r) => r.teamId === me.team.id);
  const agenda = currentAgenda(snapshot.state);
  const countdown = useCountdown(snapshot.state, live.serverNow);
  const crisis = activeCrisis(snapshot.state);
  const myCrisisHit = crisis ? me.ledger.find((e) => e.kind === "crisis" && e.note.startsWith(crisis.title)) : null;

  const semaforoLive = snapshot.state.semaforo.status === "votando";
  const galleryLive = snapshot.state.gallery.status === "votando";

  const quizOpen = snapshot.state.quiz.status === "abierto";
  const guestLive = snapshot.state.agendaIndex >= 12 && snapshot.state.agendaIndex <= 13;

  // Cuando el equipo docente abre una votación o el quiz, se lleva a cada celular a esa pestaña una vez.
  const lastOpen = useRef({ semaforo: snapshot.state.semaforo.scenarioId, gallery: snapshot.state.gallery.status, quiz: snapshot.state.quiz.index });
  useEffect(() => {
    const prev = lastOpen.current;
    if (semaforoLive && prev.semaforo !== snapshot.state.semaforo.scenarioId) setTab("votar");
    if (galleryLive && prev.gallery !== "votando") setTab("votar");
    if (quizOpen && prev.quiz !== snapshot.state.quiz.index) setTab("clase");
    lastOpen.current = { semaforo: snapshot.state.semaforo.scenarioId, gallery: snapshot.state.gallery.status, quiz: snapshot.state.quiz.index };
  }, [semaforoLive, galleryLive, quizOpen, snapshot.state.semaforo.scenarioId, snapshot.state.gallery.status, snapshot.state.quiz.index]);

  const canvasNow = CANVAS_FIELDS.some((f) => f.agenda === snapshot.state.agendaIndex) && snapshot.state.gallery.status === "cerrada";
  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: boolean }[] = [
    { id: "clase", label: "Clase", icon: Icon.slides, badge: quizOpen && tab !== "clase" },
    { id: "lienzo", label: "Lienzo", icon: Icon.canvas, badge: canvasNow && tab !== "lienzo" },
    { id: "mercado", label: "Mercado", icon: Icon.market, badge: snapshot.state.marketOpen && tab !== "mercado" },
    { id: "invitado", label: "Invitado", icon: Icon.mic, badge: guestLive && !me.guestQuestion && tab !== "invitado" },
    { id: "votar", label: "Votar", icon: Icon.light, badge: (semaforoLive || galleryLive) && tab !== "votar" },
    { id: "activos", label: "Activos", icon: Icon.assets },
  ];

  return (
    <>
      <header className="topbar">
        <Brand href="/equipo" />
        <div className="row" style={{ gap: 10 }}>
          <Signal online={live.online} realtime={live.realtime} />
          <form action={logout}>
            <button className="btn ghost sm" type="submit" title="Para que otro integrante entre desde este celular">Cambiar</button>
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
            <span>Hola, <b style={{ color: "var(--board-text)" }}>{me.student.name}</b>{me.team.members.length > 1 ? ` · con ${me.team.members.filter((m) => m !== me.student.name).join(", ")}` : ""}</span>
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

        {tab === "clase" && <ClassTab snapshot={snapshot} action={action} serverNow={live.serverNow} />}
        {tab === "mercado" && <MarketTab snapshot={snapshot} action={action} />}
        {tab === "lienzo" && <CanvasTab snapshot={snapshot} refresh={live.refresh} />}
        {tab === "invitado" && <GuestTab snapshot={snapshot} action={action} />}
        {tab === "votar" && <VoteTab snapshot={snapshot} action={action} />}
        {tab === "activos" && <AssetsTab snapshot={snapshot} />}
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
      <PopOverlay pending={me.pendingPops} serverNow={live.serverNow} refresh={live.refresh} />
      {toasts.view}
    </>
  );
}

export type ActionApi = ReturnType<typeof useAction>;
