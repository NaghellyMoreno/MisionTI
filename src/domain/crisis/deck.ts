import type { CrisisCard } from "./CrisisEffect";
import {
  BudgetCutEffect,
  ManualEffect,
  ProcurementAuditEffect,
  RequiresTagEffect,
  SupplierBankruptcyEffect,
} from "./effects";

export const CRISIS_DECK: CrisisCard[] = [
  {
    id: "quiebra",
    title: "El proveedor quebró",
    flavor: "Su proveedor de hardware cerró de un día para otro.",
    rule: "Quien tenga equipos físicos sin contrato de soporte pierde la garantía: −10 TC.",
    manual: false,
    effect: new SupplierBankruptcyEffect(10),
  },
  {
    id: "ransomware",
    title: "Ataque de ransomware",
    flavor: "Los archivos de la empresa amanecieron cifrados.",
    rule: "Con sistema de respaldo: +5 TC. Sin respaldo: −15 TC.",
    manual: false,
    effect: new RequiresTagEffect("respaldo", 5, 15, {
      reward: "el respaldo salvó la operación",
      penalty: "sin respaldo, se perdió la información",
    }),
  },
  {
    id: "recorte",
    title: "Recorte de presupuesto",
    flavor: "La junta directiva necesita liquidez.",
    rule: "Todos pierden el 20 % de su saldo disponible.",
    manual: false,
    effect: new BudgetCutEffect(0.2),
  },
  {
    id: "resistencia",
    title: "Resistencia al cambio",
    flavor: "Los empleados se niegan a usar el nuevo sistema.",
    rule: "Con programa de capacitación: +10 TC. Sin capacitación: −5 TC.",
    manual: false,
    effect: new RequiresTagEffect("capacitacion", 10, 5, {
      reward: "la capacitación funcionó",
      penalty: "nadie usa la tecnología",
    }),
  },
  {
    id: "auditoria",
    title: "Auditoría de contratación",
    flavor: "La Contraloría revisa las compras del sector público.",
    rule: "Entidades públicas con compras fuera de la contratación estatal: −10 TC.",
    manual: false,
    effect: new ProcurementAuditEffect(10),
  },
  {
    id: "oportunidad",
    title: "Oportunidad inesperada",
    flavor: "Una entidad ofrece cofinanciar un recurso.",
    rule: "Los grupos que justifiquen su impacto en 30 segundos reciben un bono que asigna el equipo docente.",
    manual: true,
    effect: new ManualEffect(),
  },
];

export const findCrisis = (id: string | null) => CRISIS_DECK.find((c) => c.id === id) ?? null;
