import React, { useState, useEffect } from 'react';
import { FUNNEL_BLOCKS } from '../content/funnelData';
import { supabase } from '../services/supabaseClient';

interface TrackingEvent {
  id: string;
  eventType: 'block_view' | 'answer_selected' | 'block_completed' | 'checkout_click' | 'page_abandon';
  blockId: number;
  blockType: string;
  blockTitle?: string;
  answerId?: string | number;
  answerText?: string;
  progress: number;
  vitalityScore?: number;
  timestamp: number;
  sessionId: string;
}

interface SessionData {
  sessionId: string;
  firstSeen: number;
  lastSeen: number;
  blocksViewed: number[];
  answers: Record<number, any>;
  finalProgress: number;
  vitalityScore: number;
  abandonedAt?: number;
  reachedCheckout: boolean;
}

const Dashboard: React.FC = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'pages'>('metrics');
  const [filters, setFilters] = useState({
    sessionId: '',
    dateFrom: '',
    dateTo: '',
    minProgress: '',
    hasCheckout: null as boolean | null,
  });
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [editingSession, setEditingSession] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // Atualiza a cada 2 segundos
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Carrega do Supabase primeiro (dados de todos os usuários)
      try {
        const { data: supabaseEvents, error } = await supabase
          .from('tracking_events')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(10000); // Limita a 10k eventos mais recentes

        if (!error && supabaseEvents) {
          // Converte formato do Supabase para formato local
          const convertedEvents: TrackingEvent[] = supabaseEvents.map(e => ({
            id: e.id,
            eventType: e.event_type,
            blockId: e.block_id,
            blockType: e.block_type,
            blockTitle: e.block_title,
            answerId: e.answer_id,
            answerText: e.answer_text,
            progress: e.progress,
            vitalityScore: e.vitality_score,
            timestamp: e.timestamp,
            sessionId: e.session_id,
          }));

          setEvents(convertedEvents);
          processEvents(convertedEvents);
          return; // Se conseguiu carregar do Supabase, não precisa do localStorage
        }
      } catch (supabaseError) {
        console.warn('Erro ao carregar do Supabase, usando localStorage:', supabaseError);
      }

      // Fallback: carrega do localStorage (apenas dados locais)
      const storedEvents = localStorage.getItem('tracking_events');
      if (storedEvents) {
        const parsedEvents: TrackingEvent[] = JSON.parse(storedEvents);
        setEvents(parsedEvents);
        processEvents(parsedEvents);
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    }
  };

  const processEvents = (eventList: TrackingEvent[]) => {
    try {
        // Agrupa eventos por sessão
        const sessionsMap = new Map<string, SessionData>();
        
        eventList.forEach(event => {
          if (!sessionsMap.has(event.sessionId)) {
            sessionsMap.set(event.sessionId, {
              sessionId: event.sessionId,
              firstSeen: event.timestamp,
              lastSeen: event.timestamp,
              blocksViewed: [],
              answers: {},
              finalProgress: 0,
              vitalityScore: 0,
              reachedCheckout: false,
            });
          }
          
          const session = sessionsMap.get(event.sessionId)!;
          session.lastSeen = Math.max(session.lastSeen, event.timestamp);
          
          if (event.eventType === 'block_view') {
            if (!session.blocksViewed.includes(event.blockId)) {
              session.blocksViewed.push(event.blockId);
            }
            session.finalProgress = Math.max(session.finalProgress, event.progress);
          }
          
          if (event.eventType === 'answer_selected') {
            session.answers[event.blockId] = {
              answerId: event.answerId,
              answerText: event.answerText,
            };
            if (event.vitalityScore) {
              session.vitalityScore = event.vitalityScore;
            }
          }
          
          if (event.eventType === 'checkout_click') {
            session.reachedCheckout = true;
            if (event.vitalityScore) {
              session.vitalityScore = event.vitalityScore;
            }
          }
          
          if (event.eventType === 'page_abandon') {
            session.abandonedAt = event.blockId;
          }
        });
        
      setSessions(Array.from(sessionsMap.values()).sort((a, b) => b.lastSeen - a.lastSeen));
    } catch (e) {
      console.error('Erro ao processar eventos:', e);
    }
  };

  const getMetricValue = (metric: string) => {
    const uniqueSessions = new Set(events.map(e => e.sessionId)).size;
    const sessionsWithInteraction = sessions.filter(s => s.blocksViewed.length > 0).length;
    const sessionsWith50Percent = sessions.filter(s => s.finalProgress >= 50).length;
    const completedSessions = sessions.filter(s => s.finalProgress >= 95).length;
    
    switch (metric) {
      case 'visitantes':
        return uniqueSessions;
      case 'leads':
        return sessionsWithInteraction;
      case 'taxa_interacao':
        return uniqueSessions > 0 ? ((sessionsWithInteraction / uniqueSessions) * 100).toFixed(2) : '0.00';
      case 'leads_qualificados':
        return sessionsWith50Percent;
      case 'fluxos_finalizados':
        return completedSessions;
      default:
        return 0;
    }
  };

  const getAbandonmentByBlock = () => {
    const abandonmentMap = new Map<number, number>();
    events
      .filter(e => e.eventType === 'page_abandon')
      .forEach(e => {
        abandonmentMap.set(e.blockId, (abandonmentMap.get(e.blockId) || 0) + 1);
      });
    return Array.from(abandonmentMap.entries()).sort((a, b) => b[1] - a[1]);
  };

  const getAnswersByBlock = (blockId: number) => {
    const answerMap = new Map<string | number, number>();
    events
      .filter(e => e.eventType === 'answer_selected' && e.blockId === blockId)
      .forEach(e => {
        const key = e.answerId || 'unknown';
        answerMap.set(key, (answerMap.get(key) || 0) + 1);
      });
    return Array.from(answerMap.entries()).sort((a, b) => b[1] - a[1]);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const formatDateInput = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  };

  const selectedSessionData = sessions.find(s => s.sessionId === selectedSession);

  // Funções de filtro
  const filteredSessions = sessions.filter(session => {
    if (filters.sessionId && !session.sessionId.includes(filters.sessionId)) return false;
    if (filters.dateFrom && session.firstSeen < new Date(filters.dateFrom).getTime()) return false;
    if (filters.dateTo && session.firstSeen > new Date(filters.dateTo + 'T23:59:59').getTime()) return false;
    if (filters.minProgress && session.finalProgress < parseInt(filters.minProgress)) return false;
    if (filters.hasCheckout !== null && session.reachedCheckout !== filters.hasCheckout) return false;
    return true;
  });

  // Função para deletar sessão
  const deleteSession = async (sessionId: string) => {
    if (!confirm(`Tem certeza que deseja deletar a sessão ${sessionId.slice(-8)}?`)) return;

    try {
      // Deleta do Supabase
      const { error } = await supabase
        .from('tracking_events')
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        console.error('Erro ao deletar do Supabase:', error);
      }

      // Deleta do localStorage também
      const storedEvents = localStorage.getItem('tracking_events');
      if (storedEvents) {
        const parsedEvents: TrackingEvent[] = JSON.parse(storedEvents);
        const filteredEvents = parsedEvents.filter(e => e.sessionId !== sessionId);
        localStorage.setItem('tracking_events', JSON.stringify(filteredEvents));
      }

      // Recarrega os dados
      loadData();
    } catch (e) {
      console.error('Erro ao deletar sessão:', e);
      alert('Erro ao deletar sessão');
    }
  };

  // Função para deletar múltiplas sessões
  const deleteSelectedSessions = async () => {
    if (selectedSessions.size === 0) {
      alert('Selecione pelo menos uma sessão para deletar');
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar ${selectedSessions.size} sessão(ões)?`)) return;

    try {
      const sessionIds = Array.from(selectedSessions);
      
      // Deleta do Supabase
      for (const sessionId of sessionIds) {
        const { error } = await supabase
          .from('tracking_events')
          .delete()
          .eq('session_id', sessionId);
        
        if (error) console.error(`Erro ao deletar sessão ${sessionId}:`, error);
      }

      // Deleta do localStorage
      const storedEvents = localStorage.getItem('tracking_events');
      if (storedEvents) {
        const parsedEvents: TrackingEvent[] = JSON.parse(storedEvents);
        const filteredEvents = parsedEvents.filter(e => !sessionIds.includes(e.sessionId));
        localStorage.setItem('tracking_events', JSON.stringify(filteredEvents));
      }

      setSelectedSessions(new Set());
      loadData();
    } catch (e) {
      console.error('Erro ao deletar sessões:', e);
      alert('Erro ao deletar sessões');
    }
  };

  // Função para selecionar/deselecionar sessão
  const toggleSessionSelection = (sessionId: string) => {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  };

  // Função para selecionar todas as sessões
  const toggleSelectAll = () => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.sessionId)));
    }
  };

  // Função para obter detalhes completos de cada bloco
  const getBlockDetails = () => {
    const blockDetailsMap = new Map<number, {
      blockId: number;
      blockTitle?: string;
      blockType: string;
      views: number;
      answers: Map<string | number, { count: number; text?: string }>;
      abandons: number;
      completed: number;
      lastActivity?: number;
    }>();

    events.forEach(event => {
      if (!blockDetailsMap.has(event.blockId)) {
        blockDetailsMap.set(event.blockId, {
          blockId: event.blockId,
          blockTitle: event.blockTitle,
          blockType: event.blockType,
          views: 0,
          answers: new Map(),
          abandons: 0,
          completed: 0,
        });
      }

      const details = blockDetailsMap.get(event.blockId)!;

      if (event.eventType === 'block_view') {
        details.views++;
        details.lastActivity = Math.max(details.lastActivity || 0, event.timestamp);
      }

      if (event.eventType === 'answer_selected') {
        const key = event.answerId || 'unknown';
        if (!details.answers.has(key)) {
          details.answers.set(key, { count: 0, text: event.answerText });
        }
        details.answers.get(key)!.count++;
        details.lastActivity = Math.max(details.lastActivity || 0, event.timestamp);
      }

      if (event.eventType === 'page_abandon') {
        details.abandons++;
        details.lastActivity = Math.max(details.lastActivity || 0, event.timestamp);
      }

      if (event.eventType === 'block_completed') {
        details.completed++;
        details.lastActivity = Math.max(details.lastActivity || 0, event.timestamp);
      }
    });

    return Array.from(blockDetailsMap.values())
      .sort((a, b) => a.blockId - b.blockId);
  };

  const blockDetails = getBlockDetails();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard Analytics - VitalityFlow Quiz</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'metrics'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📊 Métricas Gerais
          </button>
          <button
            onClick={() => setActiveTab('pages')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'pages'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📄 Páginas e Blocos
          </button>
        </div>

        {activeTab === 'metrics' && (
          <>
            {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <MetricCard
            icon="👁️"
            title="Visitantes"
            description="Visitantes que acessaram o funil"
            value={getMetricValue('visitantes')}
          />
          <MetricCard
            icon="👥"
            title="Leads Adquiridos"
            description="Usuários com ao menos uma interação"
            value={getMetricValue('leads')}
          />
          <MetricCard
            icon="📊"
            title="Taxa de Interação"
            description="Visitantes x Interação do funil"
            value={`${getMetricValue('taxa_interacao')}%`}
          />
          <MetricCard
            icon="👍"
            title="Leads Qualificados"
            description="Usuários com ao menos 50% de interação"
            value={getMetricValue('leads_qualificados')}
          />
          <MetricCard
            icon="✅"
            title="Fluxos Finalizados"
            description="Usuários que chegaram até a última etapa"
            value={getMetricValue('fluxos_finalizados')}
          />
        </div>

        {/* Análise de Abandono */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">📍 Onde o Tráfego Para (Abandono por Bloco)</h2>
          <div className="space-y-2">
            {getAbandonmentByBlock().map(([blockId, count]) => (
              <div key={blockId} className="flex items-center justify-between bg-gray-700 p-3 rounded">
                <span className="font-medium">Bloco {blockId}</span>
                <div className="flex items-center gap-4">
                  <div className="w-48 bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${(count / sessions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-300">{count} abandono(s)</span>
                </div>
              </div>
            ))}
            {getAbandonmentByBlock().length === 0 && (
              <p className="text-gray-400 text-sm">Nenhum abandono registrado ainda</p>
            )}
          </div>
        </div>

        {/* Tabela de Sessões */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">📋 Sessões e Respostas</h2>
            <div className="flex gap-2">
              {selectedSessions.size > 0 && (
                <button
                  onClick={deleteSelectedSessions}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                >
                  🗑️ Deletar Selecionadas ({selectedSessions.size})
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">ID da Sessão</label>
                <input
                  type="text"
                  placeholder="Buscar por ID..."
                  value={filters.sessionId}
                  onChange={(e) => setFilters({ ...filters, sessionId: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Data Final</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Progresso Mínimo (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0-100"
                  value={filters.minProgress}
                  onChange={(e) => setFilters({ ...filters, minProgress: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Checkout</label>
                <select
                  value={filters.hasCheckout === null ? '' : filters.hasCheckout ? 'yes' : 'no'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilters({ ...filters, hasCheckout: value === '' ? null : value === 'yes' });
                  }}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="yes">Com Checkout</option>
                  <option value="no">Sem Checkout</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setFilters({ sessionId: '', dateFrom: '', dateTo: '', minProgress: '', hasCheckout: null })}
                className="px-4 py-1 text-sm text-gray-400 hover:text-white underline"
              >
                Limpar Filtros
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left p-3">
                    <input
                      type="checkbox"
                      checked={selectedSessions.size === filteredSessions.length && filteredSessions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-3">Sessão</th>
                  <th className="text-left p-3">Primeira Visita</th>
                  <th className="text-left p-3">Última Visita</th>
                  <th className="text-left p-3">Progresso</th>
                  <th className="text-left p-3">Score</th>
                  <th className="text-left p-3">Blocos Visitados</th>
                  <th className="text-left p-3">Checkout</th>
                  <th className="text-left p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((session) => (
                  <tr key={session.sessionId} className="border-b border-gray-700 hover:bg-gray-700">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedSessions.has(session.sessionId)}
                        onChange={() => toggleSessionSelection(session.sessionId)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3 font-mono text-xs">{session.sessionId.slice(-8)}</td>
                    <td className="p-3 text-gray-400">{formatDate(session.firstSeen)}</td>
                    <td className="p-3 text-gray-400">{formatDate(session.lastSeen)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-600 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${session.finalProgress}%` }}
                          />
                        </div>
                        <span>{session.finalProgress}%</span>
                      </div>
                    </td>
                    <td className="p-3">{session.vitalityScore}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        {session.blocksViewed.slice(0, 5).map(id => (
                          <span key={id} className="bg-blue-600 px-2 py-1 rounded text-xs">{id}</span>
                        ))}
                        {session.blocksViewed.length > 5 && (
                          <span className="text-gray-400 text-xs">+{session.blocksViewed.length - 5}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {session.reachedCheckout ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedSession(selectedSession === session.sessionId ? null : session.sessionId)}
                          className="text-blue-400 hover:text-blue-300 text-xs underline"
                        >
                          Ver detalhes
                        </button>
                        <button
                          onClick={() => deleteSession(session.sessionId)}
                          className="text-red-400 hover:text-red-300 text-xs underline"
                          title="Deletar sessão"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSessions.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-gray-400">
                      {sessions.length === 0 
                        ? 'Nenhuma sessão registrada ainda. As sessões aparecerão aqui quando usuários interagirem com o quiz.'
                        : 'Nenhuma sessão encontrada com os filtros aplicados.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detalhes da Sessão Selecionada */}
        {selectedSessionData && (
          <div className="bg-gray-800 rounded-lg p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">🔍 Detalhes da Sessão</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Respostas Selecionadas:</h3>
                <div className="space-y-2">
                  {Object.entries(selectedSessionData.answers).map(([blockId, answer]: [string, any]) => (
                    <div key={blockId} className="bg-gray-700 p-3 rounded">
                      <span className="font-medium">Bloco {blockId}:</span>{' '}
                      <span className="text-gray-300">Resposta {answer.answerId}</span>
                      {answer.answerText && (
                        <div className="text-sm text-gray-400 mt-1">"{answer.answerText}"</div>
                      )}
                    </div>
                  ))}
                  {Object.keys(selectedSessionData.answers).length === 0 && (
                    <p className="text-gray-400 text-sm">Nenhuma resposta registrada</p>
                  )}
                </div>
              </div>
              {selectedSessionData.abandonedAt && (
                <div className="bg-red-900/30 border border-red-700 p-3 rounded">
                  <span className="font-semibold text-red-400">⚠️ Abandonou no Bloco {selectedSessionData.abandonedAt}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Análise por Bloco */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-bold mb-4">📊 Respostas por Bloco</h2>
          <div className="space-y-4">
            {[2, 3, 4, 5, 6, 7, 8, 11, 12, 13].map(blockId => {
              const answers = getAnswersByBlock(blockId);
              if (answers.length === 0) return null;
              return (
                <div key={blockId} className="bg-gray-700 p-4 rounded">
                  <h3 className="font-semibold mb-2">Bloco {blockId}</h3>
                  <div className="space-y-1">
                    {answers.map(([answerId, count]) => (
                      <div key={answerId} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Resposta {String(answerId)}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(count / sessions.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-gray-400">{count} vez(es)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
          </>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-6">
            {/* Visualização por Usuário/Sessão - Todos os 21 Blocos */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">👥 Respostas por Usuário/Sessão - Todos os 21 Blocos</h2>
                  <p className="text-gray-400 text-sm mt-2">
                    Veja exatamente onde cada pessoa clicou e onde parou em cada um dos 21 blocos do funil. Cada linha representa uma sessão/usuário único.
                  </p>
                </div>
                {selectedSessions.size > 0 && (
                  <button
                    onClick={deleteSelectedSessions}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-semibold"
                  >
                    🗑️ Deletar Selecionadas ({selectedSessions.size})
                  </button>
                )}
              </div>

              {/* Filtros para tabela de Páginas */}
              <div className="bg-gray-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ID da Sessão</label>
                    <input
                      type="text"
                      placeholder="Buscar por ID..."
                      value={filters.sessionId}
                      onChange={(e) => setFilters({ ...filters, sessionId: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Data Inicial</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Data Final</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Progresso Mínimo (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={filters.minProgress}
                      onChange={(e) => setFilters({ ...filters, minProgress: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => setFilters({ sessionId: '', dateFrom: '', dateTo: '', minProgress: '', hasCheckout: null })}
                    className="px-4 py-1 text-sm text-gray-400 hover:text-white underline"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-gray-700">
                      <th className="text-left p-3 bg-gray-700 sticky left-0 z-10 min-w-[140px] border-r-2 border-gray-600">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSessions.size === filteredSessions.length && filteredSessions.length > 0}
                            onChange={toggleSelectAll}
                            className="rounded"
                          />
                          <span>Entrada</span>
                        </div>
                      </th>
                      {FUNNEL_BLOCKS.map(block => (
                        <th key={block.id} className="text-center p-3 bg-gray-700 min-w-[90px]">
                          <div className="flex flex-col items-center">
                            <span className="font-semibold text-xs">Bloco {block.id}</span>
                            <span className="text-xs text-gray-400 mt-1 capitalize truncate w-full" title={block.type}>
                              {block.type.replace('_', ' ')}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session, idx) => {
                      return (
                        <tr key={session.sessionId} className="border-b border-gray-700 hover:bg-gray-700/50">
                          <td className="p-3 bg-gray-800/80 sticky left-0 z-10 border-r-2 border-gray-600">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" className="rounded" />
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm text-white">
                                  {new Date(session.firstSeen).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="font-mono text-xs text-gray-400 mt-0.5">
                                  {session.sessionId.slice(-8)}
                                </span>
                              </div>
                            </div>
                          </td>
                          {FUNNEL_BLOCKS.map(block => {
                            const answer = session.answers[block.id];
                            const wasAbandonedHere = session.abandonedAt === block.id;
                            
                            // Verifica se a sessão passou por este bloco
                            const viewedBlock = session.blocksViewed.includes(block.id);
                            
                            return (
                              <td key={block.id} className="p-3 align-middle text-center">
                                {!viewedBlock && (
                                  <span className="text-gray-600 text-xs">N/A</span>
                                )}
                                {viewedBlock && !answer && (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span className="text-blue-400 text-xs font-medium">click</span>
                                    {wasAbandonedHere && (
                                      <span className="text-red-400 text-xs">⚠️</span>
                                    )}
                                  </div>
                                )}
                                {answer && (
                                  <div className={`flex flex-col items-center gap-0.5 ${wasAbandonedHere ? 'text-red-400' : 'text-green-400'}`}>
                                    <span className="font-bold text-sm">
                                      {String(answer.answerId)}
                                    </span>
                                    {wasAbandonedHere && (
                                      <span className="text-xs">⚠️</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {sessions.length === 0 && (
                      <tr>
                        <td colSpan={FUNNEL_BLOCKS.length + 1} className="p-6 text-center text-gray-400">
                          Nenhuma sessão registrada ainda. Complete algumas perguntas no quiz para ver os dados aqui.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visualização Agregada por Bloco (mantida para referência) */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">📊 Detalhamento Agregado por Página/Bloco</h2>
              <p className="text-gray-400 text-sm mb-6">
                Métricas consolidadas de todos os usuários por bloco.
              </p>
              
              <div className="space-y-4">
                {blockDetails.map(block => {
                  const totalInteractions = block.answers.size > 0 
                    ? Array.from(block.answers.values()).reduce((sum, a) => sum + a.count, 0)
                    : 0;
                  const conversionRate = block.views > 0 
                    ? ((totalInteractions / block.views) * 100).toFixed(1)
                    : '0.0';

                  return (
                    <div key={block.blockId} className="bg-gray-700 rounded-lg p-5 border-l-4 border-blue-500">
                      {/* Cabeçalho do Bloco */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-600 text-white font-bold px-3 py-1 rounded text-lg">
                              Bloco #{block.blockId}
                            </span>
                            <span className="bg-gray-600 text-gray-300 text-xs px-2 py-1 rounded uppercase">
                              {block.blockType}
                            </span>
                          </div>
                          {block.blockTitle && (
                            <h3 className="text-lg font-semibold text-white mt-2">{block.blockTitle}</h3>
                          )}
                        </div>
                      </div>

                      {/* Métricas do Bloco */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-800 p-3 rounded">
                          <div className="text-xs text-gray-400 mb-1">Visualizações</div>
                          <div className="text-2xl font-bold text-blue-400">{block.views}</div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                          <div className="text-xs text-gray-400 mb-1">Respostas/Clicks</div>
                          <div className="text-2xl font-bold text-green-400">{totalInteractions}</div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                          <div className="text-xs text-gray-400 mb-1">Taxa Conversão</div>
                          <div className="text-2xl font-bold text-yellow-400">{conversionRate}%</div>
                        </div>
                        <div className="bg-gray-800 p-3 rounded">
                          <div className="text-xs text-gray-400 mb-1">Abandonos</div>
                          <div className="text-2xl font-bold text-red-400">{block.abandons}</div>
                        </div>
                      </div>

                      {/* Respostas/Clicks Detalhados */}
                      {block.answers.size > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold mb-3 text-gray-300">🖱️ Onde Clicaram (Respostas Escolhidas):</h4>
                          <div className="space-y-2">
                            {Array.from(block.answers.entries())
                              .sort((a, b) => b[1].count - a[1].count)
                              .map(([answerId, data]) => (
                                <div key={answerId} className="bg-gray-800 p-3 rounded">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="bg-green-600 text-white font-bold px-2 py-1 rounded text-sm">
                                        ID: {String(answerId)}
                                      </span>
                                      <span className="text-white font-medium">
                                        {data.count} {data.count === 1 ? 'vez' : 'vezes'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="w-32 bg-gray-600 rounded-full h-2">
                                        <div
                                          className="bg-green-500 h-2 rounded-full"
                                          style={{ width: `${block.views > 0 ? (data.count / block.views) * 100 : 0}%` }}
                                        />
                                      </div>
                                      <span className="text-xs text-gray-400">
                                        {block.views > 0 ? ((data.count / block.views) * 100).toFixed(1) : 0}%
                                      </span>
                                    </div>
                                  </div>
                                  {data.text && (
                                    <div className="text-sm text-gray-400 italic mt-1 pl-1 border-l-2 border-green-500">
                                      "{data.text}"
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Abandonos */}
                      {block.abandons > 0 && (
                        <div className="mt-4 bg-red-900/20 border border-red-700 rounded p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-red-400 font-semibold">⚠️</span>
                            <span className="text-red-400 font-semibold">
                              {block.abandons} {block.abandons === 1 ? 'pessoa abandonou' : 'pessoas abandonaram'} nesta página
                            </span>
                          </div>
                          <div className="text-xs text-red-300 mt-1">
                            Taxa de abandono: {block.views > 0 ? ((block.abandons / block.views) * 100).toFixed(1) : 0}%
                          </div>
                        </div>
                      )}

                      {/* Sem interações */}
                      {block.answers.size === 0 && block.abandons === 0 && block.views > 0 && (
                        <div className="mt-4 bg-yellow-900/20 border border-yellow-700 rounded p-3">
                          <span className="text-yellow-400 text-sm">
                            ⚠️ {block.views} visualização(ões) mas nenhuma interação registrada
                          </span>
                        </div>
                      )}

                      {/* Sem dados */}
                      {block.views === 0 && (
                        <div className="mt-4 bg-gray-800 rounded p-3">
                          <span className="text-gray-500 text-sm">
                            Nenhuma visualização registrada ainda
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {blockDetails.length === 0 && (
                  <div className="bg-gray-800 rounded-lg p-8 text-center">
                    <p className="text-gray-400">
                      Nenhum dado de página/bloco registrado ainda. Complete algumas perguntas no quiz para ver os dados aqui.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{ icon: string; title: string; description: string; value: string | number }> = ({
  icon,
  title,
  description,
  value,
}) => (
  <div className="bg-gray-800 rounded-lg p-4">
    <div className="flex items-center gap-3 mb-2">
      <span className="text-2xl">{icon}</span>
      <div>
        <h3 className="font-bold text-lg">{title}</h3>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </div>
    <div className="text-3xl font-bold mt-4">{value}</div>
  </div>
);

export default Dashboard;

