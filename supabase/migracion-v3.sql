-- =====================================================================
-- Misión TI · Migración a la versión 3 (lienzo digital y anular sorpresas)
-- Úsenla si ya habían ejecutado schema.sql o migracion-v2.sql.
-- Supabase → SQL Editor → New query → pegar → Run. No borra datos.
-- =====================================================================

-- Preguntas sorpresa anuladas por el equipo docente
alter table public.answers add column if not exists voided boolean not null default false;

-- Lienzo digital: una fila por grupo y casilla
create table if not exists public.canvas_entries (
  team_id    text not null references public.teams(id) on delete cascade,
  field      text not null,
  text       text not null default '',
  updated_by text not null,
  updated_at timestamptz not null default now(),
  primary key (team_id, field)
);
alter table public.canvas_entries enable row level security;
