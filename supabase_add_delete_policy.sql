-- Adicione esta política para permitir DELETE na tabela tracking_events
-- Execute no SQL Editor do Supabase

-- Política: Permite DELETE para todos (qualquer um pode deletar eventos)
CREATE POLICY "Permitir DELETE de eventos de tracking para todos"
ON tracking_events
FOR DELETE
TO anon, authenticated
USING (true);

