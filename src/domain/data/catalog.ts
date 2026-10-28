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
    isPublic: false,
  },
  {
    id: "colegio",
    name: "Colegio Rural La Esperanza",
    sector: "Educación",
    situation: "Sin conectividad estable, equipos donados sin mantenimiento y docentes sin formación digital.",
    isPublic: false,
  },
  {
    id: "cafe",
    name: "Café de Origen Exportadora",
    sector: "Agroexportación",
    situation: "ERP de hace 12 años sin soporte del fabricante; los pedidos internacionales se pierden.",
    isPublic: false,
  },
  {
    id: "tiendaya",
    name: "TiendaYa",
    sector: "Comercio electrónico",
    situation: "La página se cae en temporada alta; no hay respaldo de datos ni plan de contingencia.",
    isPublic: false,
  },
  {
    id: "alcaldia",
    name: "Alcaldía de Villa Verde",
    sector: "Sector público",
    situation: "Trámites presenciales y servidores sobrecalentados. Toda compra sigue la contratación pública.",
    isPublic: true,
  },
  {
    id: "rincon",
    name: "Papelería El Rincón Digital",
    sector: "Emprendimiento unipersonal",
    situation:
      "La dueña atiende sola la papelería y café internet del pueblo: dos computadores viejos, una impresora que falla, ventas anotadas en un cuaderno y ningún respaldo.",
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
