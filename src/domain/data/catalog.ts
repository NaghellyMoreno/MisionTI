import type { CatalogItem, CompanyCase, LegalRoute } from "../types";

export const INITIAL_BALANCE = 100;

export const CATALOG: CatalogItem[] = [
  { id: "servidor", name: "Servidor físico", method: "Compra", price: 40, tags: ["tangible"] },
  { id: "nube", name: "Servicios en la nube · 1 año", method: "Suscripción SaaS / IaaS", price: 25, tags: ["intangible"] },
  { id: "erp", name: "Licencia de ERP", method: "Compra de licencia", price: 30, tags: ["intangible"] },
  { id: "desarrollo", name: "Software a la medida", method: "Desarrollo propio o contratado", price: 45, tags: ["intangible"] },
  { id: "pcs-compra", name: "Lote de 10 computadores", method: "Compra", price: 35, tags: ["tangible"] },
  { id: "pcs-leasing", name: "Lote de 10 computadores", method: "Leasing", price: 20, tags: ["tangible"], note: "Incluye reposición al final del contrato" },
  { id: "red", name: "Red y conectividad", method: "Compra e instalación", price: 20, tags: ["tangible"] },
  { id: "respaldo", name: "Sistema de respaldo de datos", method: "Suscripción", price: 10, tags: ["intangible", "respaldo"] },
  { id: "capacitacion", name: "Programa de capacitación", method: "Contratación de servicio", price: 10, tags: ["intangible", "capacitacion"] },
  { id: "soporte", name: "Soporte técnico · 1 año", method: "Contratación de servicio", price: 15, tags: ["intangible", "soporte"] },
  { id: "donados", name: "Equipos donados", method: "Donación", price: 0, tags: ["tangible"], note: "Sin garantía" },
];

