import { Building2, Search, Edit, Trash2, Users } from "lucide-react";
import { ModernHeader } from "@/components/ModernHeader";
import { ViewToggle } from "@/components/ViewToggle";
import { PaginationControls } from "@/components/PaginationControls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUserRole } from "@/hooks/useUserRole";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

type Church = Tables<"churches">;
type Region = Tables<"regions">;
type Area = Tables<"areas">;
type User = { id: string; full_name: string; email: string; phone: string; city: string; state: string };

export default function Igrejas() {
  const [churches, setChurches] = useState<Church[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [pastors, setPastors] = useState<User[]>([]);
  const [visitorsCount, setVisitorsCount] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChurch, setEditingChurch] = useState<Church | null>(null);
  const [view, setView] = useState<"card" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const [formData, setFormData] = useState({
    name: "",
    pastor_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    region_id: "none",
    area_id: "none",
    pastor_id: "none",
  });

  useEffect(() => {
    fetchChurches();
    fetchRegions();
    fetchAreas();
    fetchPastors();
    fetchVisitorsCount();
  }, []);

  const fetchRegions = async () => {
    const { data } = await supabase.from("regions").select("*").order("name");
    setRegions(data || []);
  };

  const fetchAreas = async () => {
    const { data } = await supabase.from("areas").select("*").order("name");
    setAreas(data || []);
  };

  const fetchPastors = async () => {
    const { data } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        profiles!user_roles_user_id_fkey(full_name, email, phone, city, state)
      `)
      .eq("role", "pastor");

    const pastorsList = data?.map(r => ({
      id: r.user_id,
      full_name: (r.profiles as any)?.full_name || "Sem nome",
      email: (r.profiles as any)?.email || "Sem email",
      phone: (r.profiles as any)?.phone || "",
      city: (r.profiles as any)?.city || "",
      state: (r.profiles as any)?.state || ""
    })) || [];
    setPastors(pastorsList);
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
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitorsCount = async () => {
    const { data } = await supabase
      .from("visitors")
      .select("church_id");

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach((visitor: any) => {
        const churchId = visitor.church_id;
        counts[churchId] = (counts[churchId] || 0) + 1;
      });
      setVisitorsCount(counts);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      region_id: formData.region_id && formData.region_id !== "none" ? formData.region_id : null,
      area_id: formData.area_id && formData.area_id !== "none" ? formData.area_id : null,
      pastor_id: formData.pastor_id && formData.pastor_id !== "none" ? formData.pastor_id : null,
    };
    
    try {
      if (editingChurch) {
        const { error } = await supabase
          .from("churches")
          .update(payload)
          .eq("id", editingChurch.id);

        if (error) throw error;
        toast({ title: "Igreja atualizada com sucesso!" });
      } else {
        const { error } = await supabase
          .from("churches")
          .insert([payload as TablesInsert<"churches">]);

        if (error) throw error;
        toast({ title: "Igreja criada com sucesso!" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchChurches();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar igreja",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta igreja?")) return;

    try {
      const { error } = await supabase.from("churches").delete().eq("id", id);
      if (error) throw error;
      
      toast({ title: "Igreja excluída com sucesso!" });
      fetchChurches();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir igreja",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      pastor_name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      region_id: "none",
      area_id: "none",
      pastor_id: "none",
    });
    setEditingChurch(null);
  };

  const openEditDialog = async (church: Church) => {
    setEditingChurch(church);
    
    // Se existe pastor_id, buscar dados atualizados do pastor
    if (church.pastor_id && church.pastor_id !== "none") {
      const selectedPastor = pastors.find(p => p.id === church.pastor_id);
      if (selectedPastor) {
        setFormData({
          name: church.name,
          pastor_name: selectedPastor.full_name,
          email: selectedPastor.email,
          phone: selectedPastor.phone,
          address: church.address || "",
          city: selectedPastor.city,
          state: selectedPastor.state,
          region_id: church.region_id || "none",
          area_id: church.area_id || "none",
          pastor_id: church.pastor_id,
        });
        setIsDialogOpen(true);
        return;
      }
    }
    
    // Se não tem pastor ou pastor não encontrado, usar dados da igreja
    setFormData({
      name: church.name,
      pastor_name: church.pastor_name || "",
      email: church.email || "",
      phone: church.phone || "",
      address: church.address || "",
      city: church.city || "",
      state: church.state || "",
      region_id: church.region_id || "none",
      area_id: church.area_id || "none",
      pastor_id: church.pastor_id || "none",
    });
    setIsDialogOpen(true);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const filteredAreas = areas.filter(a => 
    !formData.region_id || a.region_id === formData.region_id
  );

  const filteredChurches = churches.filter((church) =>
    church.name.toLowerCase().includes(search.toLowerCase()) ||
    church.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (roleLoading || loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-muted-foreground">Carregando...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Igrejas"
        description="Gerencie todas as igrejas do sistema"
        icon={Building2}
        colorScheme="red-coral"
        onAction={isAdmin ? () => setIsDialogOpen(true) : undefined}
        actionText="Nova Igreja"
      />

      {(isAdmin) && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
              <DialogHeader>
                <DialogTitle>{editingChurch ? "Editar Igreja" : "Nova Igreja"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome da Igreja *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="region_id">Região</Label>
                    <Select
                      value={formData.region_id}
                      onValueChange={(value) => setFormData({ ...formData, region_id: value, area_id: "none" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma região" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {regions.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="area_id">Área</Label>
                    <Select
                      value={formData.area_id}
                      onValueChange={(value) => setFormData({ ...formData, area_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma área" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="none">Nenhuma</SelectItem>
                        {filteredAreas.map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pastor_id">Pastor Responsável</Label>
                    <Select
                      value={formData.pastor_id}
                      onValueChange={(value) => {
                        const selectedPastor = pastors.find(p => p.id === value);
                        if (selectedPastor) {
                          setFormData({ 
                            ...formData, 
                            pastor_id: value,
                            pastor_name: selectedPastor.full_name,
                            email: selectedPastor.email,
                            phone: selectedPastor.phone,
                            city: selectedPastor.city,
                            state: selectedPastor.state
                          });
                        } else {
                          setFormData({ ...formData, pastor_id: value });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um pastor" />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="none">Nenhum</SelectItem>
                        {pastors.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="pastor_name">Nome do Pastor</Label>
                    <Input
                      id="pastor_name"
                      value={formData.pastor_name}
                      onChange={(e) => setFormData({ ...formData, pastor_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
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
            placeholder="Buscar por nome ou cidade..."
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
                  <TableHead>Cidade/Estado</TableHead>
                  <TableHead>Pastor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-center">Visitantes</TableHead>
                  {isAdmin && <TableHead className="text-center">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredChurches
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((church) => (
                  <TableRow key={church.id}>
                    <TableCell className="font-medium">{church.name}</TableCell>
                    <TableCell>{church.city ? `${church.city}, ${church.state}` : "-"}</TableCell>
                    <TableCell>{church.pastor_name || "-"}</TableCell>
                    <TableCell>{church.email || "-"}</TableCell>
                    <TableCell>{church.phone || "-"}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{visitorsCount[church.id] || 0}</span>
                      </div>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center">
                        <div className="flex gap-2 justify-center">
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(church)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(church.id)}>
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
          {filteredChurches
            .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
            .map((church) => (
            <div key={church.id} className="glass-card rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{church.name}</h3>
                    {church.city && (
                      <p className="text-sm text-muted-foreground">{church.city}, {church.state}</p>
                    )}
                  </div>
                </div>
              </div>

              {church.pastor_name && (
                <p className="text-sm text-muted-foreground mb-2">
                  <span className="font-medium">Pastor:</span> {church.pastor_name}
                </p>
              )}
              
              {church.email && (
                <p className="text-sm text-muted-foreground mb-2">{church.email}</p>
              )}
              
              {church.phone && (
                <p className="text-sm text-muted-foreground mb-2">{church.phone}</p>
              )}

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold">{visitorsCount[church.id] || 0}</span>
                  <span className="text-sm text-muted-foreground">Visitantes</span>
                </div>
              </div>

              {isAdmin && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(church)} className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(church.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {filteredChurches.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {search ? "Nenhuma igreja encontrada" : "Nenhuma igreja cadastrada"}
          </p>
        </div>
      )}

      {filteredChurches.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalItems={filteredChurches.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}
    </div>
  );
}
