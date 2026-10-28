import { redirect } from "next/navigation";
import { GetSnapshot } from "@/application/snapshot";
import { getGame, isLiveDatabase } from "@/infrastructure/container";
import { readViewer } from "@/infrastructure/session";
import { ControlApp } from "./ControlApp";

export const dynamic = "force-dynamic";

export default async function ControlPage() {
  const viewer = await readViewer();
  if (viewer.role !== "staff") redirect("/");
  const snapshot = await new GetSnapshot(getGame()).execute(viewer);
  return <ControlApp initial={snapshot} liveDatabase={isLiveDatabase()} />;
}
