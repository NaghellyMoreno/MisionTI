"use client";

import type { Snapshot } from "@/application/snapshot";
import { activeCrisis, currentAgenda } from "@/application/snapshot";
import { CASES } from "@/domain/data/catalog";
import { Brand, Clock, Coins, useCountdown } from "@/ui/parts";
import { useLive } from "@/ui/useLive";
import { GuestScreen, LobbyScreen, PopScreen, QuizScreen, TheoryScreen } from "./ClassScreens";
import { useSoundCues } from "./useSoundCues";

const caseName = (id: string) => CASES.find((c) => c.id === id)?.name ?? "";

export function Projector({ initial }: { initial: Snapshot }) {
  const live = useLive(initial);
  const { snapshot } = live;
  const agenda = currentAgenda(snapshot.state);
  const countdown = useCountdown(snapshot.state, live.serverNow);
  const sound = useSoundCues(snapshot);

  return (
    <div className="projector">
      <header className={`proj-top phase-${agenda.current.phase}`}>
        <Brand href="/proyector" />
        <div className="proj-now">
          <div className="row" style={{ gap: 12 }}>
            <span className="chip phase-chip"><span className="dot" />{agenda.current.phase}</span>
            {snapshot.state.marketOpen && <span className="chip mint live"><span className="dot" />Mercado abierto</span>}
            <span className="mono dim" style={{ fontSize: 13 }}>{agenda.index + 1}/{agenda.total}</span>
          </div>
          <span className="title">{agenda.current.title}</span>
          <div className="progress"><i style={{ width: `${countdown.ratio * 100}%` }} /></div>
        </div>
        <div className="board" style={{ padding: "14px 22px" }}>
          <Clock left={countdown.left} status={countdown.status} className="proj-timer" />
        </div>
      </header>
      <main className="proj-body">
        <Screen snapshot={snapshot} serverNow={live.serverNow} />
      </main>
      <button className="sound-toggle" onClick={sound.enabled ? sound.disable : sound.enable} title="Sonidos del proyector">
        {sound.enabled ? "🔊" : "🔇 Activar sonido"}
      </button>
    </div>
  );
}

function Screen({ snapshot, serverNow }: { snapshot: Snapshot; serverNow: () => number }) {
  const crisis = activeCrisis(snapshot.state);
  switch (snapshot.state.screen) {
    case "sala":
      return <LobbyScreen snapshot={snapshot} />;
    case "teoria":
      return <TheoryScreen snapshot={snapshot} />;
    case "sorpresa":
      return snapshot.pop ? <PopScreen snapshot={snapshot} serverNow={serverNow} /> : <TheoryScreen snapshot={snapshot} />;
    case "invitado":
      return <GuestScreen snapshot={snapshot} />;
    case "quiz":
      return <QuizScreen snapshot={snapshot} serverNow={serverNow} />;
    case "crisis":
      return crisis ? <CrisisScreen card={crisis} /> : <Ranking snapshot={snapshot} />;
    case "semaforo":
      return snapshot.scenario ? <SemaforoScreen snapshot={snapshot} /> : <Ranking snapshot={snapshot} />;
    case "galeria":
      return <GalleryScreen snapshot={snapshot} />;
    case "podio":
      return <Podium snapshot={snapshot} />;
    default:
      return <Ranking snapshot={snapshot} />;
  }
}

function Ranking({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="proj-rank" aria-label="Ranking de TecnoCoins">
      <div className="row between" style={{ padding: "0 18px 10px" }}>
        <span className="label">Ranking de TecnoCoins</span>
        <span className="label plain">Activos</span>
      </div>
      {snapshot.ranking.map((r, i) => (
        <div key={r.teamId} className={`proj-row ${r.position === 1 ? "lead" : ""}`} style={{ animationDelay: `${i * 40}ms` }}>
          <span className="pos">#{r.position}</span>
          <span className="team">G·{r.label}</span>
          <span className="case">
            {caseName(r.caseId)}
            <span className="leader" />
            <span className="mono dim" style={{ fontSize: 16 }}>{r.assets} act.</span>
          </span>
          <Coins value={r.balance} />
        </div>
      ))}
    </section>
  );
}

