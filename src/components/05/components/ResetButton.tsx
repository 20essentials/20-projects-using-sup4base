import { useStoreCanvas } from '@/components/05/store/useStoreCanvas';
import '@/components/05/styles/ResetButton.css';

export const ResetButton = () => {
  const resetCanvas = useStoreCanvas(state => state.resetCanvas);

  function handleReset(e: React.MouseEvent) {
    e.stopPropagation();
    resetCanvas();
  }

  return (
    <div className='button-container' onClick={handleReset}>
      <div className='button'>
        <span>Reset Canvas</span>
      </div>
    </div>
  );
};
