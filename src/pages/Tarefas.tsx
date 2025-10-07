import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernHeader } from "@/components/ModernHeader";
import { PaginationControls } from "@/components/PaginationControls";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Edit, CheckCircle, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description: string | null;
  church_id: string;
  assistance_group_id: string;
  assigned_to: string;
  created_by: string;
  interaction_type: string;
  due_date: string;
  completed_date: string | null;
  completion_notes: string | null;
  status: "pending" | "overdue" | "completed";
  churches?: { name: string };
  assistance_groups?: { name: string };
}

interface Church {
  id: string;
  name: string;
}

interface AssistanceGroup {
  id: string;
  name: string;
  responsible_id: string | null;
  church_id: string;
}

export default function Tarefas() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { isPastor, isAdmin } = useUserRole();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [assistanceGroups, setAssistanceGroups] = useState<AssistanceGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<AssistanceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    church_id: "",
    assistance_group_id: "",
    interaction_type: "",
    due_date: new Date(),
  });

  const [completionData, setCompletionData] = useState({
    completed_date: new Date(),
    completion_notes: "",
  });

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchChurches();
      fetchAssistanceGroups();
    }
  }, [user]);

  useEffect(() => {
    if (formData.church_id) {
      const filtered = assistanceGroups.filter(ag => ag.church_id === formData.church_id);
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups([]);
    }
  }, [formData.church_id, assistanceGroups]);

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from("tasks")
        .select(`
          *,
          churches(name),
          assistance_groups(name)
        `)
        .order("due_date", { ascending: true });

      // Se não for pastor/admin, mostra apenas tarefas atribuídas ao usuário
      if (!isPastor && !isAdmin) {
        query = query.eq("assigned_to", user!.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTasks((data || []) as Task[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar tarefas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChurches = async () => {
    const { data, error } = await supabase
      .from("churches")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Erro ao carregar igrejas:", error);
      return;
    }

    setChurches(data || []);
  };

  const fetchAssistanceGroups = async () => {
    const { data, error } = await supabase
      .from("assistance_groups")
      .select("id, name, responsible_id, church_id")
      .order("name");

    if (error) {
      console.error("Erro ao carregar grupos:", error);
      return;
    }

    setAssistanceGroups(data || []);
  };

  const handleSave = async () => {
    try {
      const selectedGroup = assistanceGroups.find(ag => ag.id === formData.assistance_group_id);
      
      if (!selectedGroup?.responsible_id) {
        toast({
          title: "Erro",
          description: "O grupo selecionado não possui um responsável atribuído.",
          variant: "destructive",
        });
        return;
      }

      const taskData = {
        title: formData.title,
        description: formData.description,
        church_id: formData.church_id,
        assistance_group_id: formData.assistance_group_id,
        assigned_to: selectedGroup.responsible_id,
        created_by: user!.id,
        interaction_type: formData.interaction_type,
        due_date: format(formData.due_date, "yyyy-MM-dd"),
      };

      const { error } = await supabase
        .from("tasks")
        .insert(taskData);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso!",
      });

      setDialogOpen(false);
      resetForm();
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Erro ao criar tarefa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleComplete = async () => {
    if (!editingTask) return;

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          completed_date: format(completionData.completed_date, "yyyy-MM-dd"),
          completion_notes: completionData.completion_notes,
          status: "completed",
        })
        .eq("id", editingTask.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tarefa marcada como concluída!",
      });

      setCompletionDialogOpen(false);
      setEditingTask(null);
      fetchTasks();
    } catch (error: any) {
      toast({
        title: "Erro ao concluir tarefa",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      church_id: "",
      assistance_group_id: "",
      interaction_type: "",
      due_date: new Date(),
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500">No Prazo</Badge>;
      case "overdue":
        return <Badge variant="destructive">Atrasado</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Concluído</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Paginação
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!can("tarefas", "view")) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <ModernHeader
        title="Tarefas"
        description="Gerencie tarefas atribuídas aos responsáveis dos GAs"
        icon={CheckSquare}
        colorScheme="red-coral"
        onAction={can("tarefas", "create") && (isPastor || isAdmin) ? () => setDialogOpen(true) : undefined}
        actionText="Nova Tarefa"
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Lista de Tarefas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Igreja</TableHead>
                    <TableHead>GA</TableHead>
                    <TableHead>Tipo de Interação</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.churches?.name}</TableCell>
                      <TableCell>{task.assistance_groups?.name}</TableCell>
                      <TableCell>{task.interaction_type}</TableCell>
                      <TableCell>{format(new Date(task.due_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(task.status)}</TableCell>
                      <TableCell>
                        {task.status !== "completed" && can("tarefas", "edit") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingTask(task);
                              setCompletionDialogOpen(true);
                            }}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Concluir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Nenhuma tarefa encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <PaginationControls
                currentPage={currentPage}
                totalItems={tasks.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog para criar tarefa */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="church">Igreja *</Label>
              <Select
                value={formData.church_id}
                onValueChange={(value) => setFormData({ ...formData, church_id: value, assistance_group_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma igreja" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="group">Grupo de Assistência *</Label>
              <Select
                value={formData.assistance_group_id}
                onValueChange={(value) => setFormData({ ...formData, assistance_group_id: value })}
                disabled={!formData.church_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um GA" />
                </SelectTrigger>
                <SelectContent>
                  {filteredGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interaction">Tipo de Interação *</Label>
              <Input
                id="interaction"
                value={formData.interaction_type}
                onChange={(e) => setFormData({ ...formData, interaction_type: e.target.value })}
                placeholder="Ex: Visita, Ligação, etc."
              />
            </div>

            <div>
              <Label>Prazo *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.due_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.due_date ? format(formData.due_date, "PPP", { locale: ptBR }) : "Selecione uma data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => date && setFormData({ ...formData, due_date: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para concluir tarefa */}
      <Dialog open={completionDialogOpen} onOpenChange={setCompletionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Data de Conclusão *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(completionData.completed_date, "PPP", { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={completionData.completed_date}
                    onSelect={(date) => date && setCompletionData({ ...completionData, completed_date: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={completionData.completion_notes}
                onChange={(e) => setCompletionData({ ...completionData, completion_notes: e.target.value })}
                placeholder="Descreva como a tarefa foi realizada..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCompletionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleComplete}>Confirmar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
