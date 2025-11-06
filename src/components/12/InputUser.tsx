import './InputUser.css';
import { useState, type ChangeEvent, type RefObject } from 'react';

export const InputUserData = ({
  placeholderName,
  nameRef,
  roleRef
}: {
  placeholderName: string;
  nameRef?: RefObject<string>;
  roleRef?: RefObject<string>;
}) => {
  const [valueInput, setValueInput] = useState('');

  function updateValue(e: ChangeEvent<HTMLInputElement>) {
    const value = e.currentTarget.value;
    if (nameRef?.current) nameRef.current = value;
    if (roleRef?.current) roleRef.current = value;
    setValueInput(value);
  }

  return (
    <div className='form-control'>
      <input type='text' value={valueInput} required onChange={updateValue} />
      <label>
        {placeholderName.split('').map((char, i) => (
          <span style={{ transitionDelay: `${i * 50}ms` }}>{char}</span>
        ))}
      </label>
    </div>
  );
};
