import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { MessageSquare, Plus, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface VisitorInteraction {
  id: string;
  visitor_id: string;
  interaction_type: string;
  interaction_date: string;
  description: string;
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface VisitorInteractionsProps {
  visitorId: string;
  visitorName: string;
}

const interactionTypes = {
  mensagem: "Mensagem",
  ligacao: "Ligação",
  visita: "Visita",
  outro: "Outro",
};

const interactionColors: Record<string, string> = {
  mensagem: "bg-blue-500/10 text-blue-500",
  ligacao: "bg-green-500/10 text-green-500",
  visita: "bg-purple-500/10 text-purple-500",
  outro: "bg-gray-500/10 text-gray-500",
};

export function VisitorInteractions({ visitorId, visitorName }: VisitorInteractionsProps) {
  const { user } = useAuth();
  const { can } = usePermissions();
  const [interactions, setInteractions] = useState<VisitorInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    interaction_type: "mensagem",
    description: "",
  });
  const [interactionDate, setInteractionDate] = useState<Date>(new Date());

  useEffect(() => {
    fetchInteractions();
  }, [visitorId]);

  const fetchInteractions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitor_interactions")
      .select("*")
      .eq("visitor_id", visitorId)
      .order("interaction_date", { ascending: false });

    if (error) {
      console.error("Error fetching interactions:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as interações",
        variant: "destructive",
      });
      setInteractions([]);
    } else {
      // Buscar perfis dos criadores
      const interactionsWithProfiles = await Promise.all(
        (data || []).map(async (interaction) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", interaction.created_by)
            .single();

          return {
            ...interaction,
            profiles: profile || { full_name: "Usuário" },
          };
        })
      );
      setInteractions(interactionsWithProfiles);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const { error } = await supabase.from("visitor_interactions").insert({
        visitor_id: visitorId,
        interaction_type: formData.interaction_type,
        interaction_date: interactionDate.toISOString(),
        description: formData.description,
        created_by: user.id,
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Interação registrada com sucesso",
      });

      setDialogOpen(false);
      setFormData({
        interaction_type: "mensagem",
        description: "",
      });
      setInteractionDate(new Date());
      fetchInteractions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Histórico de Interações
            </CardTitle>
            <CardDescription>
              Acompanhamento com {visitorName}
            </CardDescription>
          </div>
          {can("interacoes", "create") && (
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Interação
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-4">Carregando...</p>
        ) : interactions.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma interação registrada ainda
          </p>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction) => (
              <div key={interaction.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Badge className={interactionColors[interaction.interaction_type]}>
                    {interactionTypes[interaction.interaction_type as keyof typeof interactionTypes]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(interaction.interaction_date), "dd/MM/yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </span>
                </div>
                <p className="text-sm">{interaction.description}</p>
                <p className="text-xs text-muted-foreground">
                  Por: {interaction.profiles?.full_name || "Usuário"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Interação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="interaction_type">Tipo de Interação *</Label>
              <Select
                value={formData.interaction_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, interaction_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(interactionTypes).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data da Interação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !interactionDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {interactionDate ? (
                      format(interactionDate, "dd/MM/yyyy", { locale: ptBR })
                    ) : (
                      <span>Selecione uma data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={interactionDate}
                    onSelect={(date) => date && setInteractionDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descreva o que foi feito..."
                required
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
