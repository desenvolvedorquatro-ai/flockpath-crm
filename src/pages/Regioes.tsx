import { useEffect, useState } from "react";
import { MapPin, Trash2, Edit, Map, Building2, Users } from "lucide-react";
import { ViewToggle } from "@/components/ViewToggle";
import { PaginationControls } from "@/components/PaginationControls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ModernHeader } from "@/components/ModernHeader";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";

interface Region {
  id: string;
  name: string;
  pastor_id: string | null;
  created_at: string;
}

interface RegionStats {
  regionId: string;
  areas: number;
  churches: number;
  visitors: number;
}

interface User {
  id: string;
  full_name: string;
  email: string;
}

export default function Regioes() {
  const { isAdmin, isPastor } = useUserRole();
  const [regions, setRegions] = useState<Region[]>([]);
  const [pastors, setPastors] = useState<User[]>([]);
  const [stats, setStats] = useState<RegionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRegion, setEditingRegion] = useState<Region | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"card" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: "",
    pastor_id: "none",
  });

  useEffect(() => {
    fetchRegions();
    fetchPastors();
    fetchStats();
  }, []);

  const fetchRegions = async () => {
    const { data, error } = await supabase
      .from("regions")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Erro ao carregar regiões",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setRegions(data || []);
    }
    setLoading(false);
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

  const fetchStats = async () => {
    const [areasRes, churchesRes, visitorsRes] = await Promise.all([
      supabase.from("areas").select("id, region_id"),
      supabase.from("churches").select("id, region_id"),
      supabase.from("visitors").select("id, church_id, churches!inner(region_id)"),
    ]);

    const regionStats: RegionStats[] = regions.map(region => {
      const areasCount = areasRes.data?.filter(a => a.region_id === region.id).length || 0;
      const churchesCount = churchesRes.data?.filter(c => c.region_id === region.id).length || 0;
      
      // Filtrar visitantes pela region_id através da church
      const visitorsCount = visitorsRes.data?.filter((v: any) => 
        v.churches?.region_id === region.id
      ).length || 0;
      
      return {
        regionId: region.id,
        areas: areasCount,
        churches: churchesCount,
        visitors: visitorsCount,
      };
    });

    setStats(regionStats);
  };

  useEffect(() => {
    if (regions.length > 0) {
      fetchStats();
    }
  }, [regions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      pastor_id: formData.pastor_id && formData.pastor_id !== "none" ? formData.pastor_id : null,
    };

    if (editingRegion) {
      const { error } = await supabase
        .from("regions")
        .update(payload)
        .eq("id", editingRegion.id);

      if (error) {
        toast({
          title: "Erro ao atualizar região",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Região atualizada!",
          description: "A região foi atualizada com sucesso.",
        });
        resetForm();
        fetchRegions();
      }
    } else {
      const { error } = await supabase.from("regions").insert([payload]);

      if (error) {
        toast({
          title: "Erro ao criar região",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Região criada!",
          description: "A região foi criada com sucesso.",
        });
        resetForm();
        fetchRegions();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta região?")) return;

    const { error } = await supabase.from("regions").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir região",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Região excluída!",
        description: "A região foi excluída com sucesso.",
      });
      fetchRegions();
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      pastor_id: "none",
    });
    setEditingRegion(null);
    setIsDialogOpen(false);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const openEditDialog = (region: Region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      pastor_id: region.pastor_id || "none",
    });
    setIsDialogOpen(true);
  };

  const filteredRegions = regions.filter((region) =>
    region.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingOverlay isVisible={true} message="Carregando regiões..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LoadingOverlay isVisible={loading} message="Carregando regiões..." />
      
      <ModernHeader
        title="Regiões"
        description="Gerencie as regiões do sistema"
        icon={MapPin}
        colorScheme="red-coral"
        onAction={(isAdmin || isPastor) ? () => setIsDialogOpen(true) : undefined}
        actionText="Nova Região"
      />

      {(isAdmin || isPastor) && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingRegion ? "Editar Região" : "Nova Região"}</DialogTitle>
                <DialogDescription>
                  Preencha as informações da região
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
                  {editingRegion ? "Atualizar" : "Criar"} Região
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Input
          placeholder="Buscar região..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {filteredRegions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma região encontrada</h3>
            <p className="text-muted-foreground">
              {regions.length === 0 ? "Comece criando sua primeira região" : "Nenhuma região corresponde à busca"}
            </p>
          </CardContent>
        </Card>
      ) : view === "list" ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Pastor Responsável</TableHead>
                  <TableHead className="text-center">Áreas</TableHead>
                  <TableHead className="text-center">Igrejas</TableHead>
                  <TableHead className="text-center">Visitantes</TableHead>
                  {(isAdmin || isPastor) && <TableHead className="text-center">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegions
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((region) => {
                  const regionStat = stats.find(s => s.regionId === region.id);
                  return (
                    <TableRow key={region.id}>
                      <TableCell className="font-medium">{region.name}</TableCell>
                      <TableCell>{pastors.find(p => p.id === region.pastor_id)?.full_name || "Não definido"}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Map className="w-4 h-4 text-muted-foreground" />
                          <span>{regionStat?.areas || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span>{regionStat?.churches || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span>{regionStat?.visitors || 0}</span>
                        </div>
                      </TableCell>
                      {(isAdmin || isPastor) && (
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(region)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(region.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRegions
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((region) => {
            const regionStat = stats.find(s => s.regionId === region.id);
            return (
              <Card key={region.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{region.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Pastor: {pastors.find(p => p.id === region.pastor_id)?.full_name || "Não definido"}
                      </CardDescription>
                      
                      <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <Map className="w-5 h-5 text-primary mb-1" />
                          <span className="text-2xl font-bold">{regionStat?.areas || 0}</span>
                          <span className="text-xs text-muted-foreground">Áreas</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <Building2 className="w-5 h-5 text-primary mb-1" />
                          <span className="text-2xl font-bold">{regionStat?.churches || 0}</span>
                          <span className="text-xs text-muted-foreground">Igrejas</span>
                        </div>
                        <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                          <Users className="w-5 h-5 text-primary mb-1" />
                          <span className="text-2xl font-bold">{regionStat?.visitors || 0}</span>
                          <span className="text-xs text-muted-foreground">Visitantes</span>
                        </div>
                      </div>
                    </div>
                    {(isAdmin || isPastor) && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(region)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(region.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {filteredRegions.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredRegions.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}