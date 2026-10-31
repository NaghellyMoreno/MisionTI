import "server-only";
import { headers } from "next/headers";
import QRCode from "qrcode";

export interface JoinLink {
  url: string;
  /** Código QR como SVG, generado en el servidor (no depende de servicios externos). */
  svg: string;
}

/**
 * Dirección pública de la app para el QR de la sala de espera.
 * Usa APP_URL si está configurada; si no, la deduce de la petición (sirve en Vercel y en local).
 */
export async function getJoinLink(): Promise<JoinLink> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const url = (process.env.APP_URL ?? `${proto}://${host}`).replace(/\/$/, "");
  const svg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#1c2b3d", light: "#00000000" },
  });
  return { url, svg };
}
