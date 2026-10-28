"use client";

import { useRef, useState, useTransition } from "react";
import { STAFF } from "@/domain/data/teams";
import { loginStaff, loginTeam } from "./actions";

type TeamOption = { id: string; label: string; caseName: string };

export function LoginForm({ teams }: { teams: TeamOption[] }) {
  const [mode, setMode] = useState<"team" | "staff">("team");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [staff, setStaff] = useState<string | null>(null);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const code = pin.join("");
  const who = mode === "team" ? teamId : staff;
  const ready = !!who && code.length === 4;

  const setDigit = (i: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length > 1) {
      const next = digits.slice(0, 4).split("");
      setPin([0, 1, 2, 3].map((k) => next[k] ?? ""));
      boxes.current[Math.min(next.length, 3)]?.focus();
      return;
    }
    setPin((p) => p.map((d, k) => (k === i ? digits : d)));
    if (digits && i < 3) boxes.current[i + 1]?.focus();
  };

  const submit = () => {
    if (!ready || !who) return;
    setError(null);
    start(async () => {
      const result = mode === "team" ? await loginTeam(who, code) : await loginStaff(who, code);
      if (result && !result.ok) {
        setError(result.error);
        setPin(["", "", "", ""]);
        boxes.current[0]?.focus();
      }
    });
  };

  const switchMode = (m: "team" | "staff") => {
    setMode(m);
    setError(null);
    setPin(["", "", "", ""]);
  };

  return (
    <form
      className="panel tick stack"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="row between wrap">
        <div className="seg" role="group" aria-label="Tipo de acceso">
          <button type="button" aria-pressed={mode === "team"} onClick={() => switchMode("team")}>Soy un grupo</button>
          <button type="button" aria-pressed={mode === "staff"} onClick={() => switchMode("staff")}>Equipo docente</button>
        </div>
        <span className="hint">{mode === "team" ? "1 · Elijan su grupo   2 · Código de 4 dígitos" : "Código del equipo docente"}</span>
      </div>

      {mode === "team" ? (
        <div className="team-grid">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              className="team-tile"
              aria-pressed={teamId === t.id}
              onClick={() => {
                setTeamId(t.id);
                boxes.current[0]?.focus();
              }}
            >
              <span className="label plain">Grupo</span>
              <span className="num">{t.label}</span>
              <span className="case">{t.caseName}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="team-grid">
          {STAFF.map((s) => (
            <button key={s.name} type="button" className="team-tile" aria-pressed={staff === s.name} onClick={() => setStaff(s.name)}>
              <span className="label plain">{s.role}</span>
              <span className="num" style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 600 }}>{s.name}</span>
            </button>
          ))}
        </div>
      )}

      <div className="row wrap" style={{ gap: 16, alignItems: "end" }}>
        <div className="field">
          <span className="label">Código de acceso</span>
          <div className="pin">
            {pin.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                value={d}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                aria-label={`Dígito ${i + 1}`}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Backspace" && !d && i > 0) boxes.current[i - 1]?.focus();
                }}
              />
            ))}
          </div>
        </div>
        <button className="btn primary" type="submit" disabled={!ready || pending} style={{ minHeight: 62, minWidth: 160 }}>
          {pending ? "Verificando…" : "Entrar a la misión →"}
        </button>
      </div>
      {error && <p className="coral" role="alert" style={{ margin: 0 }}>{error}</p>}
    </form>
  );
}
