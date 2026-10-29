import type { Slide } from "@/domain/data/lessons";
import { SOURCES } from "@/domain/data/sources";

const KIND_LABEL: Record<Slide["kind"], string> = {
  portada: "",
  concepto: "Teoría",
  kosmos: "Expediente KOSMOS TIC",
  ley: "Normativa",
  actividad: "Actividad",
  mision: "Misión",
  pausa: "Pausa activa",
};

/** Una diapositiva de teoría. La misma pieza sirve para proyector, celular y vista previa. */
export function SlideView({ slide, size = "md", clue }: { slide: Slide; size?: "sm" | "md" | "lg"; clue?: boolean }) {
  return (
    <article className={`slide slide-${slide.kind} slide-${size}`}>
      <header className="slide-head">
        <span className="label">{slide.kicker}</span>
        {KIND_LABEL[slide.kind] && slide.kind !== "concepto" && <span className={`chip slide-tag tag-${slide.kind}`}>{KIND_LABEL[slide.kind]}</span>}
        {clue && <span className="chip amber live"><span className="dot" />Pista para su pregunta</span>}
      </header>
      <h2 className="slide-title">{slide.title}</h2>
      {slide.lead && <p className="slide-lead">{slide.lead}</p>}
      {slide.quote && (
        <blockquote className="slide-quote">
          <p>“{slide.quote.text}”</p>
          <cite>{slide.quote.cite}</cite>
        </blockquote>
      )}
      {slide.points && (
        <ul className="slide-points">
          {slide.points.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {slide.sources.length > 0 && (
        <footer className="slide-sources">
          Fuente{slide.sources.length > 1 ? "s" : ""}: {slide.sources.map((id) => SOURCES[id].short).join(" · ")}
        </footer>
      )}
    </article>
  );
}
