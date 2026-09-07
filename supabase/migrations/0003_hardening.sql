-- schema_migrations e tabela de controle do runner e nao deve ser legivel via PostgREST.
-- RLS ligado sem nenhuma policy nega tudo; o service_role continua enxergando.
alter table public.schema_migrations enable row level security;
