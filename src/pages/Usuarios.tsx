import { UserCog, Plus, Search, Shield } from "lucide-react";
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

type Profile = Tables<"profiles"> & {
  churches: { name: string } | null;
  user_roles: { role: string }[];
};

type Church = Tables<"churches">;

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedChurchId, setSelectedChurchId] = useState("");
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
      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUserId,
        role: selectedRole as any,
        church_id: selectedChurchId || null,
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
    setSelectedUserId(userId);
    setIsDialogOpen(true);
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
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
        </div>
      </div>

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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAssignDialog(profile.id)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Atribuir Função
                    </Button>
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
            <div>
              <Label htmlFor="church">Igreja (opcional)</Label>
              <Select value={selectedChurchId} onValueChange={setSelectedChurchId}>
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
