import type { Light, ScenarioId } from "../types";

export interface Scenario {
  id: ScenarioId;
  text: string;
  answer: Light;
  explanation: string;
}

export const SEMAFORO_REWARD = 5;

export const SCENARIOS: Scenario[] = [
  {
    id: "S1",
    text: "Portátil de 4 años que funciona, pero no es compatible con el nuevo sistema operativo que exige la empresa.",
    answer: "rojo",
    explanation: "Retiro por obsolescencia: el equipo sirve, pero ya no le sirve a la organización.",
  },
  {
    id: "S2",
    text: "Impresora con la tarjeta principal quemada; el repuesto cuesta más que una impresora nueva.",
    answer: "rojo",
    explanation: "Retiro por daño: repararla no es viable económicamente.",
  },
  {
    id: "S3",
    text: "Servidor de 6 años sin fallas, pero el fabricante dejó de publicar actualizaciones de seguridad.",
    answer: "rojo",
    explanation: "Obsolescencia por riesgo de seguridad: funcionar no es suficiente.",
  },
  {
    id: "S4",
    text: "Router con dos años de uso que se reinicia solo una vez al mes.",
    answer: "amarillo",
    explanation: "Requiere diagnóstico y mantenimiento correctivo, no reemplazo.",
  },
  {
    id: "S5",
    text: "Licencia de software vigente que el área usa a diario sin problemas.",
    answer: "verde",
    explanation: "Recurso en plena vida útil: se mantiene en operación.",
  },
  {
    id: "S6",
    text: "Proyector que funciona, pero lleva 8 meses guardado porque nadie sabe usarlo.",
    answer: "amarillo",
    explanation: "La falla es de capacitación, no del equipo.",
  },
];
