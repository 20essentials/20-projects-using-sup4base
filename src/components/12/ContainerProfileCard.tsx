import { baseUrl } from '@/utils/functions';
import ProfileCard from './ProfileCard';
import { InputUserData } from './InputUser';
import { Button } from './Button';
import { useEffect, useRef, useState } from 'react';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from 'astro:env/client';
import { supabase } from '@/lib/supabase';

const DEFAULT_NAME = 'Jonathan';
const DEFAULT_ROLE = 'Software Engineer';
export type UserDataType = {
  newName: string;
  newRole: string;
};

export const ContainerProfileCard = () => {
  const [name, setName] = useState(DEFAULT_NAME);
  const [role, setRole] = useState(DEFAULT_ROLE);
  const nameRef = useRef<string>(DEFAULT_NAME);
  const roleRef = useRef<string>(DEFAULT_ROLE);
  const userId = useRef<string | null>(null);
  const jwt = useRef<string | null>(null);

  const updateData = async ({ newName, newRole }: UserDataType) => {
    setName(newName);
    setRole(newRole);
    if (!userId.current || !jwt.current) return;
    if (!newName || !newRole) return;
    if (newName.trim() === '' || newRole.trim() === '') return;

    try {
      const response = await fetch(
        `${PUBLIC_SUPABASE_URL}/rest/v1/project_12_user_profile_card`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: PUBLIC_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${jwt.current}`,
            Prefer: 'return=representation,resolution=merge-duplicates'
          },
          body: JSON.stringify({
            id: userId.current,
            employee_name: newName,
            role_text: newRole
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error upserting profile card.', errorText);
      } else {
        console.log('Profile card updated successfully');
      }
    } catch (err) {
      console.error('Fetch error');
    }
  };

  const deleteData = async () => {
    setName(DEFAULT_NAME);
    setRole(DEFAULT_ROLE);

    if (!userId.current || !jwt.current) return;

    try {
      const response = await fetch(
        `${PUBLIC_SUPABASE_URL}/rest/v1/project_12_user_profile_card?id=eq.${userId.current}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt.current}`,
            apikey: PUBLIC_SUPABASE_ANON_KEY
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error deleting profile card.', errorText);
      } else {
        console.log('Profile card deleted successfully');
      }
    } catch (err) {
      console.error('Fetch error deleting profile card:', err);
    }
  };

  useEffect(() => {
    async function initUserProfile() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          return;
        }

        if (!data.session?.user) {
          console.error('No user session found');
          return;
        }

        userId.current = data.session.user.id;
        jwt.current = data.session.access_token;

        const response = await fetch(
          `${PUBLIC_SUPABASE_URL}/rest/v1/project_12_user_profile_card?id=eq.${userId.current}&select=*`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${jwt.current}`,
              apikey: PUBLIC_SUPABASE_ANON_KEY
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error fetching profile card.', errorText);
          return;
        }

        const dataProfile = await response.json();
        if (dataProfile.length > 0) {
          setName(dataProfile[0].employee_name);
          setRole(dataProfile[0].role_text);
        } else {
          setName(DEFAULT_NAME);
          setRole(DEFAULT_ROLE);
        }
      } catch (err) {
        console.error('Error initializing user profile:', err);
      }
    }

    initUserProfile();
  }, []);

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
