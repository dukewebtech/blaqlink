-- Fix user profiles and categories foreign key

-- First, create a function to handle new user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, auth_id, email, full_name, role)
  values (
    gen_random_uuid(),
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'vendor')
  );
  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create trigger to automatically create user profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Drop the existing foreign key constraint on categories
alter table public.categories
  drop constraint if exists categories_user_id_fkey;

-- Add the correct foreign key constraint
alter table public.categories
  add constraint categories_user_id_fkey
  foreign key (user_id) references public.users(id) on delete cascade;

-- Insert missing user profiles for existing auth users
insert into public.users (id, auth_id, email, full_name, role)
select 
  gen_random_uuid(),
  au.id,
  au.email,
  coalesce(au.raw_user_meta_data->>'full_name', au.email),
  coalesce(au.raw_user_meta_data->>'role', 'vendor')
from auth.users au
where not exists (
  select 1 from public.users u where u.auth_id = au.id
)
on conflict (email) do nothing;