export const CASES: CompanyCase[] = [
  {
    id: "clinica",
    name: "Clínica Santa Ana",
    sector: "Salud",
    situation: "Historias clínicas en papel, citas por teléfono y un solo computador por piso.",
    profile: "Clínica privada de mediana complejidad con unos 60 empleados. Atiende consultas, urgencias básicas y laboratorio a pacientes del municipio y de veredas cercanas.",
    problems: [
      "Las historias clínicas están en papel: se pierden, se duplican y tardan en encontrarse.",
      "Las citas se asignan por teléfono y hay pacientes que llegan sin cupo.",
      "Hay un solo computador por piso, así que el personal hace fila para registrar atenciones.",
      "Los datos de salud son sensibles y hoy no tienen ninguna protección ni respaldo.",
    ],
    challenge: "Digitalizar la atención sin parar la clínica: decidan qué comprar primero, cómo se capacita al personal médico y cómo se protegen los datos de los pacientes.",
    isPublic: false,
  },
  {
    id: "colegio",
    name: "Colegio Rural La Esperanza",
    sector: "Educación",
    situation: "Sin conectividad estable, equipos donados sin mantenimiento y docentes sin formación digital.",
    profile: "Colegio público rural con unos 180 estudiantes de primaria y bachillerato y 9 docentes. Está lejos del casco urbano y depende de recursos limitados.",
    problems: [
      "La conexión a internet es inestable o no existe en varias aulas.",
      "Los equipos donados no tienen garantía ni mantenimiento y varios ya no encienden.",
      "Los docentes no han recibido formación para usar herramientas digitales en clase.",
      "No hay una persona responsable del soporte técnico.",
    ],
    challenge: "Lograr que la tecnología se use de verdad en el aula: piensen en conectividad, mantenimiento y, sobre todo, capacitación para que el recurso no quede guardado.",
    isPublic: false,
  },
  {
    id: "cafe",
    name: "Café de Origen Exportadora",
    sector: "Agroexportación",
    situation: "ERP de hace 12 años sin soporte del fabricante; los pedidos internacionales se pierden.",
    profile: "Empresa exportadora de café especial con unos 45 empleados, que vende a compradores en Europa y Estados Unidos y trabaja con fincas de pequeños productores.",
    problems: [
      "El ERP tiene 12 años y el fabricante ya no da soporte ni actualizaciones.",
      "Los pedidos internacionales se pierden o se registran con errores.",
      "La información de inventario y de despachos no está sincronizada entre áreas.",
      "Si el sistema falla, nadie sabe cómo recuperar los datos.",
    ],
    challenge: "Reemplazar o modernizar el sistema sin interrumpir las exportaciones: justifiquen la adquisición, la migración de datos y el plan para retirar el ERP viejo.",
    isPublic: false,
  },
  {
    id: "tiendaya",
    name: "TiendaYa",
    sector: "Comercio electrónico",
    situation: "La página se cae en temporada alta; no hay respaldo de datos ni plan de contingencia.",
    profile: "Tienda virtual de ropa y accesorios con unos 20 empleados, que vende en todo el país y recibe la mayoría de sus ventas en pocas semanas del año.",
    problems: [
      "La página se cae en temporada alta (Black Friday, Navidad) y se pierden ventas.",
      "No hay copias de seguridad de pedidos ni de clientes.",
      "No existe un plan de contingencia si el servidor o el proveedor fallan.",
      "El soporte a clientes se hace con herramientas sueltas y sin registro.",
    ],
    challenge: "Garantizar que la tienda venda cuando más se necesita: prioricen capacidad, respaldo y continuidad del servicio antes que lo vistoso.",
    isPublic: false,
  },
  {
    id: "alcaldia",
    name: "Alcaldía de Villa Verde",
    sector: "Sector público",
    situation: "Trámites presenciales y servidores sobrecalentados. Toda compra sigue la contratación pública.",
    profile: "Alcaldía de un municipio pequeño con unos 80 funcionarios. Presta trámites a la ciudadanía como impuestos, licencias y certificados.",
    problems: [
      "Casi todos los trámites son presenciales y generan filas y demoras.",
      "Los servidores están sobrecalentados y fallan con frecuencia.",
      "Toda compra debe seguir la contratación pública, con su ruta legal y sus tiempos.",
      "La información de la ciudadanía no tiene respaldo ni controles de acceso claros.",
    ],
    challenge: "Modernizar el servicio a la ciudadanía cumpliendo la ley: además de qué comprar, elijan la ruta legal de contratación y justifíquenla.",
    isPublic: true,
  },
  {
    id: "rincon",
    name: "Papelería El Rincón Digital",
    sector: "Emprendimiento unipersonal",
    situation:
      "La dueña atiende sola la papelería y café internet del pueblo: dos computadores viejos, una impresora que falla, ventas anotadas en un cuaderno y ningún respaldo.",
    profile: "Negocio de una sola persona: papelería y café internet de un pueblo pequeño, atendido por su dueña, que hace todo: vende, cobra, imprime y cuida el local.",
    problems: [
      "Tiene dos computadores viejos y lentos para los clientes.",
      "La impresora falla justo cuando hay más trabajo.",
      "Las ventas se anotan en un cuaderno y no se sabe cuánto se gana.",
      "No hay ningún respaldo: si se daña un equipo, se pierde todo.",
    ],
    challenge: "Con pocos recursos, elegir 2 o 3 compras que más ayuden al negocio y explicar por qué esas y no otras.",
    isPublic: false,
    express: {
      note: "Caso exprés: es una empresa de una sola persona. Con 2 o 3 compras bien justificadas es suficiente, y el lienzo se responde con una frase por nivel.",
      questions: [
        "Diagnóstico · ¿Cuál es el problema que más le cuesta dinero al negocio?",
        "Adquisición · ¿Qué 2 o 3 recursos compra y por qué esos?",
        "Implementación · ¿Dónde quedan instalados dentro del local?",
        "Capacitación · ¿Qué necesita aprender la dueña para aprovecharlos?",
        "Operación · ¿Quién le da soporte si algo falla un sábado?",
        "Fin de ciclo · ¿Cuándo daría de baja los computadores viejos: por daño o por obsolescencia?",
      ],
    },
  },
];

export const LEGAL_ROUTES: LegalRoute[] = [
  { id: "orden-privada", name: "Orden de compra privada", public: false },
  { id: "minima-cuantia", name: "Mínima cuantía", public: true },
  { id: "seleccion-abreviada", name: "Selección abreviada", public: true },
  { id: "licitacion", name: "Licitación pública", public: true },
  { id: "contratacion-directa", name: "Contratación directa", public: true },
  { id: "convenio-donacion", name: "Convenio o donación", public: true },
];
