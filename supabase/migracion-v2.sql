-- =====================================================================
-- Misión TI · Migración a la versión 2 (clase individual)
-- Úsenla SOLO si ya habían ejecutado schema.sql de la versión anterior.
-- Supabase → SQL Editor → New query → pegar → Run
-- =====================================================================

-- Grupos según la lista actualizada (equipo 13 eliminado, Juliana en caso exprés)
update public.teams set members = '["David Estiven Cuartas","David Ramírez","Andrés Felipe Ríos"]' where id = 'EQ12';
insert into public.teams (id, label, case_id, members, sort)
values ('EQ14', '14', 'rincon', '["Juliana del Pilar Moreno"]', 14)
on conflict (id) do update set case_id = 'rincon', members = excluded.members;
insert into public.team_pins (team_id, pin)
select 'EQ14', lpad((1000 + floor(random() * 9000))::int::text, 4, '0')
on conflict (team_id) do nothing;
insert into public.ledger (team_id, amount, kind, note)
select 'EQ14', 100, 'inicial', 'Presupuesto inicial'
where not exists (select 1 from public.ledger where team_id = 'EQ14');
delete from public.teams where id = 'EQ13';

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


alter table public.presence        enable row level security;
alter table public.answers         enable row level security;
alter table public.guest_questions enable row level security;
