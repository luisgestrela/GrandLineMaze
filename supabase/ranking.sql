-- Rode este arquivo no Supabase: SQL Editor > New query > Run

create table if not exists public.ranking (
  google_sub text primary key,            -- id único do usuário no Google
  name       text not null,               -- nome público (ex.: "Luis E.")
  score      int  not null check (score >= 0),
  updated_at timestamptz not null default now()
);

-- Segurança: com RLS ligado e sem políticas, o navegador (chave anon) NÃO acessa a tabela.
-- Só a API do Vercel, usando a chave secreta, lê e grava.
alter table public.ranking enable row level security;

-- Grava a pontuação só se for maior que o recorde atual
create or replace function public.submit_score(p_sub text, p_name text, p_score int)
returns void language sql as $$
  insert into public.ranking (google_sub, name, score)
  values (p_sub, p_name, p_score)
  on conflict (google_sub) do update
    set name = excluded.name,
        score = greatest(public.ranking.score, excluded.score),
        updated_at = now();
$$;

revoke execute on function public.submit_score(text, text, int) from public, anon, authenticated;
grant  execute on function public.submit_score(text, text, int) to service_role;
