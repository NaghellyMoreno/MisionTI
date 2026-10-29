import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Viewer } from "@/application/snapshot";

/** Sesión mínima en una cookie firmada con HMAC: sin contraseñas guardadas en el navegador. */

const COOKIE = "mti_session";
const MAX_AGE = 60 * 60 * 8; // una jornada de clase

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("Falta la variable SESSION_SECRET");
  return s ?? "solo-para-desarrollo-local";
}

const sign = (value: string) => createHmac("sha256", secret()).update(value).digest("base64url");

export function encodeSession(viewer: Exclude<Viewer, { role: "public" }>) {
  const body = Buffer.from(JSON.stringify({ ...viewer, exp: Date.now() + MAX_AGE * 1000 })).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined): Viewer {
  if (!token) return { role: "public" };
  const [body, mac] = token.split(".");
  if (!body || !mac) return { role: "public" };
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { role: "public" };
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp < Date.now()) return { role: "public" };
    if (data.role === "staff") return { role: "staff", name: data.name };
    if (data.role === "team" && data.studentId) return { role: "team", teamId: data.teamId, studentId: data.studentId };
  } catch {}
  return { role: "public" };
}

export async function readViewer(): Promise<Viewer> {
  return decodeSession((await cookies()).get(COOKIE)?.value);
}

export async function writeSession(viewer: Exclude<Viewer, { role: "public" }>) {
  (await cookies()).set(COOKIE, encodeSession(viewer), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
