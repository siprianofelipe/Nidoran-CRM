-- ============================================================
-- Nidoran Seguros — Schema do banco de dados
-- Como usar: Supabase > SQL Editor > New query > cole tudo e clique em RUN
-- ============================================================

create extension if not exists "pgcrypto";

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  telefone text,
  email text,
  cidade text,
  origem text default 'Site',
  status text default 'Lead',
  data_cadastro date default current_date,
  created_at timestamptz default now()
);

create table if not exists apolices (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  tipo text not null,
  seguradora text,
  numero text,
  premio numeric default 0,
  periodicidade text default 'Mensal',
  comissao_pct numeric default 0,
  data_inicio date,
  data_vencimento date,
  status text default 'Ativa',
  created_at timestamptz default now()
);

create table if not exists tabela_comissoes (
  id uuid primary key default gen_random_uuid(),
  seguradora text not null,
  tipo text not null,
  percentual numeric not null default 0,
  created_at timestamptz default now()
);

create table if not exists negocios (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references clientes(id) on delete set null,
  produto_interesse text,
  valor_estimado numeric default 0,
  etapa text default 'Novo lead',
  criado_em date default current_date
);

create table if not exists campanhas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  segmento text,
  mensagem text,
  data date default current_date
);

create table if not exists tarefas_manuais (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  concluida boolean default false,
  created_at timestamptz default now()
);

-- guarda quais tarefas automáticas (geradas de apólices/negócios) já foram marcadas como feitas
create table if not exists tarefas_auto_concluidas (
  id text primary key,
  created_at timestamptz default now()
);

-- ============================================================
-- Segurança (RLS): só usuários logados no sistema podem ler/gravar
-- ============================================================
alter table clientes enable row level security;
alter table apolices enable row level security;
alter table tabela_comissoes enable row level security;
alter table negocios enable row level security;
alter table campanhas enable row level security;
alter table tarefas_manuais enable row level security;
alter table tarefas_auto_concluidas enable row level security;

create policy "acesso autenticado" on clientes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "acesso autenticado" on apolices for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "acesso autenticado" on tabela_comissoes for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "acesso autenticado" on negocios for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "acesso autenticado" on campanhas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "acesso autenticado" on tarefas_manuais for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "acesso autenticado" on tarefas_auto_concluidas for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================
-- Dados de exemplo (opcional — apague depois de validar)
-- ============================================================
insert into clientes (nome, cpf, telefone, email, cidade, origem, status)
values
  ('Maria Aparecida Souza', '123.456.789-00', '(11) 98888-7777', 'maria.souza@email.com', 'São Paulo/SP', 'Indicação', 'Ativo'),
  ('João Pedro Lima', '987.654.321-00', '(11) 97777-6666', 'joao.lima@email.com', 'Campinas/SP', 'Site', 'Ativo'),
  ('Fernanda Costa Ribeiro', '456.123.789-00', '(21) 96666-5555', 'fernanda.costa@email.com', 'Rio de Janeiro/RJ', 'Indicação', 'Lead');

insert into tabela_comissoes (seguradora, tipo, percentual) values
  ('Porto Seguro', 'Vida', 20),
  ('Porto Seguro', 'Auto', 15),
  ('Azul Seguros', 'Auto', 14),
  ('Brasilprev', 'Previdência', 8),
  ('Rodobens', 'Consórcio', 5),
  ('Icatu Seguros', 'Vida', 22);
