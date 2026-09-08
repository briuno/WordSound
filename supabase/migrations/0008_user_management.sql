-- WordSound — administracao de usuarios
--
-- Ate aqui o papel de admin so podia ser alterado direto no banco. Ao abrir
-- isso para a interface aparece um risco novo: rebaixar ou apagar o ultimo
-- administrador deixa o sistema sem ninguem capaz de administra-lo, sem volta
-- pela propria aplicacao.
--
-- A trava fica no banco, e nao na server action, porque a checagem "ainda
-- existe outro admin?" seguida da escrita e uma condicao de corrida: dois
-- admins se rebaixando ao mesmo tempo passariam os dois pela verificacao.

create or replace function private.guard_last_admin()
returns trigger language plpgsql security definer set search_path = '' as $fn$
declare
  v_remaining int;
begin
  if tg_op = 'UPDATE' and old.role = 'admin' and new.role is distinct from 'admin' then
    select count(*) into v_remaining from public.profiles where role = 'admin' and id <> old.id;
    if v_remaining = 0 then
      raise exception 'Nao e possivel rebaixar o ultimo administrador do sistema.'
        using errcode = 'check_violation';
    end if;
  end if;

  if tg_op = 'DELETE' and old.role = 'admin' then
    select count(*) into v_remaining from public.profiles where role = 'admin' and id <> old.id;
    if v_remaining = 0 then
      raise exception 'Nao e possivel excluir o ultimo administrador do sistema.'
        using errcode = 'check_violation';
    end if;
  end if;

  return coalesce(new, old);
end $fn$;

create trigger profiles_guard_last_admin
before update or delete on public.profiles
for each row execute function private.guard_last_admin();

-- Indice para a contagem de admins, usada pela trava a cada mudanca de papel
create index profiles_role_idx on public.profiles (role) where role = 'admin';
