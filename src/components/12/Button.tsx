import type { RefObject } from 'react';
import './Button.css';
import type { UserDataType } from './ContainerProfileCard';

export const Button = ({
  text,
  colorButton,
  callbackFn,
  nameRef,
  roleRef
}: {
  text: string;
  colorButton: string;
  callbackFn: (userData: UserDataType) => void;
  nameRef: RefObject<string>;
  roleRef: RefObject<string>;
}) => {
  return (
    <button
      className='am-button'
      onClick={() =>
        callbackFn({ newName: nameRef.current, newRole: roleRef.current })
      }
      style={{ '--clr-button': colorButton } as React.CSSProperties}
    >
      <b>{text}</b>
    </button>
  );
};
