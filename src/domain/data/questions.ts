import type { PopSection } from "./agenda";

export interface Question {
  id: string;
  text: string;
  options: [string, string, string, string];
  /** Índice de la opción correcta (0–3). */
  answer: 0 | 1 | 2 | 3;
  explanation: string;
}

/** Tiempo para responder una pregunta sorpresa. */
export const POP_SECONDS = 45;
/** Tiempo por pregunta del quiz final. */
export const QUIZ_SECONDS = 20;

export const POP_SECTIONS: Record<PopSection, string> = {
  fuente: "Fase 1 · Fuentes y KOSMOS TIC",
  nivel1: "Nivel 1 · Diagnóstico",
  nivel2: "Nivel 2 · Adquisición y ruta legal",
  nivel34: "Niveles 3 y 4 · Implementación y capacitación",
  nivel56: "Niveles 5 y 6 · Operación y fin de ciclo",
  kosmos: "Fase 3 · Después del invitado",
};

/** Banco de preguntas sorpresa, por bloque de la clase. */
export const POP_BANK: Record<PopSection, Question[]> = {
  fuente: [
    {
      id: "F1",
      text: "¿Cuál es la primera etapa del ciclo de vida de un recurso tecnológico?",
      options: ["Capacitación", "Identificación y diagnóstico", "Adquisición", "Mantenimiento"],
      answer: 1,
      explanation: "Todo empieza por entender la situación actual y las necesidades.",
    },
    {
      id: "F2",
      text: "Según su catálogo, ¿en qué se especializa KOSMOS TIC?",
      options: ["Venta de computadores", "Soluciones VoIP para empresas, call centers, contact centers y pymes", "Desarrollo de videojuegos", "Instalación de redes eléctricas"],
      answer: 1,
      explanation: "Así se presenta en la sección ¿Quiénes somos? del catálogo.",
    },
    {
      id: "F3",
      text: "¿Cuál es una fuente oficial para conocer a la empresa invitada?",
      options: ["Un comentario anónimo en redes", "El catálogo y el sitio web de la propia empresa", "Un foro sin autor", "Una respuesta de IA sin verificar"],
      answer: 1,
      explanation: "Las fuentes oficiales son las que publica la propia organización.",
    },
    {
      id: "F4",
      text: "¿En qué ciudad tiene su sede KOSMOS TIC?",
      options: ["Bogotá", "Medellín", "Manizales", "Pereira"],
      answer: 2,
      explanation: "Su sitio web y su catálogo la ubican en Manizales.",
    },
    {
      id: "F5",
      text: "¿Qué norma orienta la gestión de residuos de aparatos eléctricos y electrónicos (RAEE)?",
      options: ["Ley 1672 de 2013", "Ley 80 de 1993", "Ley 2300 de 2023", "Ley 1581 de 2012"],
      answer: 0,
      explanation: "La Ley 1672 de 2013 trata la gestión integral de los RAEE.",
    },
  ],
  nivel1: [
    {
      id: "N1A",
      text: "Hacer el inventario de la tecnología que tiene hoy la empresa corresponde a…",
      options: ["Detectar oportunidades", "Identificar la situación actual", "Dar de baja", "Capacitar"],
      answer: 1,
      explanation: "El inventario muestra qué hay y cómo funciona hoy.",
    },
    {
      id: "N1B",
      text: "“Los clientes no pueden comprar cuando la página se cae” describe…",
      options: ["Una necesidad específica", "Un método de adquisición", "Un mantenimiento preventivo", "Un retiro por daño"],
      answer: 0,
      explanation: "Es un problema concreto del negocio que la tecnología debe resolver.",
    },
    {
      id: "N1C",
      text: "Descubrir que los clientes ya escriben por WhatsApp y que se les puede atender por ahí es…",
      options: ["Una obsolescencia", "Una oportunidad tecnológica", "Un daño", "Una licitación"],
      answer: 1,
      explanation: "Es algo que existe y se puede aprovechar.",
    },
    {
      id: "N1D",
      text: "En las estrategias de servicio al cliente de KOSMOS TIC, ¿cuál es el paso 01?",
      options: ["Implementación", "Diagnóstico integral", "Medición de resultados", "Diseño de estrategia"],
      answer: 1,
      explanation: "Primero analizan los procesos actuales de atención.",
    },
    {
      id: "N1E",
      text: "¿Qué pregunta debe guiar el diagnóstico?",
      options: ["¿Qué marca es la más famosa?", "¿Qué problema del negocio queremos resolver?", "¿Cuál es el equipo más caro?", "¿Quién entrega más rápido?"],
      answer: 1,
      explanation: "La tecnología se elige por el problema, no por la moda.",
    },
  ],
  nivel2: [
    {
      id: "N2A",
      text: "Una licencia de software es un recurso…",
      options: ["Tangible", "Intangible", "Físico", "Consumible"],
      answer: 1,
      explanation: "No se puede tocar: es un derecho de uso.",
    },
    {
      id: "N2B",
      text: "Pagar mes a mes por usar un software en la nube es adquirir por…",
      options: ["Compra", "Donación", "Suscripción (SaaS)", "Leasing"],
      answer: 2,
      explanation: "Software como servicio: se paga por usarlo.",
    },
    {
      id: "N2C",
      text: "Una alcaldía que compra tecnología debe seguir…",
      options: ["La preferencia del jefe de sistemas", "La contratación estatal (Ley 80 de 1993 y Ley 1150 de 2007)", "El proveedor más barato sin proceso", "Ningún procedimiento"],
      answer: 1,
      explanation: "Las entidades públicas compran por contratación estatal.",
    },
    {
      id: "N2D",
      text: "El costo total de propiedad (TCO) incluye…",
      options: ["Solo el precio de compra", "Adquisición, operación, mantenimiento y retiro", "Solo los impuestos", "Solo la capacitación"],
      answer: 1,
      explanation: "Comprar es solo el comienzo.",
    },
    {
      id: "N2E",
      text: "Según KOSMOS TIC, una ventaja de sus sistemas SaaS es que…",
      options: ["Exigen comprar servidores propios", "Crecen con el negocio sin grandes inversiones iniciales en infraestructura", "Solo funcionan en una oficina", "No necesitan internet"],
      answer: 1,
      explanation: "Así lo dice su catálogo en Sistemas SaaS.",
    },
    {
      id: "N2F",
      text: "Según la Ley 2300 de 2023, un sábado se pueden enviar mensajes comerciales…",
      options: ["A cualquier hora", "Entre 8:00 a. m. y 3:00 p. m.", "Solo de noche", "Nunca"],
      answer: 1,
      explanation: "Sábados de 8:00 a. m. a 3:00 p. m.; domingos y festivos, nunca.",
    },
  ],
  nivel34: [
    {
      id: "N3A",
      text: "Decidir si un sistema vive en un servidor propio o en la nube es definir su…",
      options: ["Ubicación física o lógica", "Ruta legal", "Capacitación", "Retiro"],
      answer: 0,
      explanation: "Es parte de la implementación.",
    },
    {
      id: "N3B",
      text: "Según KOSMOS TIC, un número virtual DID permite…",
      options: ["Imprimir documentos", "Recibir llamadas por internet sin una línea física específica", "Enviar correos masivos", "Reemplazar el computador"],
      answer: 1,
      explanation: "Redirige las llamadas a un celular, computador o central IP.",
    },
    {
      id: "N3C",
      text: "¿A quién se orienta la capacitación?",
      options: ["Solo al gerente", "A quienes usarán, administrarán y darán soporte a la tecnología", "A los proveedores", "A nadie si es intuitiva"],
      answer: 1,
      explanation: "Cada rol necesita aprender algo distinto.",
    },
    {
      id: "N3D",
      text: "En el catálogo de KOSMOS TIC, un cliente cuenta que además de configurar el CRM, el equipo…",
      options: ["Les vendió computadores", "Les enseñó a aprovecharlo al máximo", "Les dio un descuento", "Cambió su logo"],
      answer: 1,
      explanation: "Capacitar es lo que convierte la compra en resultados.",
    },
    {
      id: "N3E",
      text: "Para KOSMOS TIC, la omnicanalidad es…",
      options: ["Tener muchos canales separados", "Una experiencia única y coherente sin importar cómo contacte el cliente", "Atender solo por teléfono", "Enviar SMS masivos"],
      answer: 1,
      explanation: "No es tener canales: es integrarlos.",
    },
    {
      id: "N3F",
      text: "Instalar y probar antes de que los usuarios empiecen a usarlo corresponde a…",
      options: ["Implementación y puesta en marcha", "Diagnóstico", "Desistimiento", "Adquisición"],
      answer: 0,
      explanation: "Nivel 3 del ciclo.",
    },
  ],
  nivel56: [
    {
      id: "N5A",
      text: "Cambiar una pieza antes de que falle, según un calendario, es mantenimiento…",
      options: ["Correctivo", "Preventivo", "Evolutivo", "De emergencia"],
      answer: 1,
      explanation: "Se adelanta a la falla.",
    },
    {
      id: "N5B",
      text: "Un equipo que funciona, pero ya no es compatible con el software que necesita la empresa, se retira por…",
      options: ["Daño", "Obsolescencia", "Robo", "Garantía"],
      answer: 1,
      explanation: "Sirve, pero ya no le sirve a la organización.",
    },
    {
      id: "N5C",
      text: "Antes de dar de baja un computador, ¿qué se debe hacer con la información?",
      options: ["Venderlo tal cual", "Borrar de forma segura los datos personales", "Dejarlo para el siguiente dueño", "Nada"],
      answer: 1,
      explanation: "La Ley 1581 de 2012 protege los datos personales.",
    },
    {
      id: "N5D",
      text: "El NPS, que KOSMOS TIC dice medir, es un indicador de…",
      options: ["Velocidad de internet", "Satisfacción y recomendación de los clientes", "Consumo eléctrico", "Precio del servicio"],
      answer: 1,
      explanation: "Net Promoter Score: ¿nos recomendarías?",
    },
    {
      id: "N5E",
      text: "¿Qué disponibilidad de soporte técnico anuncia el catálogo de KOSMOS TIC?",
      options: ["Solo los lunes", "24/7", "Solo por correo", "Una vez al mes"],
      answer: 1,
      explanation: "El catálogo anuncia soporte 24/7.",
    },
    {
      id: "N5F",
      text: "Según KOSMOS TIC, un SIP Trunk permite…",
      options: ["Eliminar las líneas telefónicas físicas usando internet", "Imprimir más rápido", "Reemplazar el CRM", "Cargar celulares"],
      answer: 0,
      explanation: "Conecta la central de la empresa a internet con el protocolo SIP.",
    },
  ],
  kosmos: [
    {
      id: "K1",
      text: "Según KOSMOS TIC, una IP PBX es…",
      options: ["Un cable de red", "Una central telefónica que opera en la nube y gestiona llamadas por red IP", "Un tipo de impresora", "Un antivirus"],
      answer: 1,
      explanation: "Así la define su catálogo.",
    },
    {
      id: "K2",
      text: "Los SMS masivos se usan principalmente para…",
      options: ["Notificaciones y campañas de marketing", "Reemplazar el correo interno", "Hacer copias de seguridad", "Configurar servidores"],
      answer: 0,
      explanation: "Así los describe el catálogo de KOSMOS TIC.",
    },
    {
      id: "K3",
      text: "¿Cuál es la misión publicada por KOSMOS TIC en su sitio web?",
      options: ["Vender el teléfono más barato", "Ser el aliado tecnológico que garantiza que tu empresa nunca deje de comunicarse", "Fabricar computadores", "Ser la red social más grande"],
      answer: 1,
      explanation: "Está en kosmostic.com.",
    },
    {
      id: "K4",
      text: "Las campañas masivas de voz envían…",
      options: ["Mensajes de voz pregrabados a muchos destinatarios a la vez", "Correos con imágenes", "Facturas impresas", "Videos en vivo"],
      answer: 0,
      explanation: "Recordatorios, alertas y anuncios.",
    },
  ],
};

