import type { CanvasView } from "@/application/snapshot";
import { CANVAS_FIELDS } from "@/domain/data/canvas";
import { CASES } from "@/domain/data/catalog";

/** Lienzo de un grupo en solo lectura: proyector, Galería y panel docente. */
export function CanvasBoard({ canvas, size = "md" }: { canvas: CanvasView; size?: "sm" | "md" | "lg" }) {
  const company = CASES.find((c) => c.id === canvas.caseId);
  return (
    <article className={`canvas-board canvas-${size}`}>
      <header className="canvas-head">
        <span className="mono canvas-team">G·{canvas.label}</span>
        <span className="canvas-case">{company?.name}</span>
        <span className="chip">{canvas.filled}/{CANVAS_FIELDS.length} casillas</span>
      </header>
      <div className="canvas-grid-6">
        {CANVAS_FIELDS.map((f) => {
          const entry = canvas.fields[f.id];
          return (
            <section key={f.id} className={`canvas-cell-ro ${entry?.text.trim() ? "" : "is-empty"}`}>
              <span className="label">{f.level} · {f.title}</span>
              <p>{entry?.text.trim() || "Sin escribir"}</p>
            </section>
          );
        })}
      </div>
    </article>
  );
}
