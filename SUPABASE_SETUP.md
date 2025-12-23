# 🔧 Configuração do Supabase na Vercel

## 📋 Variáveis de Ambiente Necessárias

Para que o tracking funcione corretamente em produção, você precisa adicionar as seguintes variáveis de ambiente na Vercel:

### 1. Acesse as Configurações do Projeto na Vercel

1. Vá para o seu projeto na Vercel
2. Clique em **Settings** (Configurações)
3. Clique em **Environment Variables** (Variáveis de Ambiente)

### 2. Adicione as Variáveis

Adicione estas duas variáveis:

**Variável 1:**
- **Nome:** `VITE_SUPABASE_URL`
- **Valor:** `https://xspshdeuppwaqjfbdfcb.supabase.co`
- **Ambiente:** Production, Preview, Development (marque todos)

**Variável 2:**
- **Nome:** `VITE_SUPABASE_ANON_KEY`
- **Valor:** `sb_publishable_HnnFmVvK-W0vzqBUEkqDbg_nZiaACgt`
- **Ambiente:** Production, Preview, Development (marque todos)

### 3. Faça Redeploy

Após adicionar as variáveis:
1. Vá para a aba **Deployments**
2. Clique nos três pontos (⋯) do último deploy
3. Clique em **Redeploy**
4. Aguarde o deploy concluir

## ✅ Como Funciona Agora

1. **Eventos são salvos em DOIS lugares:**
   - ✅ **LocalStorage** (dados locais do navegador)
   - ✅ **Supabase** (banco de dados - dados de TODOS os usuários)

2. **Dashboard lê de DOIS lugares:**
   - Primeiro tenta carregar do **Supabase** (dados de todos)
   - Se falhar, usa **localStorage** como fallback

3. **Benefícios:**
   - ✅ Dados persistentes no banco
   - ✅ Vê dados de todos os usuários
   - ✅ Histórico completo
   - ✅ Não perde dados se limpar cache

## 🧪 Testando

1. Complete algumas perguntas no quiz
2. Acesse o dashboard: `https://seu-dominio.vercel.app/#dashboard`
3. Verifique se os dados aparecem
4. Opcional: Verifique no Supabase se os eventos foram salvos na tabela `tracking_events`

## 📊 Verificar Dados no Supabase

1. Acesse o Supabase Dashboard
2. Vá em **Table Editor**
3. Selecione a tabela `tracking_events`
4. Você verá todos os eventos salvos!

