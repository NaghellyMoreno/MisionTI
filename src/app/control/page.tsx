import { redirect } from "next/navigation";
import { GetSnapshot } from "@/application/snapshot";
import { getGame, isLiveDatabase } from "@/infrastructure/container";
import { readViewer } from "@/infrastructure/session";
import { LoginForm } from "../LoginForm";
import { Brand } from "@/ui/parts";
import { ControlApp } from "./ControlApp";

export const dynamic = "force-dynamic";

export default async function ControlPage() {
  const viewer = await readViewer();
  if (viewer.role === "team") redirect("/equipo");
  if (viewer.role !== "staff") {
    return (
      <div className="login">
        <header className="topbar">
          <Brand />
          <a className="btn ghost sm" href="/proyector">Proyector ↗</a>
        </header>
        <main className="login-main">
          <section className="login-hero">
            <span className="label">Centro de control</span>
            <h1>
              Equipo<br />
              <em>docente.</em>
            </h1>
            <p>Elijan quién ingresa y escriban el código de acceso del equipo.</p>
          </section>
          <LoginForm mode="staff" />
        </main>
        <footer className="login-foot">
          <span>José Castellanos · Karen Moreno · Dylber Cabrera · Camila Giraldo</span>
          <span className="mono">Ingeniería de Sistemas y Computación</span>
        </footer>
      </div>
    );
  }
  const snapshot = await new GetSnapshot(getGame()).execute(viewer);
  return <ControlApp initial={snapshot} liveDatabase={isLiveDatabase()} />;
}
