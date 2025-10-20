import { useEffect, useState } from "react";
import { Users, Plus, Mail, Phone, Calendar, Filter, MessageSquare, CalendarIcon, Building2, AlertCircle, Cake, Edit, User2, Briefcase, ArrowRightLeft, CheckCircle2, XCircle, Trash2 } from "lucide-react";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "@/hooks/use-toast";
import { VisitorInteractionsDialog } from "@/components/visitors/VisitorInteractionsDialog";
import { VisitorTransferDialog } from "@/components/visitors/VisitorTransferDialog";
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
  church_name?: string | null;
  assistance_group_name?: string | null;
  last_interaction_type?: string | null;
  last_interaction_date?: string | null;
  categoria: string | null;
  sexo: string | null;
  profissao: string | null;
  responsavel_assistencia: string | null;
  participacao_seminario: string | null;
  candidato_batismo: boolean | null;
  data_batismo: string | null;
  area_id: string | null;
  region_id: string | null;
  resgate: boolean | null;
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

const categoriaLabels: Record<string, string> = {
  crianca: "Criança",
  intermediario: "Intermediário",
  adolescente: "Adolescente",
  jovem: "Jovem",
  senhora: "Senhora",
  varao: "Varão",
  idoso: "Idoso",
};

const sexoLabels: Record<string, string> = {
  masculino: "Masculino",
  feminino: "Feminino",
};

