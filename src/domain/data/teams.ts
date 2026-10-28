import type { Team } from "../types";

/**
 * Grupos de juego a partir de la lista oficial del curso.
 * Lista actualizada: el equipo 13 desapareció (Andrés Felipe Ríos pasó al 12)
 * y el equipo 14 queda con una sola integrante.
 * El equipo 3 dirige la clase y no participa como grupo.
 */
export const TEAMS: Team[] = [
  { id: "EQ01", label: "01", caseId: "clinica", members: ["Jesús Daniel Arias", "Juan Alejandro Betancourth", "Nicolás Carvajal"] },
  { id: "EQ02", label: "02", caseId: "colegio", members: ["Jaime Andrés Cardona", "Daner Alejandro Salazar", "José Daniel Restrepo"] },
  { id: "EQ04", label: "04", caseId: "cafe", members: ["Juan Camilo Botero", "Keyla Daniela Cartagena", "Jorge Iván García"] },
  { id: "EQ05", label: "05", caseId: "tiendaya", members: ["Juan Darío Cardona", "Juan José Tangarife"] },
  { id: "EQ06", label: "06", caseId: "alcaldia", members: ["Andrés Felipe Martínez", "Vanesa Buitrago"] },
  { id: "EQ07", label: "07", caseId: "clinica", members: ["Andrés Mateo Padilla", "Eduardo José Villamil", "Juan Sebastián Molina"] },
  { id: "EQ09", label: "09", caseId: "colegio", members: ["Lorenzo López", "Miguel Ángel Rojas"] },
  { id: "EQ10", label: "10", caseId: "cafe", members: ["Jhony Alejandro Pérez", "Juan Pablo Pulgarín"] },
  { id: "EQ11", label: "11", caseId: "tiendaya", members: ["Felipe Gaviria", "Juan Fernando García", "Juan José Serna"] },
  { id: "EQ12", label: "12", caseId: "alcaldia", members: ["David Estiven Cuartas", "David Ramírez", "Andrés Felipe Ríos"] },
  { id: "EQ14", label: "14", caseId: "clinica", members: ["Juliana del Pilar Moreno"] },
];

export const STAFF = [
  { name: "José", role: "Director de la misión" },
  { name: "Karen", role: "Estratega" },
  { name: "Dylber", role: "Game Master" },
  { name: "Camila", role: "Anfitriona" },
] as const;
