-- set_user_role: change the role of an existing login, from the SQL Editor.
--
-- Usage:
--   select public.set_user_role('someone@example.com', 'admin');
--   select public.set_user_role('someone@example.com', 'editor');
--   select public.set_user_role('someone@example.com', null);   -- remove access
--
-- Same as running:
--   update public.profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'someone@example.com');

create or replace function public.set_user_role(p_email text, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = lower(trim(p_email));
  if v_user_id is null then
    raise exception 'No user with email %', p_email;
  end if;

  insert into public.profiles (id, display_name, role)
  values (v_user_id, lower(trim(p_email)), p_role)
  on conflict (id) do update set role = excluded.role;
end;
$$;

-- Only the SQL Editor / service role may run it.
revoke execute on function public.set_user_role(text, public.app_role) from public, anon, authenticated;
grant execute on function public.set_user_role(text, public.app_role) to service_role;
