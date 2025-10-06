import { useEffect, useState } from "react";
import { Map, Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Area {
  id: string;
  name: string;
  region_id: string;
  pastor_id: string | null;
  created_at: string;
}

interface Region {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

export default function Areas() {
  const { isAdmin, isPastor } = useUserRole();
  const [areas, setAreas] = useState<Area[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [pastors, setPastors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    region_id: "",
    pastor_id: "none",
  });

  useEffect(() => {
    fetchAreas();
    fetchRegions();
    fetchPastors();
  }, []);

  const fetchAreas = async () => {
    const { data, error } = await supabase
      .from("areas")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Erro ao carregar áreas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAreas(data || []);
    }
    setLoading(false);
  };

  const fetchRegions = async () => {
    const { data, error } = await supabase
      .from("regions")
      .select("*")
      .order("name");

    if (error) {
      console.error("Erro ao carregar regiões:", error);
    } else {
      setRegions(data || []);
    }
  };

  const fetchPastors = async () => {
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles!user_roles_user_id_fkey(full_name, email)
      `)
      .eq("role", "pastor");

    if (error) {
      console.error("Erro ao carregar pastores:", error);
      return;
    }

    const pastorsList = data?.map(r => ({
      id: r.user_id,
      full_name: (r.profiles as any)?.full_name || "Sem nome",
      email: (r.profiles as any)?.email || "Sem email"
    })) || [];
    
    setPastors(pastorsList);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      region_id: formData.region_id,
      pastor_id: formData.pastor_id && formData.pastor_id !== "none" ? formData.pastor_id : null,
    };

    if (editingArea) {
      const { error } = await supabase
        .from("areas")
        .update(payload)
        .eq("id", editingArea.id);

      if (error) {
        toast({
          title: "Erro ao atualizar área",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Área atualizada!",
          description: "A área foi atualizada com sucesso.",
        });
        resetForm();
        fetchAreas();
      }
    } else {
      const { error } = await supabase.from("areas").insert([payload]);

      if (error) {
        toast({
          title: "Erro ao criar área",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Área criada!",
          description: "A área foi criada com sucesso.",
        });
        resetForm();
        fetchAreas();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta área?")) return;

    const { error } = await supabase.from("areas").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir área",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Área excluída!",
        description: "A área foi excluída com sucesso.",
      });
      fetchAreas();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      region_id: "",
      pastor_id: "none",
    });
    setEditingArea(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (area: Area) => {
    setEditingArea(area);
    setFormData({
      name: area.name,
      region_id: area.region_id,
      pastor_id: area.pastor_id || "none",
    });
    setIsDialogOpen(true);
  };

  const filteredAreas = areas.filter((area) =>
    area.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Áreas</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gerencie as áreas do sistema</p>
        </div>
        {(isAdmin || isPastor) && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="w-4 h-4" />
                Nova Área
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingArea ? "Editar Área" : "Nova Área"}</DialogTitle>
                <DialogDescription>
                  Preencha as informações da área
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region_id">Região *</Label>
                  <Select
                    value={formData.region_id}
                    onValueChange={(value) => setFormData({ ...formData, region_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma região" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      {regions.map((region) => (
                        <SelectItem key={region.id} value={region.id}>
                          {region.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pastor_id">Pastor Responsável</Label>
                  <Select
                    value={formData.pastor_id}
                    onValueChange={(value) => setFormData({ ...formData, pastor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um pastor" />
                    </SelectTrigger>
                    <SelectContent className="bg-card">
                      <SelectItem value="none">Nenhum</SelectItem>
                      {pastors.map((pastor) => (
                        <SelectItem key={pastor.id} value={pastor.id}>
                          {pastor.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-primary-glow">
                  {editingArea ? "Atualizar" : "Criar"} Área
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mb-6">
        <Input
          placeholder="Buscar área..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      {filteredAreas.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Map className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma área encontrada</h3>
            <p className="text-muted-foreground">
              {areas.length === 0 ? "Comece criando sua primeira área" : "Nenhuma área corresponde à busca"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAreas.map((area) => (
            <Card key={area.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{area.name}</CardTitle>
                    <CardDescription>
                      Região: {regions.find(r => r.id === area.region_id)?.name || "N/A"}
                      <br />
                      Pastor: {pastors.find(p => p.id === area.pastor_id)?.full_name || "Não definido"}
                    </CardDescription>
                  </div>
                  {(isAdmin || isPastor) && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(area)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(area.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}