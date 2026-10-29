import { NextResponse } from "next/server";
import { Heartbeat } from "@/application/usecases/classroom";
import { getGame } from "@/infrastructure/container";
import { readViewer } from "@/infrastructure/session";

export const dynamic = "force-dynamic";

/** Señal de vida del celular de cada estudiante (lista de asistencia). */
export async function POST() {
  const viewer = await readViewer();
  if (viewer.role !== "team") return NextResponse.json({ ok: false }, { status: 401 });
  await new Heartbeat(getGame()).execute(viewer.studentId, viewer.teamId);
  return NextResponse.json({ ok: true });
}
