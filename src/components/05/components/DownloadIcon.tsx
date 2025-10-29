import { useStoreCanvas } from '@/components/05/store/useStoreCanvas';

export const DownloadIcon = (props: any) => {
  const matriz = useStoreCanvas(state => state.matriz);
  const blockSize = useStoreCanvas(state => state.blocksize);

  function handleDownload() {
    const $canvas = document.querySelector(
      '.am-canvas-board'
    ) as HTMLCanvasElement;
    const newCanvas = $canvas.cloneNode(true) as HTMLCanvasElement;
    const ctx = newCanvas?.getContext('2d') as CanvasRenderingContext2D;
    matriz.forEach((row, y) => {
      row.forEach((value, x) => {
        if (!value) return;
        ctx.fillStyle = value;
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
      });
    });
    const img = newCanvas.toDataURL('image/png');
    const anchor = document.createElement('a');
    anchor.href = img;
    anchor.download = 'draw.png';
    anchor.click();
  }

  return (
    <svg
      onClick={handleDownload}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      {...props}
    >
      <path
        fill='currentColor'
        d='M12 4v12.25L17.25 11l.75.66-6.5 6.5-6.5-6.5.75-.66L11 16.25V4zM3 19h1v2h15v-2h1v3H3z'
      />
    </svg>
  );
};
