import type { SourceId } from "./sources";

export interface GuestTopic {
  teamId: string;
  /** Nivel del ciclo: define el orden de la entrevista. */
  level: number;
  levelName: string;
  topic: string;
  /** Pista con fuente oficial para inspirar la pregunta (no es la pregunta). */
  clue: string;
  sources: SourceId[];
}

export const GUEST_MEETING = {
  company: "KOSMOS TIC S.A.S. y BU-TIC",
  channel: "Google Meet",
  start: "2:47 p. m.",
  maxQuestionSeconds: 30,
};

/**
 * Tema de entrevista de cada grupo. Cada uno cubre una etapa distinta del ciclo,
 * así las preguntas no se repiten y la entrevista recorre el tema completo.
 */
export const GUEST_TOPICS: GuestTopic[] = [
  {
    teamId: "EQ01",
    level: 1,
    levelName: "Diagnóstico",
    topic: "Cómo hacen el diagnóstico integral de un cliente",
    clue: "Su método empieza con un “Diagnóstico Integral: analizamos tus procesos actuales de atención para identificar oportunidades de mejora”.",
    sources: ["catalogo"],
  },
  {
    teamId: "EQ02",
    level: 2,
    levelName: "Adquisición",
    topic: "Suscripción en la nube frente a comprar infraestructura propia",
    clue: "El catálogo ofrece sistemas SaaS “sin necesidad de grandes inversiones iniciales en infraestructura”.",
    sources: ["catalogo"],
  },
  {
    teamId: "EQ06",
    level: 2,
    levelName: "Ruta legal",
    topic: "Cómo cumplen la Ley 2300 de 2023 en SMS y campañas masivas",
    clue: "Venden SMS masivos y campañas de voz y email; la Ley 2300 de 2023 limita horarios y frecuencia del contacto comercial.",
    sources: ["catalogo", "ley2300"],
  },
  {
    teamId: "EQ04",
    level: 3,
    levelName: "Implementación",
    topic: "Números virtuales DID para atender clientes de otros países",
    clue: "Un DID es “un número telefónico sin línea física específica que permite recibir llamadas globales a través de internet”.",
    sources: ["catalogo"],
  },
  {
    teamId: "EQ05",
    level: 3,
    levelName: "Implementación",
    topic: "Integrar WhatsApp, chat web, correo y redes en una sola plataforma",
    clue: "“La omnicanalidad no es solo tener múltiples canales, es crear una experiencia única y coherente”.",
    sources: ["catalogo"],
  },
  {
    teamId: "EQ07",
    level: 4,
    levelName: "Capacitación",
    topic: "Cómo capacitan a los equipos para que sí usen el CRM",
    clue: "Ofrecen “Capacitación Especializada… para maximizar el uso de las herramientas tecnológicas”.",
    sources: ["catalogo"],
  },
  {
    teamId: "EQ09",
    level: 5,
    levelName: "Operación",
    topic: "Cómo sostienen un soporte 24/7",
    clue: "El catálogo anuncia soporte 24/7 y “acompañamiento técnico permanente con actualizaciones automáticas”.",
    sources: ["catalogo"],
  },
  {
    teamId: "EQ10",
    level: 5,
    levelName: "Sostenibilidad",
    topic: "Qué indicadores miden para saber si una solución funciona",
    clue: "Monitorean “KPIs clave: tiempos de respuesta, satisfacción de clientes y NPS”.",
    sources: ["catalogo"],
  },
  {
    teamId: "EQ12",
    level: 5,
    levelName: "Seguridad",
    topic: "Cómo protegen los datos de los clientes de sus clientes",
    clue: "Prometen “protección de datos con estándares internacionales”; en Colombia rige la Ley 1581 de 2012.",
    sources: ["catalogo", "ley1581"],
  },
  {
    teamId: "EQ11",
    level: 6,
    levelName: "Fin de ciclo",
    topic: "Qué pasa con las centrales y líneas físicas cuando una empresa migra a IP",
    clue: "El SIP Trunk funciona “eliminando las líneas físicas y usando Internet como medio de conexión”.",
    sources: ["catalogo", "ley1672"],
  },
  {
    teamId: "EQ14",
    level: 6,
    levelName: "Pymes",
    topic: "Qué le recomendarían a un negocio de una sola persona",
    clue: "Atienden “empresas, Call Centers, Contact Centers y Pymes” con un “enfoque minimalista”.",
    sources: ["catalogo"],
  },
];

export const guestTopicOf = (teamId: string) => GUEST_TOPICS.find((t) => t.teamId === teamId) ?? null;
