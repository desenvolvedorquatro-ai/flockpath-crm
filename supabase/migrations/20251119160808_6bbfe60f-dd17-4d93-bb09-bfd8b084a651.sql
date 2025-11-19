-- Tabela para armazenar conversas ativas do WhatsApp
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id UUID NOT NULL REFERENCES public.visitors(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy para visualizar conversas
CREATE POLICY "Authenticated users can view conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Policy para criar conversas
CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Policy para atualizar conversas
CREATE POLICY "Authenticated users can update conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Índice para melhorar performance
CREATE INDEX idx_conversations_visitor_id ON public.conversations(visitor_id);
CREATE INDEX idx_conversations_phone ON public.conversations(phone);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();