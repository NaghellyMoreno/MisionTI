-- =====================================================================
-- Misión TI · Rescate Empresarial — esquema de base de datos (Supabase)
-- Ejecútenlo una sola vez en: Supabase → SQL Editor → New query → Run
-- =====================================================================

-- Grupos de juego -------------------------------------------------------
create table if not exists public.teams (
  id        text primary key,
  label     text not null,
  case_id   text not null,
  members   jsonb not null default '[]',
  sort      int  not null default 0
);

-- Códigos de acceso (separados para que nunca viajen con los grupos)
create table if not exists public.team_pins (
  team_id text primary key references public.teams(id) on delete cascade,
  pin     text not null check (pin ~ '^[0-9]{4}$')
);

-- Movimientos de TecnoCoins: el saldo es la suma de esta tabla -----------
create table if not exists public.ledger (
  id         uuid primary key default gen_random_uuid(),
  team_id    text not null references public.teams(id) on delete cascade,
  amount     int  not null,
  kind       text not null check (kind in ('inicial','compra','crisis','semaforo','ajuste')),
  note       text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists ledger_team_idx on public.ledger(team_id);

-- Solicitudes de compra -------------------------------------------------
create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  team_id       text not null references public.teams(id) on delete cascade,
  item_id       text not null,
  legal_route   text not null,
  justification text not null,
  status        text not null default 'pendiente' check (status in ('pendiente','aprobada','rechazada')),
  staff_note    text,
  resolved_by   text,
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

-- Votos del Semáforo y la Galería (uno por grupo y ronda) ---------------
create table if not exists public.votes (
  round      text not null,
  team_id    text not null references public.teams(id) on delete cascade,
  choice     text not null,
  created_at timestamptz not null default now(),
  primary key (round, team_id)
);

-- Asistencia: última señal de cada celular -----------------------------
create table if not exists public.presence (
  student_id text primary key,
  team_id    text not null references public.teams(id) on delete cascade,
  last_seen  timestamptz not null default now()
);

-- Respuestas individuales: preguntas sorpresa y quiz final --------------
create table if not exists public.answers (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('sorpresa','quiz')),
  question_id text not null,
  student_id  text not null,
  team_id     text not null references public.teams(id) on delete cascade,
  choice      int check (choice between 0 and 3),
  correct     boolean not null default false,
  points      int not null default 0,
  sent_at     timestamptz not null default now(),
  answered_at timestamptz,
  deadline    timestamptz
);
create index if not exists answers_student_idx on public.answers(student_id);
-- En el quiz, cada estudiante responde una sola vez por pregunta
create unique index if not exists answers_quiz_once on public.answers(question_id, student_id) where kind = 'quiz';

-- Preguntas para el invitado (una por grupo) ----------------------------
create table if not exists public.guest_questions (
  id         uuid primary key default gen_random_uuid(),
  team_id    text not null unique references public.teams(id) on delete cascade,
  student_id text not null,
  text       text not null,
  status     text not null default 'lista' check (status in ('lista','en-pantalla','hecha')),
  updated_at timestamptz not null default now()
);

-- Estado general de la partida (una sola fila) --------------------------
create table if not exists public.game_state (
  id    int primary key default 1 check (id = 1),
  state jsonb not null default '{}'
);

-- Seguridad: RLS activado y SIN políticas.
-- Solo el servidor (con la clave service_role) puede leer y escribir.
alter table public.teams      enable row level security;
alter table public.team_pins  enable row level security;
alter table public.ledger     enable row level security;
alter table public.purchases  enable row level security;
alter table public.votes      enable row level security;
alter table public.game_state enable row level security;
alter table public.presence        enable row level security;
alter table public.answers         enable row level security;
alter table public.guest_questions enable row level security;

-- =====================================================================
-- Datos iniciales: los 11 grupos de juego de la lista del curso
-- =====================================================================
insert into public.teams (id, label, case_id, members, sort) values
  ('EQ01', '01',    'clinica',  '["Jesús Daniel Arias","Juan Alejandro Betancourth","Nicolás Carvajal"]', 1),
  ('EQ02', '02',    'colegio',  '["Jaime Andrés Cardona","Daner Alejandro Salazar","José Daniel Restrepo"]', 2),
  ('EQ04', '04',    'cafe',     '["Juan Camilo Botero","Keyla Daniela Cartagena","Jorge Iván García"]', 4),
  ('EQ05', '05',    'tiendaya', '["Juan Darío Cardona","Juan José Tangarife"]', 5),
  ('EQ06', '06',    'alcaldia', '["Andrés Felipe Martínez","Vanesa Buitrago"]', 6),
  ('EQ07', '07',    'clinica',  '["Andrés Mateo Padilla","Eduardo José Villamil","Juan Sebastián Molina"]', 7),
  ('EQ09', '09',    'colegio',  '["Lorenzo López","Miguel Ángel Rojas"]', 9),
  ('EQ10', '10',    'cafe',     '["Jhony Alejandro Pérez","Juan Pablo Pulgarín"]', 10),
  ('EQ11', '11',    'tiendaya', '["Felipe Gaviria","Juan Fernando García","Juan José Serna"]', 11),
  ('EQ12', '12',    'alcaldia', '["David Estiven Cuartas","David Ramírez","Andrés Felipe Ríos"]', 12),
  ('EQ14', '14',    'rincon',   '["Juliana del Pilar Moreno"]', 14)
on conflict (id) do nothing;

-- Códigos aleatorios de 4 dígitos (se ven en la app: Control → Ajustes)
insert into public.team_pins (team_id, pin)
select id, lpad((1000 + floor(random() * 9000))::int::text, 4, '0') from public.teams
on conflict (team_id) do nothing;

-- Presupuesto inicial de 100 TC por grupo (solo si aún no hay movimientos)
insert into public.ledger (team_id, amount, kind, note)
select t.id, 100, 'inicial', 'Presupuesto inicial'
from public.teams t
where not exists (select 1 from public.ledger l where l.team_id = t.id);

insert into public.game_state (id, state) values (1, '{}') on conflict (id) do nothing;
