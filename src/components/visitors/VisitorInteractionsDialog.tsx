import { useState, useEffect } from "react";
import { Calendar, Plus, TrendingUp, Hash, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { InteractionTimeline } from "./InteractionTimeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface VisitorInteraction {
  id: string;
  visitor_id: string;
  interaction_type: string;
  interaction_date: string;
  description: string;
  ultimo_culto: string | null;
  frequencia: string | null;
  created_by: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface VisitorInteractionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitorId: string;
  visitorName: string;
}

const interactionTypes = {
  visita: 'Visita',
  ligacao: 'Ligação',
  mensagem: 'Mensagem',
  evento: 'Evento',
  outro: 'Outro'
};

export function VisitorInteractionsDialog({
  open,
  onOpenChange,
  visitorId,
  visitorName
}: VisitorInteractionsDialogProps) {
  const [interactions, setInteractions] = useState<VisitorInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    interaction_type: '',
    interaction_date: new Date(),
    ultimo_culto: null as Date | null,
    frequencia: '',
    description: ''
  });

  useEffect(() => {
    if (open) {
      fetchInteractions();
    }
  }, [open, visitorId]);

  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('visitor_interactions')
        .select(`
          *,
          profiles (
            full_name
          )
        `)
        .eq('visitor_id', visitorId)
        .order('interaction_date', { ascending: false });

      if (error) throw error;
      setInteractions(data as any || []);
    } catch (error: any) {
      toast.error('Erro ao carregar interações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.interaction_type || !formData.description) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('visitor_interactions')
        .insert({
          visitor_id: visitorId,
          interaction_type: formData.interaction_type,
          interaction_date: format(formData.interaction_date, 'yyyy-MM-dd'),
          ultimo_culto: formData.ultimo_culto ? format(formData.ultimo_culto, 'yyyy-MM-dd') : null,
          frequencia: formData.frequencia || null,
          description: formData.description.trim(),
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Interação registrada com sucesso!');
      setShowForm(false);
      setFormData({
        interaction_type: '',
        interaction_date: new Date(),
        ultimo_culto: null,
        frequencia: '',
        description: ''
      });
      fetchInteractions();
    } catch (error: any) {
      toast.error('Erro ao registrar interação');
      console.error(error);
    }
  };

  const lastInteraction = interactions[0];
  const lastCulto = interactions.find(i => i.ultimo_culto)?.ultimo_culto;
  const currentFrequencia = interactions.find(i => i.frequencia)?.frequencia;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            <span>Histórico de Interações - {visitorName}</span>
            <Button
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'Cancelar' : 'Nova Interação'}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">
          {/* Quick Info Cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Último Culto</p>
                    <p className="text-lg font-semibold">
                      {lastCulto ? format(new Date(lastCulto), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Frequência</p>
                    <p className="text-lg font-semibold capitalize">
                      {currentFrequencia || 'N/A'}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Interações</p>
                    <p className="text-lg font-semibold">{interactions.length}</p>
                  </div>
                  <Hash className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* New Interaction Form */}
          <Collapsible open={showForm} onOpenChange={setShowForm}>
            <CollapsibleContent>
              <Card>
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo de Interação *</Label>
                        <Select
                          value={formData.interaction_type}
                          onValueChange={(value) => setFormData({ ...formData, interaction_type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(interactionTypes).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
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
                                !formData.interaction_date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(formData.interaction_date, "dd/MM/yyyy", { locale: ptBR })}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={formData.interaction_date}
                              onSelect={(date) => date && setFormData({ ...formData, interaction_date: date })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Último Culto</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !formData.ultimo_culto && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.ultimo_culto ? format(formData.ultimo_culto, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={formData.ultimo_culto || undefined}
                              onSelect={(date) => setFormData({ ...formData, ultimo_culto: date || null })}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Frequência</Label>
                        <Select
                          value={formData.frequencia}
                          onValueChange={(value) => setFormData({ ...formData, frequencia: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Descrição *</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Descreva a interação..."
                        rows={3}
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      Registrar Interação
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Timeline de Interações</h3>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <InteractionTimeline interactions={interactions} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
