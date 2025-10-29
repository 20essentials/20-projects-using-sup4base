import { DownloadIcon } from '@/components/05/components/DownloadIcon';
import '@/components/05/styles/NavOptions.css';
import { ResetButton } from '@/components/05/components/ResetButton';
import { useStoreCanvas } from '@/components/05/store/useStoreCanvas';

export const NavOptions = () => {
  const setColor = useStoreCanvas(state => state.setColor);
  const color = useStoreCanvas(state => state.color);

  function handleColor(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setColor({ color: value });
  }

  return (
    <nav className='container-options'>
      <aside className='option option-color'>
        <input type='color' defaultValue={color} onInput={handleColor} />
      </aside>
      <aside className='option option-download'>
        <DownloadIcon />
      </aside>
      <aside className='option option-reset'>
        <ResetButton />
      </aside>
    </nav>
  );
};
