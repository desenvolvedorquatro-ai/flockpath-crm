-- Adicionar campos de data aos visitantes
ALTER TABLE public.visitors 
ADD COLUMN data_nascimento DATE,
ADD COLUMN primeira_visita DATE;

-- Criar tabela de interações com visitantes
CREATE TABLE public.visitor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES public.visitors(id) ON DELETE CASCADE NOT NULL,
  interaction_type VARCHAR(50) NOT NULL, -- 'mensagem', 'ligacao', 'visita', 'outro'
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX idx_visitor_interactions_visitor_id ON public.visitor_interactions(visitor_id);
CREATE INDEX idx_visitor_interactions_date ON public.visitor_interactions(interaction_date DESC);

-- RLS para visitor_interactions
ALTER TABLE public.visitor_interactions ENABLE ROW LEVEL SECURITY;

-- Admins podem ver e gerenciar todas as interações
CREATE POLICY "Admins can manage all interactions"
ON public.visitor_interactions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Pastores podem ver e criar interações de visitantes de suas igrejas
CREATE POLICY "Pastors can manage interactions from their churches"
ON public.visitor_interactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.visitors v
    INNER JOIN public.profiles p ON p.id = auth.uid()
    WHERE v.id = visitor_interactions.visitor_id
    AND (
      v.church_id = p.church_id
      OR EXISTS (
        SELECT 1 FROM public.user_churches uc
        WHERE uc.user_id = auth.uid()
        AND uc.church_id = v.church_id
      )
      OR public.has_role(auth.uid(), 'pastor')
    )
  )
);

-- Líderes de grupo podem ver e criar interações de seus visitantes
CREATE POLICY "Group leaders can manage their visitors interactions"
ON public.visitor_interactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.visitors v
    INNER JOIN public.assistance_groups ag ON ag.id = v.assistance_group_id
    WHERE v.id = visitor_interactions.visitor_id
    AND ag.leader_id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_visitor_interactions_updated_at
BEFORE UPDATE ON public.visitor_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();