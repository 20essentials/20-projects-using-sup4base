import { create } from 'zustand';
import { combine, persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

const INITIAL_ROWS_COUNT = 16;
const INITIAL_COLS_COUNT = 16;

function generaMatrix(rows: number, cols: number) {
  return Array(rows)
    .fill(null)
    .map(() => Array(cols).fill('transparent'));
}

const initialState = {
  blocksize: 20,
  rowsCount: INITIAL_ROWS_COUNT,
  columnsCount: INITIAL_COLS_COUNT,
  matriz: generaMatrix(INITIAL_ROWS_COUNT, INITIAL_COLS_COUNT),
  color: '#00ff00'
};

// --- Variables privadas fuera del store (no persistentes) ---
let changes: { row: number; col: number; color: string }[] = [];
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

async function saveChangesToSupabase(userId: string) {
  if (!userId || changes.length === 0) return;

  const toSave = [...changes];
  changes = []; // limpiamos la cola

  const { error } = await supabase
    .from('project_05_pixels')
    .upsert(
      toSave.map(c => ({
        user_id: userId,      // <-- uid actual
        row: c.row,
        col: c.col,
        color: c.color,
        updated_at: new Date().toISOString()
      })),
      { onConflict: 'user_id,row,col' }
    );

  if (error) {
    console.error('❌ Error al guardar:', error);
    changes = [...toSave, ...changes]; // reencolar en caso de fallo
  } else {
    console.log(`✅ ${toSave.length} cambios guardados.`);
  }
}

// --- Store principal ---
export const useStoreCanvas = create(
  persist(
    combine(initialState, (set, get) => ({
      setBlockSize: (numSize: number) => {
        set({ blocksize: numSize });
      },

      setRowsCount: (rowsCount: number) => {
        set({ rowsCount });
        const { matriz } = get();
        if (rowsCount === matriz.length) return;

        const newMatrix = structuredClone(matriz);
        if (rowsCount > matriz.length) {
          const { columnsCount } = get();
          const rowsToAdd = generaMatrix(rowsCount - matriz.length, columnsCount);
          set({ matriz: [...newMatrix, ...rowsToAdd] });
        } else {
          set({ matriz: newMatrix.slice(0, rowsCount) });
        }
      },

      setColumnsCount: (columnsCount: number) => {
        set({ columnsCount });
        const { matriz } = get();
        const currentCols = matriz[0]?.length ?? 0;
        if (columnsCount === currentCols) return;

        const newMatrix = structuredClone(matriz);
        if (columnsCount > currentCols) {
          const colsToAdd = columnsCount - currentCols;
          newMatrix.forEach(row => row.push(...Array(colsToAdd).fill('transparent')));
        } else {
          newMatrix.forEach((row, i) => {
            newMatrix[i] = row.slice(0, columnsCount);
          });
        }

        set({ matriz: newMatrix });
      },

      setColor({ color }: { color: string }) {
        set({ color });
      },

      paintColorOfOneSquare: ({ inX, inY }: { inX: number; inY: number }) => {
        const { color, matriz } = get();

        const newMatrix = structuredClone(matriz);
        newMatrix[inY][inX] = color;
        set({ matriz: newMatrix });

        // Guardamos el diff (último valor prevalece)
        changes = changes.filter(c => !(c.row === inY && c.col === inX));
        changes.push({ row: inY, col: inX, color });

        // Debounce: guarda tras 3s de inactividad
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
          const { data: userData } = await supabase.auth.getUser();
          const userId = userData?.user?.id;
          if (userId) void saveChangesToSupabase(userId);
        }, 3000);
      },

      resetCanvas() {
        set(initialState);
        changes = [];
        if (saveTimeout) clearTimeout(saveTimeout);
      }
    })),
    {
      name: 'grid-game'
    }
  )
);
