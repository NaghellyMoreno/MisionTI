import { redirect } from "next/navigation";
import { GetSnapshot } from "@/application/snapshot";
import { getGame } from "@/infrastructure/container";
import { readViewer } from "@/infrastructure/session";
import { TeamApp } from "./TeamApp";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const viewer = await readViewer();
  if (viewer.role !== "team") redirect("/");
  const snapshot = await new GetSnapshot(getGame()).execute(viewer);
  if (!snapshot.team) redirect("/");
  return <TeamApp initial={snapshot} />;
}
