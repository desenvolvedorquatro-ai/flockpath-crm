import { useEffect, useState } from "react";
import { Users, Plus, Mail, Phone, Calendar, Filter, MessageSquare, CalendarIcon, Building2, AlertCircle, Cake, Edit } from "lucide-react";
import { ViewToggle } from "@/components/ViewToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { statusColors, statusLabels, statusOptions } from "@/lib/visitorStatus";

interface Visitor {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  status: string;
  first_visit_date: string;
  invited_by: string | null;
  assistance_group_id: string | null;
  data_nascimento: string | null;
  primeira_visita: string | null;
  church_id: string;
  assistance_group_name?: string | null;
  last_interaction_type?: string | null;
  last_interaction_date?: string | null;
}

interface AssistanceGroup {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
}

interface Area {
  id: string;
  name: string;
  region_id: string;
}

interface Church {
  id: string;
  name: string;
  area_id: string | null;
  region_id: string | null;
}

const interactionTypeLabels: Record<string, string> = {
  visita: "Visita",
  ligacao: "Ligação",
  mensagem: "Mensagem",
  reuniao: "Reunião",
  outro: "Outro",
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isInteractionsDialogOpen, setIsInteractionsDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [view, setView] = useState<"card" | "list">("list");
  const [userHasNoChurch, setUserHasNoChurch] = useState(false);

  // Estados para admin selecionar região, área e igreja
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    invited_by: "",
    status: "visitante",
    assistance_group_id: "none",
  });
  const [editFormData, setEditFormData] = useState({
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
  const [editDataNascimento, setEditDataNascimento] = useState<Date | undefined>();
  const [editPrimeiraVisita, setEditPrimeiraVisita] = useState<Date | undefined>();

  useEffect(() => {
    if (!user) return;

    const fetchChurchAndVisitors = async () => {
      if (isAdmin) {
        // Admin vê todos os visitantes e grupos com última interação e grupo
        const { data, error } = await supabase
          .from("visitors")
          .select(`
            *,
            assistance_groups!visitors_assistance_group_id_fkey(name),
            visitor_interactions(interaction_type, interaction_date)
          `)
          .order("created_at", { ascending: false });

        if (error) {
          toast({
            title: "Erro ao carregar visitantes",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Processar os dados para incluir último tipo de interação e nome do grupo
          const processedData = (data || []).map((v: any) => {
            const lastInteraction = v.visitor_interactions?.[0] || null;
            return {
              ...v,
              assistance_group_name: v.assistance_groups?.name || null,
              last_interaction_type: lastInteraction?.interaction_type || null,
              last_interaction_date: lastInteraction?.interaction_date || null,
            };
          });
          setVisitors(processedData);
          setFilteredVisitors(processedData);
        }

        const { data: groupsData } = await supabase
          .from("assistance_groups")
          .select("id, name")
          .order("name");

        setAssistanceGroups(groupsData || []);

        // Carregar regiões, áreas e igrejas para admin
        const { data: regionsData } = await supabase
          .from("regions")
          .select("*")
          .order("name");
        setRegions(regionsData || []);

        const { data: areasData } = await supabase
          .from("areas")
          .select("*")
          .order("name");
        setAreas(areasData || []);

        const { data: churchesData } = await supabase
          .from("churches")
          .select("*")
          .order("name");
        setChurches(churchesData || []);
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
            .select(`
              *,
              assistance_groups!visitors_assistance_group_id_fkey(name),
              visitor_interactions(interaction_type, interaction_date)
            `)
            .in("church_id", churchIds)
            .order("created_at", { ascending: false });

          if (error) {
            toast({
              title: "Erro ao carregar visitantes",
              description: error.message,
              variant: "destructive",
            });
          } else {
            const processedData = (data || []).map((v: any) => {
              const lastInteraction = v.visitor_interactions?.[0] || null;
              return {
                ...v,
                assistance_group_name: v.assistance_groups?.name || null,
                last_interaction_type: lastInteraction?.interaction_type || null,
                last_interaction_date: lastInteraction?.interaction_date || null,
              };
            });
            setVisitors(processedData);
            setFilteredVisitors(processedData);
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
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          toast({
            title: "Erro ao carregar perfil",
            description: profileError.message,
            variant: "destructive",
          });
          return;
        }

        if (profile?.church_id) {
          // Pré-carregar a igreja do usuário
          setChurchId(profile.church_id);

          // Carregar dados da igreja
          const { data: churchData } = await supabase
            .from("churches")
            .select("*")
            .eq("id", profile.church_id)
            .maybeSingle();

          if (churchData) {
            setChurches([churchData]);
          }

          const { data, error } = await supabase
            .from("visitors")
            .select(`
              *,
              assistance_groups!visitors_assistance_group_id_fkey(name),
              visitor_interactions(interaction_type, interaction_date)
            `)
            .eq("church_id", profile.church_id)
            .order("created_at", { ascending: false });

          if (error) {
            toast({
              title: "Erro ao carregar visitantes",
              description: error.message,
              variant: "destructive",
            });
          } else {
            const processedData = (data || []).map((v: any) => {
              const lastInteraction = v.visitor_interactions?.[0] || null;
              return {
                ...v,
                assistance_group_name: v.assistance_groups?.name || null,
                last_interaction_type: lastInteraction?.interaction_type || null,
                last_interaction_date: lastInteraction?.interaction_date || null,
              };
            });
            setVisitors(processedData);
            setFilteredVisitors(processedData);
          }

          const { data: groupsData } = await supabase
            .from("assistance_groups")
            .select("id, name")
            .eq("church_id", profile.church_id)
            .order("name");

          setAssistanceGroups(groupsData || []);
        }
      }
    };

    fetchChurchAndVisitors();
  }, [user, isAdmin, isPastor]);

  // Filtrar áreas quando região é selecionada
  useEffect(() => {
    if (selectedRegionId) {
      const filtered = areas.filter(a => a.region_id === selectedRegionId);
      setFilteredAreas(filtered);
      setSelectedAreaId("");
      setChurchId(null);
    } else {
      setFilteredAreas([]);
      setSelectedAreaId("");
    }
  }, [selectedRegionId, areas]);

  // Filtrar igrejas quando área é selecionada
  useEffect(() => {
    if (selectedAreaId) {
      const filtered = churches.filter(c => c.area_id === selectedAreaId);
      setFilteredChurches(filtered);
      setChurchId(null);
    } else if (selectedRegionId) {
      const filtered = churches.filter(c => c.region_id === selectedRegionId);
      setFilteredChurches(filtered);
    } else {
      setFilteredChurches(churches);
    }
  }, [selectedAreaId, selectedRegionId, churches]);

  // Carregar grupos quando igreja é selecionada (para admin)
  useEffect(() => {
    if (churchId && isAdmin) {
      console.log("[VISITANTES] Carregando grupos para igreja (admin):", churchId);
      const loadChurchGroups = async () => {
        const { data: groupsData } = await supabase
          .from("assistance_groups")
          .select("id, name")
          .eq("church_id", churchId)
          .order("name");

        console.log("[VISITANTES] Grupos carregados para admin:", groupsData);
        setAssistanceGroups(groupsData || []);
      };

      loadChurchGroups();
    }
  }, [churchId, isAdmin]);

  // Recarregar church_id do usuário quando o dialog de cadastro abre
  useEffect(() => {
    if (!user || isAdmin || isPastor || !isDialogOpen) return;

    console.log("[VISITANTES] Dialog aberto, recarregando church_id do usuário...");
    
    const reloadUserChurch = async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[VISITANTES] Erro ao recarregar church_id:", error);
        return;
      }

      console.log("[VISITANTES] Church ID recarregado:", profile?.church_id);

      if (profile?.church_id) {
        setChurchId(profile.church_id);
        setUserHasNoChurch(false);

        // Recarregar grupos de assistência para a igreja do usuário
        const { data: groupsData } = await supabase
          .from("assistance_groups")
          .select("id, name")
          .eq("church_id", profile.church_id)
          .order("name");

        console.log("[VISITANTES] Grupos carregados para usuário:", groupsData);
        setAssistanceGroups(groupsData || []);
      } else {
        setUserHasNoChurch(true);
        console.warn("[VISITANTES] Usuário sem church_id configurado");
      }
    };

    reloadUserChurch();
  }, [user, isAdmin, isPastor, isDialogOpen]);

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

  const openEditDialog = (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setEditFormData({
      full_name: visitor.full_name,
      phone: visitor.phone || "",
      email: visitor.email || "",
      address: visitor.address || "",
      invited_by: visitor.invited_by || "",
      status: visitor.status,
      assistance_group_id: visitor.assistance_group_id || "none",
    });
    setEditDataNascimento(visitor.data_nascimento ? new Date(visitor.data_nascimento) : undefined);
    setEditPrimeiraVisita(visitor.primeira_visita ? new Date(visitor.primeira_visita) : undefined);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVisitor) return;

    const { error } = await supabase
      .from("visitors")
      .update({
        full_name: editFormData.full_name,
        phone: editFormData.phone || null,
        email: editFormData.email || null,
        address: editFormData.address || null,
        invited_by: editFormData.invited_by || null,
        status: editFormData.status as "visitante" | "interessado" | "em_assistencia" | "batizado",
        assistance_group_id: editFormData.assistance_group_id && editFormData.assistance_group_id !== "none" ? editFormData.assistance_group_id : null,
        data_nascimento: editDataNascimento ? format(editDataNascimento, "yyyy-MM-dd") : null,
        primeira_visita: editPrimeiraVisita ? format(editPrimeiraVisita, "yyyy-MM-dd") : null,
      })
      .eq("id", selectedVisitor.id);

    if (error) {
      toast({
        title: "Erro ao atualizar visitante",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Visitante atualizado!",
      description: "Os dados foram atualizados com sucesso.",
    });

    setIsEditDialogOpen(false);
    
    // Recarregar visitantes
    const reloadVisitors = async () => {
      const query = supabase
        .from("visitors")
        .select(`
          *,
          assistance_groups!visitors_assistance_group_id_fkey(name),
          visitor_interactions(interaction_type, interaction_date)
        `)
        .order("created_at", { ascending: false });

      if (isAdmin) {
        // Admin vê todos
      } else if (isPastor) {
        const { data: pastorChurches } = await supabase
          .from("churches")
          .select("id")
          .eq("pastor_id", user.id);

        if (pastorChurches && pastorChurches.length > 0) {
          const churchIds = pastorChurches.map(c => c.id);
          query.in("church_id", churchIds);
        }
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("id", user.id)
          .single();

        if (profile?.church_id) {
          query.eq("church_id", profile.church_id);
        }
      }

      const { data } = await query;

      if (data) {
        const processedData = data.map((v: any) => {
          const lastInteraction = v.visitor_interactions?.[0] || null;
          return {
            ...v,
            assistance_group_name: v.assistance_groups?.name || null,
            last_interaction_type: lastInteraction?.interaction_type || null,
            last_interaction_date: lastInteraction?.interaction_date || null,
          };
        });
        setVisitors(processedData);
        setFilteredVisitors(processedData);
      }
    };

    reloadVisitors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!churchId) {
      toast({
        title: "Erro",
        description: isAdmin ? "Selecione uma igreja para o visitante." : "Igreja não encontrada.",
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
      status: formData.status as "visitante" | "interessado" | "em_assistencia" | "batizado",
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
      
      // Resetar seleções de admin
      if (isAdmin) {
        setSelectedRegionId("");
        setSelectedAreaId("");
        setChurchId(null);
      }

      const { data } = await supabase
        .from("visitors")
        .select("*")
        .order("created_at", { ascending: false });

      if (isAdmin) {
        setVisitors(data || []);
      } else {
        const filtered = data?.filter(v => v.church_id === churchId) || [];
        setVisitors(filtered);
      }
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

      {/* Alerta quando usuário não tem igreja configurada */}
      {userHasNoChurch && !isAdmin && !isPastor && (
        <div className="mb-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sua igreja não está configurada. Por favor, solicite a um administrador que configure sua igreja principal nas configurações de usuário.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Visitante</DialogTitle>
            <DialogDescription>
              Preencha os dados do visitante. {!isAdmin && churchId && churches.length > 0 && (
                <>Igreja: <span className="font-semibold">{churches.find((c) => c.id === churchId)?.name}</span></>
              )}
            </DialogDescription>
          </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isAdmin && (
                <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <Label className="font-semibold">Selecione a Igreja do Visitante</Label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="region">Região</Label>
                      <Select
                        value={selectedRegionId}
                        onValueChange={setSelectedRegionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione região" />
                        </SelectTrigger>
                        <SelectContent className="bg-card z-[100]">
                          {regions.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="area">Área</Label>
                      <Select
                        value={selectedAreaId}
                        onValueChange={setSelectedAreaId}
                        disabled={!selectedRegionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione área" />
                        </SelectTrigger>
                        <SelectContent className="bg-card z-[100]">
                          {filteredAreas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="church">Igreja *</Label>
                      <Select
                        value={churchId || ""}
                        onValueChange={setChurchId}
                        disabled={!selectedRegionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione igreja" />
                        </SelectTrigger>
                        <SelectContent className="bg-card z-[100]">
                          {filteredChurches.map((church) => (
                            <SelectItem key={church.id} value={church.id}>
                              {church.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
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
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
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
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
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
                  <TableHead className="hidden sm:table-cell min-w-[130px]">Grupo</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[160px]">Última Interação</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[100px]">Aniversário</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors.map((visitor) => {
                  const birthday = visitor.data_nascimento ? new Date(visitor.data_nascimento) : null;
                  const today = new Date();
                  const daysUntilBirthday = birthday 
                    ? differenceInDays(
                        new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate()),
                        today
                      )
                    : null;
                  const isUpcomingBirthday = daysUntilBirthday !== null && daysUntilBirthday >= 0 && daysUntilBirthday <= 7;

                  return (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{visitor.full_name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {visitor.assistance_group_name || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {visitor.last_interaction_type ? (
                          <div className="flex flex-col gap-1">
                            <span>{interactionTypeLabels[visitor.last_interaction_type] || visitor.last_interaction_type}</span>
                            {visitor.last_interaction_date && (
                              <span className="text-xs opacity-70">
                                {format(new Date(visitor.last_interaction_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {birthday ? (
                          <div className="flex items-center gap-2">
                            {isUpcomingBirthday && <Cake className="w-4 h-4 text-green-500" />}
                            <span className={cn(
                              "text-sm",
                              isUpcomingBirthday ? "text-green-600 font-semibold" : "text-muted-foreground"
                            )}>
                              {format(birthday, "dd/MM")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${statusColors[visitor.status]} text-xs`}
                        >
                          {statusLabels[visitor.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(visitor)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(visitor)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedVisitor(visitor);
                      setIsInteractionsDialogOpen(true);
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Interações
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Visitante</DialogTitle>
            <DialogDescription>
              Atualize as informações do visitante abaixo
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-6">
            {/* Igreja (read-only) */}
            <div className="space-y-2">
              <Label>Igreja</Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                {churches.find((c) => c.id === selectedVisitor?.church_id)?.name || "Igreja não encontrada"}
              </div>
            </div>

            {/* Nome e Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_full_name">Nome completo *</Label>
                <Input
                  id="edit_full_name"
                  value={editFormData.full_name}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, full_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Telefone</Label>
                <Input
                  id="edit_phone"
                  value={editFormData.phone}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, phone: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit_email">E-mail</Label>
              <Input
                id="edit_email"
                type="email"
                value={editFormData.email}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="edit_address">Endereço</Label>
              <Input
                id="edit_address"
                value={editFormData.address}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
              />
            </div>

            {/* Data de Nascimento e Primeira Visita */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editDataNascimento && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDataNascimento ? (
                        format(editDataNascimento, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editDataNascimento}
                      onSelect={setEditDataNascimento}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
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
                        !editPrimeiraVisita && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editPrimeiraVisita ? (
                        format(editPrimeiraVisita, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={editPrimeiraVisita}
                      onSelect={setEditPrimeiraVisita}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Convidado por e Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_invited_by">Convidado por</Label>
                <Input
                  id="edit_invited_by"
                  value={editFormData.invited_by}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, invited_by: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_status">Status</Label>
                <Select
                  value={editFormData.status}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Grupo de Assistência */}
            <div className="space-y-2">
              <Label htmlFor="edit_assistance_group_id">
                Grupo de Assistência
              </Label>
              <Select
                value={editFormData.assistance_group_id}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, assistance_group_id: value })
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

            {/* Botões */}
            <div className="flex gap-3 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                Salvar Alterações
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
