# 📊 Dashboard Analytics - Guia de Uso

## 🎯 Como Acessar o Dashboard

### Opção 1: Acessar via URL (Durante Desenvolvimento)

1. **Adicione uma rota simples no App.tsx** (quando quiser testar):
   ```typescript
   // No final do renderContent(), adicione uma verificação:
   if (window.location.pathname === '/dashboard') {
     return <Dashboard />;
   }
   ```

2. **Ou crie um arquivo separado** (já criado: `index-dashboard.tsx`)
   - Acesse: `http://localhost:5173/dashboard.html` (se configurado)
   - Ou configure uma rota no seu router

### Opção 2: Usar URL Hash (Mais Simples - Sem Modificar App Principal)

Acesse diretamente no navegador:
```
http://localhost:5173/#dashboard
```

E adicione este código no início do `App.tsx` (apenas para desenvolvimento):

```typescript
// No topo do componente App, antes do return:
if (window.location.hash === '#dashboard') {
  return <Dashboard />;
}
```

### Opção 3: Abrir em Aba Separada (Recomendado para Desenvolvimento)

1. Abra o DevTools (F12)
2. No console, digite:
   ```javascript
   window.open('/dashboard.html', '_blank');
   ```

## 📈 O que o Dashboard Mostra

### Métricas Principais (Cards no Topo):
1. **Visitantes** - Total de sessões únicas
2. **Leads Adquiridos** - Sessões com pelo menos 1 interação
3. **Taxa de Interação** - % de visitantes que interagiram
4. **Leads Qualificados** - Sessões com 50%+ de progresso
5. **Fluxos Finalizados** - Sessões que chegaram ao final (95%+)

### Análise de Abandono:
- Mostra em quais blocos as pessoas mais param
- Gráfico visual com contagem de abandonos

### Tabela de Sessões:
- Lista todas as sessões
- Progresso de cada uma
- Score de Vitality
- Blocos visitados
- Se chegou ao checkout
- Botão para ver detalhes completos

### Detalhes da Sessão:
- Todas as respostas escolhidas por bloco
- Texto completo das respostas
- Onde abandonou (se aplicável)

### Respostas por Bloco:
- Distribuição de respostas em cada bloco
- Quantas vezes cada resposta foi escolhida
- Gráficos visuais

## 💾 Onde os Dados São Armazenados

**Atualmente:** LocalStorage do navegador
- Arquivo: `services/trackingService.ts`
- Chave: `tracking_events`
- Limite: Últimos 10.000 eventos

**Vantagens:**
- ✅ Funciona imediatamente, sem backend
- ✅ Zero configuração
- ✅ Perfeito para desenvolvimento/testes

**Limitações:**
- ⚠️ Dados apenas no navegador atual
- ⚠️ Não compartilhado entre dispositivos
- ⚠️ Perdido se limpar cache

## 🔄 Migração para Backend (Futuro)

Quando quiser persistir os dados em um backend:

1. **Crie um endpoint** (ex: Vercel Edge Function ou API simples)
2. **Configure no trackingService.ts:**
   ```typescript
   // Descomente e configure a URL do endpoint
   window.__TRACKING_ENDPOINT__ = 'https://seu-backend.com/api/track';
   ```
3. **O dashboard lerá do backend** ao invés do localStorage

## 🧪 Como Testar

1. **Abra o quiz principal** (http://localhost:5173)
2. **Complete algumas perguntas** - os eventos serão registrados
3. **Abra o dashboard** (usando uma das opções acima)
4. **Veja os dados em tempo real** - atualiza a cada 2 segundos

## 🎨 Customização

O dashboard está em `pages/Dashboard.tsx` e pode ser totalmente customizado:
- Cores e estilos
- Métricas adicionais
- Gráficos diferentes
- Exportação de dados
- Filtros e busca

## ✅ Status Atual

✅ **Dashboard criado** - Funcional e completo
✅ **Tracking integrado** - Eventos sendo salvos
✅ **Visualização em tempo real** - Atualiza automaticamente
⏳ **Backend opcional** - Pode ser adicionado depois

**Pronto para usar!** Basta acessar o dashboard e começar a analisar os dados! 🚀

