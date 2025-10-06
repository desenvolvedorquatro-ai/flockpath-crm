import { useEffect, useState } from "react";
import { Users, Plus, Mail, Phone, Calendar, Filter } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface Visitor {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  status: string;
  first_visit_date: string;
  invited_by: string | null;
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
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [churchId, setChurchId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    address: "",
    invited_by: "",
    status: "visitante",
  });

  useEffect(() => {
    if (!user) return;

    const fetchChurchAndVisitors = async () => {
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
    };

    fetchChurchAndVisitors();
  }, [user]);

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

    if (!churchId) {
      toast({
        title: "Erro",
        description: "Igreja não encontrada.",
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
      });

      const { data } = await supabase
        .from("visitors")
        .select("*")
        .eq("church_id", churchId)
        .order("created_at", { ascending: false });

      setVisitors(data || []);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Visitantes</h1>
          <p className="text-sm md:text-base text-muted-foreground">Gestão completa de visitantes e membros</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 btn-hover-lift bg-gradient-to-r from-primary to-primary-glow w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Novo Visitante</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Visitante</DialogTitle>
              <DialogDescription>
                Adicione as informações do visitante ao sistema
              </DialogDescription>
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
                    <SelectContent>
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
              <Button
                type="submit"
                className="w-full btn-hover-lift bg-gradient-to-r from-primary to-primary-glow"
              >
                Cadastrar Visitante
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="glass-card rounded-2xl p-4 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
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
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Nome</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">Contato</TableHead>
                  <TableHead className="min-w-[120px]">Status</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[140px]">Primeira Visita</TableHead>
                  <TableHead className="hidden xl:table-cell min-w-[120px]">Convidado por</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
