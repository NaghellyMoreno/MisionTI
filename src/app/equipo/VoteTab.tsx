"use client";

import type { Snapshot } from "@/application/snapshot";
import { SemaforoTab } from "./SemaforoTab";
import { GalleryTab } from "./GalleryTab";
import type { ActionApi } from "./TeamApp";

/** Semáforo y Galería en una sola pestaña: se muestra primero la que esté activa. */
export function VoteTab({ snapshot, action }: { snapshot: Snapshot; action: ActionApi }) {
  const galleryFirst = snapshot.state.gallery.status !== "cerrada" && snapshot.state.semaforo.status !== "votando";
  const semaforo = <SemaforoTab key="s" snapshot={snapshot} action={action} />;
  const gallery = <GalleryTab key="g" snapshot={snapshot} action={action} />;
  return <div className="stack" style={{ gap: 28 }}>{galleryFirst ? [gallery, semaforo] : [semaforo, gallery]}</div>;
}
