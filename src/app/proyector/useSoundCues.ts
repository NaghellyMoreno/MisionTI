"use client";

import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/application/snapshot";

type Cue = "crisis" | "pop" | "quiz" | "reveal" | "join";

const PATTERNS: Record<Cue, [number, number][]> = {
  crisis: [[440, 0.18], [330, 0.18], [440, 0.18], [330, 0.32]],
  pop: [[660, 0.09], [880, 0.09], [1100, 0.16]],
  quiz: [[523, 0.1], [659, 0.1], [784, 0.2]],
  reveal: [[784, 0.12], [1046, 0.24]],
  join: [[880, 0.06]],
};

/**
 * Sonidos cortos en el proyector para despertar al salón (la clase es después
 * de almorzar). Se generan con Web Audio, sin archivos externos.
 */
export function useSoundCues(snapshot: Snapshot) {
  const [enabled, setEnabled] = useState(false);
  const ctx = useRef<AudioContext | null>(null);
  const last = useRef({
    crisis: snapshot.state.activeCrisisId,
    pop: snapshot.state.pop?.launchedAt ?? null,
    quiz: `${snapshot.state.quiz.index}:${snapshot.state.quiz.status}`,
    semaforo: snapshot.state.semaforo.status,
    online: snapshot.roster.filter((r) => r.online).length,
  });

  const play = (cue: Cue) => {
    const ac = ctx.current;
    if (!ac) return;
    let t = ac.currentTime;
    for (const [freq, dur] of PATTERNS[cue]) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = cue === "crisis" ? "square" : "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(cue === "crisis" ? 0.08 : 0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur;
    }
  };

  useEffect(() => {
    const s = snapshot.state;
    const prev = last.current;
    const online = snapshot.roster.filter((r) => r.online).length;
    const quizKey = `${s.quiz.index}:${s.quiz.status}`;
    if (enabled) {
      if (s.activeCrisisId && s.activeCrisisId !== prev.crisis) play("crisis");
      else if (s.pop && s.pop.launchedAt !== prev.pop) play("pop");
      else if (quizKey !== prev.quiz && s.quiz.status === "abierto") play("quiz");
      else if ((quizKey !== prev.quiz && s.quiz.status === "revelado") || (s.semaforo.status === "revelado" && prev.semaforo !== "revelado")) play("reveal");
      else if (s.screen === "sala" && online > prev.online) play("join");
    }
    last.current = { crisis: s.activeCrisisId, pop: s.pop?.launchedAt ?? null, quiz: quizKey, semaforo: s.semaforo.status, online };
  });

  const enable = () => {
    try {
      ctx.current ??= new AudioContext();
      void ctx.current.resume();
      setEnabled(true);
      play("join");
    } catch {}
  };

  return { enabled, enable, disable: () => setEnabled(false) };
}
