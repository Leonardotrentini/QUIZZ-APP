-- Tabela para armazenar eventos de tracking do quiz
CREATE TABLE IF NOT EXISTS tracking_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  block_id INTEGER NOT NULL,
  block_type TEXT NOT NULL,
  block_title TEXT,
  answer_id TEXT,
  answer_text TEXT,
  progress INTEGER NOT NULL,
  vitality_score INTEGER,
  timestamp BIGINT NOT NULL,
  session_id TEXT NOT NULL,
  -- Novos campos para rastreamento avançado
  ip_address TEXT,
  country TEXT,
  city TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_term TEXT,
  utm_content TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance nas consultas
CREATE INDEX IF NOT EXISTS idx_tracking_events_session_id ON tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_block_id ON tracking_events(block_id);
CREATE INDEX IF NOT EXISTS idx_tracking_events_event_type ON tracking_events(event_type);
CREATE INDEX IF NOT EXISTS idx_tracking_events_timestamp ON tracking_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_tracking_events_created_at ON tracking_events(created_at);

-- Habilita Row Level Security (RLS) - IMPORTANTE para segurança
ALTER TABLE tracking_events ENABLE ROW LEVEL SECURITY;

-- Política: Permite INSERT para todos (qualquer um pode enviar eventos)
CREATE POLICY "Permitir INSERT de eventos de tracking para todos"
ON tracking_events
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Política: Permite SELECT para todos (qualquer um pode ler eventos)
-- Se quiser restringir, você pode remover esta política e criar uma mais específica
CREATE POLICY "Permitir SELECT de eventos de tracking para todos"
ON tracking_events
FOR SELECT
TO anon, authenticated
USING (true);

-- Comentários para documentação
COMMENT ON TABLE tracking_events IS 'Armazena eventos de tracking do quiz VitalityFlow';
COMMENT ON COLUMN tracking_events.event_type IS 'Tipo do evento: block_view, answer_selected, block_completed, checkout_click, page_abandon';
COMMENT ON COLUMN tracking_events.progress IS 'Progresso do usuário no funil (0-100)';
COMMENT ON COLUMN tracking_events.session_id IS 'ID único da sessão do usuário';

