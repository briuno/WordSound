-- WordSound — corrige recursao infinita na policy de profiles
--
-- A policy profiles_update_own tinha este with check:
--
--   role = (select p.role from public.profiles p where p.id = auth.uid())
--
-- A intencao era impedir o aluno de se promover a admin. Mas consultar
-- profiles de dentro de uma policy sobre profiles e recursivo, e o Postgres
-- responde 42P17 "infinite recursion detected in policy". O erro so aparecia
-- em UPDATE, que nenhuma tela fazia ate a gestao de usuarios existir: promover
-- alguem falhava e a escrita nao acontecia.
--
-- A regra continua valendo, so que num trigger, onde consultar a tabela e
-- perfeitamente legal.

drop policy if exists profiles_update_own on public.profiles;

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function private.guard_role_change()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  if new.role is distinct from old.role
     -- auth.uid() nulo significa acesso direto ao banco ou service_role, que
     -- ja e confiavel; a regra existe para o usuario autenticado comum
     and (select auth.uid()) is not null
     and not (select private.is_admin())
  then
    raise exception 'Apenas administradores podem alterar o papel de uma conta.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $fn$;

create trigger profiles_guard_role_change
before update on public.profiles
for each row execute function private.guard_role_change();
