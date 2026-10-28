import type { ChangeNotifier } from "@/application/ports";

export const REALTIME_CHANNEL = "mision-ti";
export const REALTIME_EVENT = "changed";

/**
 * Envía un aviso por Supabase Realtime (Broadcast) para que todas las pantallas
 * vuelvan a pedir su estado. Si el aviso falla, las pantallas igual se
 * actualizan por consulta periódica, así que el error no detiene el juego.
 */
export class BroadcastNotifier implements ChangeNotifier {
  constructor(private readonly url: string, private readonly key: string) {}

  async notify() {
    const headers: Record<string, string> = { apikey: this.key, "Content-Type": "application/json" };
    if (this.key.startsWith("eyJ")) headers.Authorization = `Bearer ${this.key}`;
    try {
      await fetch(`${this.url}/realtime/v1/api/broadcast`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages: [{ topic: REALTIME_CHANNEL, event: REALTIME_EVENT, payload: { at: Date.now() } }] }),
        signal: AbortSignal.timeout(2500),
      });
    } catch (error) {
      console.warn("[mision-ti] No se pudo enviar el aviso en tiempo real", error);
    }
  }
}
