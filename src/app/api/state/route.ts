import { NextResponse } from "next/server";
import { GetSnapshot } from "@/application/snapshot";
import { getGame } from "@/infrastructure/container";
import { readViewer } from "@/infrastructure/session";

export const dynamic = "force-dynamic";

/** Estado del juego según quién lo pide (grupo, equipo docente o proyector). */
export async function GET() {
  const snapshot = await new GetSnapshot(getGame()).execute(await readViewer());
  return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store" } });
}
