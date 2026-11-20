-- create_staff_user: add (or update) a login with a password and a role,
-- straight from the SQL Editor. Not callable from the website API.
--
-- Usage:
--   select public.create_staff_user('someone@example.com', 'StrongPassword123', 'editor');
--   select public.create_staff_user('owner@example.com',   'StrongPassword123', 'admin');
--
-- Running it again for an existing email updates that user's password and role.

create or replace function public.create_staff_user(
  p_email text,
  p_password text,
  p_role public.app_role default 'editor'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(p_email));
  v_user_id uuid;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Invalid email: %', p_email;
  end if;
  if char_length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user_id, 'authenticated', 'authenticated',
      v_email, extensions.crypt(p_password, extensions.gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('display_name', v_email),
      now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_user_id, v_user_id::text, 'email',
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      now(), now(), now()
    );
  else
    update auth.users
       set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
           email_confirmed_at = coalesce(email_confirmed_at, now()),
           updated_at = now()
     where id = v_user_id;
  end if;

  -- The on_auth_user_created trigger makes the profile; upsert covers older users.
  insert into public.profiles (id, display_name, role)
  values (v_user_id, v_email, p_role)
  on conflict (id) do update set role = excluded.role;

  return v_user_id;
end;
$$;

-- Only the SQL Editor / service role may run it; never visitors or signed-in users.
revoke execute on function public.create_staff_user(text, text, public.app_role) from public, anon, authenticated;
grant execute on function public.create_staff_user(text, text, public.app_role) to service_role;
