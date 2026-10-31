"use client";

import { useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import type { GuestQuestion } from "@/domain/types";
import { GUEST_MEETING, GUEST_TOPICS } from "@/domain/data/guest";
import { editGuestQuestion, setGuestQuestionStatus } from "../actions";
import type { ActionApi } from "./ControlApp";

/** Moderación de la entrevista: las preguntas van en el orden del ciclo de vida. */
export function GuestAdmin({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const staff = snapshot.staff!;
  const byTeam = new Map(staff.guestQuestions.map((q) => [q.teamId, q]));
  const ready = staff.guestQuestions.length;

  return (
    <section className="stack">
      <div className="board row between wrap">
        <div className="stack-sm" style={{ gap: 2 }}>
          <span className="label">{GUEST_MEETING.company} · {GUEST_MEETING.channel}</span>
          <strong style={{ fontFamily: "var(--display)", fontSize: 20 }}>Entrevista a las {GUEST_MEETING.start}</strong>
        </div>
        <span className="coins" style={{ fontSize: 40 }}>
          {ready}
          <span className="unit">de {snapshot.guest.queue.length} preguntas listas</span>
        </span>
      </div>

      <div className="stack-sm">
        {snapshot.guest.queue.map((item, i) => {
          const q = byTeam.get(item.teamId);
          const topic = GUEST_TOPICS.find((t) => t.teamId === item.teamId)!;
          const onScreen = q?.status === "en-pantalla";
          return (
            <article key={item.teamId} className={`panel guest-row ${onScreen ? "on-screen" : ""} ${q?.status === "hecha" ? "done" : ""}`}>
              <span className="mono guest-turn">{String(i + 1).padStart(2, "0")}</span>
              <div className="stack-sm" style={{ gap: 4 }}>
                <div className="row wrap" style={{ gap: 8 }}>
                  <strong className="mono">G·{item.teamLabel}</strong>
                  <span className="chip">Nivel {item.level} · {item.levelName}</span>
                  <span className="hint">{topic.topic}</span>
                </div>
                {q ? <QuestionText q={q} action={action} /> : <span className="coral" style={{ fontSize: 14 }}>Este grupo aún no ha escrito su pregunta.</span>}
              </div>
              <div className="row" style={{ gap: 6 }}>
                {q && !onScreen && (
                  <button className="btn sm primary" disabled={action.pending} onClick={() => action.run(() => setGuestQuestionStatus(q.id, "en-pantalla"))}>
                    {q.status === "hecha" ? "Repetir" : "En pantalla"}
                  </button>
                )}
                {q && onScreen && (
                  <button className="btn sm" disabled={action.pending} onClick={() => action.run(() => setGuestQuestionStatus(q.id, "hecha"))}>
                    Marcar hecha
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/** Texto de la pregunta con corrección en línea: para pulir la redacción antes de proyectarla. */
function QuestionText({ q, action }: { q: GuestQuestion; action: ActionApi }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(q.text);

  if (!editing) {
    return (
      <div className="row" style={{ gap: 8, alignItems: "start" }}>
        <p className="quote grow" style={{ margin: 0 }}>{q.text}</p>
        <button
          className="btn ghost sm"
          onClick={() => {
            setText(q.text);
            setEditing(true);
          }}
        >
          Corregir
        </button>
      </div>
    );
  }

  return (
    <form
      className="stack-sm"
      onSubmit={(e) => {
        e.preventDefault();
        action.run(() => editGuestQuestion(q.id, text), () => setEditing(false));
      }}
    >
      <textarea className="textarea" value={text} maxLength={240} onChange={(e) => setText(e.target.value)} autoFocus />
      <div className="row" style={{ gap: 6 }}>
        <button className="btn sm primary" disabled={action.pending || text.trim() === q.text}>Guardar corrección</button>
        <button type="button" className="btn sm ghost" onClick={() => setEditing(false)}>Cancelar</button>
        <span className="hint">{text.trim().length}/240</span>
      </div>
    </form>
  );
}
