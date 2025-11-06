import './Button.css';

export const Button = ({
  text,
  colorButton
}: {
  text: string;
  colorButton: string;
}) => {
  return (
    <button
      className='am-button'
      style={{ '--clr-button': colorButton } as React.CSSProperties}
    >
      <b>{text}</b>
    </button>
  );
};
