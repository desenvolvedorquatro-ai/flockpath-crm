import { UserCog, Plus, Search, Shield, Edit, Trash2, Lock, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ViewToggle } from "@/components/ViewToggle";
import { PaginationControls } from "@/components/PaginationControls";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { Tables } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { ModernHeader } from "@/components/ModernHeader";

type Profile = Tables<"profiles"> & {
  churches?: { name: string } | null;
  regions?: { name: string } | null;
  areas?: { name: string } | null;
  user_roles?: { role: string }[];
  last_sign_in_at?: string | null;
  user_group?: { group_id: string; assistance_groups?: { name: string } } | null;
};

type Church = Tables<"churches">;
type Region = Tables<"regions">;
type Area = Tables<"areas">;

interface AssistanceGroup {
  id: string;
  name: string;
  church_id: string;
}

interface RoleDefinition {
  id: string;
  role_name: string;
  display_name: string;
  description: string;
  color: string;
}

export default function Usuarios() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleDefinition[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);
  const [availableGroups, setAvailableGroups] = useState<AssistanceGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedChurchId, setSelectedChurchId] = useState("");
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    full_name: "",
    phone: "",
    cpf: "",
    city: "",
    state: "",
    church_id: "",
    region_id: "",
    area_id: "",
  });
  const [multiChurchAccess, setMultiChurchAccess] = useState(false);
  const [selectedChurches, setSelectedChurches] = useState<string[]>([]);
  const [newUserFilteredAreas, setNewUserFilteredAreas] = useState<Area[]>([]);
  const [newUserFilteredChurches, setNewUserFilteredChurches] = useState<Church[]>([]);
  const [editUserData, setEditUserData] = useState({
    full_name: "",
    phone: "",
    cpf: "",
    city: "",
    state: "",
    church_id: "",
    region_id: "",
    area_id: "",
  });
  const [editMultiChurchAccess, setEditMultiChurchAccess] = useState(false);
  const [editSelectedChurches, setEditSelectedChurches] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [view, setView] = useState<"card" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchProfiles();
      fetchChurches();
      fetchRegions();
      fetchAreas();
      fetchRoles();
    }
  }, [roleLoading, isAdmin]);

  // Carregar grupos quando igreja é selecionada no formulário de criação
  useEffect(() => {
    if (newUserData.church_id) {
      fetchGroupsForChurch(newUserData.church_id);
    } else {
      setAvailableGroups([]);
      setSelectedGroupId("");
    }
  }, [newUserData.church_id]);

  const fetchGroupsForChurch = async (churchId: string) => {
    try {
      const { data, error } = await supabase
        .from('assistance_groups')
        .select('id, name, church_id')
        .eq('church_id', churchId)
        .order('name');
      
      if (error) throw error;
      setAvailableGroups(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar grupos:", error);
      toast({
        title: "Erro ao carregar grupos",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchChurches = async () => {
    try {
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .order("name");

      if (error) throw error;
      setChurches(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar igrejas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("name");

      if (error) throw error;
      setRegions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar regiões",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAreas = async () => {
    try {
      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .order("name");

      if (error) throw error;
      setAreas(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar áreas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("role_definitions")
        .select("*")
        .order("display_name");

      if (error) {
        console.error("Erro ao buscar funções:", error);
        throw error;
      }
      
      console.log("Funções carregadas:", data);
      setAvailableRoles(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar funções:", error);
      toast({
        title: "Erro ao carregar funções",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleLabel = (roleName: string) => {
    const role = availableRoles.find(r => r.role_name === roleName);
    return role?.display_name || roleName;
  };

  const getRoleColor = (roleName: string) => {
    const role = availableRoles.find(r => r.role_name === roleName);
    return role?.color || "#6B7280";
  };

  const fetchProfiles = async () => {
    try {
      console.log("🔍 Iniciando fetchProfiles...");
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select(`
          *, 
          churches(name), 
          regions(name), 
          areas(name),
          user_group:user_group_access(group_id, assistance_groups(name))
        `)
        .order("full_name");

      console.log("📊 Profiles retornados:", profilesData?.length, "perfis");
      console.log("📋 Dados completos:", profilesData);
      
      if (profilesError) {
        console.error("❌ Erro ao buscar profiles:", profilesError);
        throw profilesError;
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Buscar último acesso para cada usuário
      const profilesWithRoles = await Promise.all((profilesData || []).map(async (profile) => {
        const { data: lastSignIn } = await supabase.rpc('get_user_last_sign_in', { user_id: profile.id });
        
        // Processar user_group que pode vir como array
        const userGroupData = Array.isArray(profile.user_group) 
          ? profile.user_group[0] 
          : profile.user_group;
        
        return {
          ...profile,
          user_roles: (rolesData || [])
            .filter((role) => role.user_id === profile.id)
            .map((role) => ({ role: role.role })),
          last_sign_in_at: lastSignIn,
          user_group: userGroupData || null,
        };
      }));

      console.log("✅ Profiles com roles processados:", profilesWithRoles?.length, "perfis");
      console.log("👥 Lista final:", profilesWithRoles);
      setProfiles(profilesWithRoles);
    } catch (error: any) {
      console.error("❌ Erro total ao carregar usuários:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedRole) return;

    try {
      // Deletar função antiga do usuário
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", selectedUserId);

      // Inserir nova função
      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUserId,
        role: selectedRole as any,
      });

      if (error) throw error;
      
      toast({ title: "Função atribuída com sucesso!" });
      setIsDialogOpen(false);
      resetForm();
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Erro ao atribuir função",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setSelectedUserId(null);
    setSelectedRole("");
    setSelectedChurchId("");
  };

  const openAssignDialog = (userId: string) => {
    const user = profiles.find(p => p.id === userId);
    setSelectedUserId(userId);
    
    // Pré-selecionar a função atual do usuário
    if (user?.user_roles && user.user_roles.length > 0) {
      setSelectedRole(user.user_roles[0].role);
    } else {
      setSelectedRole("");
    }
    
    setIsDialogOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (newUserData.password !== newUserData.confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (newUserData.password.length < 8) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 8 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!newUserData.church_id) {
      toast({
        title: "Erro",
        description: "Selecione uma igreja principal",
        variant: "destructive",
      });
      return;
    }

    try {
      // Criar usuário usando edge function (não faz logout do admin)
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserData.email.trim(),
          password: newUserData.password,
          full_name: newUserData.full_name.trim(),
          phone: newUserData.phone.trim() || null,
          cpf: newUserData.cpf.trim() || null,
          city: newUserData.city.trim() || null,
          state: newUserData.state || null,
          church_id: newUserData.church_id,
          region_id: newUserData.region_id || null,
          area_id: newUserData.area_id || null,
          additional_churches: multiChurchAccess ? selectedChurches : [],
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido ao criar usuário');

      // Salvar grupo se selecionado
      if (selectedGroupId && selectedGroupId !== 'none' && data.user_id) {
        const { data: { session } } = await supabase.auth.getSession();
        const { error: groupError } = await supabase
          .from('user_group_access')
          .insert({
            user_id: data.user_id,
            group_id: selectedGroupId,
            created_by: session?.user?.id
          });

        if (groupError) {
          console.error("Erro ao atribuir grupo:", groupError);
          toast({
            title: "Aviso",
            description: "Usuário criado, mas houve erro ao atribuir o grupo",
            variant: "destructive",
          });
        }
      }

      toast({ title: "Usuário criado com sucesso!" });
      setIsCreateDialogOpen(false);
      setNewUserData({ email: "", password: "", confirmPassword: "", full_name: "", phone: "", cpf: "", city: "", state: "", church_id: "", region_id: "", area_id: "" });
      setMultiChurchAccess(false);
      setSelectedChurches([]);
      setSelectedGroupId("");
      setAvailableGroups([]);
      setNewUserFilteredAreas([]);
      setNewUserFilteredChurches([]);
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (userId: string) => {
    const user = profiles.find(p => p.id === userId);
    if (user) {
      setSelectedUserId(userId);
      setEditUserData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        cpf: user.cpf || "",
        city: user.city || "",
        state: user.state || "",
        church_id: user.church_id || "",
        region_id: user.region_id || "",
        area_id: user.area_id || "",
      });

      // Filter areas based on selected region
      if (user.region_id) {
        setFilteredAreas(areas.filter(area => area.region_id === user.region_id));
      } else {
        setFilteredAreas([]);
      }

      // Filter churches based on selected area
      if (user.area_id) {
        setFilteredChurches(churches.filter(church => church.area_id === user.area_id));
      } else {
        setFilteredChurches([]);
      }

      // Carregar grupos da igreja do usuário
      if (user.church_id) {
        await fetchGroupsForChurch(user.church_id);
      }

      // Buscar grupo atual do usuário
      const { data: userGroup } = await supabase
        .from("user_group_access")
        .select("group_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (userGroup?.group_id) {
        setSelectedGroupId(userGroup.group_id);
      } else {
        setSelectedGroupId("");
      }

      // Buscar igrejas adicionais do usuário
      const { data: userChurches } = await supabase
        .from("user_churches")
        .select("church_id")
        .eq("user_id", userId);

      if (userChurches && userChurches.length > 0) {
        setEditMultiChurchAccess(true);
        setEditSelectedChurches(userChurches.map(uc => uc.church_id));
      } else {
        setEditMultiChurchAccess(false);
        setEditSelectedChurches([]);
      }

      setIsEditDialogOpen(true);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    // Validar se igreja foi selecionada
    if (!editUserData.church_id) {
      toast({
        title: "Erro",
        description: "Selecione uma igreja principal",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editUserData.full_name.trim(),
          phone: editUserData.phone.trim() || null,
          cpf: editUserData.cpf.trim() || null,
          city: editUserData.city.trim() || null,
          state: editUserData.state || null,
          church_id: editUserData.church_id,
          region_id: editUserData.region_id || null,
          area_id: editUserData.area_id || null,
        })
        .eq("id", selectedUserId);

      if (error) throw error;

      // Deletar igrejas adicionais antigas
      await supabase
        .from("user_churches")
        .delete()
        .eq("user_id", selectedUserId);

      // Inserir novas igrejas adicionais se habilitado
      if (editMultiChurchAccess && editSelectedChurches.length > 0) {
        const churchesToInsert = editSelectedChurches.map(churchId => ({
          user_id: selectedUserId,
          church_id: churchId,
        }));

        const { error: churchesError } = await supabase
          .from("user_churches")
          .insert(churchesToInsert);

        if (churchesError) throw churchesError;
      }

      // Atualizar grupo do usuário
      // Primeiro deletar grupo antigo
      await supabase
        .from("user_group_access")
        .delete()
        .eq("user_id", selectedUserId);

      // Inserir novo grupo se selecionado
      if (selectedGroupId && selectedGroupId !== 'none') {
        const { data: { session } } = await supabase.auth.getSession();
        const { error: groupError } = await supabase
          .from("user_group_access")
          .insert({
            user_id: selectedUserId,
            group_id: selectedGroupId,
            created_by: session?.user?.id
          });

        if (groupError) {
          console.error("Erro ao atualizar grupo:", groupError);
          toast({
            title: "Aviso",
            description: "Dados atualizados, mas houve erro ao atualizar o grupo",
            variant: "destructive",
          });
        }
      }

      toast({ title: "Dados atualizados com sucesso!" });
      
      // AGUARDAR fetchProfiles completar antes de fechar
      await fetchProfiles();
      
      setIsEditDialogOpen(false);
      setSelectedUserId(null);
      setEditUserData({ full_name: "", phone: "", cpf: "", city: "", state: "", church_id: "", region_id: "", area_id: "" });
      setEditMultiChurchAccess(false);
      setEditSelectedChurches([]);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openPasswordDialog = (userId: string) => {
    setSelectedUserId(userId);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newPassword) return;

    if (newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Sessão não encontrada");
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/update-user-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: selectedUserId,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao atualizar senha');
      }

      toast({ title: "Senha alterada com sucesso!" });
      setIsPasswordDialogOpen(false);
      setNewPassword("");
    } catch (error: any) {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);

      if (error) throw error;

      toast({ title: "Usuário excluído com sucesso!" });
      fetchProfiles();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
    profile.email?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  if (roleLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Carregando...</div>
    </div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="glass-card rounded-2xl p-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Usuários"
        description="Gerencie usuários e permissões do sistema"
        icon={UserCog}
        onAction={() => setIsCreateDialogOpen(true)}
        actionText="Novo Usuário"
        colorScheme="red-coral"
      />

      <div className="glass-card rounded-2xl p-6 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === "list" ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-350px)]">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nome</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Igreja</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Região</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Área</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Último Acesso</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Funções</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProfiles
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((profile) => (
                  <tr key={profile.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground">{profile.full_name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{profile.email}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {profile.churches?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {profile.regions?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {profile.areas?.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {profile.last_sign_in_at ? (
                        format(new Date(profile.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      ) : (
                        <span className="text-muted-foreground/50">Nunca acessou</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {profile.user_roles && profile.user_roles.length > 0 ? (
                          profile.user_roles.map((ur, idx) => (
                            <Badge
                              key={idx}
                              style={{ backgroundColor: getRoleColor(ur.role) }}
                              className="text-white border-0"
                            >
                              {getRoleLabel(ur.role)}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem funções</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(profile.id)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openPasswordDialog(profile.id)}
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Senha
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAssignDialog(profile.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Função
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(profile.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((profile) => (
            <Card key={profile.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                      <UserCog className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                      <CardDescription className="text-sm">{profile.email}</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Igreja:</span>{" "}
                    <span className="text-muted-foreground">{profile.churches?.name || "-"}</span>
                  </div>
                  {profile.regions && (
                    <div>
                      <span className="font-medium text-foreground">Região:</span>{" "}
                      <span className="text-muted-foreground">{profile.regions.name}</span>
                    </div>
                  )}
                  {profile.areas && (
                    <div>
                      <span className="font-medium text-foreground">Área:</span>{" "}
                      <span className="text-muted-foreground">{profile.areas.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {profile.last_sign_in_at ? (
                        <>Último acesso: {format(new Date(profile.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</>
                      ) : (
                        "Nunca acessou"
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-sm text-foreground mb-2 block">Funções:</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.user_roles && profile.user_roles.length > 0 ? (
                      profile.user_roles.map((ur, idx) => (
                        <Badge 
                          key={idx} 
                          style={{ backgroundColor: getRoleColor(ur.role) }}
                          className="text-white border-0"
                        >
                          {getRoleLabel(ur.role)}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem funções</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(profile.id)}
                    className="flex-1"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openPasswordDialog(profile.id)}
                  >
                    <Lock className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignDialog(profile.id)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(profile.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Paginação */}
      {filteredProfiles.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredProfiles.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {filteredProfiles.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center mt-6">
          <UserCog className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
          </p>
        </div>
      )}

      {/* Dialog Criar Usuário */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="full_name">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={newUserData.full_name}
                  onChange={(e) => setNewUserData({ ...newUserData, full_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={newUserData.cpf}
                  onChange={(e) => setNewUserData({ ...newUserData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={newUserData.phone}
                  onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={newUserData.city}
                  onChange={(e) => setNewUserData({ ...newUserData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={newUserData.state}
                  onValueChange={(value) => setNewUserData({ ...newUserData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-[100]">
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AL">AL</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="DF">DF</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                    <SelectItem value="PB">PB</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="PI">PI</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="RN">RN</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="RR">RR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="SE">SE</SelectItem>
                    <SelectItem value="TO">TO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground mt-1">Mínimo 8 caracteres</p>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={newUserData.confirmPassword}
                  onChange={(e) => setNewUserData({ ...newUserData, confirmPassword: e.target.value })}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region_id">Região</Label>
                <Select
                  value={newUserData.region_id || undefined}
                  onValueChange={(value) => {
                    setNewUserData({ ...newUserData, region_id: value, area_id: "", church_id: "" });
                    if (value) {
                      setNewUserFilteredAreas(areas.filter(area => area.region_id === value));
                      setNewUserFilteredChurches([]);
                    } else {
                      setNewUserFilteredAreas([]);
                      setNewUserFilteredChurches([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="area_id">Área</Label>
                <Select
                  value={newUserData.area_id || undefined}
                  onValueChange={(value) => {
                    setNewUserData({ ...newUserData, area_id: value, church_id: "" });
                    if (value) {
                      setNewUserFilteredChurches(churches.filter(church => church.area_id === value));
                    } else {
                      setNewUserFilteredChurches([]);
                    }
                  }}
                  disabled={!newUserData.region_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    {newUserFilteredAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="church_id">Igreja Principal *</Label>
              <Select
                value={newUserData.church_id}
                onValueChange={(value) => setNewUserData({ ...newUserData, church_id: value })}
                required
                disabled={!newUserData.area_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma igreja" />
                </SelectTrigger>
                <SelectContent>
                  {newUserFilteredChurches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="group_id">Grupo de Assistência</Label>
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
                disabled={!newUserData.church_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum grupo</SelectItem>
                  {availableGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                O usuário verá apenas visitantes deste grupo
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="multiChurch"
                checked={multiChurchAccess}
                onChange={(e) => setMultiChurchAccess(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="multiChurch" className="cursor-pointer">
                Acesso a múltiplas igrejas
              </Label>
            </div>

            {multiChurchAccess && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    onValueChange={(value) => {
                      if (value && !selectedChurches.includes(value) && value !== newUserData.church_id) {
                        setSelectedChurches([...selectedChurches, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar mais igrejas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {churches
                        .filter((c) => c.id !== newUserData.church_id && !selectedChurches.includes(c.id))
                        .map((church) => (
                          <SelectItem key={church.id} value={church.id}>
                            {church.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedChurches.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedChurches.map((churchId) => {
                      const church = churches.find((c) => c.id === churchId);
                      return (
                        <Badge key={churchId} variant="secondary" className="gap-1">
                          {church?.name}
                          <button
                            type="button"
                            onClick={() => setSelectedChurches(selectedChurches.filter((id) => id !== churchId))}
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Criar Usuário</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Dados do Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_full_name">Nome Completo *</Label>
                <Input
                  id="edit_full_name"
                  value={editUserData.full_name}
                  onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_cpf">CPF</Label>
                <Input
                  id="edit_cpf"
                  value={editUserData.cpf}
                  onChange={(e) => setEditUserData({ ...editUserData, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="edit_phone">Telefone</Label>
              <Input
                id="edit_phone"
                value={editUserData.phone}
                onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_city">Cidade</Label>
                <Input
                  id="edit_city"
                  value={editUserData.city}
                  onChange={(e) => setEditUserData({ ...editUserData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_state">Estado</Label>
                <Select
                  value={editUserData.state || ""}
                  onValueChange={(value) => setEditUserData({ ...editUserData, state: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-[100]">
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AL">AL</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="DF">DF</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                    <SelectItem value="PB">PB</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="PI">PI</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="RN">RN</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="RR">RR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="SE">SE</SelectItem>
                    <SelectItem value="TO">TO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_region_id">Região</Label>
                <Select
                  value={editUserData.region_id || ""}
                  onValueChange={(value) => {
                    setEditUserData({ ...editUserData, region_id: value, area_id: "", church_id: "" });
                    if (value) {
                      setFilteredAreas(areas.filter(area => area.region_id === value));
                      setFilteredChurches([]);
                    } else {
                      setFilteredAreas([]);
                      setFilteredChurches([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
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

              <div>
                <Label htmlFor="edit_area_id">Área</Label>
                <Select
                  value={editUserData.area_id || ""}
                  onValueChange={(value) => {
                    setEditUserData({ ...editUserData, area_id: value, church_id: "" });
                    if (value) {
                      setFilteredChurches(churches.filter(church => church.area_id === value));
                    } else {
                      setFilteredChurches([]);
                    }
                  }}
                  disabled={!editUserData.region_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
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
            </div>

            <div>
              <Label htmlFor="edit_church_id">Igreja Principal *</Label>
              <Select
                value={editUserData.church_id || ""}
                onValueChange={(value) => setEditUserData({ ...editUserData, church_id: value })}
                disabled={!editUserData.area_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma igreja" />
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

            <div>
              <Label htmlFor="edit_group_id">Grupo de Assistência</Label>
              <Select
                value={selectedGroupId}
                onValueChange={setSelectedGroupId}
                disabled={!editUserData.church_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um grupo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum grupo</SelectItem>
                  {availableGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                O usuário verá apenas visitantes deste grupo
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="editMultiChurch"
                checked={editMultiChurchAccess}
                onChange={(e) => setEditMultiChurchAccess(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="editMultiChurch" className="cursor-pointer">
                Acesso a múltiplas igrejas
              </Label>
            </div>

            {editMultiChurchAccess && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select
                    onValueChange={(value) => {
                      if (value && !editSelectedChurches.includes(value) && value !== editUserData.church_id) {
                        setEditSelectedChurches([...editSelectedChurches, value]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Adicionar mais igrejas..." />
                    </SelectTrigger>
                    <SelectContent>
                      {churches
                        .filter((c) => c.id !== editUserData.church_id && !editSelectedChurches.includes(c.id))
                        .map((church) => (
                          <SelectItem key={church.id} value={church.id}>
                            {church.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {editSelectedChurches.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editSelectedChurches.map((churchId) => {
                      const church = churches.find((c) => c.id === churchId);
                      return (
                        <Badge key={churchId} variant="secondary" className="gap-1">
                          {church?.name}
                          <button
                            type="button"
                            onClick={() =>
                              setEditSelectedChurches(editSelectedChurches.filter((id) => id !== churchId))
                            }
                            className="ml-1 hover:text-destructive"
                          >
                            ×
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar Senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha do Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <Label htmlFor="new_password">Nova Senha *</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Mínimo de 6 caracteres
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Alterar Senha</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Atribuir Função */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atribuir Função</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignRole} className="space-y-4">
            <div>
              <Label htmlFor="role">Função *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma função" />
                </SelectTrigger>
                <SelectContent className="bg-card z-[100]">
                  {availableRoles.length === 0 ? (
                    <SelectItem value="loading" disabled>Carregando funções...</SelectItem>
                  ) : (
                    availableRoles.map((role) => (
                      <SelectItem key={role.id} value={role.role_name}>
                        {role.display_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button type="submit">Atribuir</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
