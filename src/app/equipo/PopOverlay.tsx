"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { useTick } from "@/ui/useLive";
import { answerPop } from "../actions";

type Pending = NonNullable<Snapshot["team"]>["pendingPops"][number];
type Result = { correct: boolean; explanation: string; answer: number; options: string[] };

const QUEUE_KEY = "mti-pop-queue";
const LETTERS = ["A", "B", "C", "D"];

/** Respuestas guardadas en el celular mientras vuelve la conexión. */
function readQueue(): { answerId: string; choice: number }[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}
function writeQueue(q: { answerId: string; choice: number }[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {}
}

/**
 * Pregunta sorpresa a pantalla completa. Si el celular pierde la señal,
 * la respuesta queda guardada y se reenvía sola al reconectar.
 */
export function PopOverlay({ pending, serverNow, refresh }: { pending: Pending[]; serverNow: () => number; refresh: () => Promise<void> | void }) {
  useTick(250);
  const [result, setResult] = useState<Result | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [queued, setQueued] = useState<string[]>([]);
  const seen = useRef(new Set<string>());

  const current = pending.find((p) => !queued.includes(p.answerId)) ?? null;

  const flush = useCallback(async () => {
    const queue = readQueue();
    if (!queue.length) return;
    const rest: typeof queue = [];
    for (const item of queue) {
      try {
        const r = await answerPop(item.answerId, item.choice);
        if (!r.ok && /No se pudo/.test(r.error)) rest.push(item);
      } catch {
        rest.push(item);
      }
    }
    writeQueue(rest);
    setQueued(rest.map((r) => r.answerId));
    void refresh();
  }, [refresh]);

  useEffect(() => {
    setQueued(readQueue().map((q) => q.answerId));
    void flush();
    const id = setInterval(() => void flush(), 5000);
    window.addEventListener("online", flush);
    return () => {
      clearInterval(id);
      window.removeEventListener("online", flush);
    };
  }, [flush]);

  // Vibra una vez cuando llega una pregunta nueva.
  useEffect(() => {
    if (current && !seen.current.has(current.answerId)) {
      seen.current.add(current.answerId);
      try {
        navigator.vibrate?.([120, 60, 120]);
      } catch {}
    }
  }, [current]);

  const choose = async (p: Pending, choice: number) => {
    setSending(p.answerId);
    try {
      const r = await answerPop(p.answerId, choice);
      if (r.ok) setResult({ correct: r.correct, explanation: r.explanation, answer: r.answer, options: p.question.options });
      else if (/No se pudo/.test(r.error)) throw new Error(r.error);
      else setResult({ correct: false, explanation: r.error, answer: -1, options: p.question.options });
    } catch {
      writeQueue([...readQueue().filter((q) => q.answerId !== p.answerId), { answerId: p.answerId, choice }]);
      setQueued((q) => [...q, p.answerId]);
    } finally {
      setSending(null);
      void refresh();
    }
  };

  if (result) {
    return (
      <div className="pop-overlay" role="dialog" aria-modal="true" aria-label="Resultado">
        <div className={`pop-card ${result.correct ? "ok" : "ko"}`}>
          <span className="pop-big">{result.correct ? "¡Correcto!" : "Esta vez no"}</span>
          {result.answer >= 0 && !result.correct && (
            <p style={{ margin: 0 }}>Respuesta: <b>{result.options[result.answer]}</b></p>
          )}
          <p className="muted" style={{ margin: 0 }}>{result.explanation}</p>
          <button className="btn primary block" onClick={() => setResult(null)}>Seguir en la clase</button>
        </div>
      </div>
    );
  }

  if (!current) {
    return queued.length ? (
      <div className="pop-queued" role="status">Respuesta guardada sin señal · se enviará al reconectar</div>
    ) : null;
  }

  const left = Math.max(0, Math.ceil((current.deadline - serverNow()) / 1000));
  const late = left === 0;

  return (
    <div className="pop-overlay" role="dialog" aria-modal="true" aria-label="Pregunta sorpresa">
      <div className="pop-card">
        <div className="row between">
          <span className="label coral">¡Te tocó! Pregunta sorpresa</span>
          <span className={`pop-timer mono ${left <= 10 ? "coral" : ""}`}>{late ? "tiempo extra" : `${left}s`}</span>
        </div>
        <p className="pop-question">{current.question.text}</p>
        <div className="pop-options">
          {current.question.options.map((o, i) => (
            <button key={i} className="pop-option" disabled={!!sending} onClick={() => choose(current, i)}>
              <span className="mono">{LETTERS[i]}</span>
              {o}
            </button>
          ))}
        </div>
        <span className="hint">Responde tú solo: la pregunta es individual.</span>
      </div>
    </div>
  );
}
