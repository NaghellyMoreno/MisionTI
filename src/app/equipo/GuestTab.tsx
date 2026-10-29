"use client";

import { useEffect, useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { GUEST_MEETING } from "@/domain/data/guest";
import { SOURCES } from "@/domain/data/sources";
import { GUEST_QUESTION_MAX, GUEST_QUESTION_MIN } from "@/application/usecases/classroom";
import { saveGuestQuestion } from "../actions";
import type { ActionApi } from "./TeamApp";

const STATUS_TEXT = {
  lista: { cls: "mint", text: "Lista para la entrevista" },
  "en-pantalla": { cls: "amber live", text: "¡Es su turno! Hagan la pregunta" },
  hecha: { cls: "", text: "Pregunta hecha" },
} as const;

export function GuestTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const me = snapshot.team!;
  const topic = me.guestTopic;
  const saved = me.guestQuestion;
  const [text, setText] = useState(saved?.text ?? "");
  useEffect(() => setText(saved?.text ?? ""), [saved?.text]);

  const position = snapshot.guest.queue.findIndex((q) => q.teamId === me.team.id) + 1;
  const locked = saved?.status === "hecha";
  const length = text.trim().length;

  return (
    <section className="stack">
      <div className="board stack-sm">
        <span className="label">Conexión en vivo · {GUEST_MEETING.channel}</span>
        <strong style={{ fontFamily: "var(--display)", fontSize: 20 }}>{GUEST_MEETING.company}</strong>
        <span className="muted">
          {GUEST_MEETING.start} · Su grupo pregunta en el turno {position} de {snapshot.guest.queue.length}
        </span>
      </div>

      {snapshot.guest.current && (
        <div className="panel alert stack-sm">
          <span className="label coral">En pantalla ahora · Grupo {snapshot.guest.current.teamLabel}</span>
          <p style={{ margin: 0 }}>{snapshot.guest.current.text}</p>
        </div>
      )}

      {topic && (
        <div className="panel tick stack-sm">
          <span className="label">Su tema · Nivel {topic.level} · {topic.levelName}</span>
          <strong style={{ fontSize: 17 }}>{topic.topic}</strong>
          <p className="quote" style={{ margin: 0 }}>🔎 {topic.clue}</p>
          <span className="hint">Fuente: {topic.sources.map((s) => SOURCES[s].short).join(" · ")}</span>
        </div>
      )}

      <form
        className="panel stack-sm"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(() => saveGuestQuestion(text));
        }}
      >
        <div className="row between">
          <span className="label">Pregunta del grupo</span>
          {saved && <span className={`chip ${STATUS_TEXT[saved.status].cls}`}><span className="dot" />{STATUS_TEXT[saved.status].text}</span>}
        </div>
        <textarea
          className="textarea"
          value={text}
          disabled={locked}
          maxLength={GUEST_QUESTION_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escriban una pregunta que se pueda hacer en 30 segundos…"
        />
        <div className="row between">
          <span className="hint">{length}/{GUEST_QUESTION_MAX} · cualquier integrante puede editarla</span>
          <button className="btn primary" disabled={locked || length < GUEST_QUESTION_MIN || text.trim() === saved?.text || action.pending}>
            {saved ? "Actualizar" : "Guardar pregunta"}
          </button>
        </div>
      </form>
    </section>
  );
}
