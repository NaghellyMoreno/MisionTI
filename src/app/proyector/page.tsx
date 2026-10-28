import { GetSnapshot } from "@/application/snapshot";
import { getGame } from "@/infrastructure/container";
import { Projector } from "./Projector";

export const dynamic = "force-dynamic";

/** Pantalla para el video beam: solo lectura, no requiere ingreso. */
export default async function ProjectorPage() {
  const snapshot = await new GetSnapshot(getGame()).execute({ role: "public" });
  return <Projector initial={snapshot} />;
}
