import type { SourceId } from "./sources";

export type SlideKind = "portada" | "concepto" | "kosmos" | "ley" | "actividad" | "mision" | "pausa";

export interface Slide {
  id: string;
  /** Actividad del cronograma a la que pertenece. */
  agenda: number;
  kind: SlideKind;
  kicker: string;
  title: string;
  lead?: string;
  points?: string[];
  /** Cita textual de una fuente oficial. */
  quote?: { text: string; cite: string };
  /** Grupos para quienes esta diapositiva es una pista de su pregunta al invitado. */
  clueFor?: string[];
  sources: SourceId[];
}

/**
 * Teoría de la clase y contextualización de KOSMOS TIC.
 * Las citas de la empresa son textuales del catálogo oficial y de kosmostic.com;
 * las de teoría, del documento maestro del MRAE v3.0 de MinTIC.
 */
export const SLIDES: Slide[] = [
  /* ---------- FASE 1 · FUENTE ---------- */
  {
    id: "alerta",
    agenda: 0,
    kind: "portada",
    kicker: "Fase 1 · Fuente",
    title: "Una empresa puede tener la mejor tecnología… y aun así fracasar.",
    lead: "Hoy su firma consultora va a rescatar una. Tienen 100 TecnoCoins, una empresa en crisis y tres horas.",
    sources: [],
  },
  {
    id: "que-es",
    agenda: 0,
    kind: "concepto",
    kicker: "El tema",
    title: "Gestionar recursos tecnológicos es acompañar la tecnología toda su vida en la organización",
    points: [
      "1 · Identificación y diagnóstico",
      "2 · Análisis y planeación de la adquisición",
      "3 · Implementación y puesta en marcha",
      "4 · Capacitación y aprovechamiento",
      "5 · Operación y sostenibilidad",
      "6 · Desistimiento y fin de ciclo",
    ],
    sources: ["iso19770", "mrae", "iso55000"],
  },
  {
    id: "fuentes",
    agenda: 1,
    kind: "concepto",
    kicker: "¿De dónde sale lo que verán hoy?",
    title: "Cuatro fuentes",
    points: [
      "Bibliografía: ISO/IEC 19770-1 (gestión de activos de TI), ISO 55000 (gestión de activos), ITIL 4, COBIT 2019 y NIST SP 800-88 (borrado seguro).",
      "Guía oficial colombiana: Marco de Referencia de Arquitectura Empresarial v3.0 de MinTIC (2023).",
      "Normativa: Ley 80 de 1993, Ley 1150 de 2007, Ley 1581 de 2012, Ley 1672 de 2013 y Ley 2300 de 2023.",
      "Empresa real: catálogo oficial y sitio web de KOSMOS TIC.",
      "Experto: KOSMOS TIC en vivo a las 2:47 p. m.",
    ],
    sources: ["iso19770", "iso55000", "itil", "cobit", "nist80088", "mrae", "catalogo", "web"],
  },
  {
    id: "expediente",
    agenda: 1,
    kind: "kosmos",
    kicker: "Expediente KOSMOS TIC",
    title: "La empresa que se conectará hoy",
    points: [
      "Empresa colombiana con sede en Manizales.",
      "Más de 15 años de experiencia en telecomunicaciones.",
      "Especializada en soluciones VoIP para empresas, call centers, contact centers y pymes.",
      "Con BU-TIC asesora en CRM y estrategia comercial.",
    ],
    quote: {
      text: "Ser el aliado tecnológico que garantiza que tu empresa nunca deje de comunicarse.",
      cite: "Misión publicada en kosmostic.com",
    },
    sources: ["catalogo", "web"],
  },
  {
    id: "mision-entrevista",
    agenda: 1,
    kind: "mision",
    kicker: "Su misión secreta",
    title: "Cada grupo llega a la entrevista con una pregunta",
    lead: "Durante la clase aparecerán pistas 🔎 sobre KOSMOS TIC. Cada grupo tiene un tema asignado en la pestaña Invitado de su celular. Escriban su pregunta allí antes de las 2:47 p. m.",
    sources: ["catalogo"],
  },

  /* ---------- FASE 2 · ENTREGA ---------- */
  {
    id: "juego",
    agenda: 2,
    kind: "actividad",
    kicker: "Mecánica del juego",
    title: "Ustedes son la firma consultora",
    points: [
      "Cada grupo recibe una empresa en crisis y 100 TecnoCoins.",
      "Compran recursos en el Mercado desde el celular, con ruta legal y justificación.",
      "Las cartas de crisis premian o castigan sus decisiones.",
      "Ojo: la app puede escoger a cualquiera para una pregunta sorpresa individual.",
    ],
    sources: [],
  },
  {
    id: "nivel1",
    agenda: 3,
    kind: "concepto",
    kicker: "Nivel 1",
    title: "Identificación y diagnóstico",
    lead: "Antes de comprar nada: ¿qué problema del negocio queremos resolver?",
    points: [
      "Situación actual: inventario de lo que hay y cómo funciona.",
      "Necesidades específicas: lo que hoy le cuesta dinero, tiempo o clientes.",
      "Oportunidades tecnológicas: lo que se puede aprovechar.",
      "Retos de la organización: lo que puede frenar el cambio.",
    ],
    quote: {
      text: "…su situación actual (línea base), que corresponde a la forma como opera en el presente la entidad…",
      cite: "MinTIC · MRAE v3.0 (2023), dominio de arquitectura institucional",
    },
    sources: ["mrae", "iso19770"],
  },
  {
    id: "nivel1-kosmos",
    agenda: 3,
    kind: "kosmos",
    kicker: "Así lo hace KOSMOS TIC",
    title: "Su método empieza por un diagnóstico",
    quote: {
      text: "Diagnóstico Integral: Analizamos tus procesos actuales de atención para identificar oportunidades de mejora.",
      cite: "Catálogo KOSMOS TIC y BU-TIC · Estrategias de Servicio al Cliente, paso 01",
    },
    points: ["Después vienen: diseño de estrategia, implementación y medición de resultados."],
    clueFor: ["EQ01"],
    sources: ["catalogo"],
  },
  {
    id: "lienzo1",
    agenda: 4,
    kind: "actividad",
    kicker: "Manos a la obra",
    title: "Diagnóstico de su empresa en el lienzo",
    points: [
      "¿Cuál es la situación actual?",
      "Tres necesidades específicas.",
      "Una oportunidad tecnológica.",
      "El reto principal.",
    ],
    sources: [],
  },
  {
    id: "nivel2",
    agenda: 5,
    kind: "concepto",
    kicker: "Nivel 2",
    title: "Análisis y planeación de la adquisición",
    points: [
      "Recursos tangibles (equipos, red) e intangibles (licencias, servicios, conocimiento).",
      "Cómo afianzar el entorno tecnológico que ya existe.",
      "Qué adquirir y con qué método: compra, leasing, suscripción, desarrollo o donación.",
      "Costo total de propiedad: comprar es solo el comienzo; también cuestan la operación, el mantenimiento y el retiro.",
    ],
    quote: {
      text: "…dando prioridad a adquisiciones en modalidad de servicio o por demanda y propendiendo por minimizar la compra de bienes de hardware.",
      cite: "MinTIC · MRAE v3.0 (2023), lineamiento MGGTI.LI.GO.06",
    },
    sources: ["mrae", "iso55000", "itil"],
  },
  {
    id: "ruta-legal",
    agenda: 5,
    kind: "ley",
    kicker: "La ruta legal",
    title: "No todas las empresas compran igual",
    points: [
      "Empresa privada: orden de compra o contrato entre particulares.",
      "Entidad pública: contratación estatal (Ley 80 de 1993 y Ley 1150 de 2007): licitación pública, selección abreviada, concurso de méritos o contratación directa.",
      "Compras pequeñas del Estado: mínima cuantía (Ley 1474 de 2011, art. 94).",
    ],
    sources: ["ley80", "ley1474"],
  },
  {
    id: "nivel2-kosmos",
    agenda: 5,
    kind: "kosmos",
    kicker: "Así lo hace KOSMOS TIC",
    title: "Suscribirse en lugar de comprar servidores",
    quote: {
      text: "Sistemas en la nube que crecen con tu negocio, sin necesidad de grandes inversiones iniciales en infraestructura.",
      cite: "Catálogo KOSMOS TIC y BU-TIC · Sistemas SaaS para Gestión Comercial",
    },
    points: ["Su IP PBX es una central telefónica que opera en la nube."],
    clueFor: ["EQ02", "EQ14"],
    sources: ["catalogo"],
  },
  {
    id: "ley2300",
    agenda: 5,
    kind: "ley",
    kicker: "Ruta legal en comunicaciones",
    title: "Ley 2300 de 2023: “Dejen de fregar”",
    lead: "KOSMOS TIC vende SMS masivos y campañas de voz y de email. Esta ley dice cuándo se pueden usar con fines comerciales.",
    points: [
      "Aplica a SMS, mensajería por aplicaciones o web, correos electrónicos y llamadas.",
      "Lunes a viernes, de 7:00 a. m. a 7:00 p. m.; sábados, de 8:00 a. m. a 3:00 p. m.",
      "Nunca domingos ni festivos, y no más de un contacto al día.",
    ],
    clueFor: ["EQ06"],
    sources: ["ley2300", "catalogo"],
  },
  {
    id: "mercado",
    agenda: 6,
    kind: "actividad",
    kicker: "Mercado Tecnológico",
    title: "El mercado está abierto",
    points: [
      "Elijan el recurso, la ruta legal y escriban por qué lo necesitan.",
      "El presupuesto no alcanza para todo: prioricen según su diagnóstico.",
      "Las crisis vienen en camino.",
    ],
    sources: [],
  },
  {
    id: "nivel3",
    agenda: 7,
    kind: "concepto",
    kicker: "Nivel 3",
    title: "Implementación y puesta en marcha",
    points: [
      "Ubicación física: sede, oficina, centro de datos, puesto de trabajo.",
      "Ubicación lógica: red, nube, segmentos, permisos.",
      "Configurar, instalar y probar antes de entregarlo a los usuarios.",
    ],
    quote: {
      text: "…durante la implementación y paso a producción de los servicios de TI, se debe garantizar la estabilidad de la operación de TI…",
      cite: "MinTIC · MRAE v3.0 (2023), lineamiento MGGTI.LI.ST.02",
    },
    sources: ["mrae", "itil"],
  },
  {
    id: "nivel3-kosmos",
    agenda: 7,
    kind: "kosmos",
    kicker: "Así lo hace KOSMOS TIC",
    title: "Tecnología sin un lugar físico fijo",
    quote: {
      text: "Un número virtual DID (Direct Inward Dialing) es un número telefónico sin línea física específica que permite recibir llamadas globales a través de internet.",
      cite: "Catálogo KOSMOS TIC y BU-TIC · Números virtuales DID",
    },
    points: [
      "Omnicanalidad: WhatsApp, chat web, correo y redes en una sola plataforma.",
      "“Conectamos nuestras soluciones con tus sistemas existentes para una operación fluida y sin interrupciones.”",
    ],
    clueFor: ["EQ04", "EQ05"],
    sources: ["catalogo"],
  },
  {
    id: "nivel4",
    agenda: 7,
    kind: "concepto",
    kicker: "Nivel 4",
    title: "Capacitación y aprovechamiento",
    points: [
      "¿A quién? Usuarios finales, administradores y personal de soporte.",
      "¿Qué temas? Lo que cada rol necesita para hacer su trabajo.",
      "¿Cómo sacarle el máximo partido? Formación por roles, multiplicadores internos y medir el uso real.",
      "Gestión del cambio cada vez que se adquiere o despliega una solución nueva.",
    ],
    quote: {
      text: "…define y desarrolla acciones para movilizar a los grupos de interés buscando impulsar la adopción de las facilidades y servicios de tecnología…",
      cite: "MinTIC · MRAE v3.0 (2023), dominio de Uso y Apropiación de TI",
    },
    sources: ["mrae", "itil"],
  },
  {
    id: "nivel4-kosmos",
    agenda: 7,
    kind: "kosmos",
    kicker: "Así lo hace KOSMOS TIC",
    title: "Configurar no basta: hay que enseñar",
    quote: {
      text: "Capacitación Especializada: Formamos a tu equipo con programas personalizados para maximizar el uso de las herramientas tecnológicas.",
      cite: "Catálogo KOSMOS TIC y BU-TIC · Asesorías en CRM",
    },
    points: ["Un cliente cuenta en el catálogo que el equipo “no solo configuró el sistema, sino que nos enseñó a aprovecharlo al máximo”."],
    clueFor: ["EQ07"],
    sources: ["catalogo"],
  },
  {
    id: "lienzo2",
    agenda: 8,
    kind: "actividad",
    kicker: "Manos a la obra",
    title: "¿Dónde queda cada recurso y a quién capacitan?",
    points: ["Dibujen la ubicación física o lógica.", "Definan a quién capacitar, en qué y cómo."],
    sources: [],
  },
  {
    id: "nivel5",
    agenda: 9,
    kind: "concepto",
    kicker: "Nivel 5",
    title: "Operación y sostenibilidad",
    points: [
      "Soporte técnico: una mesa de servicio como único punto de contacto, con soporte de primer, segundo y tercer nivel.",
      "Mantenimiento preventivo (antes de que falle), correctivo (cuando falla) y evolutivo (para mejorar).",
      "Administración: inventario, licencias, contratos con acuerdos de nivel de servicio (ANS) e indicadores durante toda su estadía.",
    ],
    quote: {
      text: "…debe implementar un plan de mantenimiento preventivo y evolutivo sobre toda la infraestructura y demás Servicios Tecnológicos…",
      cite: "MinTIC · MRAE v3.0 (2023), lineamiento MGGTI.LI.ST.09",
    },
    sources: ["mrae", "itil", "iso55000"],
  },
  {
    id: "nivel5-kosmos",
    agenda: 9,
    kind: "kosmos",
    kicker: "Así lo hace KOSMOS TIC",
    title: "Soporte continuo y medición",
    quote: {
      text: "Acompañamiento técnico permanente con actualizaciones automáticas y mantenimiento incluido.",
      cite: "Catálogo KOSMOS TIC y BU-TIC · Sistemas SaaS",
    },
    points: [
      "El catálogo anuncia soporte 24/7.",
      "Miden KPIs: tiempos de respuesta, satisfacción de clientes y NPS.",
    ],
    clueFor: ["EQ09", "EQ10"],
    sources: ["catalogo"],
  },
  {
    id: "nivel6",
    agenda: 9,
    kind: "concepto",
    kicker: "Nivel 6",
    title: "Desistimiento y fin de ciclo",
    points: [
      "Retiro por daño: no funciona y repararlo no es rentable.",
      "Retiro por obsolescencia: funciona, pero ya no le sirve a la organización (sin soporte del fabricante, incompatible o ineficiente).",
      "Antes de retirarlo: borrado seguro de los medios, para que recuperar los datos sea inviable (NIST SP 800-88), y protección de los datos personales (Ley 1581 de 2012).",
      "Después: disposición responsable como RAEE (Ley 1672 de 2013).",
    ],
    quote: {
      text: "…debe gestionar la correcta disposición de residuos tecnológicos de acuerdo con el Plan Institucional de Gestión Ambiental…",
      cite: "MinTIC · MRAE v3.0 (2023), lineamiento MGGTI.LI.ST.12",
    },
    sources: ["mrae", "nist80088", "ley1581", "ley1672"],
  },
  {
    id: "nivel6-kosmos",
    agenda: 9,
    kind: "kosmos",
    kicker: "Así lo hace KOSMOS TIC",
    title: "Adiós a las líneas físicas",
    quote: {
      text: "Facilita el envío y recepción de llamadas vía IP, eliminando las líneas físicas y usando Internet como medio de conexión.",
      cite: "Catálogo KOSMOS TIC y BU-TIC · SIP Trunk",
    },
    points: [
      "¿Qué pasa con las centrales telefónicas tradicionales cuando una empresa migra a IP?",
      "El catálogo promete “protección de datos con estándares internacionales”.",
    ],
    clueFor: ["EQ11", "EQ12"],
    sources: ["catalogo"],
  },
  {
    id: "lienzo3",
    agenda: 10,
    kind: "actividad",
    kicker: "Manos a la obra",
    title: "Soporte, mantenimiento y criterio de baja",
    points: ["¿Quién da soporte y cada cuánto se hace mantenimiento?", "¿Cuándo darían de baja su recurso principal: por daño u obsolescencia?"],
    sources: [],
  },
  {
    id: "pausa",
    agenda: 11,
    kind: "pausa",
    kicker: "Pausa activa",
    title: "60 segundos: todos de pie",
    points: ["Brazos arriba y estiren.", "Giren el cuello despacio.", "Choquen la mano con alguien de otro grupo."],
    sources: [],
  },

  /* ---------- FASE 3 · INVITADO ---------- */
  {
    id: "afinar",
    agenda: 12,
    kind: "mision",
    kicker: "Últimos 5 minutos",
    title: "Afinen su pregunta para KOSMOS TIC",
    points: [
      "Revisen la pista de su tema en la pestaña Invitado.",
      "Una sola pregunta, de máximo 30 segundos.",
      "Conéctenla con su empresa del juego: así será más interesante.",
    ],
    sources: ["catalogo"],
  },
  {
    id: "en-vivo",
    agenda: 13,
    kind: "portada",
    kicker: "Fase 3 · Invitado experto",
    title: "Conexión en vivo con KOSMOS TIC",
    lead: "Entrevista tipo podcast por Google Meet. Las preguntas de los grupos van en orden del ciclo de vida: del diagnóstico al fin de ciclo.",
    sources: ["web"],
  },

  /* ---------- FASE 4 · EVALUACIÓN ---------- */
  {
    id: "semaforo",
    agenda: 14,
    kind: "actividad",
    kicker: "Fase 4 · Evaluación",
    title: "Juego Semáforo",
    points: ["Verde: mantener.", "Amarillo: soporte o mantenimiento.", "Rojo: dar de baja (¿por daño u obsolescencia?)."],
    sources: [],
  },
  {
    id: "galeria",
    agenda: 15,
    kind: "actividad",
    kicker: "Fase 4 · Evaluación",
    title: "Galería",
    points: ["Recorran los lienzos.", "Cada grupo vota por los 2 mejores, sin contar el propio."],
    sources: [],
  },
  {
    id: "quiz",
    agenda: 16,
    kind: "actividad",
    kicker: "Fase 4 · Evaluación",
    title: "Quiz final individual",
    points: ["12 preguntas en su celular.", "Acertar rápido da más puntos."],
    sources: [],
  },
  {
    id: "cierre",
    agenda: 17,
    kind: "portada",
    kicker: "Cierre",
    title: "La tecnología no se compra: se gestiona de principio a fin.",
    lead: "¿Qué cambiarían de su lienzo después de escuchar a KOSMOS TIC?",
    sources: ["iso19770", "mrae"],
  },
];

export const firstSlideOf = (agendaIndex: number) => {
  const i = SLIDES.findIndex((s) => s.agenda === agendaIndex);
  return i === -1 ? null : i;
};
