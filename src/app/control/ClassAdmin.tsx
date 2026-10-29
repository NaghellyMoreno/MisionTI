"use client";

import { useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { AGENDA, type PopSection } from "@/domain/data/agenda";
import { SLIDES } from "@/domain/data/lessons";
import { POP_BANK, POP_SECTIONS, findPopQuestion } from "@/domain/data/questions";
import { SlideView } from "@/ui/SlideView";
import { controlSlides, launchPop } from "../actions";
import type { ActionApi } from "./ControlApp";

const time = (iso: string) => new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

export function ClassAdmin({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const staff = snapshot.staff!;
  const index = snapshot.state.slideIndex;
  const slide = SLIDES[index];
  const suggested = AGENDA[snapshot.state.agendaIndex]?.pop;
  const [section, setSection] = useState<PopSection>(suggested ?? "fuente");
  const [questionId, setQuestionId] = useState<string>("");
  const [count, setCount] = useState(4);
  const online = snapshot.roster.filter((r) => r.online).length;

  return (
    <section className="class-admin">
      <div className="stack">
        <div className="row between wrap">
          <span className="label">Teoría · diapositiva {index + 1} de {SLIDES.length}</span>
          <div className="row" style={{ gap: 6 }}>
            <button className="btn sm" disabled={index === 0} onClick={() => action.run(() => controlSlides("prev"))}>◀ Anterior</button>
            <button className="btn sm primary" disabled={index === SLIDES.length - 1} onClick={() => action.run(() => controlSlides("next"))}>Siguiente ▶</button>
          </div>
        </div>
        <div className="panel slide-preview">
          <SlideView slide={slide} size="md" />
        </div>
        <div className="slide-strip">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              className={`strip-item tag-${s.kind}`}
              aria-current={i === index ? "true" : undefined}
              title={s.title}
              onClick={() => action.run(() => controlSlides({ goto: i }))}
            >
              <span className="mono">{String(i + 1).padStart(2, "0")}</span>
              {s.title}
            </button>
          ))}
        </div>
      </div>

      <div className="stack">
        <form
          className="panel tick stack-sm"
          onSubmit={(e) => {
            e.preventDefault();
            action.run(() => launchPop(section, count, questionId || undefined));
          }}
        >
          <span className="label coral">Pregunta sorpresa</span>
          <span className="hint">
            Va a {count} estudiante{count > 1 ? "s" : ""} al azar entre los {online} conectados, empezando por quienes menos preguntas han recibido.
          </span>
          <label className="field">
            <span className="label plain">Bloque {suggested && suggested === section ? "(sugerido ahora)" : ""}</span>
            <select
              className="select"
              value={section}
              onChange={(e) => {
                setSection(e.target.value as PopSection);
                setQuestionId("");
              }}
            >
              {(Object.keys(POP_SECTIONS) as PopSection[]).map((k) => (
                <option key={k} value={k}>{POP_SECTIONS[k]}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span className="label plain">Pregunta</span>
            <select className="select" value={questionId} onChange={(e) => setQuestionId(e.target.value)}>
              <option value="">Al azar (la menos usada)</option>
              {POP_BANK[section].map((q) => (
                <option key={q.id} value={q.id}>{q.id} · {q.text}</option>
              ))}
            </select>
          </label>
          <div className="row" style={{ gap: 8, alignItems: "end" }}>
            <label className="field" style={{ width: 110 }}>
              <span className="label plain">Estudiantes</span>
              <input className="input mono" type="number" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} />
            </label>
            <button className="btn danger grow" disabled={!online || action.pending}>🎯 Lanzar</button>
          </div>
        </form>

        <div className="panel stack-sm" style={{ maxHeight: 420, overflowY: "auto" }}>
          <span className="label">Historial de preguntas sorpresa</span>
          {staff.popDetail.length === 0 && <span className="hint">Aún no se ha lanzado ninguna.</span>}
          {staff.popDetail.map((p, i) => (
            <div key={i} className="ledger-row">
              <div>
                <div>{p.name} <span className="dim">· G·{p.teamLabel}</span></div>
                <div className="when">{time(p.sentAt)} · {p.questionId} · {findPopQuestion(p.questionId)?.text.slice(0, 48)}…</div>
              </div>
              <span className={`chip ${p.choice === null ? "" : p.correct ? "mint" : "coral"}`}>
                {p.choice === null ? "sin responder" : p.correct ? "correcta" : "incorrecta"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
