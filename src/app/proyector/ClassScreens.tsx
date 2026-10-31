"use client";

import type { Snapshot } from "@/application/snapshot";
import { CASES } from "@/domain/data/catalog";
import { GUEST_MEETING } from "@/domain/data/guest";
import { SLIDES } from "@/domain/data/lessons";
import { firstName } from "@/domain/students";
import { SlideView } from "@/ui/SlideView";
import { useTick } from "@/ui/useLive";

const LETTERS = ["A", "B", "C", "D"];

/** Sala de espera: quién ya se conectó. */
export function LobbyScreen({ snapshot }: { snapshot: Snapshot }) {
  const online = snapshot.roster.filter((r) => r.online).length;
  const teams = [...new Set(snapshot.roster.map((r) => r.teamId))];
  const label = new Map(snapshot.ranking.map((r) => [r.teamId, r]));
  return (
    <section className="lobby">
      <div className="lobby-head">
        <div className="stack-sm">
          <span className="label">Sala de espera · entren desde su celular</span>
          <h2 className="h-display" style={{ fontSize: "clamp(28px, min(3.6vw, 6vh), 44px)" }}>Misión TI empieza a la 1:00 p. m.</h2>
        </div>
        <div className="board lobby-count">
          <span className="coins" style={{ fontSize: "clamp(36px, min(5vw, 8vh), 64px)" }}>{online}<span className="unit">de {snapshot.roster.length}</span></span>
          <span className="label">conectados</span>
        </div>
      </div>
      <div className="lobby-grid">
        {teams.map((t) => (
          <div key={t} className="lobby-team">
            <span className="mono" style={{ fontSize: "clamp(17px, 2.6vh, 22px)" }}>G·{label.get(t)?.label}</span>
            <span className="hint">{CASES.find((c) => c.id === label.get(t)?.caseId)?.name}</span>
            {snapshot.roster
              .filter((r) => r.teamId === t)
              .map((r) => (
                <span key={r.id} className={`lobby-name ${r.online ? "on" : ""}`}>
                  <i aria-hidden />
                  {r.name}
                </span>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}

export function TheoryScreen({ snapshot }: { snapshot: Snapshot }) {
  const slide = SLIDES[snapshot.state.slideIndex] ?? SLIDES[0];
  return (
    <section className="theory" key={slide.id}>
      <SlideView slide={slide} size="lg" />
      <span className="theory-page mono">{snapshot.state.slideIndex + 1} / {SLIDES.length}</span>
    </section>
  );
}

/** Ronda de preguntas sorpresa: se ven los nombres escogidos (no la pregunta). */
export function PopScreen({ snapshot, serverNow }: { snapshot: Snapshot; serverNow: () => number }) {
  useTick(250);
  const pop = snapshot.pop;
  if (!pop) return null;
  const left = Math.max(0, Math.ceil((pop.deadline - serverNow()) / 1000));
  return (
    <section className="takeover pop-screen">
      <span className="chip coral live" style={{ fontSize: 14, padding: "6px 14px" }}><span className="dot" />Pregunta sorpresa</span>
      <h2 className="h-display" style={{ fontSize: "clamp(32px, min(5vw, 7vh), 56px)" }}>{pop.reveal ? "Se acabó el tiempo" : "Revisen su celular…"}</h2>
      <div className="pop-names">
        {pop.students.map((s, i) => (
          <div key={s.id} className={`pop-name ${s.answered ? "done" : ""}`} style={{ animationDelay: `${i * 220}ms` }}>
            <span className="pop-first">{firstName(s.name)}</span>
            <span className="hint">{s.name.split(" ").slice(1).join(" ")} · G·{s.teamLabel}</span>
            <span className={`chip ${s.answered ? "mint" : ""}`}>{s.answered ? "✓ respondió" : "pensando…"}</span>
          </div>
        ))}
      </div>
      {pop.reveal ? (
        <div className="panel pop-reveal">
          <p style={{ margin: 0, fontSize: 22 }}>{pop.reveal.text}</p>
          <p style={{ margin: "10px 0 0", fontSize: 26 }}>
            Respuesta: <b>{pop.reveal.answer}</b> · <span className="mono">{pop.reveal.correct}/{pop.reveal.total}</span> acertaron
          </p>
        </div>
      ) : (
        <span className="coins" style={{ fontSize: "clamp(56px, min(8vw, 12vh), 96px)" }}>{left}<span className="unit">seg</span></span>
      )}
    </section>
  );
}

export function GuestScreen({ snapshot }: { snapshot: Snapshot }) {
  const cur = snapshot.guest.current;
  return (
    <section className="guest-screen">
      <div className="stack-sm">
        <span className="label">Conexión en vivo · {GUEST_MEETING.channel}</span>
        <h2 className="h-display" style={{ fontSize: "clamp(26px, min(3.4vw, 5.5vh), 40px)" }}>{GUEST_MEETING.company}</h2>
      </div>
      {cur ? (
        <article className="guest-card">
          <span className="label">Grupo {cur.teamLabel} · Nivel {cur.levelName}</span>
          <p className="guest-question">“{cur.text}”</p>
          <span className="hint" style={{ fontSize: 16 }}>Tema: {cur.topic}</span>
        </article>
      ) : (
        <article className="guest-card idle">
          <p className="guest-question">Preparen su pregunta: la entrevista recorre el ciclo de vida, del diagnóstico al fin de ciclo.</p>
        </article>
      )}
      <ol className="guest-queue">
        {snapshot.guest.queue.map((q) => (
          <li key={q.teamId} className={`gq-${q.status}`}>
            <span className="mono">G·{q.teamLabel}</span>
            <span>{q.levelName}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function QuizScreen({ snapshot, serverNow }: { snapshot: Snapshot; serverNow: () => number }) {
  useTick(250);
  const q = snapshot.quiz;
  const online = snapshot.roster.filter((r) => r.online).length;

  if (q.status === "cerrado" || !q.question) {
    return (
      <section className="takeover">
        <span className="label" style={{ fontSize: 16 }}>Quiz final individual</span>
        <h2 className="h-display" style={{ fontSize: "clamp(36px, min(6vw, 9vh), 72px)" }}>Saquen el celular.</h2>
        <p className="muted" style={{ fontSize: "clamp(18px, 2.4vw, 26px)", margin: 0 }}>{q.total} preguntas · acertar rápido da más puntos</p>
      </section>
    );
  }

  if (q.status === "terminado") return <Leaderboard snapshot={snapshot} title="Podio del quiz" />;

  const left = q.openedAt ? Math.max(0, Math.ceil((q.openedAt + q.durationMs - serverNow()) / 1000)) : 0;
  const revealed = q.status === "revelado";
  const max = Math.max(1, ...(q.tally ?? [1]));

  return (
    <section className="quiz-screen">
      <div className="row between">
        <span className="label" style={{ fontSize: 14 }}>Pregunta {q.index + 1} de {q.total}</span>
        <span className="mono muted" style={{ fontSize: 20 }}>{q.answered}/{online} respondieron</span>
      </div>
      <div className="row between quiz-head" style={{ alignItems: "start", gap: 32 }}>
        <p className="quiz-big">{q.question.text}</p>
        {!revealed && <span className={`coins ${left <= 5 ? "coral" : ""}`} style={{ fontSize: "clamp(56px, min(9vw, 13vh), 110px)", lineHeight: 1 }}>{left}</span>}
      </div>
      <div className="quiz-options">
        {q.question.options.map((o, i) => (
          <div key={i} className={`quiz-opt opt-${i} ${revealed ? (i === q.answer ? "right" : "dim-out") : ""}`}>
            <span className="mono quiz-letter">{LETTERS[i]}</span>
            <span className="grow">{o}</span>
            {revealed && q.tally && (
              <span className="quiz-bar">
                <i style={{ width: `${(q.tally[i] / max) * 100}%` }} />
                <b className="mono">{q.tally[i]}</b>
              </span>
            )}
          </div>
        ))}
      </div>
      {revealed && q.leaderboard && q.leaderboard.length > 0 && (
        <div className="quiz-top">
          {q.leaderboard.slice(0, 3).map((l, i) => (
            <span key={i} className="chip mint" style={{ fontSize: 15, padding: "6px 14px" }}>
              {i + 1}. {firstName(l.name)} · {l.points}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Leaderboard({ snapshot, title }: { snapshot: Snapshot; title: string }) {
  const top = snapshot.quiz.leaderboard ?? [];
  return (
    <section className="stack" style={{ alignContent: "center", maxWidth: 1000, margin: "0 auto", width: "100%" }}>
      <span className="label" style={{ fontSize: 16 }}>{title}</span>
      {top.map((l, i) => (
        <div key={i} className={`proj-row ${i === 0 ? "lead" : ""}`} style={{ gridTemplateColumns: "70px 1fr 220px", animationDelay: `${(top.length - i) * 200}ms` }}>
          <span className="pos">#{i + 1}</span>
          <span className="case" style={{ fontSize: 28, color: "var(--text)" }}>{l.name} <span className="dim" style={{ fontSize: 18 }}>G·{l.teamLabel}</span></span>
          <span className="coins" style={{ fontSize: 40, textAlign: "right" }}>{l.points}<span className="unit">pts</span></span>
        </div>
      ))}
    </section>
  );
}
