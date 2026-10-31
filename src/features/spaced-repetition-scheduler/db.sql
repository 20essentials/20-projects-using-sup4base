-- =====================================================================
-- PROJECT 22 — SPACED REPETITION SCHEDULER
-- =====================================================================
-- Una sola tabla con TODOS los temas (CULT SMART 1 / 2 / 3).
-- - Lectura pública (visitas).
-- - Agregar temas y marcar "Repasado" SOLO con tu password especial
--   (validado en Postgres, nunca en el cliente).
-- - Los repasos avanzan por la escala de intervalos del Excel:
--   1 → 4 → 7 → 9 → 10 → 12 → 16 → 21 → 28 → 30 → 50 → 60 → 80 → 90 →
--   100 → 120 → 140 → 150 → 210 → 250 → 280 → 300 → 350 → 450 → 550 → 700 días.
-- ⚠️ Recuerda cambiar tu password en scheduler_secret() ANTES de ejecutar.

-- =====================================================================
-- 0) LIMPIEZA (idempotente: puedes re-ejecutar este script las veces
--    que quieras; borra lo anterior de este proyecto y lo crea todo de nuevo)
-- =====================================================================
drop table if exists project_22_scheduler cascade;
drop function if exists scheduler_add_topic(smallint, text, text);
drop function if exists scheduler_mark_reviewed(uuid, text);
drop function if exists scheduler_ladder();
drop function if exists scheduler_secret();

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1) TU PASSWORD
-- =====================================================================
-- ⚠️ EDITA ESTA LÍNEA antes de ejecutar: escribe tu password entre comillas.
create or replace function scheduler_secret()
returns text
language sql
immutable
as $$
  select 'EDIT-ME-CHANGE-THIS-PASSWORD';
$$;

-- Nadie puede leer la función directamente: solo las RPC de abajo la usan.
revoke all on function scheduler_secret() from public, anon, authenticated;

-- =====================================================================
-- 2) LA ÚNICA TABLA
-- =====================================================================
create table project_22_scheduler (
  id uuid primary key default gen_random_uuid(),
  nivel smallint not null check (nivel between 1 and 3), -- 1/2/3 = CULT SMART 1/2/3
  orden int not null,                                    -- orden del tema en el curso
  tema text not null,
  streak int not null default 0,                         -- repasos hechos (0 = aún no ha repasado)
  proxima_fecha date not null default current_date,
  created_at timestamptz not null default now(),
  unique (nivel, tema)
);

alter table project_22_scheduler enable row level security;

-- Lectura pública (anónimo y autenticados pueden ver el scheduler)
create policy "public read scheduler"
on project_22_scheduler
for select
to anon, authenticated
using (true);

-- Escritura: SOLO a través de las RPC con password (ninguna policy INSERT/UPDATE).
grant select on project_22_scheduler to anon, authenticated;

-- =====================================================================
-- 3) ESCALA DE INTERVALOS (del Excel)
-- =====================================================================
create or replace function scheduler_ladder()
returns int[]
language sql
immutable
as $$
  select
    array[1, 4, 7, 9, 10, 12, 16, 21, 28, 30, 50, 60, 80, 90, 100, 120, 140,
          150, 210, 250, 280, 300, 350, 450, 550, 700];
$$;

-- =====================================================================
-- 4) RPC: AGREGAR TEMA (requiere password)
-- =====================================================================
create or replace function scheduler_add_topic(
  p_nivel smallint,
  p_tema text,
  p_pass text
)
returns project_22_scheduler
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orden int;
  v_row   project_22_scheduler;
