"use client";

import { useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { currentAgenda } from "@/application/snapshot";
import { AGENDA } from "@/domain/data/agenda";
import type { ProjectorScreen } from "@/domain/types";
import { Brand, Clock, Signal, useAction, useCountdown, useToasts } from "@/ui/parts";
import { useLive } from "@/ui/useLive";
import { controlAgenda, logout, setMarket, setScreen } from "../actions";
import { RequestsTab } from "./RequestsTab";
import { TeamsTab } from "./TeamsTab";
import { CrisisTab } from "./CrisisTab";
import { SemaforoAdmin } from "./SemaforoAdmin";
import { GalleryAdmin } from "./GalleryAdmin";
import { SettingsTab } from "./SettingsTab";

type Tab = "solicitudes" | "grupos" | "crisis" | "semaforo" | "galeria" | "ajustes";
export type ActionApi = ReturnType<typeof useAction>;

const SCREENS: { id: ProjectorScreen; label: string }[] = [
  { id: "ranking", label: "Ranking" },
  { id: "crisis", label: "Crisis" },
  { id: "semaforo", label: "Semáforo" },
  { id: "galeria", label: "Galería" },
  { id: "podio", label: "Podio" },
];

export function ControlApp({ initial, liveDatabase }: { initial: Snapshot; liveDatabase: boolean }) {
  const live = useLive(initial);
  const { snapshot } = live;
  const toasts = useToasts();
  const action = useAction(toasts.push, live.refresh);
  const [tab, setTab] = useState<Tab>("solicitudes");
  const staff = snapshot.staff!;
  const me = snapshot.viewer.role === "staff" ? snapshot.viewer.name : "";

  const pending = staff.purchases.filter((p) => p.status === "pendiente").length;
  const agenda = currentAgenda(snapshot.state);
  const countdown = useCountdown(snapshot.state, live.serverNow);
  const running = snapshot.state.timer.status === "running";

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "solicitudes", label: "Solicitudes", count: pending },
    { id: "grupos", label: "Grupos" },
    { id: "crisis", label: "Crisis" },
    { id: "semaforo", label: "Semáforo" },
    { id: "galeria", label: "Galería" },
    { id: "ajustes", label: "Ajustes" },
  ];

  return (
    <>
      <header className="topbar">
        <div className="row" style={{ gap: 14 }}>
          <Brand href="/control" />
          <span className="chip hide-sm">Control · {me}</span>
          {!liveDatabase && <span className="chip amber hide-sm" title="Sin Supabase: los datos se pierden al reiniciar el servidor">Modo local</span>}
        </div>
        <div className="row" style={{ gap: 10 }}>
          <Signal online={live.online} realtime={live.realtime} />
          <a className="btn sm" href="/proyector" target="_blank" rel="noreferrer">Proyector ↗</a>
          <form action={logout}><button className="btn ghost sm" type="submit">Salir</button></form>
        </div>
      </header>

      <div className="control">
        <aside className="control-side">
          <section className={`board stack-sm phase-${agenda.current.phase}`}>
            <div className="row between">
              <span className="label">Actividad {agenda.index + 1}/{agenda.total}</span>
              <span className="chip phase-chip"><span className="dot" />{agenda.current.phase}</span>
            </div>
            <strong style={{ fontFamily: "var(--display)", fontSize: 18, fontWeight: 600, lineHeight: 1.25 }}>{agenda.current.title}</strong>
            <span className="muted" style={{ fontSize: 13 }}>A cargo: {agenda.current.lead}</span>
            <Clock left={countdown.left} status={countdown.status} className="big-timer" />
            <div className="progress"><i style={{ width: `${countdown.ratio * 100}%` }} /></div>
            <div className="timer-controls">
              <button className="btn sm" onClick={() => action.run(() => controlAgenda("prev"))} aria-label="Actividad anterior">◀</button>
              <button className={`btn sm ${running ? "amber" : "primary"}`} onClick={() => action.run(() => controlAgenda(running ? "pause" : "start"))}>
                {running ? "Pausar" : snapshot.state.timer.status === "paused" ? "Reanudar" : "Iniciar"}
              </button>
              <button className="btn sm" onClick={() => action.run(() => controlAgenda("next"))} aria-label="Siguiente actividad">▶</button>
            </div>
            <div className="timer-tweaks">
              <button className="btn sm" onClick={() => action.run(() => controlAgenda("minus1"))}>−1 min</button>
              <button className="btn sm" onClick={() => action.run(() => controlAgenda("plus1"))}>+1 min</button>
              <button className="btn sm" onClick={() => action.run(() => controlAgenda("reset"))}>Reiniciar</button>
            </div>
          </section>

          <section className="panel stack-sm">
            <span className="label">Cronograma</span>
            <ol className="agenda-list">
              {AGENDA.map((a, i) => (
                <li key={i} className={`phase-${a.phase}`}>
                  <button aria-current={i === agenda.index ? "step" : undefined} onClick={() => action.run(() => controlAgenda({ goto: i }))}>
                    <span className="n">{String(i + 1).padStart(2, "0")}</span>
                    <span className={i < agenda.index ? "done" : ""}>{a.title}</span>
                    <span className="m">{a.minutes}′</span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel stack-sm">
            <div className="row between">
              <span className="label">Mercado</span>
              <button
                className={`btn sm ${snapshot.state.marketOpen ? "danger" : "primary"}`}
                onClick={() => action.run(() => setMarket(!snapshot.state.marketOpen))}
              >
                {snapshot.state.marketOpen ? "Cerrar mercado" : "Abrir mercado"}
              </button>
            </div>
            <span className="label" style={{ marginTop: 8 }}>En el proyector</span>
            <div className="screens">
              {SCREENS.map((s) => (
                <button key={s.id} className={`btn sm ${snapshot.state.screen === s.id ? "on" : ""}`} onClick={() => action.run(() => setScreen(s.id))}>
                  {s.label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main className="control-main">
          <nav className="tabs" role="tablist">
            {tabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
                {!!t.count && <span className="count">{t.count}</span>}
              </button>
            ))}
          </nav>
          {tab === "solicitudes" && <RequestsTab snapshot={snapshot} action={action} />}
          {tab === "grupos" && <TeamsTab snapshot={snapshot} />}
          {tab === "crisis" && <CrisisTab snapshot={snapshot} action={action} />}
          {tab === "semaforo" && <SemaforoAdmin snapshot={snapshot} action={action} />}
          {tab === "galeria" && <GalleryAdmin snapshot={snapshot} action={action} />}
          {tab === "ajustes" && <SettingsTab snapshot={snapshot} action={action} />}
        </main>
      </div>
      {toasts.view}
    </>
  );
}
