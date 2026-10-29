import type { Presence, Student, StudentId, Team } from "./types";

/** Cada integrante tiene un id estable derivado de su grupo y su posición: EQ07-2. */
export function studentsOf(teams: Team[]): Student[] {
  return teams.flatMap((t) => t.members.map((name, i) => ({ id: `${t.id}-${i + 1}`, teamId: t.id, name })));
}

export const findStudent = (teams: Team[], id: StudentId) => studentsOf(teams).find((s) => s.id === id) ?? null;

/** Se considera conectado quien envió señal en los últimos 45 segundos. */
export const ONLINE_WINDOW_MS = 45_000;

export const isOnline = (p: Presence | undefined, now: number) => !!p && now - p.lastSeen <= ONLINE_WINDOW_MS;

export const firstName = (fullName: string) => fullName.split(" ")[0];