begin
  if p_pass is null or p_pass <> scheduler_secret() then
    raise exception 'WRONG_PASSWORD' using errcode = '42501';
  end if;

  if p_tema is null or length(trim(p_tema)) = 0 then
    raise exception 'EMPTY_TOPIC' using errcode = '22023';
  end if;

  if p_nivel is null or p_nivel not between 1 and 3 then
    raise exception 'BAD_LEVEL' using errcode = '22023';
  end if;

  select coalesce(max(orden), 0) + 1
    into v_orden
    from project_22_scheduler
   where nivel = p_nivel;

  insert into project_22_scheduler (nivel, orden, tema, streak, proxima_fecha)
  values (p_nivel, v_orden, trim(p_tema), 0, current_date)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function scheduler_add_topic(smallint, text, text) from public;
grant execute on function scheduler_add_topic(smallint, text, text) to anon, authenticated;

-- =====================================================================
-- 5) RPC: MARCAR TEMAS COMO REPASADOS (requiere password)
-- =====================================================================
-- Avanza la fecha del próximo repaso con la escala de intervalos:
-- nuevo_repaso = base + intervalo, donde base = max(hoy, fecha_programada)
-- (si repasas antes de tiempo, tu agenda no se adelanta).
create or replace function scheduler_mark_reviewed(
  p_id uuid,
  p_pass text
)
returns project_22_scheduler
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row     project_22_scheduler;
  v_ladder  int[] := scheduler_ladder();
  v_index   int;
  v_days    int;
begin
  if p_pass is null or p_pass <> scheduler_secret() then
    raise exception 'WRONG_PASSWORD' using errcode = '42501';
  end if;

  select streak into v_index from project_22_scheduler where id = p_id;

  if v_index is null then
    raise exception 'TOPIC_NOT_FOUND' using errcode = '22023';
  end if;

  v_index := least(v_index + 1, array_length(v_ladder, 1));
  v_days := v_ladder[v_index];

  update project_22_scheduler
     set streak = least(streak + 1, array_length(v_ladder, 1)),
         proxima_fecha = greatest(current_date, proxima_fecha) + v_days
   where id = p_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function scheduler_mark_reviewed(uuid, text) from public;
grant execute on function scheduler_mark_reviewed(uuid, text) to anon, authenticated;

