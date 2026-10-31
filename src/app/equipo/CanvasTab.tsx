"use client";

import { useEffect, useRef, useState } from "react";
import type { Snapshot } from "@/application/snapshot";
import { CANVAS_FIELDS, CANVAS_MAX, type CanvasFieldId } from "@/domain/data/canvas";
import { CASES } from "@/domain/data/catalog";
import { saveCanvasField } from "../actions";

type SaveState = "idle" | "saving" | "saved" | "error";
const SAVE_DELAY_MS = 1200;

/**
 * Lienzo digital del grupo. Se guarda solo mientras escriben (una casilla a la vez),
 * así dos integrantes pueden trabajar en casillas distintas sin pisarse.
 */
export function CanvasTab({ snapshot, refresh }: { snapshot: Snapshot; refresh: () => Promise<void> | void }) {
  const me = snapshot.team!;
  const company = CASES.find((c) => c.id === me.team.caseId)!;
  const locked = snapshot.state.gallery.status !== "cerrada";

  // Mientras la pestaña está abierta, trae lo que escriben los compañeros.
  useEffect(() => {
    const id = setInterval(() => void refresh(), 6000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <section className="stack">
      <div className="row between">
        <span className="label">Lienzo · {company.name}</span>
        <span className="chip mono">{me.canvas.filled}/{CANVAS_FIELDS.length}</span>
      </div>
      {company.express && <p className="hint" style={{ margin: 0 }}>{company.express.note}</p>}
      {locked ? (
        <div className="panel alert" style={{ padding: 14 }}>El lienzo se cerró porque empezó la Galería. Así todos votan sobre la misma versión.</div>
      ) : (
        <p className="hint" style={{ margin: 0 }}>Se guarda solo. Cualquier integrante puede escribir; repártanse las casillas.</p>
      )}
      {CANVAS_FIELDS.map((f, i) => (
        <CanvasField
          key={f.id}
          field={f.id}
          title={`${f.level} · ${f.title}`}
          prompt={company.express?.questions[i] ?? f.prompt}
          remote={me.canvas.fields[f.id]?.text ?? ""}
          by={me.canvas.fields[f.id]?.by ?? null}
          current={snapshot.state.agendaIndex === f.agenda}
          locked={locked}
        />
      ))}
    </section>
  );
}

function CanvasField(props: {
  field: CanvasFieldId;
  title: string;
  prompt: string;
  remote: string;
  by: string | null;
  current: boolean;
  locked: boolean;
}) {
  const [text, setText] = useState(props.remote);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty = useRef(false);
  const focused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lo que llega del servidor reemplaza el texto solo si nadie está escribiendo aquí.
  useEffect(() => {
    if (!dirty.current && !focused.current) setText(props.remote);
  }, [props.remote]);

  const save = async (value: string) => {
    setState("saving");
    try {
      const r = await saveCanvasField(props.field, value);
      if (r.ok) {
        dirty.current = false;
        setState("saved");
        setError(null);
      } else {
        setState("error");
        setError(r.error);
      }
    } catch {
      setState("error");
      setError("Sin conexión: lo guardaremos cuando vuelva la señal.");
      timer.current = setTimeout(() => void save(value), 4000);
    }
  };

  const onChange = (value: string) => {
    setText(value);
    dirty.current = true;
    setState("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(value), SAVE_DELAY_MS);
  };

  return (
    <div className={`panel canvas-field ${props.current ? "current" : ""}`}>
      <div className="row between">
        <span className="label">{props.title}</span>
        {props.current && <span className="chip amber live"><span className="dot" />Ahora</span>}
      </div>
      <p className="hint" style={{ margin: 0 }}>{props.prompt}</p>
      <textarea
        className="textarea"
        value={text}
        maxLength={CANVAS_MAX}
        disabled={props.locked}
        placeholder="Escriban aquí…"
        onFocus={() => (focused.current = true)}
        onBlur={() => {
          focused.current = false;
          if (dirty.current) {
            if (timer.current) clearTimeout(timer.current);
            void save(text);
          }
        }}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="row between">
        <span className={`hint ${state === "error" ? "coral" : ""}`}>
          {state === "saving" && "Guardando…"}
          {state === "saved" && "Guardado ✓"}
          {state === "error" && error}
          {state === "idle" && (props.by ? `Última edición: ${props.by}` : "")}
        </span>
        <span className="hint mono">{text.length}/{CANVAS_MAX}</span>
      </div>
    </div>
  );
}
