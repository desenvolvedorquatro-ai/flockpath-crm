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

// Red-coral palette from design system
const COLORS = ['hsl(5 53% 48%)', 'hsl(5 63% 58%)', 'hsl(5 73% 68%)', 'hsl(5 43% 38%)', 'hsl(5 33% 28%)'];

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
  const [tarefasData, setTarefasData] = useState<any[]>([]);
  const [frequenciaTipoData, setFrequenciaTipoData] = useState<any[]>([]);
  const [frequenciaMensalData, setFrequenciaMensalData] = useState<any[]>([]);
  const [topFrequentadoresData, setTopFrequentadoresData] = useState<any[]>([]);
  const [frequenciaDetalhadaData, setFrequenciaDetalhadaData] = useState<any[]>([]);
  const [resgateData, setResgateData] = useState<any[]>([]);

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
          name: key === 'interessado' ? 'Interessado' : 
                key === 'visitante' ? 'Visitante' :
                key === 'visitante_frequente' ? 'Visitante Frequente' :
                key === 'candidato_batismo' ? 'Candidato à Batismo' : 'Membro',
          value: value,
          percentage: ((value / total) * 100).toFixed(1)
        }));
        
        // Relatório de Resgates
        const resgates = visitors.filter((v: any) => v.resgate === true);
        const resgateReport = [{
          name: 'Resgates',
          total: resgates.length
        }, {
          name: 'Não Resgates',
          total: visitors.length - resgates.length
        }];
        setResgateData(resgateReport);

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

      // Buscar dados de tarefas
      let taskQuery = supabase.from("tasks").select(`
        *,
        churches(name),
        assistance_groups(name)
      `);

      if (selectedChurch && selectedChurch !== "all") {
        taskQuery = taskQuery.eq("church_id", selectedChurch);
      }

      if (startDate) {
        taskQuery = taskQuery.gte("due_date", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        taskQuery = taskQuery.lte("due_date", format(endDate, "yyyy-MM-dd"));
      }

      const { data: tasks } = await taskQuery;

      if (tasks) {
        const statusCounts = tasks.reduce((acc: any, task: any) => {
          const status = task.status === 'completed' ? 'Concluídas' : 
                        task.status === 'overdue' ? 'Atrasadas' : 'No Prazo';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const taskReport = Object.entries(statusCounts).map(([key, value]: [string, any]) => ({
          name: key,
          total: value
        }));

        setTarefasData(taskReport);
      }

      // Buscar dados de frequência
      let attendanceQuery = supabase.from("attendance_records").select(`
        *,
        visitors(full_name, church_id)
      `);

      if (selectedChurch && selectedChurch !== "all") {
        attendanceQuery = attendanceQuery.eq("visitors.church_id", selectedChurch);
      }

      if (startDate) {
        attendanceQuery = attendanceQuery.gte("attendance_date", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        attendanceQuery = attendanceQuery.lte("attendance_date", format(endDate, "yyyy-MM-dd"));
      }

      const { data: attendance } = await attendanceQuery;

      if (attendance) {
        // Frequência por tipo de culto
        const tipoCounts = attendance.reduce((acc: any, record: any) => {
          const tipo = record.service_type === 'ebd' ? 'EBD' :
                      record.service_type === 'noite' ? 'Culto Noite' : 'Outro';
          acc[tipo] = (acc[tipo] || 0) + 1;
          return acc;
        }, {});

        const tipoReport = Object.entries(tipoCounts).map(([key, value]: [string, any]) => ({
          name: key,
          total: value
        }));
        setFrequenciaTipoData(tipoReport);

        // Frequência mensal
        const monthAttendanceCounts = attendance.reduce((acc: any, record: any) => {
          if (record.attendance_date) {
            const date = new Date(record.attendance_date);
            const month = format(date, "MMM/yyyy", { locale: ptBR });
            acc[month] = (acc[month] || 0) + 1;
          }
          return acc;
        }, {});

        const monthAttendanceReport = Object.entries(monthAttendanceCounts).map(([key, value]: [string, any]) => ({
          mes: key,
          presencas: value
        }));
        setFrequenciaMensalData(monthAttendanceReport);

        // Top 10 frequentadores
        const visitorAttendance = attendance.reduce((acc: any, record: any) => {
          const visitorName = record.visitors?.full_name || 'Desconhecido';
          acc[visitorName] = (acc[visitorName] || 0) + 1;
          return acc;
        }, {});

        const topFrequentadores = Object.entries(visitorAttendance)
          .map(([key, value]: [string, any]) => ({
            name: key,
            total: value
          }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        setTopFrequentadoresData(topFrequentadores);

        // Relatório detalhado de frequência por visitante e igreja
        const frequenciaDetalhada: any[] = [];
        const visitorMap = new Map();

        attendance.forEach((record: any) => {
          const visitorId = record.visitor_id;
          const visitorName = record.visitors?.full_name || 'Desconhecido';
          const churchId = record.visitors?.church_id;

          if (!visitorMap.has(visitorId)) {
            visitorMap.set(visitorId, {
              visitor_id: visitorId,
              visitor_name: visitorName,
              church_id: churchId,
              months: new Map()
            });
          }

          if (record.attendance_date) {
            const date = new Date(record.attendance_date);
            const monthKey = format(date, "MMM/yyyy", { locale: ptBR });
            
            const visitor = visitorMap.get(visitorId);
            if (!visitor.months.has(monthKey)) {
              visitor.months.set(monthKey, 0);
            }
            visitor.months.set(monthKey, visitor.months.get(monthKey) + 1);
          }
        });

        // Buscar informações das igrejas para cada visitante
        visitorMap.forEach((visitor) => {
          const church = churches.find(c => c.id === visitor.church_id);
          const churchName = church?.name || 'Sem Igreja';

          visitor.months.forEach((count, month) => {
            frequenciaDetalhada.push({
              visitante: visitor.visitor_name,
              igreja: churchName,
              mes: month,
              total_cultos: count
            });
          });
        });

        // Ordenar por mês e visitante
        frequenciaDetalhada.sort((a, b) => {
          const dateA = new Date(a.mes.split('/').reverse().join('-'));
          const dateB = new Date(b.mes.split('/').reverse().join('-'));
          if (dateA.getTime() !== dateB.getTime()) {
            return dateB.getTime() - dateA.getTime();
          }
          return b.total_cultos - a.total_cultos;
        });

        setFrequenciaDetalhadaData(frequenciaDetalhada);
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
                <Calendar 
                  mode="single" 
                  selected={startDate} 
                  onSelect={setStartDate} 
                  initialFocus 
                  locale={ptBR}
                  className="pointer-events-auto"
                />
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
                <Calendar 
                  mode="single" 
                  selected={endDate} 
                  onSelect={setEndDate} 
                  initialFocus 
                  locale={ptBR}
                  className="pointer-events-auto"
                />
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
                <Bar dataKey="total" fill="hsl(5 53% 48%)" />
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
                <Bar dataKey="total" fill="hsl(5 63% 58%)" />
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
                <Bar dataKey="batizados" fill="hsl(5 73% 68%)" />
              </BarChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(batizadosData, "relatorio_batizados")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Tarefas */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Status das Tarefas</CardTitle>
          <CardDescription>Distribuição de tarefas por status</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tarefasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="hsl(5 53% 48%)" />
            </BarChart>
          </ResponsiveContainer>
          <Button onClick={() => exportToExcel(tarefasData, "relatorio_tarefas")} className="w-full mt-4">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </CardContent>
      </Card>

      {/* Frequência por Tipo de Culto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Frequência por Tipo de Culto</CardTitle>
            <CardDescription>Distribuição de presenças por tipo de culto</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={frequenciaTipoData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, total }) => `${name}: ${total}`}
                  outerRadius={80}
                  fill="hsl(5 53% 48%)"
                  dataKey="total"
                >
                  {frequenciaTipoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(frequenciaTipoData, "relatorio_frequencia_tipo")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Frequentadores</CardTitle>
            <CardDescription>Visitantes com maior frequência</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topFrequentadoresData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(5 53% 48%)" />
              </BarChart>
            </ResponsiveContainer>
            <Button onClick={() => exportToExcel(topFrequentadoresData, "relatorio_top_frequentadores")} className="w-full mt-4">
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Frequência Mensal */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Frequência Mensal</CardTitle>
          <CardDescription>Evolução mensal de presenças nos cultos</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={frequenciaMensalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="presencas" fill="hsl(5 63% 58%)" />
            </BarChart>
          </ResponsiveContainer>
          <Button onClick={() => exportToExcel(frequenciaMensalData, "relatorio_frequencia_mensal")} className="w-full mt-4">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </CardContent>
      </Card>

      {/* Relatório Mensal */}
      <Card className="mb-6">
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
              <Bar dataKey="visitantes" fill="hsl(5 63% 58%)" />
            </BarChart>
          </ResponsiveContainer>
          <Button onClick={() => exportToExcel(mensalData, "relatorio_mensal")} className="w-full mt-4">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        </CardContent>
      </Card>

      {/* Relatório Detalhado de Frequência */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Frequência Detalhada por Visitante</CardTitle>
          <CardDescription>Quantidade de cultos por mês, visitante e igreja</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Visitante</th>
                  <th className="text-left p-2 font-semibold">Igreja</th>
                  <th className="text-left p-2 font-semibold">Mês</th>
                  <th className="text-right p-2 font-semibold">Total de Cultos</th>
                </tr>
              </thead>
              <tbody>
                {frequenciaDetalhadaData.length > 0 ? (
                  frequenciaDetalhadaData.slice(0, 50).map((item, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2">{item.visitante}</td>
                      <td className="p-2">{item.igreja}</td>
                      <td className="p-2">{item.mes}</td>
                      <td className="text-right p-2">{item.total_cultos}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center p-4 text-muted-foreground">
                      Nenhum dado de frequência disponível
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {frequenciaDetalhadaData.length > 50 && (
              <p className="text-sm text-muted-foreground mt-2">
                Mostrando 50 de {frequenciaDetalhadaData.length} registros. Exporte para Excel para ver todos.
              </p>
            )}
          </div>
          <Button onClick={() => exportToExcel(frequenciaDetalhadaData, "relatorio_frequencia_detalhada")} className="w-full mt-4">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel - {frequenciaDetalhadaData.length} registros
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
