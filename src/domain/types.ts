/**
 * Entidades del dominio. No dependen de Next.js, de Supabase ni de React:
 * son el núcleo estable del que dependen las demás capas (DIP).
 */

export type TeamId = string;
export type ItemId = string;
export type CaseId = string;
export type CrisisId = string;
export type ScenarioId = string;

export type StaffName = "José" | "Karen" | "Dylber" | "Camila";

export interface Team {
  id: TeamId;
  /** Etiqueta visible: "07", "14" */
  label: string;
  caseId: CaseId;
  members: string[];
}

export interface CompanyCase {
  id: CaseId;
  name: string;
  sector: string;
  situation: string;
  /** Las entidades públicas deben seguir la contratación estatal. */
  isPublic: boolean;
  /** Modo exprés para quien juega sola: menos carga, mismas reglas y mismo presupuesto. */
  express?: { note: string; questions: string[] };
}

export type ItemTag = "tangible" | "intangible" | "respaldo" | "soporte" | "capacitacion";

export interface CatalogItem {
  id: ItemId;
  name: string;
  method: string;
  price: number;
  tags: ItemTag[];
  note?: string;
}

export type LedgerKind = "inicial" | "compra" | "crisis" | "semaforo" | "ajuste";

export interface LedgerEntry {
  id: string;
  teamId: TeamId;
  amount: number;
  kind: LedgerKind;
  note: string;
  createdAt: string;
}

export type PurchaseStatus = "pendiente" | "aprobada" | "rechazada";

export interface Purchase {
  id: string;
  teamId: TeamId;
  itemId: ItemId;
  legalRoute: LegalRouteId;
  justification: string;
  status: PurchaseStatus;
  staffNote: string | null;
  resolvedBy: StaffName | null;
  createdAt: string;
  resolvedAt: string | null;
}

export type LegalRouteId =
  | "orden-privada"
  | "minima-cuantia"
  | "seleccion-abreviada"
  | "licitacion"
  | "contratacion-directa"
  | "convenio-donacion";

export interface LegalRoute {
  id: LegalRouteId;
  name: string;
  /** Válida para una entidad pública (Ley 80 de 1993 y Ley 1150 de 2007). */
  public: boolean;
}

export type Light = "verde" | "amarillo" | "rojo";

export interface Vote {
  round: string;
  teamId: TeamId;
  choice: string;
  createdAt: string;
}

export type ProjectorScreen =
  | "sala"
  | "teoria"
  | "ranking"
  | "crisis"
  | "sorpresa"
  | "semaforo"
  | "galeria"
  | "invitado"
  | "quiz"
  | "podio";

export type StudentId = string;

export interface Student {
  id: StudentId;
  teamId: TeamId;
  name: string;
}

export type AnswerKind = "sorpresa" | "quiz";

export interface Answer {
  id: string;
  kind: AnswerKind;
  questionId: string;
  studentId: StudentId;
  teamId: TeamId;
  /** Opción elegida (0–3); null mientras no responda. */
  choice: number | null;
  correct: boolean;
  points: number;
  sentAt: string;
  answeredAt: string | null;
  /** epoch ms límite para responder (preguntas sorpresa). */
  deadline: number | null;
}

export interface Presence {
  studentId: StudentId;
  teamId: TeamId;
  lastSeen: number;
}

export type GuestQuestionStatus = "lista" | "en-pantalla" | "hecha";

export interface GuestQuestion {
  id: string;
  teamId: TeamId;
  studentId: StudentId;
  text: string;
  status: GuestQuestionStatus;
  updatedAt: string;
}

export interface GradeWeights {
  sorpresa: number;
  quiz: number;
  lienzo: number;
  juego: number;
}

export interface TimerState {
  status: "idle" | "running" | "paused";
  /** epoch ms en que se reanudó por última vez */
  startedAt: number | null;
  /** ms restantes en el momento de pausar o reanudar */
  remainingMs: number;
}

export interface GameState {
  agendaIndex: number;
  timer: TimerState;
  marketOpen: boolean;
  activeCrisisId: CrisisId | null;
  appliedCrises: CrisisId[];
  semaforo: { scenarioId: ScenarioId | null; status: "cerrado" | "votando" | "revelado" };
  awardedScenarios: ScenarioId[];
  gallery: { status: "cerrada" | "votando" | "revelada" };
  screen: ProjectorScreen;
  /** Diapositiva de teoría en pantalla. */
  slideIndex: number;
  /** Última ronda de preguntas sorpresa (para el proyector). */
  pop: { questionId: string; studentIds: StudentId[]; launchedAt: number; deadline: number } | null;
  quiz: { index: number; status: "cerrado" | "abierto" | "revelado" | "terminado"; openedAt: number | null };
  guestCurrent: string | null;
  /** Nota del lienzo por grupo (0–5), la pone José con la rúbrica. */
  canvasScores: Record<TeamId, number>;
  weights: GradeWeights;
  version: number;
}
