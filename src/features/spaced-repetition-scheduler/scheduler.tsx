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

const GATE_KEY = 'scheduler.admin-pass';

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

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [gateOpen, setGateOpen] = useState(true);
  const [gatePassword, setGatePassword] = useState('');
  const [gateError, setGateError] = useState<null | string>(null);

  const [working, setWorking] = useState(false);
  const [actionError, setActionError] = useState<null | string>(null);
  const [newTema, setNewTema] = useState('');

  const [menuFor, setMenuFor] = useState<null | string>(null);
  const [editFor, setEditFor] = useState<Topic | null>(null);
  const [editTema, setEditTema] = useState('');
  const [deleteFor, setDeleteFor] = useState<Topic | null>(null);

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

    async function recoverAdmin() {
      const saved = sessionStorage.getItem(GATE_KEY);
      if (!saved) return;
      const { data, error } = await supabase.rpc('scheduler_check_password', {
        p_pass: saved
      });
      if (!error && data === true) {
        setIsAdmin(true);
        setAdminPassword(saved);
        setGateOpen(false);
      } else {
        sessionStorage.removeItem(GATE_KEY);
      }
    }
    recoverAdmin();
  }, []);

  async function enterAdmin() {
    setWorking(true);
    setGateError(null);
    const { data, error } = await supabase.rpc('scheduler_check_password', {
      p_pass: gatePassword
    });
    if (!error && data === true) {
      sessionStorage.setItem(GATE_KEY, gatePassword);
      setIsAdmin(true);
      setAdminPassword(gatePassword);
      setGatePassword('');
      setGateOpen(false);
    } else {
      setGateError('Password incorrecto');
    }
    setWorking(false);
  }

  function openGate() {
    setGatePassword('');
    setGateError(null);
    setGateOpen(true);
  }

  function leaveAdmin() {
    sessionStorage.removeItem(GATE_KEY);
    setIsAdmin(false);
    setAdminPassword('');
  }

  async function markReviewed(topic: Topic) {
    if (working) return;
    setWorking(true);
    setActionError(null);
    const { data, error } = await supabase.rpc('scheduler_mark_reviewed', {
      p_id: topic.id,
      p_pass: adminPassword
    });
    if (error) {
      setActionError(rpcToMessage(error.message));
    } else if (data) {
      const updated = data as Topic;
      setRows(prev =>
        sortRows(prev?.map(r => (r.id === updated.id ? updated : r)) ?? [])
      );
    }
    setWorking(false);
  }

  async function submitRename() {
    if (!editFor) return;
    const tema = editTema.trim();
    if (!tema) {
      setActionError('El tema no puede estar vacío');
      return;
    }
    setWorking(true);
    setActionError(null);
    const { data, error } = await supabase.rpc('scheduler_rename_topic', {
      p_id: editFor.id,
      p_tema: tema,
      p_pass: adminPassword
    });
    if (error) {
      setActionError(rpcToMessage(error.message));
    } else if (data) {
      const updated = data as Topic;
      setRows(prev =>
        sortRows(prev?.map(r => (r.id === updated.id ? updated : r)) ?? [])
      );
      setEditFor(null);
    }
    setWorking(false);
  }

  async function submitDelete() {
    if (!deleteFor) return;
    setWorking(true);
    setActionError(null);
    const { error } = await supabase.rpc('scheduler_delete_topic', {
      p_id: deleteFor.id,
      p_pass: adminPassword
    });
    if (error) {
      setActionError(rpcToMessage(error.message));
    } else {
      const id = deleteFor.id;
      setRows(prev => prev?.filter(r => r.id !== id) ?? null);
      setDeleteFor(null);
    }
    setWorking(false);
  }

  async function addTopic() {
    if (!newTema.trim()) {
      setActionError('Escribe el nombre del tema');
      return;
    }
    setWorking(true);
    setActionError(null);
    const { data, error } = await supabase.rpc('scheduler_add_topic', {
      p_tema: newTema.trim(),
      p_pass: adminPassword
    });
    if (error) {
      setActionError(rpcToMessage(error.message));
    } else if (data) {
      setRows(prev => sortRows([...(prev ?? []), data as Topic]));
      setNewTema('');
    }
    setWorking(false);
  }

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
        {isAdmin ? (
          <button className='badge-admin' onClick={leaveAdmin}>
            modo admin ✓ · salir
          </button>
        ) : (
          <button className='badge-guest' onClick={openGate}>
            entrar como admin
          </button>
        )}
      </header>

      {loadError && (
        <aside className='load-error'>
          No se pudo cargar la agenda: {loadError}
        </aside>
      )}

      {actionError && !gateOpen && (
        <aside className='load-error'>{actionError}</aside>
      )}

      <section className='overview'>
        <div className='today-block'>
          <h3>
            HOY <small>({overview.today.length})</small>
          </h3>
          <div className='cells'>
            {overview.today.length === 0 && <em>Libre hoy ✔</em>}
            {overview.today.map(r =>
              isDone(r) ? (
                <span key={r.id} className='cell dim'>
                  {r.tema}
                </span>
              ) : isAdmin ? (
                <button
                  key={r.id}
                  className='cell today'
                  title='Marcar como repasado'
                  onClick={() => markReviewed(r)}
                >
                  {r.tema}
                </button>
              ) : (
                <span key={r.id} className='cell today'>
                  {r.tema}
                </span>
              )
            )}
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
          {(rows ?? []).map(r => {
            const dueToday = !isDone(r) && r.proxima_fecha === today;
            return (
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
                <span className='row-actions'>
                  {isDone(r) && !isAdmin ? (
                    <span className='row-done-text'>terminado</span>
                  ) : isAdmin ? (
                    <>
                      {dueToday && (
                        <button
                          className='row-done'
                          disabled={working}
                          onClick={() => markReviewed(r)}
                          title='Marcar como repasado'
                        >
                          Repasado ✓
                        </button>
                      )}
                      <button
                        className='row-more'
                        title='Opciones'
                        onClick={() =>
                          setMenuFor(menuFor === r.id ? null : r.id)
                        }
                      >
                        ⋯
                      </button>
                      {menuFor === r.id && (
                        <div className='row-menu'>
                          <button
                            type='button'
                            onClick={() => {
                              setMenuFor(null);
                              setEditFor(r);
                              setEditTema(r.tema);
                            }}
                          >
                            Editar
                          </button>
                          <button
                            type='button'
                            className='danger'
                            onClick={() => {
                              setMenuFor(null);
                              setDeleteFor(r);
                            }}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </>
                  ) : null}
                </span>
              </li>
            );
          })}
          {!rows && !loadError && <li>Cargando…</li>}
          {rows && rows.length === 0 && !loadError && <li>Sin temas</li>}
        </ul>
      </section>

      {isAdmin && (
        <section className='admin-bar'>
          <div className='admin-controls'>
            <input
              type='text'
              placeholder='Nuevo tema, p. ej. (191) 25 RANDOM SENTENCES'
              value={newTema}
              onChange={e => {
                setNewTema(e.target.value);
                if (actionError) setActionError(null);
              }}
            />
            <button
              className='btn-add'
              disabled={working}
              onClick={addTopic}
            >
              + Agregar tema
            </button>
          </div>
        </section>
      )}

      {menuFor && (
        <div className='menu-back' onClick={() => setMenuFor(null)} />
      )}

      {editFor && (
        <div className='modal-back' onClick={() => setEditFor(null)}>
          <form
            className='modal'
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              e.preventDefault();
              submitRename();
            }}
          >
            <h3>Editar tema</h3>
            <input
              autoFocus
              type='text'
              value={editTema}
              onChange={e => setEditTema(e.target.value)}
            />
            <div className='modal-actions'>
              <button type='button' onClick={() => setEditFor(null)}>
                Cancelar
              </button>
              <button
                type='submit'
                disabled={working || editTema.trim().length === 0}
              >
                {working ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteFor && (
        <div className='modal-back' onClick={() => setDeleteFor(null)}>
          <div
            className='modal'
            onClick={e => e.stopPropagation()}
          >
            <h3>Eliminar tema</h3>
            <p className='modal-no-auth'>
              ¿Seguro que quieres eliminar «{deleteFor.tema}» con todo su
              historial de repasos? Esta acción es definitiva.
            </p>
            <div className='modal-actions'>
              <button type='button' onClick={() => setDeleteFor(null)}>
                Cancelar
              </button>
              <button
                type='button'
                className='danger'
                disabled={working}
                onClick={submitDelete}
              >
                {working ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {gateOpen && (
        <div className='modal-back' onClick={() => setGateOpen(false)}>
          <form
            className='modal'
            onClick={e => e.stopPropagation()}
            onSubmit={e => {
              e.preventDefault();
              enterAdmin();
            }}
          >
            <h3>Acceso admin</h3>
            <p className='modal-no-auth'>
              Con tu password marcas repasos y agregas temas. Sin ella
              entras en modo visitante: solo mirar.
            </p>
            <input
              type='password'
              autoFocus
              placeholder='Tu password especial'
              value={gatePassword}
              onChange={e => {
                setGatePassword(e.target.value);
                if (gateError) setGateError(null);
              }}
            />
            {gateError && <small className='modal-error'>{gateError}</small>}
            <div className='modal-actions'>
              <button type='button' onClick={() => setGateOpen(false)}>
                Solo mirar
              </button>
              <button
                type='submit'
                disabled={working || gatePassword.length === 0}
              >
                {working ? 'Comprobando…' : 'Entrar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
};
