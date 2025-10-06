import { useEffect, useState } from "react";
import { Users, Plus, Mail, Phone, Calendar, Filter, MessageSquare, CalendarIcon } from "lucide-react";
import { ViewToggle } from "@/components/ViewToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "@/hooks/use-toast";
import { VisitorInteractions } from "@/components/VisitorInteractions";
import { ModernHeader } from "@/components/ModernHeader";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Visitor {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  first_visit_date: string;
  invited_by: string | null;
  assistance_group_id: string | null;
  data_nascimento: string | null;
  primeira_visita: string | null;
}

interface AssistanceGroup {
  id: string;
  name: string;
}

const statusColors: Record<string, string> = {
  visitante: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  interessado: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  em_acompanhamento: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  novo_membro: "bg-green-500/10 text-green-500 border-green-500/20",
  engajado: "bg-pink-500/10 text-pink-500 border-pink-500/20",
};

const statusLabels: Record<string, string> = {
  visitante: "Visitante",
  interessado: "Interessado",
  em_acompanhamento: "Em Acompanhamento",
  novo_membro: "Novo Membro",
  engajado: "Engajado",
};

export default function Visitantes() {
  const { user } = useAuth();
  const { isAdmin, isPastor } = useUserRole();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [assistanceGroups, setAssistanceGroups] = useState<AssistanceGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInteractionsDialogOpen, setIsInteractionsDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [view, setView] = useState<"card" | "list">("list");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    invited_by: "",
    status: "visitante",
    assistance_group_id: "none",
  });
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>();
  const [primeiraVisita, setPrimeiraVisita] = useState<Date | undefined>();

  useEffect(() => {
    if (!user) return;

    const fetchChurchAndVisitors = async () => {
      if (isAdmin) {
        // Admin vê todos os visitantes e grupos
        const { data, error } = await supabase
          .from("visitors")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          toast({
            title: "Erro ao carregar visitantes",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setVisitors(data || []);
          setFilteredVisitors(data || []);
        }

        const { data: groupsData } = await supabase
          .from("assistance_groups")
          .select("id, name")
          .order("name");

        setAssistanceGroups(groupsData || []);
      } else if (isPastor) {
        // Pastor vê visitantes e grupos de todas as suas igrejas
        const { data: pastorChurches } = await supabase
          .from("churches")
          .select("id")
          .eq("pastor_id", user.id);

        if (pastorChurches && pastorChurches.length > 0) {
          const churchIds = pastorChurches.map(c => c.id);
          
          const { data, error } = await supabase
            .from("visitors")
            .select("*")
            .in("church_id", churchIds)
            .order("created_at", { ascending: false });

          if (error) {
            toast({
              title: "Erro ao carregar visitantes",
              description: error.message,
              variant: "destructive",
            });
          } else {
            setVisitors(data || []);
            setFilteredVisitors(data || []);
          }

          const { data: groupsData } = await supabase
            .from("assistance_groups")
            .select("id, name")
            .in("church_id", churchIds)
            .order("name");

          setAssistanceGroups(groupsData || []);
        }
      } else {
        // Outros usuários veem apenas da sua igreja
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("id", user.id)
          .single();

        if (!profile?.church_id) {
          toast({
            title: "Igreja não encontrada",
            description: "Você precisa estar vinculado a uma igreja.",
            variant: "destructive",
          });
          return;
        }

        setChurchId(profile.church_id);

        const { data, error } = await supabase
          .from("visitors")
          .select("*")
          .eq("church_id", profile.church_id)
          .order("created_at", { ascending: false });

        if (error) {
          toast({
            title: "Erro ao carregar visitantes",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setVisitors(data || []);
          setFilteredVisitors(data || []);
        }

        const { data: groupsData } = await supabase
          .from("assistance_groups")
          .select("id, name")
          .eq("church_id", profile.church_id)
          .order("name");

        setAssistanceGroups(groupsData || []);
      }
    };

    fetchChurchAndVisitors();
  }, [user, isAdmin, isPastor]);

  useEffect(() => {
    let filtered = visitors;

    if (searchTerm) {
      filtered = filtered.filter(
        (v) =>
          v.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          v.phone?.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    setFilteredVisitors(filtered);
  }, [searchTerm, statusFilter, visitors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!churchId && !isAdmin && !isPastor) {
      toast({
        title: "Erro",
        description: "Igreja não encontrada.",
        variant: "destructive",
      });
      return;
    }

    // Se admin/pastor e não tiver church_id, deve selecionar uma igreja
    if ((isAdmin || isPastor) && !churchId) {
      toast({
        title: "Erro",
        description: "Selecione uma igreja para o visitante.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("visitors").insert([{
      full_name: formData.full_name,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      invited_by: formData.invited_by || null,
      status: formData.status as "visitante" | "interessado" | "em_acompanhamento" | "novo_membro" | "engajado",
      church_id: churchId,
      assistance_group_id: formData.assistance_group_id && formData.assistance_group_id !== "none" ? formData.assistance_group_id : null,
      data_nascimento: dataNascimento ? format(dataNascimento, "yyyy-MM-dd") : null,
      primeira_visita: primeiraVisita ? format(primeiraVisita, "yyyy-MM-dd") : null,
    }]);

    if (error) {
      toast({
        title: "Erro ao cadastrar visitante",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Visitante cadastrado!",
        description: "O visitante foi adicionado com sucesso.",
      });

      setIsDialogOpen(false);
      setFormData({
        full_name: "",
        phone: "",
        email: "",
        address: "",
        invited_by: "",
        status: "visitante",
        assistance_group_id: "none",
      });
      setDataNascimento(undefined);
      setPrimeiraVisita(undefined);

      const { data } = await supabase
        .from("visitors")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });

      setVisitors(data || []);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Visitantes"
        description="Gestão completa de visitantes e membros"
        icon={Users}
        onAction={() => setIsDialogOpen(true)}
        actionText="Novo Visitante"
        colorScheme="red-coral"
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Visitante</DialogTitle>
          </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dataNascimento && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dataNascimento ? (
                          format(dataNascimento, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dataNascimento}
                        onSelect={setDataNascimento}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Primeira Visita</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !primeiraVisita && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {primeiraVisita ? (
                          format(primeiraVisita, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={primeiraVisita}
                        onSelect={setPrimeiraVisita}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invited_by">Convidado por</Label>
                  <Input
                    id="invited_by"
                    value={formData.invited_by}
                    onChange={(e) =>
                      setFormData({ ...formData, invited_by: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status inicial</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="visitante">Visitante</SelectItem>
                      <SelectItem value="interessado">Interessado</SelectItem>
                      <SelectItem value="em_acompanhamento">
                        Em Acompanhamento
                      </SelectItem>
                      <SelectItem value="novo_membro">Novo Membro</SelectItem>
                      <SelectItem value="engajado">Engajado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assistance_group_id">Grupo de Assistência</Label>
                <Select
                  value={formData.assistance_group_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, assistance_group_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="none">Nenhum</SelectItem>
                    {assistanceGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full btn-hover-lift bg-gradient-to-r from-primary to-primary-glow"
              >
                Cadastrar Visitante
              </Button>
            </form>
          </DialogContent>
        </Dialog>

      <div className="glass-card rounded-2xl p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 flex-1">
            <div className="flex-1">
              <Input
                placeholder="Buscar visitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="visitante">Visitante</SelectItem>
                <SelectItem value="interessado">Interessado</SelectItem>
                <SelectItem value="em_acompanhamento">Em Acompanhamento</SelectItem>
                <SelectItem value="novo_membro">Novo Membro</SelectItem>
                <SelectItem value="engajado">Engajado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      {filteredVisitors.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Nenhum visitante encontrado</h3>
          <p className="text-muted-foreground">
            {visitors.length === 0
              ? "Comece cadastrando seu primeiro visitante"
              : "Nenhum visitante corresponde aos filtros aplicados"}
          </p>
        </div>
      ) : view === "list" ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">Contato</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[140px]">Primeira Visita</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[120px]">Convidado por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.map((visitor) => (
                  <TableRow key={visitor.id}>
                    <TableCell className="font-medium">{visitor.full_name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1 text-sm">
                        {visitor.email && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{visitor.email}</span>
                          </div>
                        )}
                        {visitor.phone && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {visitor.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColors[visitor.status]} text-xs`}
                      >
                        {statusLabels[visitor.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(visitor.first_visit_date).toLocaleDateString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                      {visitor.invited_by || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedVisitor(visitor);
                          setIsInteractionsDialogOpen(true);
                        }}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Interações
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisitors.map((visitor) => (
            <Card key={visitor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{visitor.full_name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={`${statusColors[visitor.status]} text-xs mt-1`}
                      >
                        {statusLabels[visitor.status]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {visitor.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{visitor.email}</span>
                  </div>
                )}
                {visitor.phone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="w-4 h-4" />
                    {visitor.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {new Date(visitor.first_visit_date).toLocaleDateString("pt-BR")}
                </div>
                {visitor.invited_by && (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Convidado por:</span>{" "}
                    <span className="text-muted-foreground">{visitor.invited_by}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    setSelectedVisitor(visitor);
                    setIsInteractionsDialogOpen(true);
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ver Interações
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Interações */}
      <Dialog open={isInteractionsDialogOpen} onOpenChange={setIsInteractionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interações - {selectedVisitor?.full_name}</DialogTitle>
          </DialogHeader>
          {selectedVisitor && (
            <VisitorInteractions
              visitorId={selectedVisitor.id}
              visitorName={selectedVisitor.full_name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
