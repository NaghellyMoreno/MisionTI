import { describe, expect, it } from "vitest";
import { AGENDA } from "../src/domain/data/agenda";
import { GUION } from "../src/domain/data/guion";
import { SLIDES } from "../src/domain/data/lessons";

describe("Guion de la teoría", () => {
  it("cada diapositiva tiene su guion y no sobra ninguno", () => {
    const ids = SLIDES.map((s) => s.id);
    expect(ids.filter((id) => !GUION[id]?.length)).toEqual([]);
    expect(Object.keys(GUION).filter((id) => !ids.includes(id))).toEqual([]);
  });

  it("las diapositivas siguen el orden del cronograma", () => {
    const agenda = SLIDES.map((s) => s.agenda);
    expect([...agenda].sort((a, b) => a - b)).toEqual(agenda);
    expect(Math.max(...agenda)).toBeLessThan(AGENDA.length);
  });

  it("no hay video de Alerta Roja: ni en las diapositivas ni en el cronograma", () => {
    const text = JSON.stringify([SLIDES, GUION, AGENDA]).toLowerCase();
    expect(text).not.toMatch(/\bvideo\b/);
  });
});
