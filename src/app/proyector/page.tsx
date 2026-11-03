import { GetSnapshot } from "@/application/snapshot";
import { getGame } from "@/infrastructure/container";
import { getJoinLink } from "@/infrastructure/joinLink";
import { readViewer } from "@/infrastructure/session";
import { Projector } from "./Projector";

export const dynamic = "force-dynamic";

/**
 * Pantalla para el video beam: no requiere ingreso para verla. Si el computador ya ingresó
 * como equipo docente, el control remoto (clicker) puede pasar las diapositivas.
 */
export default async function ProjectorPage() {
  const [snapshot, join, viewer] = await Promise.all([
    new GetSnapshot(getGame()).execute({ role: "public" }),
    getJoinLink(),
    readViewer(),
  ]);
  return <Projector initial={snapshot} join={join} canControl={viewer.role === "staff"} />;
}
