import { Calendar, Clock, User, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface VisitorInteraction {
  id: string;
  interaction_type: string;
  interaction_date: string;
  description: string;
  ultimo_culto: string | null;
  frequencia: string | null;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface InteractionTimelineProps {
  interactions: VisitorInteraction[];
}

const interactionTypes = {
  visita: 'Visita',
  ligacao: 'Ligação',
  mensagem: 'Mensagem',
  evento: 'Evento',
  outro: 'Outro'
};

const interactionColors = {
  visita: 'bg-blue-500',
  ligacao: 'bg-green-500',
  mensagem: 'bg-purple-500',
  evento: 'bg-orange-500',
  outro: 'bg-gray-500'
};

const frequenciaLabels = {
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal'
};

export function InteractionTimeline({ interactions }: InteractionTimelineProps) {
  if (interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
        <p>Nenhuma interação registrada ainda</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6 pl-8">
      {/* Vertical line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />

      {interactions.map((interaction, index) => (
        <div key={interaction.id} className="relative animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
          {/* Timeline dot */}
          <div className={`absolute -left-5 w-6 h-6 rounded-full border-4 border-background ${interactionColors[interaction.interaction_type as keyof typeof interactionColors]} flex items-center justify-center`}>
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <Badge variant="secondary" className="text-xs">
                {interactionTypes[interaction.interaction_type as keyof typeof interactionTypes]}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(new Date(interaction.interaction_date), "dd/MM/yyyy", { locale: ptBR })}
              </div>
            </div>

            <p className="text-sm mb-3">{interaction.description}</p>

            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {interaction.ultimo_culto && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Último culto: {format(new Date(interaction.ultimo_culto), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
              )}
              
              {interaction.frequencia && (
                <Badge variant="outline" className="text-xs">
                  Frequência: {frequenciaLabels[interaction.frequencia]}
                </Badge>
              )}

              {interaction.profiles?.full_name && (
                <div className="flex items-center gap-1 ml-auto">
                  <User className="w-3 h-3" />
                  <span>{interaction.profiles.full_name}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}
