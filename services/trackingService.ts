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
  // Novos campos para rastreamento
  ipAddress?: string;
  country?: string;
  city?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  referrer?: string;
}

// Função para obter IP e localização (chama API externa)
let userLocation: { ip?: string; country?: string; city?: string } | null = null;
let locationPromise: Promise<{ ip?: string; country?: string; city?: string } | null> | null = null;

const fetchUserLocation = async (): Promise<{ ip?: string; country?: string; city?: string } | null> => {
  if (userLocation) return userLocation; // Cache
  
  // Se já está carregando, retorna a mesma promise
  if (locationPromise) return locationPromise;
  
  locationPromise = (async () => {
    try {
      // Usa API gratuita para obter IP e localização
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      userLocation = {
        ip: data.ip,
        country: data.country_name || data.country,
        city: data.city,
      };
      
      // Salva no sessionStorage
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('quiz_location', JSON.stringify(userLocation));
      }
      
      return userLocation;
    } catch (e) {
      console.warn('Erro ao obter localização:', e);
      // Fallback: tenta outra API
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        userLocation = { ip: data.ip };
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('quiz_location', JSON.stringify(userLocation));
        }
        return userLocation;
      } catch (e2) {
        return null;
      }
    }
  })();
  
  return locationPromise;
};

// Gera um ID único para a sessão baseado no IP
// OTIMIZAÇÃO: Gera ID temporário primeiro, atualiza com IP depois (não bloqueia carregamento)
const getSessionId = async (): Promise<string> => {
  const stored = sessionStorage.getItem('quiz_session_id');
  if (stored) return stored;
  
  // OTIMIZAÇÃO: Gera ID temporário imediatamente (não bloqueia)
  const tempId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('quiz_session_id', tempId);
  
  // Carrega IP em background (não bloqueia renderização)
  fetchUserLocation().then(location => {
    if (location?.ip) {
      const ipHash = location.ip.split('.').join('_');
      const ipBasedId = `ip_${ipHash}`;
      sessionStorage.setItem('quiz_session_id', ipBasedId);
      
      // Migra eventos temporários para o ID baseado em IP
      try {
        const storedEvents = localStorage.getItem('tracking_events');
        if (storedEvents) {
          const events: TrackingEvent[] = JSON.parse(storedEvents);
          events.forEach(event => {
            if (event.sessionId === tempId) {
              event.sessionId = ipBasedId;
            }
          });
          localStorage.setItem('tracking_events', JSON.stringify(events));
        }
      } catch (e) {
        console.warn('Erro ao migrar eventos:', e);
      }
    }
  }).catch(() => {
    // Se falhar, mantém o ID temporário
  });
  
  return tempId; // Retorna imediatamente, não espera IP
};

// OTIMIZAÇÃO: Removido bloqueio inicial - sessionId será gerado quando necessário via getSessionId()

// Captura parâmetros UTM da URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  // Se tem fbclid mas não tem utm_source, considera como facebook
  const fbclid = params.get('fbclid');
  const utmSource = params.get('utm_source') || (fbclid ? 'facebook' : null);
  
  return {
    utmSource: utmSource,
    utmMedium: params.get('utm_medium') || null,
    utmCampaign: params.get('utm_campaign') || null,
    utmTerm: params.get('utm_term') || null,
    utmContent: params.get('utm_content') || null,
    referrer: document.referrer || null,
    fbclid: fbclid, // Facebook Click ID
  };
};

// Armazena UTM params na sessão (para usar em todos os eventos)
const utmData = getUTMParams();
sessionStorage.setItem('quiz_utm_data', JSON.stringify(utmData));


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

