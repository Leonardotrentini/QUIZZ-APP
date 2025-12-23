// Serviço de tracking para rastrear progresso dos usuários no quiz

interface TrackingEvent {
  eventType: 'block_view' | 'answer_selected' | 'block_completed' | 'checkout_click' | 'page_abandon';
  blockId: number;
  blockType: string;
  blockTitle?: string;
  answerId?: string | number;
  answerText?: string;
  progress: number; // 0-100
  vitalityScore?: number;
  timestamp: number;
  sessionId: string;
  userAgent?: string;
}

// Gera um ID único para a sessão
const getSessionId = (): string => {
  const stored = sessionStorage.getItem('quiz_session_id');
  if (stored) return stored;
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('quiz_session_id', newId);
  return newId;
};

const sessionId = getSessionId();

// Declaração global do Meta Pixel
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

// Envia evento para Meta Pixel (eventos customizados)
const trackMetaPixel = (eventName: string, eventData: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('trackCustom', eventName, eventData);
  }
};

// Armazena eventos no localStorage para o dashboard
const storeEvent = (event: TrackingEvent) => {
  try {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('tracking_events');
    const events: TrackingEvent[] = stored ? JSON.parse(stored) : [];
    
    // Adiciona ID único ao evento
    const eventWithId = { ...event, id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
    events.push(eventWithId);
    
    // Mantém apenas os últimos 10.000 eventos (para não encher o localStorage)
    const maxEvents = 10000;
    if (events.length > maxEvents) {
      events.splice(0, events.length - maxEvents);
    }
    
    localStorage.setItem('tracking_events', JSON.stringify(events));
  } catch (e) {
    // Silently fail se localStorage estiver cheio
    console.warn('Erro ao armazenar evento:', e);
  }
};

// Envia evento para backend (opcional - você pode criar um endpoint)
const trackToBackend = async (event: TrackingEvent) => {
  // Primeiro armazena localmente para o dashboard
  storeEvent(event);
  
  try {
    // Substitua pela URL do seu endpoint quando criar
    // Use process.env em runtime ou configure variável de ambiente
    const endpoint = (typeof window !== 'undefined' && (window as any).__TRACKING_ENDPOINT__) || '/api/track';
    
    // Só envia se o endpoint estiver configurado (comentado por padrão)
    // Descomente e configure quando tiver seu backend pronto
    // await fetch(endpoint, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(event),
    //   keepalive: true,
    // }).catch(() => {});
  } catch (e) {
    // Não interrompe o fluxo se o tracking falhar
    // console.warn('Tracking error:', e);
  }
};

// Tracking principal - rastreia visualização de bloco
export const trackBlockView = (blockId: number, blockType: string, blockTitle?: string, totalBlocks: number = 21) => {
  const progress = Math.round(((blockId / totalBlocks) * 100));
  
  const event: TrackingEvent = {
    eventType: 'block_view',
    blockId,
    blockType,
    blockTitle,
    progress,
    timestamp: Date.now(),
    sessionId,
    userAgent: navigator.userAgent,
  };

  // Meta Pixel - evento customizado
  trackMetaPixel('BlockView', {
    block_id: blockId,
    block_type: blockType,
    block_title: blockTitle,
    progress_percentage: progress,
  });

  // Backend (se configurado)
  trackToBackend(event);
};

// Tracking de resposta selecionada
export const trackAnswerSelected = (
  blockId: number,
  blockType: string,
  answerId: string | number,
  answerText?: string,
  vitalityScore?: number,
  totalBlocks: number = 21
) => {
  const progress = Math.round(((blockId / totalBlocks) * 100));
  
  const event: TrackingEvent = {
    eventType: 'answer_selected',
    blockId,
    blockType,
    answerId,
    answerText,
    progress,
    vitalityScore,
    timestamp: Date.now(),
    sessionId,
  };

  // Meta Pixel
  trackMetaPixel('AnswerSelected', {
    block_id: blockId,
    block_type: blockType,
    answer_id: String(answerId),
    progress_percentage: progress,
    vitality_score: vitalityScore,
  });

  trackToBackend(event);
};

// Tracking de conclusão de bloco
export const trackBlockCompleted = (
  blockId: number,
  blockType: string,
  vitalityScore?: number,
  totalBlocks: number = 21
) => {
  const progress = Math.round(((blockId / totalBlocks) * 100));
  
  const event: TrackingEvent = {
    eventType: 'block_completed',
    blockId,
    blockType,
    progress,
    vitalityScore,
    timestamp: Date.now(),
    sessionId,
  };

  trackMetaPixel('BlockCompleted', {
    block_id: blockId,
    block_type: blockType,
    progress_percentage: progress,
  });

  trackToBackend(event);
};

// Tracking de clique no checkout
export const trackCheckoutClick = (vitalityScore: number, finalBlockId: number) => {
  const event: TrackingEvent = {
    eventType: 'checkout_click',
    blockId: finalBlockId,
    blockType: 'offer',
    progress: 100,
    vitalityScore,
    timestamp: Date.now(),
    sessionId,
  };

  // Meta Pixel - evento de conversão importante
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      content_name: 'VitalityFlow Quiz Offer',
      value: 14.00,
      currency: 'USD',
    });
    
    window.fbq('trackCustom', 'CheckoutClick', {
      vitality_score: vitalityScore,
      block_id: finalBlockId,
    });
  }

  trackToBackend(event);
};

// Tracking de abandono (quando o usuário sai)
export const trackPageAbandon = (blockId: number, blockType: string, totalBlocks: number = 21) => {
  const progress = Math.round(((blockId / totalBlocks) * 100));
  
  const event: TrackingEvent = {
    eventType: 'page_abandon',
    blockId,
    blockType,
    progress,
    timestamp: Date.now(),
    sessionId,
  };

  // Usa beacon API para garantir envio mesmo ao sair
  const endpoint = (typeof window !== 'undefined' && (window as any).__TRACKING_ENDPOINT__);
  if (navigator.sendBeacon && endpoint) {
    navigator.sendBeacon(endpoint, JSON.stringify(event));
  } else {
    trackToBackend(event);
  }

  trackMetaPixel('PageAbandon', {
    block_id: blockId,
    block_type: blockType,
    progress_percentage: progress,
  });
};

