import { create } from 'zustand';
import { combine, persist } from 'zustand/middleware';

const INITIAL_ROWS_COUNT = 16;
const INITIAL_COLS_COUNT = 16;

function generaMatrix(rows: number, cols: number) {
  return Array(rows)
    .fill(null)
    .map(_ => Array(cols).fill('transparent'));
}

const initialState = {
  blocksize: 20,
  rowsCount: INITIAL_ROWS_COUNT,
  columnsCount: INITIAL_COLS_COUNT,
  matriz: generaMatrix(INITIAL_ROWS_COUNT, INITIAL_COLS_COUNT),
  color: '#00ff00'
};

export const useStoreCanvas = create(
  persist(
    combine(initialState, (set, get) => ({
      setBlockSize: (numSize: number) => {
        set({ blocksize: numSize });
      },
      setRowsCount: (rowsCount: number) => {
        set({ rowsCount });
        const { matriz } = get();
        const isEqualNumOfRows = rowsCount === matriz.length;
        if (isEqualNumOfRows) return;

        const newMatrix = structuredClone(matriz);
        const weAddRows = rowsCount > matriz.length;

        //Add Rows
        if (weAddRows) {
          const { columnsCount } = get();
          const numOfRowsToAdd = rowsCount - matriz.length;
          const newArray = generaMatrix(numOfRowsToAdd, columnsCount);
          const finalMatrix = [...newMatrix, ...newArray];
          set({ matriz: finalMatrix });
          return;
        }

        //Remove Rows
        const finalMatriz = newMatrix.slice(0, rowsCount);
        set({ matriz: finalMatriz });
      },
      setColumnsCount: (columnsCount: number) => {
        set({ columnsCount });
        const { matriz } = get();
        const currentCols = matriz[0]?.length ?? 0;
        if (columnsCount === currentCols) return;
        const newMatrix = structuredClone(matriz);

        if (columnsCount > currentCols) {
          //Add Rows
          const colsToAdd = columnsCount - currentCols;
          newMatrix.forEach(row => {
            row.push(...Array(colsToAdd).fill('transparent'));
          });
        } else {
          //Remove Rows
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
      },
      resetCanvas() {
        set(initialState);
      }
    })),
    { name: 'grid-game' }
  )
);
