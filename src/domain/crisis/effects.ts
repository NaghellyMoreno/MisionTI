import { LEGAL_ROUTES } from "../data/catalog";
import { type Adjustment, type CrisisEffect, type TeamContext, hasTag } from "./CrisisEffect";

/** Premia a quien tenga un recurso con la etiqueta dada y castiga a quien no. */
export class RequiresTagEffect implements CrisisEffect {
  constructor(
    private readonly tag: Parameters<typeof hasTag>[1],
    private readonly reward: number,
    private readonly penalty: number,
    private readonly labels: { reward: string; penalty: string },
  ) {}

  resolve(ctx: TeamContext): Adjustment | null {
    if (hasTag(ctx, this.tag)) {
      return this.reward ? { amount: this.reward, note: this.labels.reward } : null;
    }
    return this.penalty ? { amount: -this.penalty, note: this.labels.penalty } : null;
  }
}

/** Castiga a quien tenga equipos físicos sin contrato de soporte. */
export class SupplierBankruptcyEffect implements CrisisEffect {
  constructor(private readonly penalty: number) {}

  resolve(ctx: TeamContext): Adjustment | null {
    const hasHardware = hasTag(ctx, "tangible");
    if (!hasHardware || hasTag(ctx, "soporte")) return null;
    return { amount: -this.penalty, note: "sin soporte, pierden la garantía" };
  }
}

/** Recorta un porcentaje del saldo disponible. */
export class BudgetCutEffect implements CrisisEffect {
  constructor(private readonly ratio: number) {}

  resolve(ctx: TeamContext): Adjustment | null {
    const cut = Math.floor(Math.max(ctx.balance, 0) * this.ratio);
    if (cut <= 0) return null;
    return { amount: -cut, note: `la junta recorta el ${Math.round(this.ratio * 100)} % del presupuesto` };
  }
}

/** Revisa que las compras de entidades públicas sigan una ruta de contratación estatal. */
export class ProcurementAuditEffect implements CrisisEffect {
  constructor(private readonly penalty: number) {}

  resolve(ctx: TeamContext): Adjustment | null {
    if (!ctx.company.isPublic) return null;
    const publicRoutes = new Set(LEGAL_ROUTES.filter((r) => r.public).map((r) => r.id));
    const irregular = ctx.approvedPurchases.some((p) => !publicRoutes.has(p.legalRoute));
    if (!irregular) return null;
    return { amount: -this.penalty, note: "compras sin ruta de contratación pública" };
  }
}

/** La carta se muestra, pero el equipo docente decide a quién beneficia. */
export class ManualEffect implements CrisisEffect {
  resolve(): Adjustment | null {
    return null;
  }
}