const calcularIdade = (dataNascimento: string | null): number | null => {
  if (!dataNascimento) return null;
  const hoje = new Date();
  const nascimento = new Date(dataNascimento);
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const mes = hoje.getMonth() - nascimento.getMonth();
  if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
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
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [view, setView] = useState<"card" | "list">("list");
  const [userHasNoChurch, setUserHasNoChurch] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

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
    categoria: "",
    sexo: "",
    profissao: "",
    responsavel_assistencia: "",
    participacao_seminario: "",
    candidato_batismo: false,
    resgate: false,
  });
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    invited_by: "",
    status: "visitante",
    assistance_group_id: "none",
    categoria: "",
    sexo: "",
    profissao: "",
    responsavel_assistencia: "",
    participacao_seminario: "",
    candidato_batismo: false,
    resgate: false,
  });
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>();
  const [primeiraVisita, setPrimeiraVisita] = useState<Date | undefined>();
  const [editDataNascimento, setEditDataNascimento] = useState<Date | undefined>();
  const [editPrimeiraVisita, setEditPrimeiraVisita] = useState<Date | undefined>();
  const [dataBatismo, setDataBatismo] = useState<Date | undefined>();
  const [editDataBatismo, setEditDataBatismo] = useState<Date | undefined>();

  useEffect(() => {
    if (!user) return;

    const fetchChurchAndVisitors = async () => {
      if (isAdmin) {
        // Admin vê todos os visitantes e grupos com última interação e grupo
        const { data, error } = await supabase
          .from("visitors")
          .select(`
            *,
            churches(name),
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
          // Processar os dados para incluir último tipo de interação, nome do grupo e igreja
          const processedData = (data || []).map((v: any) => {
            const lastInteraction = v.visitor_interactions?.[0] || null;
            return {
              ...v,
              church_name: v.churches?.name || null,
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
              churches(name),
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
                church_name: v.churches?.name || null,
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
              churches(name),
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
                church_name: v.churches?.name || null,
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

        // Carregar dados da igreja
        const { data: churchData } = await supabase
          .from("churches")
          .select("*")
          .eq("id", profile.church_id)
          .maybeSingle();

        if (churchData) {
          setChurches([churchData]);
        }

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
    setCurrentPage(1); // Reset para primeira página quando filtrar
   }, [searchTerm, statusFilter, visitors]);

  const openEditDialog = async (visitor: Visitor) => {
    setSelectedVisitor(visitor);
    setEditFormData({
      full_name: visitor.full_name,
      phone: visitor.phone || "",
      email: visitor.email || "",
      address: visitor.address || "",
      invited_by: visitor.invited_by || "",
      status: visitor.status,
      resgate: visitor.resgate || false,
      assistance_group_id: visitor.assistance_group_id || "none",
      categoria: visitor.categoria || "",
      sexo: visitor.sexo || "",
      profissao: visitor.profissao || "",
      responsavel_assistencia: visitor.responsavel_assistencia || "",
      participacao_seminario: visitor.participacao_seminario || "",
      candidato_batismo: visitor.candidato_batismo || false,
    });
    setEditDataNascimento(visitor.data_nascimento ? new Date(visitor.data_nascimento) : undefined);
    setEditPrimeiraVisita(visitor.primeira_visita ? new Date(visitor.primeira_visita) : undefined);
    setEditDataBatismo(visitor.data_batismo ? new Date(visitor.data_batismo) : undefined);
    
    // Carregar grupos de assistência apenas da igreja do visitante
    const { data: groupsData } = await supabase
      .from("assistance_groups")
      .select("id, name")
      .eq("church_id", visitor.church_id)
      .order("name");
    
    setAssistanceGroups(groupsData || []);
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVisitor) return;

    const { error } = await supabase
      .from("visitors")
      .update({
        full_name: editFormData.full_name.trim(),
        phone: editFormData.phone.trim() || null,
        email: editFormData.email.trim() || null,
        address: editFormData.address.trim() || null,
        invited_by: editFormData.invited_by.trim() || null,
        status: editFormData.status as any,
        assistance_group_id: editFormData.assistance_group_id && editFormData.assistance_group_id !== "none" ? editFormData.assistance_group_id : null,
        data_nascimento: editDataNascimento ? format(editDataNascimento, "yyyy-MM-dd") : null,
        primeira_visita: editPrimeiraVisita ? format(editPrimeiraVisita, "yyyy-MM-dd") : null,
        church_id: selectedVisitor.church_id,
        categoria: (editFormData.categoria as any) || null,
        sexo: (editFormData.sexo as any) || null,
        profissao: editFormData.profissao.trim() || null,
        responsavel_assistencia: editFormData.responsavel_assistencia.trim() || null,
        participacao_seminario: editFormData.participacao_seminario.trim() || null,
        candidato_batismo: editFormData.candidato_batismo,
        data_batismo: editDataBatismo ? format(editDataBatismo, "yyyy-MM-dd") : null,
        resgate: editFormData.resgate,
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

  const handleDeleteAllVisitors = async () => {
    if (deleteConfirmText !== "EXCLUIR TUDO") {
      toast({
        title: "Erro",
        description: "Digite 'EXCLUIR TUDO' para confirmar",
        variant: "destructive",
      });
      return;
    }

    try {
      // Buscar todos os visitantes
      const { data: allVisitors } = await supabase
        .from("visitors")
        .select("id");

      if (!allVisitors || allVisitors.length === 0) {
        toast({
          title: "Nenhum visitante encontrado",
          description: "Não há visitantes para excluir",
        });
        setIsDeleteAllDialogOpen(false);
        setDeleteConfirmText("");
        return;
      }

      const visitorIds = allVisitors.map(v => v.id);

      // Deletar registros relacionados primeiro
      await supabase.from("visitor_interactions").delete().in("visitor_id", visitorIds);
      await supabase.from("visitor_attendance").delete().in("visitor_id", visitorIds);
      await supabase.from("visitor_history").delete().in("visitor_id", visitorIds);
      await supabase.from("attendance_records").delete().in("visitor_id", visitorIds);

      // Deletar visitantes
      const { error } = await supabase.from("visitors").delete().in("id", visitorIds);

      if (error) throw error;

      toast({
        title: "Visitantes excluídos com sucesso!",
        description: `${allVisitors.length} visitante(s) foram excluídos.`,
      });

      setIsDeleteAllDialogOpen(false);
      setDeleteConfirmText("");
      setVisitors([]);
      setFilteredVisitors([]);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir visitantes",
        description: error.message,
        variant: "destructive",
      });
    }
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
      full_name: formData.full_name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      invited_by: formData.invited_by.trim() || null,
      status: formData.status as any,
      church_id: churchId,
      assistance_group_id: formData.assistance_group_id && formData.assistance_group_id !== "none" ? formData.assistance_group_id : null,
      data_nascimento: dataNascimento ? format(dataNascimento, "yyyy-MM-dd") : null,
      primeira_visita: primeiraVisita ? format(primeiraVisita, "yyyy-MM-dd") : null,
      categoria: (formData.categoria as any) || null,
      sexo: (formData.sexo as any) || null,
      profissao: formData.profissao.trim() || null,
      responsavel_assistencia: formData.responsavel_assistencia.trim() || null,
      participacao_seminario: formData.participacao_seminario.trim() || null,
      candidato_batismo: formData.candidato_batismo,
      data_batismo: dataBatismo ? format(dataBatismo, "yyyy-MM-dd") : null,
      resgate: formData.resgate,
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
        categoria: "",
        sexo: "",
        profissao: "",
        responsavel_assistencia: "",
        participacao_seminario: "",
        candidato_batismo: false,
        resgate: false,
      });
      setDataNascimento(undefined);
      setPrimeiraVisita(undefined);
      setDataBatismo(undefined);
      
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
        setVisitors((data as any[]) || []);
      } else {
        const filtered = (data as any[])?.filter(v => v.church_id === churchId) || [];
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) =>
                      setFormData({ ...formData, categoria: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione categoria" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="crianca">Criança</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="adolescente">Adolescente</SelectItem>
                      <SelectItem value="jovem">Jovem</SelectItem>
                      <SelectItem value="senhora">Senhora</SelectItem>
                      <SelectItem value="varao">Varão</SelectItem>
                      <SelectItem value="idoso">Idoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sexo">Sexo</Label>
                  <Select
                    value={formData.sexo}
                    onValueChange={(value) =>
                      setFormData({ ...formData, sexo: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sexo" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissao">Profissão</Label>
                <Input
                  id="profissao"
                  value={formData.profissao}
                  onChange={(e) =>
                    setFormData({ ...formData, profissao: e.target.value })
                  }
                  placeholder="Ex: Engenheiro, Professor, etc."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsavel_assistencia">Responsável pela Assistência</Label>
                <Input
                  id="responsavel_assistencia"
                  value={formData.responsavel_assistencia}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel_assistencia: e.target.value })
                  }
                  placeholder="Nome do responsável"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="participacao_seminario">Participação em Seminário</Label>
                <Textarea
                  id="participacao_seminario"
                  value={formData.participacao_seminario}
                  onChange={(e) =>
                    setFormData({ ...formData, participacao_seminario: e.target.value })
                  }
                  placeholder="Descreva os seminários e eventos que participou"
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="candidato_batismo"
                    checked={formData.candidato_batismo}
                    onChange={(e) =>
                      setFormData({ ...formData, candidato_batismo: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border"
                  />
                  <Label htmlFor="candidato_batismo" className="font-semibold cursor-pointer">
                    Candidato a Batismo?
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="resgate"
                    checked={formData.resgate}
                    onChange={(e) =>
                      setFormData({ ...formData, resgate: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-border"
                  />
                  <Label htmlFor="resgate" className="font-semibold cursor-pointer">
                    Resgate
                  </Label>
                </div>
                {formData.status === "batizado" && (
                  <div className="space-y-2">
                    <Label>Data do Batismo</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !dataBatismo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {dataBatismo ? (
                            format(dataBatismo, "dd/MM/yyyy", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dataBatismo}
                          onSelect={setDataBatismo}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
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
          <div className="flex gap-2">
            {isAdmin && visitors.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => setIsDeleteAllDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Todos
              </Button>
            )}
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ ATENÇÃO: Exclusão em Massa</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-destructive font-semibold">
                Esta ação irá excluir TODOS os visitantes cadastrados no sistema.
              </p>
              <p>Esta ação não pode ser desfeita e todos os dados relacionados também serão removidos:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Interações com visitantes</li>
                <li>Presenças em eventos</li>
                <li>Histórico de alterações</li>
                <li>Registros de frequência</li>
              </ul>
              <div className="space-y-2 pt-4">
                <Label htmlFor="confirm-delete">Digite "EXCLUIR TUDO" para confirmar:</Label>
                <Input
                  id="confirm-delete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="EXCLUIR TUDO"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllVisitors}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          <div className="overflow-x-auto max-h-[calc(100vh-350px)]">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[80px]">Idade</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[100px]">Sexo</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[120px]">Categoria</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[120px]">Igreja</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[130px]">Grupo</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[160px]">Última Interação</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="hidden sm:table-cell min-w-[90px]">Resgate</TableHead>
                  <TableHead className="text-center min-w-[180px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisitors
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((visitor) => {
                  const idade = calcularIdade(visitor.data_nascimento);

                  return (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">{visitor.full_name}</TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {idade !== null ? `${idade} anos` : "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        {visitor.sexo ? sexoLabels[visitor.sexo] : "-"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {visitor.categoria ? (
                          <Badge variant="outline" className="text-xs">
                            {categoriaLabels[visitor.categoria]}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {visitor.church_name || "-"}
                      </TableCell>
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
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${statusColors[visitor.status]} text-xs`}
                        >
                          {statusLabels[visitor.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {visitor.resgate ? (
                          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Não</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(visitor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVisitor(visitor);
                              setIsInteractionsDialogOpen(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedVisitor(visitor);
                              setIsTransferDialogOpen(true);
                            }}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
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
          {filteredVisitors
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((visitor) => (
            <Card key={visitor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{visitor.full_name}</CardTitle>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${statusColors[visitor.status]} text-xs`}
                        >
                          {statusLabels[visitor.status]}
                        </Badge>
                        {visitor.categoria && (
                          <Badge variant="secondary" className="text-xs">
                            {categoriaLabels[visitor.categoria]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {visitor.data_nascimento && (
                  <div className="flex items-center gap-2 text-sm">
                    <Cake className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {format(new Date(visitor.data_nascimento), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {calcularIdade(visitor.data_nascimento) && (
                      <Badge variant="outline" className="text-xs">
                        {calcularIdade(visitor.data_nascimento)} anos
                      </Badge>
                    )}
                  </div>
                )}
                {visitor.sexo && (
                  <div className="flex items-center gap-2 text-sm">
                    <User2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{sexoLabels[visitor.sexo]}</span>
                  </div>
                )}
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
                {visitor.responsavel_assistencia && (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Responsável:</span>{" "}
                    <span className="text-muted-foreground">{visitor.responsavel_assistencia}</span>
                  </div>
                )}
                {visitor.invited_by && (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Convidado por:</span>{" "}
                    <span className="text-muted-foreground">{visitor.invited_by}</span>
                  </div>
                )}
                {visitor.participacao_seminario && (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Seminários:</span>{" "}
                    <span className="text-muted-foreground">{visitor.participacao_seminario}</span>
                  </div>
                )}
                {visitor.candidato_batismo && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium text-foreground">Candidato a Batismo</span>
                  </div>
                )}
                {visitor.data_batismo && (
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Data do Batismo:</span>{" "}
                    <span className="text-muted-foreground">
                      {format(new Date(visitor.data_batismo), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedVisitor(visitor);
                      setIsTransferDialogOpen(true);
                    }}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transferir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {filteredVisitors.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {Math.ceil(filteredVisitors.length / itemsPerPage)}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredVisitors.length / itemsPerPage), prev + 1))}
            disabled={currentPage === Math.ceil(filteredVisitors.length / itemsPerPage)}
          >
            Próxima
          </Button>
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

            {/* Categoria e Sexo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_categoria">Categoria</Label>
                <Select
                  value={editFormData.categoria}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, categoria: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="crianca">Criança</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="adolescente">Adolescente</SelectItem>
                    <SelectItem value="jovem">Jovem</SelectItem>
                    <SelectItem value="senhora">Senhora</SelectItem>
                    <SelectItem value="varao">Varão</SelectItem>
                    <SelectItem value="idoso">Idoso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_sexo">Sexo</Label>
                <Select
                  value={editFormData.sexo}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, sexo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione sexo" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Profissão */}
            <div className="space-y-2">
              <Label htmlFor="edit_profissao">Profissão</Label>
              <Input
                id="edit_profissao"
                value={editFormData.profissao}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, profissao: e.target.value })
                }
                placeholder="Ex: Engenheiro, Professor, etc."
              />
            </div>

            {/* Responsável pela Assistência */}
            <div className="space-y-2">
              <Label htmlFor="edit_responsavel_assistencia">Responsável pela Assistência</Label>
              <Input
                id="edit_responsavel_assistencia"
                value={editFormData.responsavel_assistencia}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, responsavel_assistencia: e.target.value })
                }
                placeholder="Nome do responsável"
              />
            </div>

            {/* Participação em Seminário */}
            <div className="space-y-2">
              <Label htmlFor="edit_participacao_seminario">Participação em Seminário</Label>
              <Textarea
                id="edit_participacao_seminario"
                value={editFormData.participacao_seminario}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, participacao_seminario: e.target.value })
                }
                placeholder="Descreva os seminários e eventos que participou"
                className="min-h-[80px]"
              />
            </div>

            {/* Candidato a Batismo */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/30">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_candidato_batismo"
                  checked={editFormData.candidato_batismo}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, candidato_batismo: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="edit_candidato_batismo" className="font-semibold cursor-pointer">
                  Candidato a Batismo?
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit_resgate"
                  checked={editFormData.resgate}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, resgate: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                />
                <Label htmlFor="edit_resgate" className="font-semibold cursor-pointer">
                  Resgate
                </Label>
              </div>
              {editFormData.status === "batizado" && (
                <div className="space-y-2">
                  <Label>Data do Batismo</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !editDataBatismo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {editDataBatismo ? (
                          format(editDataBatismo, "dd/MM/yyyy", { locale: ptBR })
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={editDataBatismo}
                        onSelect={setEditDataBatismo}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
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
      {selectedVisitor && (
        <VisitorInteractionsDialog
          open={isInteractionsDialogOpen}
          onOpenChange={setIsInteractionsDialogOpen}
          visitorId={selectedVisitor.id}
          visitorName={selectedVisitor.full_name}
        />
      )}

      {/* Dialog de Transferência */}
      {selectedVisitor && (
        <VisitorTransferDialog
          open={isTransferDialogOpen}
          onOpenChange={setIsTransferDialogOpen}
          visitorId={selectedVisitor.id}
          visitorName={selectedVisitor.full_name}
          currentChurchId={selectedVisitor.church_id}
          currentChurchName={selectedVisitor.church_name}
          onTransferComplete={() => {
            const reloadData = async () => {
              if (isAdmin) {
                const { data } = await supabase.from("visitors").select("*").order("created_at", { ascending: false });
                setVisitors((data as any[]) || []);
              } else if (churchId) {
                const { data } = await supabase.from("visitors").select("*").eq("church_id", churchId).order("created_at", { ascending: false });
                setVisitors((data as any[]) || []);
              }
            };
            reloadData();
          }}
        />
      )}
    </div>
  );
}
