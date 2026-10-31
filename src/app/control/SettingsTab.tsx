"use client";

import { useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { adjustBalance, getAccessCodes, resetGame } from "../actions";
import type { ActionApi } from "./ControlApp";

export function SettingsTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const staff = snapshot.staff!;
  const [teams, setTeams] = useState<string[]>([]);
  const [amount, setAmount] = useState("10");
  const [note, setNote] = useState("");
  const [codes, setCodes] = useState<Record<string, string> | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState("");

  const toggle = (id: string) => setTeams((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const n = Number(amount);

  return (
    <section className="stack">
      <form
        className="panel tick stack"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(() => adjustBalance(teams, n, note), () => {
            setTeams([]);
            setNote("");
          });
        }}
      >
        <div className="stack-sm">
          <span className="label">Ajuste manual de TecnoCoins</span>
          <span className="hint">Para la carta Oportunidad inesperada, participación destacada o correcciones.</span>
        </div>
        <div className="pick-grid">
          {staff.teams.map((t) => (
            <button key={t.id} type="button" className="pick" aria-pressed={teams.includes(t.id)} onClick={() => toggle(t.id)}>
              <span className="num">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="row wrap" style={{ gap: 10, alignItems: "end" }}>
          <label className="field" style={{ width: 130 }}>
            <span className="label plain">Monto (± TC)</span>
            <input className="input mono" type="number" step={1} min={-100} max={100} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label className="field grow" style={{ minWidth: 200 }}>
            <span className="label plain">Motivo</span>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej.: Oportunidad inesperada" />
          </label>
          <button className={`btn ${n < 0 ? "danger" : "primary"}`} type="submit" disabled={!teams.length || !n || action.pending}>
            Aplicar {n > 0 ? `+${n}` : n} a {teams.length || "…"}
          </button>
        </div>
      </form>

      <div className="panel stack">
        <div className="row between wrap">
          <div className="stack-sm">
            <span className="label">Códigos de acceso de los grupos</span>
            <span className="hint">Entréguenlos al inicio de la clase. No los proyecten.</span>
          </div>
          <button
            className="btn sm"
            onClick={async () => {
              if (codes) return setCodes(null);
              setCodes(await getAccessCodes());
            }}
          >
            {codes ? "Ocultar" : "Mostrar códigos"}
          </button>
        </div>
        {codes && (
          <>
            <div className="codes">
              {staff.teams.map((t) => (
                <div key={t.id} className="code">
                  <span className="mono">Grupo {t.label}</span>
                  <b>{codes[t.id] ?? "—"}</b>
                </div>
              ))}
            </div>
            <div className="row wrap" style={{ gap: 8 }}>
              <button
                className="btn sm"
                onClick={async () => {
                  const text = staff.teams.map((t) => `${t.id}=${codes[t.id] ?? ""}`).join(",");
                  try {
                    await navigator.clipboard.writeText(text);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2500);
                  } catch {
                    window.prompt("Copien este texto:", text);
                  }
                }}
              >
                {copied ? "Copiado ✓" : "Copiar para la prueba de carga"}
              </button>
              <span className="hint">npm run carga -- --url https://su-app.vercel.app --codigos "…"</span>
            </div>
          </>
        )}
      </div>

      <form
        className="panel alert stack-sm"
        onSubmit={(e) => {
          e.preventDefault();
          action.run(() => resetGame(confirm), () => setConfirm(""));
        }}
      >
        <span className="label coral">Reiniciar partida</span>
        <span className="hint">Borra compras, votos y movimientos, y devuelve 100 TC a cada grupo. Úsenlo después del ensayo.</span>
        <div className="row wrap" style={{ gap: 8 }}>
          <input className="input" style={{ maxWidth: 220 }} placeholder="Escriban REINICIAR" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <button className="btn danger" disabled={confirm.trim().toUpperCase() !== "REINICIAR" || action.pending}>Reiniciar todo</button>
        </div>
      </form>
    </section>
  );
}