-- =====================================================================
-- 6) SEED: LOS TEMAS DEL EXCEL (CULT SMART 1 / 2 / 3)
-- =====================================================================
-- Nivel 1 — gramática básica + verbos irregulares + IPA + plurales
insert into project_22_scheduler (nivel, orden, tema)
values
  (1,  1, '(1) ARTICLES'),
  (1,  2, '(2) USES OF THE VERB TO BE'),
  (1,  3, '(3) PRESENT SIMPLE - TO BE -'),
  (1,  4, '(4) DEMONSTRATIVE'),
  (1,  5, '(5) QUESTION WORDS'),
  (1,  6, '(6) SUBJECT PRONOUNS'),
  (1,  7, '(7) POSSESSIVE ADJECTIVES'),
  (1,  8, '(8) POSSESSIVE''S'),
  (1,  9, '(9) HAVE GOT (POSSESSION)'),
  (1, 10, '(10) HOW MANY…?'),
  (1, 11, '(11) POSSESSIVE PRONOUNS'),
  (1, 12, '(12) WHOSE'),
  (1, 13, '(13) PRESENT SIMPLE -TO WORK-'),
  (1, 14, '(14) OBJECT PRONOUNS'),
  (1, 15, '(15) THERE IS / THERE ARE'),
  (1, 16, '(16) PREPOSITIONS OF PLACE'),
  (1, 17, '(17) PREPOSITIONS OF MOVEMENT'),
  (1, 18, '(18) ADVERBS OF FRECUENCY'),
  (1, 19, '(19) EXPRESSIONS OF FREQUENCY'),
  (1, 20, '(20) COUNTABLE and UNCOUNTABLE NOUNS'),
  (1, 21, '(21) A FEW, A LITTLE, A LOT / LOTS OF'),
  (1, 22, '(22) MANY / MUCH'),
  (1, 23, '(23) CAN FOR ABILITY'),
  (1, 24, '(24) CAN FOR PERMISSION AND REQUESTS'),
  (1, 25, '(25) DEGREES OF ABILITY: MODIFIERS'),
  (1, 26, '(26) PRESENT CONTINUOUS'),
  (1, 27, '(27) PAST SIMPLE -BE-'),
  (1, 28, '(28) PAST SIMPLE -CAN-'),
  (1, 29, '(29) PAST SIMPLE -REGULAR VERBS-'),
  (1, 30, '(30) PAST SIMPLE -IRREGULAR VERBS-'),
  (1, 31, '(31) IRREGULAR VERBS'),
  (1, 32, '(A) IRREGULAR VERBS'),
  (1, 33, '(B) IRREGULAR VERBS [1 - 8]'),
  (1, 34, '(B) IRREGULAR VERBS [9 - 16]'),
  (1, 35, '(C) IRREGULAR VERBS'),
  (1, 36, '(D) IRREGULAR VERBS'),
  (1, 37, '(E) IRREGULAR VERBS'),
  (1, 38, '(32) MODAL VERBS'),
  (1, 39, '(33) COMPARATIVE ADJECTIVES (PART 1)'),
  (1, 40, '(33) COMPARATIVE ADJECTIVES (PART 2)'),
  (1, 41, '(34) SUPERLATIVE ADJECTIVES'),
  (1, 42, '(35) RELATIVE PRONOUNS'),
  (1, 43, '(36) SOME-, ANY-, EVERY-, NO-'),
  (1, 44, '(37) PAST TIME EXPRESSIONS'),
  (1, 45, '(38) TELLING THE TIME'),
  (1, 46, '(39) MONTHS'),
  (1, 47, '(40) IMPERATIVE'),
  (1, 48, '(41) TOO, NOT ENOUGH'),
  (1, 49, '(42) TOO MUCH / TOO MANY / NOT ENOUGH'),
  (1, 50, '(43) PRESENT SIMPLE vs PRESENT CONTINUOUS'),
  (1, 51, '(44) TIME SEQUENCERS'),
  (1, 52, '(45) LOVE, LIKE, DON''T MIND, HATE + -ING'),
  (1, 53, '(46) ACTIVE AND STATIVE VERBS'),
  (1, 54, '(47) BE / HAVE GOT + PHYSICAL CHARACTERISTICS'),
  (1, 55, '(48) PREPOSITIONS of TIME: IN, ON, AT'),
  (1, 56, '(49) PREPOSITIONS of PLACE: IN, ON, AT'),
  (1, 57, '(50) PROGRAMMING SYMBOLS'),
  (1, 58, '(93) PLURAL NOUNS - FIRST PART'),
  (1, 59, '(93) PLURAL NOUNS - SECOND PART'),
  (1, 60, '(94) A PAIR OF TIPS'),
  (1, 61, '(95) FAREWELLS'),
  (1, 62, '(88) WORD CONTRACTIONS'),
  (1, 63, '(91) QUESTION WORDS - PART 2'),
  (1, 64, '(82) IPA: PHONEMES OF THE CONSONANTS (26)'),
  (1, 65, '(83) IPA: PHONEMES OF THE VOWELS (13)'),
  (1, 66, '(84) IPA: PHONEMES VOWELS + R (5)'),
  (1, 67, '(85) IPA: PHONEMES OF DIPHTHONGS (9)'),
  (1, 68, '(86) IPA: PHONEMES OF TRIPHTONGS (5)');

