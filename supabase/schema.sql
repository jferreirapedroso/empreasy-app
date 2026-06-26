-- Habilitar a extensão UUID-OSSP se necessário
create extension if not exists "uuid-ossp";

-- Remover tabelas existentes para recriação limpa (se necessário)
drop table if exists public.colaboradores cascade;
drop table if exists public.investimentos cascade;
drop table if exists public.orcamentos cascade;
drop table if exists public.despesas cascade;
drop table if exists public.perfis cascade;

-- 1. Tabela de Perfis de Usuários (perfis)
create table public.perfis (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text,
  cargo text,
  cpf text,
  cnpj text,
  razao_social text,
  nome_fantasia text,
  setor text,
  cep text,
  rua text,
  numero text,
  cidade text,
  estado text,
  responsavel text,
  empresa_tipo text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security) nos Perfis
alter table public.perfis enable row level security;

-- Políticas RLS para Perfis
create policy "Usuários podem ver seu próprio perfil" on public.perfis
  for select to authenticated using (auth.uid() = id);

create policy "Usuários podem atualizar seu próprio perfil" on public.perfis
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Usuários podem inserir seu próprio perfil" on public.perfis
  for insert to authenticated with check (auth.uid() = id);

-- 2. Tabela de Colaboradores (colaboradores)
create table public.colaboradores (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  cargo text not null,
  setor text,
  remuneracao numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS nos Colaboradores
alter table public.colaboradores enable row level security;

-- Políticas RLS para Colaboradores
create policy "Usuários podem ver seus próprios colaboradores" on public.colaboradores
  for select to authenticated using (auth.uid() = user_id);

create policy "Usuários podem inserir seus próprios colaboradores" on public.colaboradores
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios colaboradores" on public.colaboradores
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuários podem deletar seus próprios colaboradores" on public.colaboradores
  for delete to authenticated using (auth.uid() = user_id);

-- 3. Tabela de Despesas (despesas)
create table public.despesas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  categoria text not null,
  titulo text not null,
  valor numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS nas Despesas
alter table public.despesas enable row level security;

-- Políticas RLS para Despesas
create policy "Usuários podem ver suas próprias despesas" on public.despesas
  for select to authenticated using (auth.uid() = user_id);

create policy "Usuários podem inserir suas próprias despesas" on public.despesas
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias despesas" on public.despesas
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuários podem deletar suas próprias despesas" on public.despesas
  for delete to authenticated using (auth.uid() = user_id);

-- 4. Tabela de Investimentos (investimentos)
create table public.investimentos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  categoria text not null,
  titulo text not null,
  valor numeric not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS nos Investimentos
alter table public.investimentos enable row level security;

-- Políticas RLS para Investimentos
create policy "Usuários podem ver seus próprios investimentos" on public.investimentos
  for select to authenticated using (auth.uid() = user_id);

create policy "Usuários podem inserir seus próprios investimentos" on public.investimentos
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios investimentos" on public.investimentos
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuários podem deletar seus próprios investimentos" on public.investimentos
  for delete to authenticated using (auth.uid() = user_id);

-- 5. Tabela de Orçamentos (orcamentos)
create table public.orcamentos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  titulo text not null,
  valor numeric not null,
  vendedor text,
  status text default 'Pendente',
  empresa text,
  descricao text,
  faturamento_real numeric,
  valor_produto numeric,
  email_cliente text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS nos Orçamentos
alter table public.orcamentos enable row level security;

-- Políticas RLS para Orçamentos
create policy "Usuários podem ver seus próprios orçamentos" on public.orcamentos
  for select to authenticated using (auth.uid() = user_id);

create policy "Usuários podem inserir seus próprios orçamentos" on public.orcamentos
  for insert to authenticated with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios orçamentos" on public.orcamentos
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuários podem deletar seus próprios orçamentos" on public.orcamentos
  for delete to authenticated using (auth.uid() = user_id);

-- 6. Trigger para criar o perfil na tabela 'perfis' automaticamente quando um novo usuário se cadastrar no auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.perfis (id, nome, cargo, cpf, empresa_tipo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', ''),
    coalesce(new.raw_user_meta_data->>'cargo', 'Administrador'),
    coalesce(new.raw_user_meta_data->>'cpf', ''),
    coalesce(new.raw_user_meta_data->>'empresa_tipo', 'Não')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Garantir que a trigger seja recriada de forma limpa
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
