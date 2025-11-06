import { baseUrl } from '@/utils/functions';
import ProfileCard from './ProfileCard';
import { InputUserData } from './InputUser';
import { Button } from './Button';
import { useRef, useState } from 'react';

const DEFAULT_NAME = 'Jonathan';
const DEFAULT_ROLE = 'Software Engineer';

export const ContainerProfileCard = () => {
  const [name, setName] = useState(DEFAULT_NAME);
  const [role, setRole] = useState(DEFAULT_ROLE);
  const nameRef = useRef(DEFAULT_NAME);
  const roleRef = useRef(DEFAULT_ROLE);

  const updateData = ({
    newName,
    newRole
  }: {
    newName: string;
    newRole: string;
  }) => {
    setName(newName);
    setRole(newRole);
  };

  const deleteData = ({
    newName,
    newRole
  }: {
    newName: string;
    newRole: string;
  }) => {
    setName(DEFAULT_NAME);
    setRole(DEFAULT_ROLE);
  };

  return (
    <>
      <article className='ContainerProfileCard'>
        <ProfileCard
          name={name}
          title={role}
          handle={name}
          status='Online'
          contactText='Contact Me'
          avatarUrl={baseUrl('/assets/random-person.webp')}
          iconUrl={baseUrl('/assets/favicon.webp')}
          showUserInfo={true}
          enableTilt={true}
          enableMobileTilt={false}
          onContactClick={() => console.log('Contact clicked')}
        />
      </article>
      <InputUserData nameRef={nameRef} placeholderName={'Employee Name'} />
      <InputUserData roleRef={roleRef} placeholderName={'Role'} />
      <Button
        text={'Update'}
        nameRef={nameRef}
        roleRef={roleRef}
        callbackFn={updateData}
        colorButton={'#04aa6d'}
      />
      <Button
        text={'Delete'}
        nameRef={nameRef}
        roleRef={roleRef}
        callbackFn={deleteData}
        colorButton={'#bf0426'}
      />
    </>
  );
};
