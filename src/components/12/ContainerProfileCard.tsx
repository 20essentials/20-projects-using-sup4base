import { baseUrl } from '@/utils/functions';
import ProfileCard from './ProfileCard';
import { InputUserData } from './InputUser';
import { Button } from './Button';

export const ContainerProfileCard = () => {
  const name = 'Jonathan';
  const role = 'Software Engineer'

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

      <InputUserData placeholderName={'Employee Name'} />
      <InputUserData placeholderName={'Role'} />
      <Button text={'Update'} colorButton={'#04aa6d'} />
      <Button text={'Delete'} colorButton={'#bf0426'} />
    </>
  );
};
