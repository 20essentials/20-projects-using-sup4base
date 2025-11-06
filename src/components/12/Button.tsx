import type { RefObject } from 'react';
import './Button.css';

export const Button = ({
  text,
  colorButton,
  callbackFn,
  nameRef,
  roleRef
}: {
  text: string;
  colorButton: string;
  callbackFn: (...args: any[]) => void;
  nameRef?: RefObject<string>;
  roleRef?: RefObject<string>;
}) => {
  return (
    <button
      className='am-button'
      onClick={() => callbackFn()}
      style={{ '--clr-button': colorButton } as React.CSSProperties}
    >
      <b>{text}</b>
    </button>
  );
};
