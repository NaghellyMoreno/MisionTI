import { beforeEach, describe, expect, it } from "vitest";
import { createInMemoryGame } from "@/infrastructure/memory/InMemoryGame";
import type { GameDependencies } from "@/application/ports";
import { AnswerPop, EditGuestQuestion, Heartbeat, LaunchPop, SaveGuestQuestion, VoidPopAnswer } from "@/application/usecases/classroom";
import { FocusGallery, SaveCanvasField, SetRubricScore } from "@/application/usecases/canvas";
import { SetGallery } from "@/application/usecases/voting";
import { ResetGame } from "@/application/usecases/admin";
import { GetGrades } from "@/application/grades";
import { GetSnapshot } from "@/application/snapshot";
import { rubricScore } from "@/domain/grading";

let game: GameDependencies;
let now = 1_000_000;
const clock = () => now;

beforeEach(() => {
  game = createInMemoryGame();
  now = 1_000_000;
});

describe("Anular preguntas sorpresa", () => {
  it("una pregunta anulada no cuenta en la nota ni se puede responder, y el estudiante vuelve a la fila", async () => {
    await new Heartbeat(game, clock).execute("EQ01-1", "EQ01");
    await new LaunchPop(game, clock, () => 0).execute({ section: "fuente", questionId: "F1", count: 1 });
    const [row] = await game.answers.list();
    await new VoidPopAnswer(game).execute(row.id, true);

    await expect(new AnswerPop(game, clock).execute({ studentId: "EQ01-1", answerId: row.id, choice: 1 })).rejects.toThrow(/anuló/);
    const g = (await new GetGrades(game).execute()).find((x) => x.studentId === "EQ01-1")!;
    expect(g.sorpresa.asked).toBe(0);

    const snap = await new GetSnapshot(game, clock).execute({ role: "team", teamId: "EQ01", studentId: "EQ01-1" });
    expect(snap.team!.pendingPops).toHaveLength(0);

    await new VoidPopAnswer(game).execute(row.id, false);
    const g2 = (await new GetGrades(game).execute()).find((x) => x.studentId === "EQ01-1")!;
    expect(g2.sorpresa.asked).toBe(1);
  });
});

describe("Corregir la pregunta al invitado", () => {
  it("el docente corrige el texto sin cambiar su estado", async () => {
    await new SaveGuestQuestion(game).execute({ teamId: "EQ02", studentId: "EQ02-1", text: "como hacen  el diagnostico?" });
    const [q] = await game.guestQuestions.list();
    await new EditGuestQuestion(game).execute(q.id, "¿Cómo hacen el diagnóstico integral de un cliente nuevo?");
    const [after] = await game.guestQuestions.list();
    expect(after.text).toBe("¿Cómo hacen el diagnóstico integral de un cliente nuevo?");
    expect(after.status).toBe("lista");
    await expect(new EditGuestQuestion(game).execute(q.id, "corta")).rejects.toThrow();
  });
});

describe("Lienzo digital", () => {
  it("guarda casillas por separado y las muestra al grupo", async () => {
    const save = new SaveCanvasField(game);
    await save.execute({ teamId: "EQ07", studentId: "EQ07-1", field: "diagnostico", text: "Historias clínicas en papel" });
    await save.execute({ teamId: "EQ07", studentId: "EQ07-2", field: "adquisicion", text: "Nube + respaldo" });
    await save.execute({ teamId: "EQ07", studentId: "EQ07-3", field: "diagnostico", text: "Historias clínicas en papel y citas por teléfono  " });
    const snap = await new GetSnapshot(game).execute({ role: "team", teamId: "EQ07", studentId: "EQ07-1" });
    expect(snap.team!.canvas.filled).toBe(2);
    expect(snap.team!.canvas.fields.diagnostico.text).toBe("Historias clínicas en papel y citas por teléfono");
    expect(snap.team!.canvas.fields.diagnostico.by).toBe("Juan Sebastián Molina");
    await expect(save.execute({ teamId: "EQ07", studentId: "EQ07-1", field: "otra", text: "x" })).rejects.toThrow(/desconocida/);
  });

  it("los demás grupos solo ven los lienzos cuando abre la Galería, y ahí se cierran", async () => {
    await new SaveCanvasField(game).execute({ teamId: "EQ01", studentId: "EQ01-1", field: "fin", text: "Obsolescencia" });
    expect((await new GetSnapshot(game).execute({ role: "team", teamId: "EQ02", studentId: "EQ02-1" })).canvases).toBeUndefined();
    await new SetGallery(game).execute("votando");
    const snap = await new GetSnapshot(game).execute({ role: "public" });
    expect(snap.canvases?.find((c) => c.teamId === "EQ01")?.fields.fin.text).toBe("Obsolescencia");
    await expect(new SaveCanvasField(game).execute({ teamId: "EQ01", studentId: "EQ01-1", field: "fin", text: "Daño" })).rejects.toThrow(/cerró/);
    await new FocusGallery(game).execute("EQ01");
    expect((await game.state.get()).galleryFocus).toBe("EQ01");
  });

  it("la nota del lienzo es el promedio de la rúbrica", async () => {
    const rubric = new SetRubricScore(game);
    await rubric.execute("EQ04", "diagnostico", 5);
    await rubric.execute("EQ04", "adquisicion", 4);
    await rubric.execute("EQ04", "presupuesto", 3);
    await expect(rubric.execute("EQ04", "presupuesto", 6)).rejects.toThrow(/1 a 5/);
    expect(rubricScore((await game.state.get()).rubric.EQ04)).toBe(4);
    const g = (await new GetGrades(game).execute()).find((x) => x.studentId === "EQ04-1")!;
    expect(g.components.lienzo).toBe(4);
    await rubric.execute("EQ04", "presupuesto", null);
    expect(rubricScore((await game.state.get()).rubric.EQ04)).toBe(4.5);
  });

  it("reiniciar la partida borra los lienzos", async () => {
    await new SaveCanvasField(game).execute({ teamId: "EQ01", studentId: "EQ01-1", field: "fin", text: "Algo" });
    await new ResetGame(game).execute();
    expect(await game.canvas.list()).toHaveLength(0);
  });
});
