import { redirect } from "next/navigation";
import { getGame } from "@/infrastructure/container";
import { readViewer } from "@/infrastructure/session";
import { CASES } from "@/domain/data/catalog";
import { studentsOf } from "@/domain/students";
import { LoginForm } from "./LoginForm";
import { Brand } from "@/ui/parts";

export const dynamic = "force-dynamic";

export default async function Home() {
  const viewer = await readViewer();
  if (viewer.role === "team") redirect("/equipo");
  if (viewer.role === "staff") redirect("/control");

  const list = await getGame().teams.list();
  const students = studentsOf(list);
  const teams = list.map((t) => ({
    id: t.id,
    label: t.label,
    caseName: CASES.find((c) => c.id === t.caseId)?.name ?? "",
    students: students.filter((s) => s.teamId === t.id).map((s) => ({ id: s.id, name: s.name })),
  }));

  return (
    <div className="login">
      <header className="topbar">
        <Brand />
        <a className="btn ghost sm" href="/proyector">Proyector ↗</a>
      </header>
      <main className="login-main">
        <section className="login-hero">
          <span className="label">Gestión de Recursos Tecnológicos</span>
          <h1>
            Rescate<br />
            <em>empresarial.</em>
          </h1>
          <p>Su firma consultora tiene 100 TecnoCoins y una empresa en crisis. Entren con su nombre: la app puede escogerlos para una pregunta sorpresa en cualquier momento.</p>
        </section>
        <LoginForm teams={teams} />
      </main>
      <footer className="login-foot">
        <span>José Castellanos · Karen Moreno · Dylber Cabrera · Camila Giraldo</span>
        <span className="mono">Ingeniería de Sistemas y Computación</span>
      </footer>
    </div>
  );
}
