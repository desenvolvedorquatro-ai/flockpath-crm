import { UserCog, Plus, Search, Shield, Edit, Trash2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
};

type Church = Tables<"churches">;
type Region = Tables<"regions">;
type Area = Tables<"areas">;

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  pastor: "Pastor",
  pastor_geral: "Pastor Geral",
  pastor_regiao: "Pastor de Região",
  pastor_coordenador: "Pastor Coordenador",
  group_leader: "Líder de Grupo",
  user: "Usuário",
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500",
  pastor: "bg-purple-500",
  pastor_geral: "bg-blue-500",
  pastor_regiao: "bg-indigo-500",
  pastor_coordenador: "bg-cyan-500",
  group_leader: "bg-green-500",
  user: "bg-gray-500",
};

export default function Usuarios() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
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
    church_id: "",
    region_id: "",
    area_id: "",
  });
  const [multiChurchAccess, setMultiChurchAccess] = useState(false);
  const [selectedChurches, setSelectedChurches] = useState<string[]>([]);
  const [editUserData, setEditUserData] = useState({
    full_name: "",
    phone: "",
    cpf: "",
    church_id: "",
    region_id: "",
    area_id: "",
  });
  const [editMultiChurchAccess, setEditMultiChurchAccess] = useState(false);
  const [editSelectedChurches, setEditSelectedChurches] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchProfiles();
      fetchChurches();
    }
  }, [roleLoading, isAdmin]);

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

  const fetchProfiles = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*, churches(name)")
        .order("full_name");

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const profilesWithRoles = (profilesData || []).map((profile) => ({
        ...profile,
        user_roles: (rolesData || [])
          .filter((role) => role.user_id === profile.id)
          .map((role) => ({ role: role.role })),
      }));

      setProfiles(profilesWithRoles);
    } catch (error: any) {
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
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Atualizar perfil
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: newUserData.full_name,
            phone: newUserData.phone,
            cpf: newUserData.cpf,
            church_id: newUserData.church_id,
            region_id: newUserData.region_id || null,
            area_id: newUserData.area_id || null,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Se multi-igreja habilitado, adicionar igrejas adicionais
        if (multiChurchAccess && selectedChurches.length > 0) {
          const churchesToInsert = selectedChurches.map(churchId => ({
            user_id: authData.user.id,
            church_id: churchId,
          }));

          const { error: churchesError } = await supabase
            .from("user_churches")
            .insert(churchesToInsert);

          if (churchesError) throw churchesError;
        }
      }

      toast({ title: "Usuário criado com sucesso!" });
      setIsCreateDialogOpen(false);
      setNewUserData({ email: "", password: "", confirmPassword: "", full_name: "", phone: "", cpf: "", church_id: "", region_id: "", area_id: "" });
      setMultiChurchAccess(false);
      setSelectedChurches([]);
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

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editUserData.full_name,
          phone: editUserData.phone,
          cpf: editUserData.cpf,
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

      toast({ title: "Dados atualizados com sucesso!" });
      setIsEditDialogOpen(false);
      fetchProfiles();
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
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUserId,
        { password: newPassword }
      );

      if (error) throw error;

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

  const filteredProfiles = profiles.filter((profile) =>
    profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
    profile.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (roleLoading || loading) {
    return <div className="min-h-screen bg-background p-8 flex items-center justify-center">
      <div className="text-muted-foreground">Carregando...</div>
    </div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="glass-card rounded-2xl p-8 text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <ModernHeader
        title="Usuários"
        description="Gerencie usuários e permissões do sistema"
        icon={UserCog}
        onAction={() => setIsCreateDialogOpen(true)}
        actionText="Novo Usuário"
        colorScheme="cyan-blue"
      />

      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nome</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Igreja</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Região</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Área</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Funções</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProfiles.map((profile) => (
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
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {profile.user_roles && profile.user_roles.length > 0 ? (
                        profile.user_roles.map((ur, idx) => (
                          <Badge
                            key={idx}
                            className={`${roleColors[ur.role]} text-white`}
                          >
                            {roleLabels[ur.role]}
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

            <div>
              <Label htmlFor="church_id">Igreja Principal *</Label>
              <Select
                value={newUserData.church_id}
                onValueChange={(value) => setNewUserData({ ...newUserData, church_id: value })}
                required
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region_id">Região</Label>
                <Select
                  value={newUserData.region_id}
                  onValueChange={(value) => {
                    setNewUserData({ ...newUserData, region_id: value, area_id: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
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
                  value={newUserData.area_id}
                  onValueChange={(value) => setNewUserData({ ...newUserData, area_id: value })}
                  disabled={!newUserData.region_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {filteredAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_phone">Telefone</Label>
                <Input
                  id="edit_phone"
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_church_id">Igreja Principal *</Label>
                <Select
                  value={editUserData.church_id}
                  onValueChange={(value) => setEditUserData({ ...editUserData, church_id: value })}
                  required
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit_region_id">Região</Label>
                <Select
                  value={editUserData.region_id}
                  onValueChange={(value) => {
                    setEditUserData({ ...editUserData, region_id: value, area_id: "" });
                    if (value) {
                      setFilteredAreas(areas.filter(area => area.region_id === value));
                    } else {
                      setFilteredAreas([]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma região" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
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
                  value={editUserData.area_id}
                  onValueChange={(value) => setEditUserData({ ...editUserData, area_id: value })}
                  disabled={!editUserData.region_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhuma</SelectItem>
                    {filteredAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                  <SelectItem value="pastor_geral">Pastor Geral</SelectItem>
                  <SelectItem value="pastor_regiao">Pastor de Região</SelectItem>
                  <SelectItem value="pastor_coordenador">Pastor Coordenador</SelectItem>
                  <SelectItem value="group_leader">Líder de Grupo</SelectItem>
                  <SelectItem value="user">Usuário</SelectItem>
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
