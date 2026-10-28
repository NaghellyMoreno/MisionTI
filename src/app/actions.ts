"use server";

import { timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { getGame } from "@/infrastructure/container";
import { clearSession, readViewer, writeSession } from "@/infrastructure/session";
import { GameRuleError } from "@/domain/rules";
import { STAFF } from "@/domain/data/teams";
import type { ProjectorScreen, StaffName } from "@/domain/types";
import { RequestPurchase, ResolvePurchase } from "@/application/usecases/purchases";
import { DismissCrisis, TriggerCrisis } from "@/application/usecases/crisis";
import { ControlAgenda, type TimerCommand } from "@/application/usecases/agenda";
import { CastGalleryVote, CastLight, CloseScenario, OpenScenario, RevealScenario, SetGallery } from "@/application/usecases/voting";
import { AdjustBalance, ResetGame, SetMarket, SetScreen } from "@/application/usecases/admin";

/*
 * Capa de entrada: valida quién llama y delega en un caso de uso.
 * No contiene reglas del juego (esas viven en el dominio).
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

async function run(task: () => Promise<string | void>): Promise<ActionResult> {
  try {
    const message = await task();
    return { ok: true, ...(message ? { message } : {}) };
  } catch (error) {
    if (error instanceof GameRuleError) return { ok: false, error: error.message };
    console.error(error);
    return { ok: false, error: "Algo falló en el servidor. Intenten de nuevo." };
  }
}

async function requireStaff() {
  const viewer = await readViewer();
  if (viewer.role !== "staff") throw new GameRuleError("Solo el equipo docente puede hacer esto.");
  return viewer;
}

async function requireTeam() {
  const viewer = await readViewer();
  if (viewer.role !== "team") throw new GameRuleError("Ingresen primero con el código del grupo.");
  return viewer;
}

const samePin = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

/* ---------- Acceso ---------- */

export async function loginTeam(teamId: string, pin: string): Promise<ActionResult> {
  const result = await run(async () => {
    if (!(await getGame().access.verify(teamId, pin.trim()))) throw new GameRuleError("Código incorrecto para este grupo.");
    await writeSession({ role: "team", teamId });
  });
  if (result.ok) redirect("/equipo");
  return result;
}

export async function loginStaff(name: string, pin: string): Promise<ActionResult> {
  const result = await run(async () => {
    const expected = process.env.STAFF_PIN ?? (process.env.NODE_ENV === "production" ? "" : "2026");
    if (!expected || !samePin(pin.trim(), expected)) throw new GameRuleError("Código del equipo docente incorrecto.");
    if (!STAFF.some((s) => s.name === name)) throw new GameRuleError("Elijan quién ingresa.");
    await writeSession({ role: "staff", name: name as StaffName });
  });
  if (result.ok) redirect("/control");
  return result;
}

export async function logout() {
  await clearSession();
  redirect("/");
}

/* ---------- Grupos ---------- */

export async function requestPurchase(itemId: string, legalRoute: string, justification: string) {
  return run(async () => {
    const { teamId } = await requireTeam();
    await new RequestPurchase(getGame()).execute({ teamId, itemId, legalRoute, justification });
    return "Solicitud enviada. Esperen la aprobación.";
  });
}

export async function castLight(light: string) {
  return run(async () => {
    const { teamId } = await requireTeam();
    await new CastLight(getGame()).execute(teamId, light);
  });
}

export async function castGalleryVote(picks: string[]) {
  return run(async () => {
    const { teamId } = await requireTeam();
    await new CastGalleryVote(getGame()).execute(teamId, picks);
    return "Voto registrado.";
  });
}

/* ---------- Equipo docente ---------- */

export async function resolvePurchase(purchaseId: string, approve: boolean, note?: string) {
  return run(async () => {
    const { name } = await requireStaff();
    await new ResolvePurchase(getGame()).execute({ purchaseId, approve, staff: name, note });
  });
}

export async function triggerCrisis(crisisId: string) {
  return run(async () => {
    await requireStaff();
    const affected = await new TriggerCrisis(getGame()).execute(crisisId);
    return affected ? `Carta aplicada a ${affected} grupo(s).` : "Carta en pantalla.";
  });
}

export async function dismissCrisis() {
  return run(async () => {
    await requireStaff();
    await new DismissCrisis(getGame()).execute();
  });
}

export async function controlAgenda(command: TimerCommand) {
  return run(async () => {
    await requireStaff();
    await new ControlAgenda(getGame()).execute(command);
  });
}

export async function setMarket(open: boolean) {
  return run(async () => {
    await requireStaff();
    await new SetMarket(getGame()).execute(open);
  });
}

export async function setScreen(screen: ProjectorScreen) {
  return run(async () => {
    await requireStaff();
    await new SetScreen(getGame()).execute(screen);
  });
}

export async function openScenario(scenarioId: string) {
  return run(async () => {
    await requireStaff();
    await new OpenScenario(getGame()).execute(scenarioId);
  });
}

export async function revealScenario() {
  return run(async () => {
    await requireStaff();
    await new RevealScenario(getGame()).execute();
  });
}

export async function closeScenario() {
  return run(async () => {
    await requireStaff();
    await new CloseScenario(getGame()).execute();
  });
}

export async function setGallery(status: "cerrada" | "votando" | "revelada") {
  return run(async () => {
    await requireStaff();
    await new SetGallery(getGame()).execute(status);
  });
}

export async function adjustBalance(teamIds: string[], amount: number, note: string) {
  return run(async () => {
    const { name } = await requireStaff();
    await new AdjustBalance(getGame()).execute({ teamIds, amount, note, staff: name });
    return "Ajuste aplicado.";
  });
}

export async function resetGame(confirmation: string) {
  return run(async () => {
    await requireStaff();
    if (confirmation.trim().toUpperCase() !== "REINICIAR") throw new GameRuleError("Escriban REINICIAR para confirmar.");
    await new ResetGame(getGame()).execute();
    return "Partida reiniciada.";
  });
}

export async function getAccessCodes() {
  await requireStaff();
  return getGame().access.all();
}
