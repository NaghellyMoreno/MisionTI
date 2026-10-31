import { GetSnapshot } from "@/application/snapshot";
import { getGame } from "@/infrastructure/container";
import { getJoinLink } from "@/infrastructure/joinLink";
import { Projector } from "./Projector";

export const dynamic = "force-dynamic";

/** Pantalla para el video beam: solo lectura, no requiere ingreso. */
export default async function ProjectorPage() {
  const [snapshot, join] = await Promise.all([new GetSnapshot(getGame()).execute({ role: "public" }), getJoinLink()]);
  return <Projector initial={snapshot} join={join} />;
}
