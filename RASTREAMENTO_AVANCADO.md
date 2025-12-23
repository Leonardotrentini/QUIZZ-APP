# 📊 Rastreamento Avançado - IP, Localização e Origem do Anúncio

## ✅ Funcionalidades Implementadas

### 1. **Rastreamento de IP e Localização**
- Captura automaticamente o IP do usuário
- Obtém país e cidade baseado no IP usando API externa (ipapi.co)
- Dados são salvos na sessão e incluídos em todos os eventos

### 2. **Parâmetros UTM (Origem do Anúncio)**
- Captura automaticamente parâmetros UTM da URL:
  - `utm_source` - Fonte do tráfego (ex: facebook, google, email)
  - `utm_medium` - Meio (ex: cpc, social, email)
  - `utm_campaign` - Nome da campanha
  - `utm_term` - Termo de busca (para anúncios de busca)
  - `utm_content` - Conteúdo específico do anúncio
- Detecta automaticamente `fbclid` (Facebook Click ID) e marca como origem "facebook"
- Captura `referrer` (site de origem)

### 3. **Dashboard Atualizado**
- Novas colunas na tabela de sessões:
  - **Origem**: Mostra UTM Source, Campanha e referrer
  - **Localização**: Mostra País, Cidade e IP
- Filtros adicionais por UTM Source e País

## 🔧 Como Configurar

### 1. Execute o SQL no Supabase

Execute o arquivo `supabase_add_columns.sql` no SQL Editor do Supabase para adicionar as novas colunas:

```sql
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS utm_term TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE tracking_events ADD COLUMN IF NOT EXISTS referrer TEXT;

-- Índices para melhorar consultas
CREATE INDEX IF NOT EXISTS idx_tracking_events_country ON tracking_events(country);
CREATE INDEX IF NOT EXISTS idx_tracking_events_utm_source ON tracking_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_tracking_events_utm_campaign ON tracking_events(utm_campaign);
```

### 2. Deploy na Vercel

Após fazer o deploy na Vercel, os dados serão automaticamente capturados para novos usuários.

## 📝 Como Usar nos Anúncios

### Meta Ads (Facebook/Instagram)

Ao criar anúncios no Meta Ads Manager, adicione parâmetros UTM na URL de destino:

```
https://seudominio.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=vitality_quiz_2024
```

Ou se quiser diferenciar por anúncio:
```
https://seudominio.com/?utm_source=facebook&utm_medium=cpc&utm_campaign=vitality_quiz_2024&utm_content=video_anuncio_1
```

### Google Ads

```
https://seudominio.com/?utm_source=google&utm_medium=cpc&utm_campaign=vitality_quiz&utm_term={keyword}
```

### Email Marketing

```
https://seudominio.com/?utm_source=email&utm_medium=newsletter&utm_campaign=promocao_janeiro
```

### Tráfego Orgânico/Direto

Não precisa fazer nada! O sistema detecta automaticamente quando não há parâmetros UTM.

## 📊 Visualizando os Dados

### No Dashboard

1. Acesse o dashboard: `https://seudominio.com/#dashboard`
2. Na tabela "Sessões e Respostas", você verá:
   - **Coluna "Origem"**: Mostra o UTM Source, Campanha e referrer
   - **Coluna "Localização"**: Mostra País, Cidade e IP

### Filtrando por Origem

Use o filtro "Origem (UTM Source)" para ver apenas usuários de uma fonte específica (ex: apenas Facebook).

## 🔍 Exemplos de Dados Capturados

**Exemplo 1: Usuário do Facebook**
- `utm_source`: facebook
- `utm_campaign`: vitality_quiz_2024
- `country`: Brasil
- `city`: São Paulo
- `ip_address`: 189.xxx.xxx.xxx

**Exemplo 2: Usuário do Google Ads**
- `utm_source`: google
- `utm_medium`: cpc
- `utm_campaign`: vitality_quiz
- `utm_term`: quiz saúde
- `country`: Brasil
- `city`: Rio de Janeiro

**Exemplo 3: Tráfego Direto**
- `utm_source`: null
- `referrer`: null
- `country`: Brasil
- `city`: Brasília

## ⚠️ Observações Importantes

1. **Privacy**: IP e localização são capturados automaticamente via API externa. Para produção, considere adicionar aviso de privacidade.

2. **Rate Limits**: A API ipapi.co tem limites gratuitos. Para alto tráfego, considere usar uma API paga ou implementar cache.

3. **Facebook Click ID**: O sistema detecta automaticamente `fbclid` nos parâmetros da URL e marca como origem "facebook", mesmo sem `utm_source`.

4. **Dados em Cache**: IP e localização são capturados uma vez por sessão e reutilizados em todos os eventos.

## 🚀 Próximos Passos

Com esses dados, você pode:
- Analisar qual anúncio/campanha traz mais conversões
- Identificar padrões geográficos de abandono
- Ajustar campanhas baseado na origem do tráfego
- Criar relatórios por país/cidade

