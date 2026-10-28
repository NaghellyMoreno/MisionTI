import { LEGAL_ROUTES } from "@/domain/data/catalog";
import { GameRuleError, PurchasePolicy, balanceOf, findItem } from "@/domain/rules";
import type { LegalRouteId, StaffName, TeamId } from "@/domain/types";
import type { GameDependencies } from "../ports";

type Deps<K extends keyof GameDependencies> = Pick<GameDependencies, K>;

export class RequestPurchase {
  constructor(private readonly deps: Deps<"ledger" | "purchases" | "state" | "notifier">) {}

  async execute(input: { teamId: TeamId; itemId: string; legalRoute: string; justification: string }) {
    const item = findItem(input.itemId);
    if (!LEGAL_ROUTES.some((r) => r.id === input.legalRoute))
      throw new GameRuleError("Elijan la ruta de adquisición.");

    const [ledger, purchases, state] = await Promise.all([
      this.deps.ledger.list(),
      this.deps.purchases.list(),
      this.deps.state.get(),
    ]);

    PurchasePolicy.assertCanRequest({
      item,
      justification: input.justification,
      balance: balanceOf(input.teamId, ledger),
      teamPurchases: purchases.filter((p) => p.teamId === input.teamId),
      marketOpen: state.marketOpen,
    });

    await this.deps.purchases.create({
      teamId: input.teamId,
      itemId: item.id,
      legalRoute: input.legalRoute as LegalRouteId,
      justification: input.justification.trim(),
    });
    await this.deps.notifier.notify();
  }
}

export class ResolvePurchase {
  constructor(private readonly deps: Deps<"ledger" | "purchases" | "notifier">) {}

  async execute(input: { purchaseId: string; approve: boolean; staff: StaffName; note?: string }) {
    const [ledger, purchases] = await Promise.all([this.deps.ledger.list(), this.deps.purchases.list()]);
    const purchase = purchases.find((p) => p.id === input.purchaseId);
    if (!purchase) throw new GameRuleError("La solicitud no existe.");

    if (input.approve) PurchasePolicy.assertCanApprove(purchase, balanceOf(purchase.teamId, ledger));

    // Primero se marca como resuelta (solo si seguía pendiente) y después se cobra:
    // así dos personas aprobando a la vez no cobran dos veces.
    const changed = await this.deps.purchases.resolve(purchase.id, {
      status: input.approve ? "aprobada" : "rechazada",
      staffNote: input.note?.trim() || null,
      resolvedBy: input.staff,
    });
    if (!changed) throw new GameRuleError("Esta solicitud ya fue resuelta.");

    if (input.approve) {
      const item = findItem(purchase.itemId);
      await this.deps.ledger.append([
        { teamId: purchase.teamId, amount: -item.price, kind: "compra", note: `${item.name} · ${item.method}` },
      ]);
    }
    await this.deps.notifier.notify();
  }
}
