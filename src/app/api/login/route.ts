import { NextResponse } from "next/server";
import { findStudent } from "@/domain/students";
import { getGame } from "@/infrastructure/container";
import { writeSession } from "@/infrastructure/session";

export const dynamic = "force-dynamic";

/**
 * Ingreso de un estudiante por JSON. Hace lo mismo que el formulario de ingreso;
 * existe para que la prueba de carga (scripts/prueba-carga.mjs) pueda simular celulares.
 */
export async function POST(request: Request) {
  let body: { teamId?: string; studentId?: string; pin?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  const { teamId = "", studentId = "", pin = "" } = body;
  const game = getGame();
  if (!(await game.access.verify(teamId, String(pin).trim()))) {
    return NextResponse.json({ ok: false, error: "Código incorrecto para este grupo." }, { status: 401 });
  }
  const student = findStudent(await game.teams.list(), studentId);
  if (!student || student.teamId !== teamId) {
    return NextResponse.json({ ok: false, error: "Estudiante no válido." }, { status: 400 });
  }
  await writeSession({ role: "team", teamId, studentId });
  return NextResponse.json({ ok: true });
}
