import type { CatalogItem, CompanyCase, Purchase, Team } from "../types";

/** Todo lo que una carta de crisis necesita saber de un grupo para decidir su efecto. */
export interface TeamContext {
  team: Team;
  company: CompanyCase;
  balance: number;
  inventory: CatalogItem[];
  approvedPurchases: Purchase[];
}

export interface Adjustment {
  amount: number;
  note: string;
}

/**
 * Patrón Strategy. Cada carta encapsula su propia regla.
 * Agregar una crisis nueva = crear una clase que implemente esta interfaz
 * y registrarla en el mazo; el motor no cambia (Open/Closed).
 */
export interface CrisisEffect {
  /** null = la carta no afecta a este grupo. */
  resolve(ctx: TeamContext): Adjustment | null;
}

export interface CrisisCard {
  id: string;
  title: string;
  flavor: string;
  rule: string;
  /** Las cartas manuales se muestran, pero el efecto lo asigna el equipo docente. */
  manual: boolean;
  effect: CrisisEffect;
}

export const hasTag = (ctx: TeamContext, tag: CatalogItem["tags"][number]) =>
  ctx.inventory.some((item) => item.tags.includes(tag));
