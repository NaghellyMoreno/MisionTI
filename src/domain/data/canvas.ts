/**
 * Lienzo digital: una casilla por nivel del ciclo de vida.
 * Reemplaza el pliego de papel; los grupos lo llenan desde el celular.
 */
export type CanvasFieldId = "diagnostico" | "adquisicion" | "implementacion" | "capacitacion" | "operacion" | "fin";

export interface CanvasField {
  id: CanvasFieldId;
  level: number;
  title: string;
  /** Qué debe responder el grupo en esa casilla. */
  prompt: string;
  /** Actividad del cronograma en la que se llena. */
  agenda: number;
}

export const CANVAS_MAX = 600;

export const CANVAS_FIELDS: CanvasField[] = [
  {
    id: "diagnostico",
    level: 1,
    title: "Identificación y diagnóstico",
    prompt: "Situación actual, tres necesidades específicas, una oportunidad tecnológica y el reto principal.",
    agenda: 4,
  },
  {
    id: "adquisicion",
    level: 2,
    title: "Análisis y adquisición",
    prompt: "Qué recursos compraron, con qué método y por qué ruta legal. ¿Por qué esos y no otros?",
    agenda: 6,
  },
  {
    id: "implementacion",
    level: 3,
    title: "Implementación",
    prompt: "Dónde queda cada recurso: ubicación física (sede, puesto) o lógica (red, nube).",
    agenda: 8,
  },
  {
    id: "capacitacion",
    level: 4,
    title: "Capacitación",
    prompt: "A quién capacitan, en qué temas y cómo se aseguran de que la inversión sí se use.",
    agenda: 8,
  },
  {
    id: "operacion",
    level: 5,
    title: "Operación y sostenibilidad",
    prompt: "Quién da soporte, cada cuánto hay mantenimiento y qué indicador revisarían.",
    agenda: 10,
  },
  {
    id: "fin",
    level: 6,
    title: "Fin de ciclo",
    prompt: "Cuándo darían de baja su recurso principal: ¿por daño o por obsolescencia? ¿Qué hacen con los datos y el equipo?",
    agenda: 10,
  },
];

export const findCanvasField = (id: string) => CANVAS_FIELDS.find((f) => f.id === id) ?? null;

/* ---------- Rúbrica (la califica José de 1 a 5 por criterio) ---------- */

export type CriterionId = "diagnostico" | "adquisicion" | "implementacion" | "capacitacion" | "operacion" | "presupuesto";

export interface Criterion {
  id: CriterionId;
  name: string;
  excellent: string;
  poor: string;
}

export const RUBRIC: Criterion[] = [
  { id: "diagnostico", name: "Diagnóstico", excellent: "Situación, necesidades, oportunidad y reto claros", poor: "Genérico o ausente" },
  { id: "adquisicion", name: "Adquisición y ruta legal", excellent: "Compras que responden al diagnóstico, con método y ruta justificados", poor: "Compras sin relación con el diagnóstico" },
  { id: "implementacion", name: "Implementación", excellent: "Ubicación física o lógica clara y viable", poor: "No se define" },
  { id: "capacitacion", name: "Capacitación", excellent: "A quién, qué y cómo, con estrategia de aprovechamiento", poor: "No se contempla" },
  { id: "operacion", name: "Operación y fin de ciclo", excellent: "Soporte, mantenimiento y criterio de baja claros", poor: "No se contempla" },
  { id: "presupuesto", name: "Presupuesto y crisis", excellent: "Prioriza con criterio y responde bien a las crisis", poor: "Presupuesto mal gestionado" },
];

export const RUBRIC_LEVELS = [1, 2, 3, 4, 5] as const;