// Envia evento para Supabase
const trackToSupabase = async (event: TrackingEvent) => {
  try {
    const { supabase } = await import('./supabaseClient');
    
    // Obtém dados de localização e UTM da sessão
    const storedLocation = sessionStorage.getItem('quiz_location');
    const storedUTM = sessionStorage.getItem('quiz_utm_data');
    const location = storedLocation ? JSON.parse(storedLocation) : null;
    const utm = storedUTM ? JSON.parse(storedUTM) : null;
    
    const { error } = await supabase.from('tracking_events').insert({
      event_type: event.eventType,
      block_id: event.blockId,
      block_type: event.blockType,
      block_title: event.blockTitle || null,
      answer_id: event.answerId ? String(event.answerId) : null,
      answer_text: event.answerText || null,
      progress: event.progress,
      vitality_score: event.vitalityScore || null,
      timestamp: event.timestamp,
      session_id: event.sessionId,
      // Novos campos
      ip_address: location?.ip || event.ipAddress || null,
      country: location?.country || event.country || null,
      city: location?.city || event.city || null,
      utm_source: utm?.utmSource || event.utmSource || null,
      utm_medium: utm?.utmMedium || event.utmMedium || null,
      utm_campaign: utm?.utmCampaign || event.utmCampaign || null,
      utm_term: utm?.utmTerm || event.utmTerm || null,
      utm_content: utm?.utmContent || event.utmContent || null,
      referrer: utm?.referrer || event.referrer || null,
    });

    if (error) {
      console.warn('Erro ao enviar evento para Supabase:', error);
    }
  } catch (e) {
    // Não interrompe o fluxo se o tracking falhar
    console.warn('Erro ao conectar com Supabase:', e);
  }
};

// Envia evento para backend (Supabase + localStorage)
const trackToBackend = async (event: TrackingEvent) => {
  // Primeiro armazena localmente para o dashboard
  storeEvent(event);
  
  // Envia para Supabase (não bloqueia se falhar)
  trackToSupabase(event).catch(() => {
    // Silently fail - não interrompe o fluxo
  });
};

// Tracking principal - rastreia visualização de bloco
export const trackBlockView = async (blockId: number, blockType: string, blockTitle?: string, totalBlocks: number = 21) => {
  const progress = Math.round(((blockId / totalBlocks) * 100));
  
  // Garante que temos o sessionId correto baseado no IP
  const currentSessionId = await getSessionId();
  
  const event: TrackingEvent = {
    eventType: 'block_view',
    blockId,
    blockType,
    blockTitle,
    progress,
    timestamp: Date.now(),
    sessionId: currentSessionId,
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
export const trackAnswerSelected = async (
  blockId: number,
  blockType: string,
  answerId: string | number,
  answerText?: string,
  vitalityScore?: number,
  totalBlocks: number = 21
) => {
  const progress = Math.round(((blockId / totalBlocks) * 100));
  
  // Garante que temos o sessionId correto baseado no IP
  const currentSessionId = await getSessionId();
  
  const event: TrackingEvent = {
    eventType: 'answer_selected',
    blockId,
    blockType,
    answerId,
    answerText,
    progress,
    vitalityScore,
    timestamp: Date.now(),
    sessionId: currentSessionId,
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
export const trackBlockCompleted = async (
  blockId: number,
  blockType: string,
  vitalityScore?: number,
  totalBlocks: number = 21
) => {
  const progress = Math.round(((blockId / totalBlocks) * 100));
  
  // Garante que temos o sessionId correto baseado no IP
  const currentSessionId = await getSessionId();
  
  const event: TrackingEvent = {
    eventType: 'block_completed',
    blockId,
    blockType,
    progress,
    vitalityScore,
    timestamp: Date.now(),
    sessionId: currentSessionId,
  };

  trackMetaPixel('BlockCompleted', {
    block_id: blockId,
    block_type: blockType,
    progress_percentage: progress,
  });

  trackToBackend(event);
};

// Tracking de clique no checkout
export const trackCheckoutClick = async (vitalityScore: number, finalBlockId: number) => {
  // Garante que temos o sessionId correto baseado no IP
  const currentSessionId = await getSessionId();
  
  const event: TrackingEvent = {
    eventType: 'checkout_click',
    blockId: finalBlockId,
    blockType: 'offer',
    progress: 100,
    vitalityScore,
    timestamp: Date.now(),
    sessionId: currentSessionId,
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
export const trackPageAbandon = async (blockId: number, blockType: string, totalBlocks: number = 21) => {
  const progress = Math.round(((blockId / totalBlocks) * 100));
  
  // Garante que temos o sessionId correto baseado no IP
  const currentSessionId = await getSessionId();
  
  const event: TrackingEvent = {
    eventType: 'page_abandon',
    blockId,
    blockType,
    progress,
    timestamp: Date.now(),
    sessionId: currentSessionId,
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

