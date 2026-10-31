import { DownloadIcon } from '@/features/pixel-art/components/download-icon';
import '@/features/pixel-art/styles/nav-options.css';
import { ResetButton } from '@/features/pixel-art/components/reset-button';
import { useStoreCanvas } from '@/features/pixel-art/store/use-store-canvas';

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
