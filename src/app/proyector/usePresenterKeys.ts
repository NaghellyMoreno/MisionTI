"use client";

import { useEffect, useRef, useState } from "react";
import { controlSlides } from "../actions";

/** Teclas que envían los controles remotos de presentación (clicker USB) y el teclado. */
const NEXT = new Set(["PageDown", "ArrowRight", "ArrowDown"]);
const PREV = new Set(["PageUp", "ArrowLeft", "ArrowUp", "Backspace"]);
/** El botón de pantalla en negro de la mayoría de controles envía «.» o «b». */
const BLACK = new Set([".", "b", "B"]);
/** El botón de inicio envía F5: no debe recargar la página. */
const SWALLOW = new Set(["F5"]);

/**
 * Permite pasar las diapositivas de teoría con el control remoto.
 * El computador del proyector debe haber ingresado como equipo docente
 * (la acción `controlSlides` exige sesión docente); si no, avisa cómo hacerlo.
 */
export function usePresenterKeys({ enabled, canControl }: { enabled: boolean; canControl: boolean }) {
  const [black, setBlack] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  // Cola: si pulsan dos veces rápido, ambos avances se aplican en orden.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const say = (text: string) => {
      setHint(text);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setHint(null), 5000);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (SWALLOW.has(e.key)) {
        e.preventDefault();
        return;
      }
      if (e.key === "Escape") {
        setBlack(false);
        return;
      }
      if (BLACK.has(e.key)) {
        e.preventDefault();
        setBlack((b) => !b);
        return;
      }
      const command = NEXT.has(e.key) ? "next" : PREV.has(e.key) ? "prev" : null;
      if (!command) return;
      e.preventDefault();
      if (black) {
        setBlack(false);
        return;
      }
      if (!enabled) return; // solo cuando hay una diapositiva de teoría en pantalla
      if (!canControl) {
        say("Para pasar diapositivas con el control, ingresen como equipo docente en este navegador y abran /proyector de nuevo.");
        return;
      }
      queue.current = queue.current.then(async () => {
        const result = await controlSlides(command);
        if (!result.ok) say(result.error);
      });
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, [enabled, canControl, black]);

  return { black, hint };
}