-- Nivel 2 — futuro, condicionales, present perfect, pasiva, canciones, afotismos
insert into project_22_scheduler (nivel, orden, tema)
values
  (2,  1, '(51) QUESTION TAGS'),
  (2,  2, '(52) FUTURE WITH THE PRESENT SIMPLE'),
  (2,  3, '(53) BE GOING TO FOR INTENTIONS'),
  (2,  4, '(54) BE GOING TO FOR PREDICTIONS'),
  (2,  5, '(55) WILL'),
  (2,  6, '(56) MAY AND MIGHT'),
  (2,  7, '(57) ZERO AND FIRST CONDITIONAL'),
  (2,  8, '(58) SECOND CONDITIONAL'),
  (2,  9, '(59) SHOULD AND SHOULDN''T'),
  (2, 10, '(60) MUST AND MUSTN''T'),
  (2, 11, '(61) HAVE TO AND DON''T HAVE TO'),
  (2, 12, '(62) ADVERBS AND COMPARATIVE ADVERBS'),
  (2, 13, '(63) USES OF THE PRESENT PERFECT'),
  (2, 14, '(64) PRESENT PERFECT'),
  (2, 15, '(65) BEEN vs GONE'),
  (2, 16, '(66) PRESENT PERFECT WITH EVER and NEVER'),
  (2, 17, '(67) P. PERFECT with ALREADY, JUST and YET'),
  (2, 18, '(68) -ED and -ING ADJECTIVES'),
  (2, 19, '(69) P. PERFECT WITH [FOR AND SINCE]'),
  (2, 20, '(70) PRESENT PERFECT vs PAST SIMPLE'),
  (2, 21, '(71) USED TO'),
  (2, 22, '(72) PAST CONTINUOUS'),
  (2, 23, '(73) PAST SIMPLE vs PAST CONTINUOUS'),
  (2, 24, '(74) I WANT TO / I''D LIKE TO… / I''D LOVE TO'),
  (2, 25, '(75) INFINITIVE OF PURPOSE'),
  (2, 26, '(76) VERB PATTERNS'),
  (2, 27, '(77) PRESENT SIMPLE PASSIVE'),
  (2, 28, '(78) PAST SIMPLE PASSIVE'),
  (2, 29, '(79) PRESENT PERFECT PASSIVE'),
  (2, 30, '(80) MAROON 5 - SUGAR (SONG)'),
  (2, 31, '(81) THE NEIGHBOURHOOD - SOFTCORE'),
  (2, 32, '(87) U2 - BEAUTIFUL DAY'),
  (2, 33, '(89) RHCP - DARK NECCESSITIES'),
  (2, 34, '(90) JOHN NEWMAN - LOVE ME AGAIN'),
  (2, 35, '(92) CARTOON - WHY WE LOSE'),
  (2, 36, '(96) PART 1 → 25 APHORISMS'),
  (2, 37, '(97) HAVE - SPECIAL USES'),
  (2, 38, '(98) DOUBLE POSSESSIVES'),
  (2, 39, '(99) PART 2 → 25 APHORISMS'),
  (2, 40, '(100) A CONVERSATION (LITTLE)'),
  (2, 41, '(101) A RANDOM CONVERSATION');

-- Nivel 3 — 25 RANDOM SENTENCES (partes numeradas del 102 al 190)
insert into project_22_scheduler (nivel, orden, tema)
values
  (3, 1, '(102) 25 RANDOM SENTENCES'),
  (3, 2, '(103) 25 RANDOM SENTENCES - PART 2'),
  (3, 3, '(104) SO DO I'),
  (3, 4, '(105) NEITHER');

insert into project_22_scheduler (nivel, orden, tema)
select
  3,
  5 + n - 106,
  '(' || n || ') 25 RANDOM SENTENCES - PART ' || (n - 103)
from generate_series(106, 144) as n;

insert into project_22_scheduler (nivel, orden, tema)
select
  3,
  44 + n - 145,
  '(' || n || ') 25 RANDOM SENTENCES'
from generate_series(145, 190) as n;

-- Fechas iniciales escalonadas: orden = hoy, mañana, luego un tema por día
-- (así el overview TODAY / TOMORROW ya tiene contenido para el demo).
with ordered as (
  select id, row_number() over (order by nivel, orden) as rn
  from project_22_scheduler
)
update project_22_scheduler s
   set proxima_fecha = current_date + (o.rn - 1)::int
  from ordered o
 where s.id = o.id;
