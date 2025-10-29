import { useStoreCanvas } from '@/components/05/store/useStoreCanvas';
import '@/components/05/styles/CanvasBoard.css';
import { useEffect, useRef } from 'react';

export const CanvasBoard = () => {
  const canvasElement = useRef<null | HTMLCanvasElement>(null);
  const blockSize = useStoreCanvas(state => state.blocksize);
  const rowsCount = useStoreCanvas(state => state.rowsCount);
  const columnsCount = useStoreCanvas(state => state.columnsCount);
  const heightCanvas = `${blockSize * rowsCount}`;
  const widthCanvas = `${blockSize * columnsCount}`;
  const matriz = useStoreCanvas(state => state.matriz);
  const paintColorOfOneSquare = useStoreCanvas(
    state => state.paintColorOfOneSquare
  );

  function paintSquare(e: React.MouseEvent) {
    const { offsetLeft, offsetTop } = e.target as HTMLElement;
    const { clientX, clientY } = e;
    const x = clientX - offsetLeft;
    const y = clientY - offsetTop;
    const inX = ~~(x / blockSize);
    const inY = ~~(y / blockSize);
    paintColorOfOneSquare({ inX, inY });
  }

  useEffect(() => {
    const canvas = canvasElement.current;
    if (canvas == null) return;
    const ctx = canvas?.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    matriz.forEach((row, y) => {
      row.forEach((value, x) => {
        ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
        ctx.fillStyle = value;
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
      });
    });
  }, [columnsCount, rowsCount, matriz, columnsCount, rowsCount]);

  return (
    <canvas
      style={{
        ['--w' as any]: `${widthCanvas}px`,
        ['--h' as any]: `${heightCanvas}px`
      }}
      onClick={paintSquare}
      ref={canvasElement}
      className='am-canvas-board'
      width={widthCanvas}
      height={heightCanvas}
    ></canvas>
  );
};
