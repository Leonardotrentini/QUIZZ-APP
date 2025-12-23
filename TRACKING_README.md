# Sistema de Tracking - Quiz VitalityFlow

## 📊 O que foi implementado

Sistema completo de tracking para rastrear onde os usuários param no quiz, quais respostas escolhem e quando abandonam o funil.

## 🎯 Eventos Rastreados

### 1. **BlockView** - Visualização de Bloco
- Rastreia quando um usuário visualiza cada bloco do quiz
- Dados: `block_id`, `block_type`, `block_title`, `progress_percentage`

### 2. **AnswerSelected** - Resposta Selecionada
- Rastreia qual resposta o usuário escolheu em cada pergunta
- Dados: `block_id`, `answer_id`, `progress_percentage`, `vitality_score`

### 3. **BlockCompleted** - Bloco Completado
- Rastreia quando o usuário completa um bloco e avança
- Dados: `block_id`, `block_type`, `progress_percentage`

### 4. **CheckoutClick** - Clique no Checkout
- Evento de conversão importante
- Dispara evento padrão `InitiateCheckout` do Meta Pixel + evento customizado
- Dados: `vitality_score`, `block_id`

### 5. **PageAbandon** - Abandono da Página
- Rastreia quando o usuário sai/abandona a página
- Usa Beacon API para garantir envio mesmo ao fechar a aba
- Dados: `block_id`, `block_type`, `progress_percentage`

## 📈 Como ver os dados no Meta Ads

1. **No Meta Events Manager:**
   - Acesse: https://business.facebook.com/events_manager
   - Vá em "Test Events" ou "Events" para ver eventos em tempo real
   - Filtre por eventos customizados: `BlockView`, `AnswerSelected`, etc.

2. **No Meta Ads Manager:**
   - Crie conversões personalizadas baseadas nos eventos customizados
   - Use os eventos para otimizar campanhas e criar audiências

## 🔧 Próximos Passos (Opcional - Backend)

Para armazenar os dados no seu próprio backend:

1. **Crie um endpoint** (ex: `/api/track` na Vercel Edge Functions ou outro serviço)

2. **Configure a variável de ambiente:**
   ```javascript
   // No seu código, antes de usar o tracking:
   (window as any).__TRACKING_ENDPOINT__ = 'https://seu-endpoint.com/api/track';
   ```

3. **Exemplo de endpoint (Vercel Edge Function):**
   ```typescript
   // api/track.ts
   export default async function handler(req: Request) {
     const event = await req.json();
     // Salvar no banco de dados (Supabase, MongoDB, etc.)
     // ou enviar para analytics (Google Analytics, Mixpanel, etc.)
     return new Response(JSON.stringify({ success: true }), {
       headers: { 'Content-Type': 'application/json' },
     });
   }
   ```

## 🎨 Visualização dos Dados

### Queries úteis para análise:

1. **Qual bloco tem mais abandono?**
   - Filtre eventos `PageAbandon` e agrupe por `block_id`

2. **Quais respostas são mais escolhidas?**
   - Filtre eventos `AnswerSelected` e agrupe por `answer_id`

3. **Qual é o progresso médio antes do abandono?**
   - Analise `progress_percentage` dos eventos `PageAbandon`

4. **Taxa de conversão por bloco:**
   - Compare `BlockView` vs `CheckoutClick` por `block_id`

## ✅ Status Atual

✅ **Meta Pixel integrado** - Eventos sendo enviados automaticamente  
✅ **Eventos customizados configurados** - Prontos para uso no Meta Ads  
⏳ **Backend opcional** - Configure apenas se quiser armazenar dados próprios

Os eventos já estão sendo enviados para o Meta Pixel e aparecem automaticamente no Events Manager!

