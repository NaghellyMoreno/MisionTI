import { beforeEach, describe, expect, it } from "vitest";
import { createInMemoryGame } from "@/infrastructure/memory/InMemoryGame";
import type { GameDependencies } from "@/application/ports";
import { RequestPurchase, ResolvePurchase } from "@/application/usecases/purchases";
import { TriggerCrisis } from "@/application/usecases/crisis";
import { CastGalleryVote, CastLight, OpenScenario, RevealScenario, SetGallery } from "@/application/usecases/voting";
import { AdjustBalance, ResetGame, SetMarket } from "@/application/usecases/admin";
import { ControlAgenda } from "@/application/usecases/agenda";
import { GetSnapshot } from "@/application/snapshot";
import { balanceOf } from "@/domain/rules";

let game: GameDependencies;
const bal = async (teamId: string) => balanceOf(teamId, await game.ledger.list());

async function buy(teamId: string, itemId: string, legalRoute = "orden-privada") {
  await new RequestPurchase(game).execute({ teamId, itemId, legalRoute, justification: "Lo necesitamos según el diagnóstico" });
  const p = (await game.purchases.list()).find((x) => x.teamId === teamId && x.itemId === itemId)!;
  await new ResolvePurchase(game).execute({ purchaseId: p.id, approve: true, staff: "Karen" });
}

beforeEach(async () => {
  game = createInMemoryGame();
  await new SetMarket(game).execute(true);
});

describe("Mercado", () => {
  it("cada grupo inicia con 100 TC", async () => {
    expect(await bal("EQ01")).toBe(100);
  });

  it("cobra solo al aprobar y no permite aprobar dos veces", async () => {
    await new RequestPurchase(game).execute({ teamId: "EQ01", itemId: "servidor", legalRoute: "orden-privada", justification: "Necesitamos alojar la historia clínica" });
    expect(await bal("EQ01")).toBe(100);
    const [p] = await game.purchases.list();
    await new ResolvePurchase(game).execute({ purchaseId: p.id, approve: true, staff: "Karen" });
    expect(await bal("EQ01")).toBe(60);
    await expect(new ResolvePurchase(game).execute({ purchaseId: p.id, approve: true, staff: "Dylber" })).rejects.toThrow();
    expect(await bal("EQ01")).toBe(60);
  });

  it("reserva el saldo de las solicitudes pendientes", async () => {
    const req = new RequestPurchase(game);
    const j = "Justificación suficientemente larga";
    await req.execute({ teamId: "EQ02", itemId: "desarrollo", legalRoute: "orden-privada", justification: j });
    await req.execute({ teamId: "EQ02", itemId: "servidor", legalRoute: "orden-privada", justification: j });
    await expect(req.execute({ teamId: "EQ02", itemId: "pcs-compra", legalRoute: "orden-privada", justification: j })).rejects.toThrow(/alcanza/);
  });

  it("rechaza si el mercado está cerrado o falta justificación", async () => {
    await expect(new RequestPurchase(game).execute({ teamId: "EQ01", itemId: "red", legalRoute: "orden-privada", justification: "corta" })).rejects.toThrow(/justificación/);
    await new SetMarket(game).execute(false);
    await expect(new RequestPurchase(game).execute({ teamId: "EQ01", itemId: "red", legalRoute: "orden-privada", justification: "Justificación válida y larga" })).rejects.toThrow(/cerrado/);
  });
});

describe("Cartas de crisis", () => {
  it("ransomware premia el respaldo y castiga su ausencia", async () => {
    await buy("EQ01", "respaldo");
    await new TriggerCrisis(game).execute("ransomware");
    expect(await bal("EQ01")).toBe(95);
    expect(await bal("EQ02")).toBe(85);
  });

  it("quiebra solo afecta a quien tiene hardware sin soporte", async () => {
    await buy("EQ01", "servidor");
    await buy("EQ02", "servidor");
    await buy("EQ02", "soporte");
    await new TriggerCrisis(game).execute("quiebra");
    expect(await bal("EQ01")).toBe(50);
    expect(await bal("EQ02")).toBe(45);
    expect(await bal("EQ04")).toBe(100);
  });

  it("auditoría castiga a la Alcaldía con compras por ruta privada", async () => {
    await buy("EQ06", "red", "orden-privada");
    await buy("EQ12", "red", "licitacion");
    await new TriggerCrisis(game).execute("auditoria");
    expect(await bal("EQ06")).toBe(70);
    expect(await bal("EQ12")).toBe(80);
  });

  it("recorte quita el 20 % y no se puede jugar dos veces", async () => {
    await new TriggerCrisis(game).execute("recorte");
    expect(await bal("EQ05")).toBe(80);
    await expect(new TriggerCrisis(game).execute("recorte")).rejects.toThrow();
  });
});

describe("Semáforo y Galería", () => {
  it("paga 5 TC a los aciertos una sola vez y oculta votos hasta revelar", async () => {
    await new OpenScenario(game).execute("S4");
    await new CastLight(game).execute("EQ01", "amarillo");
    await new CastLight(game).execute("EQ02", "rojo");
    const before = await new GetSnapshot(game).execute({ role: "public" });
    expect(before.scenario?.answer).toBeUndefined();
    expect(before.scenario?.voted).toBe(2);
    await new RevealScenario(game).execute();
    await new RevealScenario(game).execute();
    expect(await bal("EQ01")).toBe(105);
    expect(await bal("EQ02")).toBe(100);
  });

  it("la galería exige 2 votos ajenos", async () => {
    await new SetGallery(game).execute("votando");
    const vote = new CastGalleryVote(game);
    await expect(vote.execute("EQ01", ["EQ01", "EQ02"])).rejects.toThrow(/propio/);
    await vote.execute("EQ01", ["EQ02", "EQ04"]);
    await vote.execute("EQ05", ["EQ02", "EQ07"]);
    await new SetGallery(game).execute("revelada");
    const snap = await new GetSnapshot(game).execute({ role: "public" });
    expect(snap.gallery.results?.[0]).toMatchObject({ teamId: "EQ02", votes: 2 });
  });
});

describe("Administración", () => {
  it("ajustes, temporizador y reinicio", async () => {
    await new AdjustBalance(game).execute({ teamIds: ["EQ07", "EQ09"], amount: 12, note: "Oportunidad", staff: "José" });
    expect(await bal("EQ09")).toBe(112);

    let now = 1_000_000;
    const agenda = new ControlAgenda(game, () => now);
    await agenda.execute("start");
    now += 60_000;
    await agenda.execute("pause");
    expect((await game.state.get()).timer.remainingMs).toBe(9 * 60_000);

    await new ResetGame(game).execute();
    expect(await bal("EQ09")).toBe(100);
    expect((await game.state.get()).marketOpen).toBe(false);
  });
});

describe("Caso exprés", () => {
  it("el equipo 14 juega la papelería con las mismas reglas y presupuesto", async () => {
    const { TEAMS } = await import("@/domain/data/teams");
    const { CASES } = await import("@/domain/data/catalog");
    const team = TEAMS.find((t) => t.id === "EQ14")!;
    const company = CASES.find((c) => c.id === team.caseId)!;
    expect(company.express?.questions).toHaveLength(6);
    expect(await bal("EQ14")).toBe(100);
    await buy("EQ14", "respaldo");
    expect(await bal("EQ14")).toBe(90);
  });
});