/** Quiz final individual (reemplaza el Kahoot). */
export const FINAL_QUIZ: Question[] = [
  {
    id: "Q1",
    text: "¿Cuál es el orden correcto del ciclo de vida?",
    options: [
      "Adquisición → diagnóstico → retiro",
      "Diagnóstico → adquisición → implementación → capacitación → operación → retiro",
      "Capacitación → compra → diagnóstico",
      "Implementación → diagnóstico → retiro",
    ],
    answer: 1,
    explanation: "Seis etapas, de la identificación al fin de ciclo.",
  },
  { id: "Q2", text: "Una licencia de ERP es un recurso…", options: ["Tangible", "Intangible", "Desechable", "Físico"], answer: 1, explanation: "Es un derecho de uso." },
  {
    id: "Q3",
    text: "Arrendar equipos por un tiempo con opción de compra al final es…",
    options: ["Donación", "Leasing", "Suscripción SaaS", "Desarrollo propio"],
    answer: 1,
    explanation: "Leasing.",
  },
  {
    id: "Q4",
    text: "Una entidad pública colombiana compra tecnología siguiendo…",
    options: ["Su preferencia", "La contratación estatal", "El proveedor más rápido", "Nada especial"],
    answer: 1,
    explanation: "Ley 80 de 1993 y Ley 1150 de 2007.",
  },
  {
    id: "Q5",
    text: "Definir si un servidor estará en la oficina o en la nube corresponde a…",
    options: ["Diagnóstico", "Implementación y puesta en marcha", "Capacitación", "Desistimiento"],
    answer: 1,
    explanation: "Ubicación física o lógica.",
  },
  {
    id: "Q6",
    text: "El objetivo principal de la capacitación es…",
    options: ["Cumplir un requisito", "Aprovechar al máximo la inversión", "Reemplazar el soporte", "Reducir personal"],
    answer: 1,
    explanation: "Sin uso, la inversión no rinde.",
  },
  {
    id: "Q7",
    text: "Revisar y ajustar un sistema para mejorarlo, sin que haya fallado, es mantenimiento…",
    options: ["Correctivo", "Evolutivo", "De emergencia", "Ninguno"],
    answer: 1,
    explanation: "Evolutivo: mejora lo que ya funciona.",
  },
  {
    id: "Q8",
    text: "Servidor de 6 años sin fallas, pero sin actualizaciones de seguridad del fabricante. Se retira por…",
    options: ["Daño", "Obsolescencia", "Capacitación", "Garantía"],
    answer: 1,
    explanation: "Funciona, pero es un riesgo.",
  },
  {
    id: "Q9",
    text: "Una impresora cuya reparación cuesta más que una nueva se retira por…",
    options: ["Obsolescencia", "Daño", "Actualización", "Leasing"],
    answer: 1,
    explanation: "Retiro por daño.",
  },
  {
    id: "Q10",
    text: "La disposición de equipos electrónicos dados de baja se orienta por la normativa sobre…",
    options: ["Contratación estatal", "Residuos de aparatos eléctricos y electrónicos (RAEE)", "Propiedad intelectual", "Tránsito"],
    answer: 1,
    explanation: "Ley 1672 de 2013.",
  },
  {
    id: "Q11",
    text: "¿Qué servicio de KOSMOS TIC conecta la central telefónica de una empresa a internet con el protocolo SIP?",
    options: ["SMS masivos", "SIP Trunk", "Campañas de email", "Número DID"],
    answer: 1,
    explanation: "SIP Trunk.",
  },
  {
    id: "Q12",
    text: "Según la Ley 2300 de 2023, ¿cuándo NO se puede enviar un SMS comercial?",
    options: ["Un martes a las 10:00 a. m.", "Un domingo", "Un sábado a las 9:00 a. m.", "Un jueves a las 6:00 p. m."],
    answer: 1,
    explanation: "Domingos y festivos están prohibidos.",
  },
];

export const ALL_POP_QUESTIONS = Object.values(POP_BANK).flat();
export const findPopQuestion = (id: string) => ALL_POP_QUESTIONS.find((q) => q.id === id) ?? null;