function CrisisScreen({ card }: { card: NonNullable<ReturnType<typeof activeCrisis>> }) {
  return (
    <section className="takeover" key={card.id}>
      <span className="chip coral live" style={{ fontSize: 14, padding: "6px 14px" }}><span className="dot" />Alerta de crisis</span>
      <article className="crisis-card">
        <h2>{card.title}</h2>
        <p className="flavor">{card.flavor}</p>
        <p className="rule">{card.rule}</p>
      </article>
    </section>
  );
}

const LIGHTS = [
  { id: "verde", name: "Mantener" },
  { id: "amarillo", name: "Mantenimiento" },
  { id: "rojo", name: "Dar de baja" },
] as const;

function SemaforoScreen({ snapshot }: { snapshot: Snapshot }) {
  const sc = snapshot.scenario!;
  const revealed = sc.status === "revelado";
  return (
    <section className="proj-scenario">
      <div className="stack-sm">
        <div className="row" style={{ gap: 14 }}>
          <span className="label coral" style={{ fontSize: 14 }}>Juego Semáforo · situación {sc.id}</span>
          {!revealed && <span className="chip amber live"><span className="dot" />{sc.voted}/{snapshot.ranking.length} grupos votaron</span>}
        </div>
        <p className="scenario-text">{sc.text}</p>
        {revealed && <p className="muted" style={{ fontSize: 24, margin: 0 }}>{sc.explanation}</p>}
      </div>
      <div className="proj-lights">
        {LIGHTS.map((l) => (
          <div key={l.id} className={`proj-light ${l.id} ${revealed && sc.answer === l.id ? "win" : ""}`}>
            <span className="lamp" />
            {revealed && <span className="n">{sc.tally?.[l.id] ?? 0}</span>}
            <span className="name">{l.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function GalleryScreen({ snapshot }: { snapshot: Snapshot }) {
  const { status, voted, results } = snapshot.gallery;
  if (status !== "revelada" || !results) {
    return (
      <section className="takeover">
        <span className="label" style={{ fontSize: 16 }}>Galería de lienzos</span>
        <h2 className="h-display" style={{ fontSize: 72 }}>Recorran la pared y voten.</h2>
        <p className="muted" style={{ fontSize: 26, margin: 0 }}>Dos votos por grupo · no el propio</p>
        <Coins value={voted} digits={2} unit={false} className="" />
        <span className="muted mono">de {snapshot.ranking.length} grupos han votado</span>
      </section>
    );
  }
  const max = Math.max(1, ...results.map((r) => r.votes));
  return (
    <section className="stack" style={{ alignContent: "start" }}>
      <span className="label" style={{ fontSize: 14 }}>Resultados de la Galería</span>
      <div className="bars" style={{ gap: 14 }}>
        {results.map((r) => (
          <div key={r.teamId} className="bar" style={{ gridTemplateColumns: "120px 1fr 80px", fontSize: 26 }}>
            <span>G·{r.label}</span>
            <span className="track" style={{ height: 22 }}><i style={{ width: `${(r.votes / max) * 100}%` }} /></span>
            <span style={{ textAlign: "right" }}>{r.votes}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Podium({ snapshot }: { snapshot: Snapshot }) {
  const [first, second, third] = snapshot.ranking;
  const gallery = snapshot.gallery.results?.[0];
  const step = (r: typeof first | undefined, place: number, height: number) =>
    r && (
      <div className={`step ${place === 1 ? "first" : ""}`} style={{ animationDelay: `${(3 - place) * 250}ms` }}>
        <span className="team">G·{r.label}</span>
        <span className="muted">{caseName(r.caseId)}</span>
        <Coins value={r.balance} className="" />
        <div className="block" style={{ height }}>{place}</div>
      </div>
    );
  return (
    <section className="stack" style={{ alignContent: "end", gap: 28 }}>
      <div className="row between">
        <span className="label" style={{ fontSize: 16 }}>Misión cumplida · mejor manejo del presupuesto</span>
        {gallery && gallery.votes > 0 && <span className="chip mint" style={{ fontSize: 14, padding: "6px 14px" }}>Galería: G·{gallery.label} · {gallery.votes} votos</span>}
      </div>
      <div className="podium">
        {step(second, 2, 150)}
        {step(first, 1, 220)}
        {step(third, 3, 110)}
      </div>
    </section>
  );
}
