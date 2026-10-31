export type Phase = "Fuente" | "Entrega" | "Invitado" | "Evaluación" | "Pausa";

/** Bancos de preguntas sorpresa (ver questions.ts). */
export type PopSection = "fuente" | "nivel1" | "nivel2" | "nivel34" | "nivel56" | "kosmos";

export interface AgendaItem {
  title: string;
  minutes: number;
  phase: Phase;
  lead: string;
  /** Banco sugerido para lanzar una pregunta sorpresa al cerrar este bloque. */
  pop?: PopSection;
  /** Nota para mantener la energía (la clase es después de almorzar). */
  energy?: string;
}

/** Hora de inicio de la clase: martes 4 de noviembre, 1:00 p. m. */
export const CLASS_START = { hour: 13, minute: 0 };
export const CLASS_DATE = "2026-11-04";

/** Cronograma de 3 horas (1:00 a 4:00 p. m.) con 5 minutos de holgura al final. */
export const AGENDA: AgendaItem[] = [
  { title: "Alerta Roja", minutes: 10, phase: "Fuente", lead: "José", energy: "Arranque con video y sonido: nada de sentarse a escuchar." },
  { title: "Fuentes y expediente KOSMOS TIC", minutes: 7, phase: "Fuente", lead: "José", pop: "fuente" },
  { title: "Mecánica del juego", minutes: 5, phase: "Entrega", lead: "Dylber" },
  { title: "Nivel 1 · Identificación y diagnóstico", minutes: 8, phase: "Entrega", lead: "Karen", pop: "nivel1" },
  { title: "Diagnóstico en el lienzo", minutes: 8, phase: "Entrega", lead: "Karen", energy: "Lienzo en el celular: uno dicta, otro escribe, y rotan en cada casilla." },
  { title: "Nivel 2 · Análisis y adquisición", minutes: 8, phase: "Entrega", lead: "Karen", pop: "nivel2" },
  { title: "Mercado Tecnológico", minutes: 15, phase: "Entrega", lead: "Karen · Dylber", energy: "Carta de crisis en el minuto 8." },
  { title: "Niveles 3 y 4 · Implementación y capacitación", minutes: 8, phase: "Entrega", lead: "Dylber", pop: "nivel34" },
  { title: "Ubicación y plan de capacitación", minutes: 10, phase: "Entrega", lead: "Dylber", energy: "Segunda carta de crisis." },
  { title: "Niveles 5 y 6 · Operación y fin de ciclo", minutes: 8, phase: "Entrega", lead: "Camila", pop: "nivel56" },
  { title: "Soporte, mantenimiento y criterio de baja", minutes: 7, phase: "Entrega", lead: "Camila" },
  { title: "Pausa activa y descanso", minutes: 8, phase: "Pausa", lead: "—", energy: "60 segundos de estiramiento guiado antes de soltar el descanso." },
  { title: "Afinen su pregunta para KOSMOS TIC", minutes: 5, phase: "Invitado", lead: "Camila" },
  { title: "Conexión en vivo · KOSMOS TIC", minutes: 30, phase: "Invitado", lead: "Camila · José", pop: "kosmos" },
  { title: "Juego Semáforo", minutes: 10, phase: "Evaluación", lead: "Camila", energy: "De pie: cada grupo vota y levanta el celular con su color." },
  { title: "Galería", minutes: 6, phase: "Evaluación", lead: "José", energy: "El vocero de cada grupo defiende su lienzo de pie en 20 segundos." },
  { title: "Quiz final", minutes: 12, phase: "Evaluación", lead: "Camila" },
  { title: "Notas, premiación y cierre", minutes: 10, phase: "Evaluación", lead: "José" },
];

/** Hora de inicio de cada actividad, en formato 1:17 p. m. */
export function agendaClock(index: number): string {
  const offset = AGENDA.slice(0, index).reduce((sum, a) => sum + a.minutes, 0);
  const total = CLASS_START.hour * 60 + CLASS_START.minute + offset;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${h >= 12 ? "p. m." : "a. m."}`;
}
