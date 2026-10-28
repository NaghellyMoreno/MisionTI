import "server-only";
import type { GameDependencies } from "@/application/ports";
import { createInMemoryGame } from "./memory/InMemoryGame";
import { createSupabaseGame } from "./supabase/SupabaseGame";

/**
 * Raíz de composición: el único lugar que decide qué implementación usar.
 * Con las variables de Supabase configuradas usa la base de datos real;
 * sin ellas, arranca en memoria para poder probar la app en local.
 */
const globalForGame = globalThis as unknown as { __misionTi?: GameDependencies };

export function getGame(): GameDependencies {
  if (globalForGame.__misionTi) return globalForGame.__misionTi;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  globalForGame.__misionTi =
    url && serviceKey ? createSupabaseGame({ url, serviceKey }) : createInMemoryGame();

  if (!url || !serviceKey) console.info("[mision-ti] Modo local en memoria (sin Supabase).");
  return globalForGame.__misionTi;
}

export const isLiveDatabase = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
