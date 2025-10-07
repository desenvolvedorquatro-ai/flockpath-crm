import { useEffect, useState } from "react";
import { FileBarChart, Download, Calendar as CalendarIcon, MapPin, Building2, Church } from "lucide-react";
import { ModernHeader } from "@/components/ModernHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Tables } from "@/integrations/supabase/types";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

type Region = Tables<"regions">;
type Area = Tables<"areas">;
type Church = Tables<"churches">;

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5'];

export default function Relatorios() {
  const { user } = useAuth();
  const { isAdmin, roles } = useUserRole();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);
  
  // Filtros hierárquicos
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedChurch, setSelectedChurch] = useState<string>("all");
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);

  // Dados dos relatórios
  const [statusData, setStatusData] = useState<any[]>([]);
  const [igrejaData, setIgrejaData] = useState<any[]>([]);
  const [mensalData, setMensalData] = useState<any[]>([]);
  const [categoriaData, setCategoriaData] = useState<any[]>([]);
  const [areaData, setAreaData] = useState<any[]>([]);
  const [candidatosBatismoData, setCandidatosBatismoData] = useState<any[]>([]);
  const [batizadosData, setBatizadosData] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadHierarchy = async () => {
      const [regionsRes, areasRes, churchesRes] = await Promise.all([
        supabase.from("regions").select("*").order("name"),
        supabase.from("areas").select("*").order("name"),
        supabase.from("churches").select("*").order("name"),
      ]);
      if (regionsRes.data) setRegions(regionsRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (churchesRes.data) setChurches(churchesRes.data);
    };
    loadHierarchy();
  }, [user]);

  useEffect(() => {
    if (selectedRegion && selectedRegion !== "all") {
      setFilteredAreas(areas.filter(a => a.region_id === selectedRegion));
    } else {
      setFilteredAreas(areas);
    }
    setSelectedArea("all");
    setSelectedChurch("all");
  }, [selectedRegion, areas]);

  useEffect(() => {
    if (selectedArea && selectedArea !== "all") {
      setFilteredChurches(churches.filter(c => c.area_id === selectedArea));
    } else if (selectedRegion && selectedRegion !== "all") {
      const regionAreas = areas.filter(a => a.region_id === selectedRegion).map(a => a.id);
      setFilteredChurches(churches.filter(c => c.area_id && regionAreas.includes(c.area_id)));
    } else {
      setFilteredChurches(churches);
    }
    setSelectedChurch("all");
  }, [selectedArea, selectedRegion, churches, areas]);

  const fetchReportData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase.from("visitors").select(`
        *,
        churches!inner(
          name,
          area_id,
          areas(
            name,
            region_id,
            regions(name)
          )
        )
      `);

      if (selectedChurch && selectedChurch !== "all") {
        query = query.eq("church_id", selectedChurch);
      } else if (selectedArea && selectedArea !== "all") {
        query = query.eq("churches.area_id", selectedArea);
      } else if (selectedRegion && selectedRegion !== "all") {
        query = query.eq("churches.areas.region_id", selectedRegion);
      }

      if (startDate) {
        query = query.gte("primeira_visita", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        query = query.lte("primeira_visita", format(endDate, "yyyy-MM-dd"));
      }

      const { data: visitors } = await query;

      if (visitors) {
        // Relatório por Status
        const statusCounts = visitors.reduce((acc: any, v: any) => {
          const status = v.status || 'visitante';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const total = visitors.length;
        const statusReport = Object.entries(statusCounts).map(([key, value]: [string, any]) => ({
          name: key === 'visitante' ? 'Visitante' : 
                key === 'interessado' ? 'Interessado' : 
                key === 'em_assistencia' ? 'Em Assistência' : 'Batizado',
          value: value,
          percentage: ((value / total) * 100).toFixed(1)
        }));

        setStatusData(statusReport);

        // Relatório por Igreja (top 10)
        const churchCounts = visitors.reduce((acc: any, v: any) => {
          const churchName = v.churches?.name || 'Sem Igreja';
          acc[churchName] = (acc[churchName] || 0) + 1;
          return acc;
        }, {});

        const churchReport = Object.entries(churchCounts)
          .map(([key, value]: [string, any]) => ({
            name: key,
            total: value
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        setIgrejaData(churchReport);

        // Relatório Mensal
        const monthCounts = visitors.reduce((acc: any, v: any) => {
          if (v.primeira_visita) {
            const date = new Date(v.primeira_visita);
            const month = format(date, "MMM/yyyy", { locale: ptBR });
            acc[month] = (acc[month] || 0) + 1;
          }
          return acc;
        }, {});

        const monthReport = Object.entries(monthCounts).map(([key, value]: [string, any]) => ({
          mes: key,
          visitantes: value
        }));

        setMensalData(monthReport);

        // Relatório por Categoria
        const categoriaCounts = visitors.reduce((acc: any, v: any) => {
          const categoria = v.categoria || 'não_definida';
          acc[categoria] = (acc[categoria] || 0) + 1;
          return acc;
        }, {});

        const categoriaLabels: Record<string, string> = {
          crianca: 'Criança',
          intermediario: 'Intermediário',
          adolescente: 'Adolescente',
          jovem: 'Jovem',
          senhora: 'Senhora',
          varao: 'Varão',
          idoso: 'Idoso',
          não_definida: 'Não definida'
        };

        const categoriaReport = Object.entries(categoriaCounts).map(([key, value]: [string, any]) => ({
          name: categoriaLabels[key] || key,
          value: value
        }));

        setCategoriaData(categoriaReport);

        // Relatório por Área
        const areaCounts = visitors.reduce((acc: any, v: any) => {
          const areaName = v.churches?.areas?.name || 'Sem Área';
          acc[areaName] = (acc[areaName] || 0) + 1;
          return acc;
        }, {});

        const areaReport = Object.entries(areaCounts)
          .map(([key, value]: [string, any]) => ({
            name: key,
            total: value
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        setAreaData(areaReport);

        // Candidatos a Batismo
        const candidatos = visitors.filter((v: any) => v.candidato_batismo);
        const candidatosReport = [{
          name: 'Candidatos a Batismo',
          total: candidatos.length
        }, {
          name: 'Não Candidatos',
          total: visitors.length - candidatos.length
        }];
        setCandidatosBatismoData(candidatosReport);

        // Batizados por período
        const batizados = visitors.filter((v: any) => v.status === 'batizado' && v.data_batismo);
        const batizadosPorMes = batizados.reduce((acc: any, v: any) => {
          if (v.data_batismo) {
            const date = new Date(v.data_batismo);
            const month = format(date, "MMM/yyyy", { locale: ptBR });
            acc[month] = (acc[month] || 0) + 1;
          }
          return acc;
        }, {});

        const batizadosReport = Object.entries(batizadosPorMes).map(([key, value]: [string, any]) => ({
          mes: key,
          batizados: value
        }));

        setBatizadosData(batizadosReport);
      }
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error);
      toast.error("Erro ao carregar dados dos relatórios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [user, selectedRegion, selectedArea, selectedChurch, startDate, endDate]);

  const exportToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `${filename}_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Relatórios"
        description="Visualize e exporte relatórios detalhados do sistema"
        icon={FileBarChart}
        colorScheme="red-coral"
      />

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <MapPin className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todas as Regiões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Regiões</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTrigger>
                <Building2 className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todas as Áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Áreas</SelectItem>
                {filteredAreas.map(area => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedChurch} onValueChange={setSelectedChurch}>
              <SelectTrigger>
                <Church className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Todas as Igrejas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Igrejas</SelectItem>
                {filteredChurches.map(church => (
                  <SelectItem key={church.id} value={church.id}>{church.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Inicial"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={ptBR} />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data Final"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Relatório por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Visitantes por Status</CardTitle>
            <CardDescription>Distribuição de visitantes por categoria</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(statusData, "relatorio_status")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Igrejas</CardTitle>
            <CardDescription>Igrejas com mais visitantes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={igrejaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(igrejaData, "relatorio_igrejas")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Relatório por Categoria e Área */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Visitantes por Categoria</CardTitle>
            <CardDescription>Distribuição por faixa etária</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoriaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoriaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(categoriaData, "relatorio_categoria")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Áreas</CardTitle>
            <CardDescription>Áreas com mais visitantes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#fb923c" />
              </BarChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(areaData, "relatorio_areas")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Candidatos a Batismo e Batizados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Candidatos a Batismo</CardTitle>
            <CardDescription>Visitantes candidatos ao batismo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={candidatosBatismoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, total }) => `${name}: ${total}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {candidatosBatismoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(candidatosBatismoData, "relatorio_candidatos_batismo")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batismos por Período</CardTitle>
            <CardDescription>Batismos realizados ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={batizadosData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="batizados" fill="#fdba74" />
              </BarChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(batizadosData, "relatorio_batizados")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Relatório Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Visitantes por Mês</CardTitle>
          <CardDescription>Evolução mensal de visitantes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mensalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="visitantes" fill="#fb923c" />
            </BarChart>
          </ResponsiveContainer>
          <Button onClick={() => exportToExcel(mensalData, "relatorio_mensal")} className="w-full mt-4">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
