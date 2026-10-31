import { useEffect, useMemo, useState } from 'react';
import './scheduler.css';
import { supabase } from '@/lib/supabase';

type Topic = {
  id: string;
  nivel: number;
  orden: number;
  tema: string;
  streak: number;
  proxima_fecha: string;
};

type NivelFilter = 0 | 1 | 2 | 3;

type PendingAction =
  | { type: 'add'; nivel: number; tema: string }
  | { type: 'mark'; id: string; tema: string }
  | null;

export const LADDER = [
  1, 4, 7, 9, 10, 12, 16, 21, 28, 30, 50, 60, 80, 90, 100, 120, 140, 150, 210,
  250, 280, 300, 350, 450, 550, 700
];

const NIVELES: { nivel: NivelFilter; label: string }[] = [
  { nivel: 0, label: 'Todos' },
  { nivel: 1, label: 'CULT SMART 1' },
  { nivel: 2, label: 'CULT SMART 2' },
  { nivel: 3, label: 'CULT SMART 3' }
];

function isoOf(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function shiftDays(date: Date, days: number) {
  const copy = new Date(date.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function shortDate(iso: string) {
  return parseIsoDate(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short'
  });
}

function sortRows(rows: Topic[]) {
  return rows.toSorted(
    (a, b) =>
      a.proxima_fecha.localeCompare(b.proxima_fecha) ||
      a.nivel - b.nivel ||
      a.orden - b.orden
  );
}

function rpcToMessage(raw: string) {
  if (raw.includes('WRONG_PASSWORD')) return 'Password incorrecto';
  if (raw.includes('EMPTY_TOPIC')) return 'El tema no puede estar vacío';
  if (raw.includes('BAD_LEVEL')) return 'Nivel inválido';
  if (raw.includes('TOPIC_NOT_FOUND')) return 'Tema no encontrado';
  if (raw.includes('duplicate key'))
    return 'Ese tema ya existe en ese nivel';
  return raw;
}

export const Scheduler = () => {
  const [rows, setRows] = useState<Topic[] | null>(null);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [filter, setFilter] = useState<NivelFilter>(0);
  const [pending, setPending] = useState<PendingAction>(null);
  const [password, setPassword] = useState('');
  const [actionError, setActionError] = useState<null | string>(null);
  const [working, setWorking] = useState(false);

  const [newTema, setNewTema] = useState('');
  const [newNivel, setNewNivel] = useState<1 | 2 | 3>(1);

  async function fetchRows() {
    const { data, error } = await supabase
      .from('project_22_scheduler')
      .select('id, nivel, orden, tema, streak, proxima_fecha')
      .order('nivel', { ascending: true })
      .order('orden', { ascending: true });

    if (error) {
      setLoadError(error.message);
      return;
    }
    setRows(sortRows((data ?? []) as Topic[]));
  }

  useEffect(() => {
    fetchRows();
  }, []);

  const today = useMemo(() => isoOf(new Date()), []);
  const tomorrow = useMemo(() => isoOf(shiftDays(new Date(), 1)), [today]);

  const visible = useMemo(() => {
    if (!rows) return [];
    return rows.filter(r => filter === 0 || r.nivel === filter);
  }, [rows, filter]);

  const overview = useMemo(() => {
    if (!rows) return { overdue: [] as Topic[], today: [] as Topic[], tomorrow: [] as Topic[] };
    const inLevel = (r: Topic) => filter === 0 || r.nivel === filter;
    return {
      overdue: rows.filter(r => r.proxima_fecha < today && inLevel(r)),
      today: rows.filter(r => r.proxima_fecha === today && inLevel(r)),
      tomorrow: rows.filter(r => r.proxima_fecha === tomorrow && inLevel(r))
    };
  }, [rows, filter, today, tomorrow]);

  function openAdd() {
    if (!newTema.trim()) {
      setActionError('Escribe el nombre del tema');
      return;
    }
    setActionError(null);
    setPending({ type: 'add', nivel: newNivel, tema: newTema.trim() });
    setPassword('');
  }

  function openMark(topic: Topic) {
    if (pending) return;
    setActionError(null);
    setPending({ type: 'mark', id: topic.id, tema: topic.tema });
    setPassword('');
  }

  function closeModal() {
    setPending(null);
    setPassword('');
    setActionError(null);
  }

  async function confirmPending() {
    if (!pending) return;
    setWorking(true);
    setActionError(null);

    if (pending.type === 'add') {
      const { data, error } = await supabase.rpc('scheduler_add_topic', {
        p_nivel: pending.nivel,
        p_tema: pending.tema,
        p_pass: password
      });
      if (error) {
        setActionError(rpcToMessage(error.message));
      } else if (data) {
        setRows(prev => sortRows([...(prev ?? []), data as Topic]));
        setNewTema('');
        closeModal();
      }
    } else {
      const { data, error } = await supabase.rpc('scheduler_mark_reviewed', {
        p_id: pending.id,
        p_pass: password
      });
      if (error) {
        setActionError(rpcToMessage(error.message));
      } else if (data) {
        const updated = data as Topic;
        setRows(prev =>
          sortRows(prev?.map(r => (r.id === updated.id ? updated : r)) ?? [])
        );
        closeModal();
      }
    }
    setWorking(false);
  }

  function chipClass(iso: string, tn: string, tm: string) {
    if (iso < tn) return 'chip overdue';
    if (iso === tn) return 'chip today';
    if (iso === tm) return 'chip tomorrow';
    return 'chip later';
  }

  function nextIntervalOf(topic: Topic) {
    const index = Math.min(topic.streak, LADDER.length - 1);
    return LADDER[index];
  }

  return (
    <main className='scheduler-page'>
      <header className='scheduler-header'>
        <h1>
          SPACED REPETITION <span>SCHEDULER</span>
        </h1>
        <p>
          Agenda de repasos (CULT SMART 1 / 2 / 3) · vista pública · solo tú
          puedes editar con tu password
        </p>
      </header>

      {loadError && (
        <aside className='load-error'>
          No se pudo cargar la agenda: {loadError}
        </aside>
      )}

      <section className='overview'>
        <div className='overdue-block'>
          <h3>
            Atrasados <small>({overview.overdue.length})</small>
          </h3>
          <div className='cells'>
            {overview.overdue.length === 0 && <em>Nada atrasado 🎉</em>}
            {overview.overdue.map(r => (
              <button
                key={r.id}
                className='cell overdue'
                title='Marcar como repasado'
                onClick={() => openMark(r)}
              >
                {r.tema}
              </button>
            ))}
          </div>
        </div>

        <div className='today-block'>
          <h3>
            HOY <small>({overview.today.length})</small>
          </h3>
          <div className='cells'>
            {overview.today.length === 0 && <em>Libre hoy ✔</em>}
            {overview.today.map(r => (
              <button
                key={r.id}
                className='cell today'
                title='Marcar como repasado'
                onClick={() => openMark(r)}
              >
                {r.tema}
              </button>
            ))}
          </div>
        </div>

        <div className='tomorrow-block'>
          <h3>
            MAÑANA <small>({overview.tomorrow.length})</small>
          </h3>
          <div className='cells'>
            {overview.tomorrow.length === 0 && <em>Libre mañana ✔</em>}
            {overview.tomorrow.map(r => (
              <span key={r.id} className='cell dim'>
                {r.tema}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className='agenda'>
        <nav className='tabs'>
          {NIVELES.map(({ nivel, label }) => (
            <button
              key={nivel}
              className={filter === nivel ? 'tab active' : 'tab'}
              onClick={() => setFilter(nivel)}
            >
              {label}
            </button>
          ))}
        </nav>

        <ul className='rows'>
          {visible.map(r => (
            <li key={r.id} className='row'>
              <span className='row-tema' title={r.tema}>
                {r.tema}
              </span>
              <span className='row-nivel'>CULT SMART {r.nivel}</span>
              <span className='row-streak'>racha {r.streak}</span>
              <span className={chipClass(r.proxima_fecha, today, tomorrow)}>
                {shortDate(r.proxima_fecha)}
              </span>
              <span className='row-next'>→ +{nextIntervalOf(r)}d</span>
              <button
                className='row-done'
                onClick={() => openMark(r)}
                title='Marcar como repasado'
              >
                Repasado ✓
              </button>
            </li>
          ))}
          {!rows && !loadError && <li>Cargando…</li>}
          {rows && visible.length === 0 && !loadError && (
            <li>Sin temas todavía en este nivel</li>
          )}
        </ul>
      </section>

      <section className='admin-bar'>
        <div className='admin-controls'>
          <select
            value={newNivel}
            onChange={e => setNewNivel(Number(e.target.value) as 1 | 2 | 3)}
          >
            <option value={1}>CULT SMART 1</option>
            <option value={2}>CULT SMART 2</option>
            <option value={3}>CULT SMART 3</option>
          </select>
          <input
            type='text'
            placeholder='Nuevo tema, p. ej. (191) 25 RANDOM SENTENCES'
            value={newTema}
            onChange={e => {
              setNewTema(e.target.value);
              if (actionError && !pending) setActionError(null);
            }}
          />
          <button className='btn-add' onClick={openAdd}>
            + Agregar tema
          </button>
        </div>
        {!pending && actionError && (
          <small className='admin-error'>{actionError}</small>
        )}
      </section>

      {pending && (
        <div className='modal-back' onClick={closeModal}>
          <form
            className='modal'
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              e.preventDefault();
              confirmPending();
            }}
          >
            <h3>
              {pending.type === 'add' ? 'Agregar tema' : 'Marcar repasado'}
            </h3>
            <p className='modal-tema'>
              {pending.type === 'add'
                ? `${pending.tema} → CULT SMART ${pending.nivel}`
                : pending.tema}
            </p>
            <input
              type='password'
              autoFocus
              placeholder='Tu password especial'
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {actionError && <small className='modal-error'>{actionError}</small>}
            <div className='modal-actions'>
              <button type='button' onClick={closeModal}>
                Cancelar
              </button>
              <button type='submit' disabled={working}>
                {working ? 'Enviando…' : 'Confirmar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};
