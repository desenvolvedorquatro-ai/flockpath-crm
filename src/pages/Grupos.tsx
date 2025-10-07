import { UsersRound, Search, Edit, Trash2 } from "lucide-react";
import { ModernHeader } from "@/components/ModernHeader";
import { ViewToggle } from "@/components/ViewToggle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserRole } from "@/hooks/useUserRole";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

type AssistanceGroup = Tables<"assistance_groups"> & {
  churches: { name: string } | null;
  profiles?: { full_name: string } | null;
};

type Church = Tables<"churches">;
type User = { id: string; full_name: string; email: string };

export default function Grupos() {
  const [groups, setGroups] = useState<AssistanceGroup[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AssistanceGroup | null>(null);
  const [view, setView] = useState<"card" | "list">("list");
  const { toast } = useToast();
  const { isAdmin, isPastor, loading: roleLoading } = useUserRole();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    church_id: "",
    responsible_id: "none",
  });

  useEffect(() => {
    fetchGroups();
    fetchChurches();
    fetchUsers();
  }, []);

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

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email");
    setUsers(data?.map(u => ({ 
      id: u.id, 
      full_name: u.full_name || "Sem nome",
      email: u.email || "Sem email"
    })) || []);
  };

  const filteredUsers = users.filter(u =>
    !formData.church_id || churches.find(c => c.id === formData.church_id)
  );

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("assistance_groups")
        .select("*, churches(name)")
        .order("name");

      if (error) throw error;
      
      // Buscar nomes dos responsáveis
      const groupsWithResponsible = await Promise.all(
        (data || []).map(async (group) => {
          if (group.responsible_id) {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", group.responsible_id)
              .single();
            
            return { ...group, profiles: profileData };
          }
          return { ...group, profiles: null };
        })
      );
      
      setGroups(groupsWithResponsible as AssistanceGroup[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar grupos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      responsible_id: formData.responsible_id && formData.responsible_id !== "none" ? formData.responsible_id : null,
    };
    
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from("assistance_groups")
          .update(payload)
          .eq("id", editingGroup.id);

        if (error) throw error;
        toast({ title: "Grupo atualizado com sucesso!" });
      } else {
        const { error } = await supabase
          .from("assistance_groups")
          .insert([payload as TablesInsert<"assistance_groups">]);

        if (error) throw error;
        toast({ title: "Grupo criado com sucesso!" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar grupo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este grupo?")) return;

    try {
      const { error } = await supabase.from("assistance_groups").delete().eq("id", id);
      if (error) throw error;
      
      toast({ title: "Grupo excluído com sucesso!" });
      fetchGroups();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir grupo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      church_id: "",
      responsible_id: "none",
    });
    setEditingGroup(null);
  };

  const openEditDialog = (group: AssistanceGroup) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      description: group.description || "",
      church_id: group.church_id,
      responsible_id: group.responsible_id || "none",
    });
    setIsDialogOpen(true);
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(search.toLowerCase())
  );

  if (roleLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Carregando...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Grupos de Assistência"
        description="Gerencie células e grupos de acompanhamento"
        icon={UsersRound}
        colorScheme="red-coral"
        onAction={(isAdmin || isPastor) ? () => setIsDialogOpen(true) : undefined}
        actionText="Novo Grupo"
      />

      {(isAdmin || isPastor) && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>{editingGroup ? "Editar Grupo" : "Novo Grupo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome do Grupo *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="church_id">Igreja *</Label>
                  <Select
                    value={formData.church_id}
                    onValueChange={(value) => setFormData({ ...formData, church_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma igreja" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {churches.map((church) => (
                        <SelectItem key={church.id} value={church.id}>
                          {church.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="responsible_id">Responsável</Label>
                  <Select
                    value={formData.responsible_id}
                    onValueChange={(value) => setFormData({ ...formData, responsible_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="none">Nenhum</SelectItem>
                      {filteredUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancelar
                  </Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

      <div className="glass-card rounded-2xl p-6 mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Buscar grupos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === "list" ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Igreja</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Descrição</TableHead>
                  {(isAdmin || isPastor) && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>{group.churches?.name || "-"}</TableCell>
                    <TableCell>{group.profiles?.full_name || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">{group.description || "-"}</TableCell>
                    {(isAdmin || isPastor) && (
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(group)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div key={group.id} className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <UsersRound className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{group.name}</h3>
                    {group.churches && (
                      <p className="text-sm text-muted-foreground">{group.churches.name}</p>
                    )}
                  </div>
                </div>
              </div>

              {group.profiles && (
                <div className="mb-3 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Responsável:</span>
                  <span className="font-medium text-foreground">{group.profiles.full_name}</span>
                </div>
              )}

              {group.description && (
                <p className="text-sm text-muted-foreground mb-4">{group.description}</p>
              )}

              {(isAdmin || isPastor) && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(group)} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(group.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredGroups.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <UsersRound className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {search ? "Nenhum grupo encontrado" : "Nenhum grupo cadastrado"}
          </p>
        </div>
      )}
    </div>
  );
}
