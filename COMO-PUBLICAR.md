# Como publicar o sistema Nidoran Seguros (sem usar terminal)

Isso já foi testado e compila sem erros. São 3 etapas: **banco de dados → repositório → publicação**. Nenhuma exige escrever código.

## Etapa 1 — Criar o banco de dados (Supabase)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta grátis.
2. Clique em **New Project**. Dê um nome (ex: `nidoran-crm`) e uma senha para o banco (guarde essa senha).
3. Espere o projeto ficar pronto (1-2 minutos).
4. No menu lateral, clique em **SQL Editor** → **New query**.
5. Abra o arquivo `supabase/schema.sql` deste pacote, copie todo o conteúdo e cole ali.
6. Clique em **RUN**. Isso cria todas as tabelas, as regras de segurança e alguns dados de exemplo.
7. Vá em **Authentication** → **Users** → **Add user** → crie o login do administrador (e-mail e senha que vocês vão usar para entrar no painel).
8. Vá em **Project Settings** → **API**. Copie dois valores: **Project URL** e a chave **anon public**. Vai precisar deles na Etapa 3.

## Etapa 2 — Colocar o código no GitHub (sem terminal)

1. Crie uma conta em [github.com](https://github.com), se ainda não tiver.
2. Clique em **New repository**. Nome sugerido: `nidoran-crm`. Deixe como **Private**. Crie.
3. Na página do repositório vazio, clique em **uploading an existing file**.
4. Arraste **todos os arquivos e pastas deste pacote, exceto `node_modules` e `.next`** (esse pacote já não tem essas pastas) para dentro da janela do navegador.
5. Clique em **Commit changes**.

## Etapa 3 — Publicar (Vercel)

1. Acesse [vercel.com](https://vercel.com) e crie uma conta usando o mesmo login do GitHub.
2. Clique em **Add New** → **Project**.
3. Selecione o repositório `nidoran-crm` que você acabou de criar.
4. Antes de clicar em Deploy, abra **Environment Variables** e adicione três:
   - `NEXT_PUBLIC_SUPABASE_URL` → cole a Project URL da Etapa 1
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → cole a chave anon public da Etapa 1
   - `ANTHROPIC_API_KEY` → sua chave da API da Anthropic (crie em [console.anthropic.com](https://console.anthropic.com), só é usada para a aba "Assistente IA")
5. Clique em **Deploy**. Em cerca de 1-2 minutos, a Vercel te dá um link, algo como `nidoran-crm.vercel.app` — igual ao padrão do `mf-crm.vercel.app`.
6. Acesse o link, faça login com o usuário criado na Etapa 1, e o sistema está no ar.

## Depois de publicar

- Para criar login de outras pessoas da equipe: Supabase → Authentication → Users → Add user.
- Os dados de exemplo (`Maria Aparecida`, `João Pedro`, `Fernanda`) podem ser apagados direto no painel, em Clientes.
- Qualquer alteração de código futura: repita a Etapa 2 (subir os arquivos atualizados no GitHub) — a Vercel publica de novo sozinha.
