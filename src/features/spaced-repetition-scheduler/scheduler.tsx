import { useEffect, useMemo, useState } from 'react';
import './scheduler.css';
import { supabase } from '@/lib/supabase';

type Topic = {
  id: string;
  orden: number;
  tema: string;
  streak: number;
  fechas: string[];
  proxima_fecha: string;
};

type PendingAction =
  | { type: 'add'; tema: string }
  | { type: 'mark'; id: string; tema: string }
  | null;

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

function shortDate(iso: string, thisYear: number) {
  const y = Number(iso.split('-')[0]);
  return parseIsoDate(iso).toLocaleDateString(
    'es-ES',
    y === thisYear
      ? { day: '2-digit', month: 'short' }
      : { day: '2-digit', month: 'short', year: '2-digit' }
  );
}

function isDone(topic: Topic) {
  return topic.streak >= topic.fechas.length;
}

function sortRows(rows: Topic[]) {
  return rows.toSorted(
    (a, b) =>
      Number(isDone(a)) - Number(isDone(b)) ||
      a.proxima_fecha.localeCompare(b.proxima_fecha) ||
      a.orden - b.orden
  );
}

function rpcToMessage(raw: string) {
  if (raw.includes('WRONG_PASSWORD')) return 'Password incorrecto';
  if (raw.includes('EMPTY_TOPIC')) return 'El tema no puede estar vacío';
  if (raw.includes('TOPIC_NOT_FOUND')) return 'Tema no encontrado';
  if (raw.includes('ALL_REVIEWED')) return 'Ese tema ya está terminado';
  if (raw.includes('duplicate key')) return 'Ese tema ya existe';
  return raw;
}

export const Scheduler = () => {
  const [rows, setRows] = useState<Topic[] | null>(null);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [password, setPassword] = useState('');
  const [actionError, setActionError] = useState<null | string>(null);
  const [working, setWorking] = useState(false);

  const [newTema, setNewTema] = useState('');

  async function fetchRows() {
    const { data, error } = await supabase
      .from('project_22_scheduler')
      .select('id, orden, tema, streak, fechas, proxima_fecha')
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
  const thisYear = new Date().getFullYear();

  const overview = useMemo(() => {
    if (!rows) return { today: [] as Topic[], tomorrow: [] as Topic[] };
    return {
      today: rows.filter(r => r.proxima_fecha === today),
      tomorrow: rows.filter(r => r.proxima_fecha === tomorrow)
    };
  }, [rows, today, tomorrow]);

  function openAdd() {
    if (!newTema.trim()) {
      setActionError('Escribe el nombre del tema');
      return;
    }
    setActionError(null);
    setPending({ type: 'add', tema: newTema.trim() });
    setPassword('');
  }

  function openMark(topic: Topic) {
    if (topic.streak >= topic.fechas.length || pending) return;
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
    if (iso === tn) return 'chip today';
    if (iso === tm) return 'chip tomorrow';
    return 'chip later';
  }

  function dateLabel(iso: string, tn: string, tm: string) {
    if (iso === tn) return 'hoy';
    if (iso === tm) return 'mañana';
    return shortDate(iso, thisYear);
  }

  return (
    <main className='scheduler-page'>
      <header className='scheduler-header'>
        <h1>
          SPACED REPETITION <span>SCHEDULER</span>
        </h1>
        <p>
          Agenda de repasos con las fechas exactas del Excel · vista pública ·
          solo tú puedes editar con tu password
        </p>
      </header>

      {loadError && (
        <aside className='load-error'>
          No se pudo cargar la agenda: {loadError}
        </aside>
      )}

      <section className='overview'>
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
        <ul className='rows'>
          {(rows ?? []).map(r => (
            <li key={r.id} className={`row${isDone(r) ? ' done' : ''}`}>
              <span className='row-tema' title={r.tema}>
                {r.tema}
              </span>
              <span
                className={
                  isDone(r)
                    ? 'chip done'
                    : chipClass(r.proxima_fecha, today, tomorrow)
                }
              >
                {isDone(r)
                  ? '✓'
                  : dateLabel(r.proxima_fecha, today, tomorrow)}
              </span>
              <span className='row-count'>
                repaso {Math.min(r.streak + 1, r.fechas.length)}/
                {r.fechas.length}
              </span>
              {isDone(r) ? (
                <span className='row-done-text'>terminado</span>
              ) : (
                <button
                  className='row-done'
                  onClick={() => openMark(r)}
                  title='Marcar como repasado'
                >
                  Repasado ✓
                </button>
              )}
            </li>
          ))}
          {!rows && !loadError && <li>Cargando…</li>}
          {rows && rows.length === 0 && !loadError && <li>Sin temas</li>}
        </ul>
      </section>

      <section className='admin-bar'>
        <div className='admin-controls'>
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
                ? `${pending.tema} → arranca hoy con la escala del Excel`
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
