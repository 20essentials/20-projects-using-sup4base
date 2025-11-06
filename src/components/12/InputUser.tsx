import './InputUser.css';

export const InputUserData = ({
  placeholderName
}: {
  placeholderName: string;
}) => {
  return (
    <div className='form-control'>
      <input type='text' required />
      <label>
        {placeholderName.split('').map((char, i) => (
          <span style={{ transitionDelay: `${i * 50}ms` }}>{char}</span>
        ))}
      </label>
    </div>
  );
};
