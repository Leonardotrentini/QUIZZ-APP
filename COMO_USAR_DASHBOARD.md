# 🚀 Como Usar o Dashboard - Guia Rápido

## ⚡ Forma Mais Simples (Recomendada)

### Para Testar o Dashboard AGORA:

1. **Abra o quiz normalmente** (http://localhost:5173)
2. **Complete algumas perguntas** - os dados serão salvos automaticamente
3. **No mesmo navegador, abra uma NOVA ABA** e acesse:
   ```
   http://localhost:5173/#dashboard
   ```

4. **Para habilitar o acesso via hash**, adicione temporariamente este código no início do `App.tsx`:

```typescript
// ADICIONE APENAS PARA TESTE - Depois remova!
import Dashboard from './pages/Dashboard';

// No início do componente App (antes do return):
if (window.location.hash === '#dashboard') {
  return <Dashboard />;
}
```

## 📊 O que Você Verá

### Cards de Métricas:
- 👁️ **Visitantes**: Total de pessoas que acessaram
- 👥 **Leads Adquiridos**: Com pelo menos 1 interação
- 📊 **Taxa de Interação**: % que interagiu
- 👍 **Leads Qualificados**: Com 50%+ de progresso
- ✅ **Fluxos Finalizados**: Chegaram ao final

### Análise de Abandono:
- Gráfico mostrando onde mais param (qual bloco)
- Contagem de abandonos por bloco

### Tabela Detalhada:
- Cada sessão com:
  - Progresso (%)
  - Score de Vitality
  - Blocos visitados
  - Se chegou ao checkout
  - Botão para ver todas as respostas

### Detalhes Completos:
- Todas as respostas escolhidas
- Texto completo de cada resposta
- Onde abandonou

### Respostas por Bloco:
- Distribuição de escolhas em cada pergunta
- Gráficos visuais

## 🔄 Atualização Automática

O dashboard atualiza automaticamente a cada 2 segundos!

## 💡 Dicas

1. **Teste com múltiplas sessões**: Abra em modo anônimo/privado para simular diferentes usuários
2. **Complete o quiz inteiro**: Veja como aparece uma sessão completa
3. **Abandone no meio**: Feche a aba e veja onde registrou o abandono
4. **Clique no checkout**: Veja como marca como "reachedCheckout"

## 📝 Dados Armazenados

Os dados são salvos no **localStorage** do navegador com a chave `tracking_events`.

Para limpar e começar do zero:
```javascript
// No console do navegador:
localStorage.removeItem('tracking_events');
location.reload();
```

## ✅ Checklist de Teste

- [ ] Abri o quiz e completei algumas perguntas
- [ ] Acessei o dashboard via `#dashboard`
- [ ] Vi as métricas sendo atualizadas
- [ ] Cliquei em "Ver detalhes" de uma sessão
- [ ] Vi as respostas registradas
- [ ] Testei abandonar no meio e vi onde parou

## 🎯 Próximos Passos

Quando estiver satisfeito com o dashboard:
1. Decida onde hospedar (pode ficar no mesmo domínio com rota `/dashboard`)
2. Migre para backend se quiser persistir dados (opcional)
3. Adicione autenticação se quiser proteger o dashboard

---

**O dashboard está pronto para uso!** 🎉

