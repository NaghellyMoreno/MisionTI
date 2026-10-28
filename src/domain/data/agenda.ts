export type Phase = "Fuente" | "Entrega" | "Invitado" | "Evaluación" | "Pausa";

export interface AgendaItem {
  title: string;
  minutes: number;
  phase: Phase;
  lead: string;
}

/** Cronograma de la versión de 3 horas de la propuesta. */
export const AGENDA: AgendaItem[] = [
  { title: "Alerta Roja", minutes: 10, phase: "Fuente", lead: "José" },
  { title: "Mapa de fuentes", minutes: 5, phase: "Fuente", lead: "José" },
  { title: "Mecánica del juego", minutes: 5, phase: "Entrega", lead: "Dylber" },
  { title: "Nivel 1 · Identificación y diagnóstico", minutes: 8, phase: "Entrega", lead: "Karen" },
  { title: "Diagnóstico en el lienzo", minutes: 10, phase: "Entrega", lead: "Karen" },
  { title: "Nivel 2 · Análisis y adquisición", minutes: 8, phase: "Entrega", lead: "Karen" },
  { title: "Mercado Tecnológico", minutes: 15, phase: "Entrega", lead: "Karen · Dylber" },
  { title: "Niveles 3 y 4 · Implementación y capacitación", minutes: 8, phase: "Entrega", lead: "Dylber" },
  { title: "Ubicación y plan de capacitación", minutes: 12, phase: "Entrega", lead: "Dylber" },
  { title: "Niveles 5 y 6 · Operación y fin de ciclo", minutes: 8, phase: "Entrega", lead: "Camila" },
  { title: "Soporte, mantenimiento y criterio de baja", minutes: 7, phase: "Entrega", lead: "Camila" },
  { title: "Descanso", minutes: 10, phase: "Pausa", lead: "—" },
  { title: "Conexión en vivo · Invitado experto", minutes: 35, phase: "Invitado", lead: "Camila · José" },
  { title: "Juego Semáforo", minutes: 12, phase: "Evaluación", lead: "Camila" },
  { title: "Galería", minutes: 8, phase: "Evaluación", lead: "José" },
  { title: "Kahoot individual", minutes: 12, phase: "Evaluación", lead: "Camila" },
  { title: "Cierre y premiación", minutes: 7, phase: "Evaluación", lead: "José" },
];
