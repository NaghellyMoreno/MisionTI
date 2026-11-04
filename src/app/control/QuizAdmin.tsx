"use client";

import type { Snapshot } from "@/application/snapshot";
import { formatClock } from "@/ui/time";
import { useTick } from "@/ui/useLive";
import { controlQuiz } from "../actions";
import type { ActionApi } from "./ControlApp";

export function QuizAdmin({ snapshot, action, serverNow }: { snapshot: Snapshot; action: ActionApi; serverNow: () => number }) {
  useTick(500);
  const q = snapshot.quiz;
  const leftMs = q.openedAt ? Math.max(0, q.openedAt + q.durationMs - serverNow()) : 0;

  return (
    <section className="stack">
      <div className="board row between wrap">
        <div className="stack-sm" style={{ gap: 2 }}>
          <span className="label">Quiz final individual · {q.total} preguntas · {Math.round(q.durationMs / 60_000)} min</span>
          <strong style={{ fontFamily: "var(--display)", fontSize: 20 }}>
            {q.status === "cerrado" ? "Sin iniciar" : q.status === "terminado" ? "Terminado" : "En curso"}
          </strong>
        </div>
        {q.status === "abierto" && <span className="coins" style={{ fontSize: 44 }}>{formatClock(leftMs)}</span>}
        <span className="mono muted">{q.finished}/{q.participants} terminaron</span>
      </div>

      {q.allDone && (
        <div className="panel alert" style={{ padding: 14 }}>
          <strong>Todos terminaron antes de tiempo.</strong> Pueden mostrar el ranking.
        </div>
      )}
      {q.status === "abierto" && !q.allDone && leftMs === 0 && (
        <div className="panel alert" style={{ padding: 14 }}>Se acabó el tiempo. Muestren el ranking.</div>
      )}

      <div className="row wrap" style={{ gap: 8 }}>
        {q.status === "cerrado" && (
          <button className="btn primary" onClick={() => action.run(() => controlQuiz("start"))}>Iniciar quiz</button>
        )}
        {q.status === "abierto" && (
          <button className={`btn ${q.allDone || leftMs === 0 ? "primary" : "ghost"}`} onClick={() => action.run(() => controlQuiz("finish"))}>
            Terminar y mostrar ranking
          </button>
        )}
        {q.status !== "cerrado" && (
          <button
            className="btn danger"
            onClick={() => {
              if (window.confirm("¿Volver a empezar el quiz? Se borran todas las respuestas del quiz y no se pueden recuperar.")) {
                action.run(() => controlQuiz("reset"));
              }
            }}
          >
            Volver a empezar
          </button>
        )}
      </div>

      {q.leaderboard && q.leaderboard.length > 0 && (
        <div className="panel stack-sm">
          <span className="label">Ranking · aciertos y tiempo</span>
          {q.leaderboard.map((l, i) => (
            <div key={i} className="row between">
              <span>{i + 1}. {l.name} <span className="dim">· G·{l.teamLabel}</span></span>
              <span className="mono">{l.correct}/{l.total} · {formatClock(l.timeMs)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
