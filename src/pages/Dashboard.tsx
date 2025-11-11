import { useEffect, useState } from "react";
import { BarChart3, Users, UserPlus, TrendingUp, Target, Calendar as CalendarIcon, MapPin, Building2, Church } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PipelineStage } from "@/components/dashboard/PipelineStage";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHierarchyFilters } from "@/hooks/useHierarchyFilters";
import { ModernHeader } from "@/components/ModernHeader";
import { useVisitorConfig } from "@/hooks/useVisitorConfig";
import { conversionRateColor } from "@/lib/visitorStatus";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DashboardStats {
  totalVisitors: number;
  interessados: number;
  visitantes: number;
  visitantesFrequentes: number;
  candidatosBatismo: number;
  membros: number;
  resgates: number;
  conversionRate: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { 
    statusHexColors, 
    statusLabels,
    loading: configLoading 
  } = useVisitorConfig();
  const {
    selectedRegion,
    selectedArea,
    selectedChurch,
    regions,
    filteredAreas,
    filteredChurches,
    isRegionLocked,
    isAreaLocked,
    isChurchLocked,
    setSelectedRegion,
    setSelectedArea,
    setSelectedChurch,
    loading: filtersLoading,
  } = useHierarchyFilters();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    interessados: 0,
    visitantes: 0,
    visitantesFrequentes: 0,
    candidatosBatismo: 0,
    membros: 0,
    resgates: 0,
    conversionRate: "0%",
  });
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  
  // Estados para filtros de data
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    if (!user || configLoading || !statusHexColors) return;

    const fetchStats = async () => {
      let query = supabase.from("visitors").select(`
        status,
        primeira_visita,
        church_id,
        churches!inner(
          id,
          area_id,
          areas(
            id,
            region_id
          )
        )
      `);

      // Aplicar filtros hierárquicos
      if (selectedChurch && selectedChurch !== "all") {
        query = query.eq("church_id", selectedChurch);
      } else if (selectedArea && selectedArea !== "all") {
        query = query.eq("churches.area_id", selectedArea);
      } else if (selectedRegion && selectedRegion !== "all") {
        query = query.eq("churches.areas.region_id", selectedRegion);
      }

      // Aplicar filtros de data
      if (startDate) {
        query = query.gte("primeira_visita", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        query = query.lte("primeira_visita", format(endDate, "yyyy-MM-dd"));
      }

      const { data: visitors } = await query;

      if (visitors) {
        const total = visitors.length;
        const interessados = visitors.filter((v) => v.status === "interessado").length;
        const visitantes = visitors.filter((v) => v.status === "visitante").length;
        const visitantesFrequentes = visitors.filter((v) => v.status === "visitante_frequente").length;
        const candidatosBatismo = visitors.filter((v) => v.status === "candidato_batismo").length;
        const membros = visitors.filter((v) => v.status === "membro").length;
        const resgates = visitors.filter((v: any) => v.resgate === true).length;
        const conversionRate = total > 0 ? ((membros / total) * 100).toFixed(1) : "0";

        setStats({
          totalVisitors: total,
          interessados,
          visitantes,
          visitantesFrequentes,
          candidatosBatismo,
          membros,
          resgates,
          conversionRate: `${conversionRate}%`,
        });

        setPipelineData([
          { title: statusLabels.interessado || "Interessado", count: interessados, color: statusHexColors.interessado || "#6B7280", percentage: total > 0 ? Math.round((interessados / total) * 100) : 0 },
          { title: statusLabels.visitante || "Visitante", count: visitantes, color: statusHexColors.visitante || "#3B82F6", percentage: total > 0 ? Math.round((visitantes / total) * 100) : 0 },
          { title: statusLabels.visitante_frequente || "Visitante Frequente", count: visitantesFrequentes, color: statusHexColors.visitante_frequente || "#8B5CF6", percentage: total > 0 ? Math.round((visitantesFrequentes / total) * 100) : 0 },
          { title: statusLabels.candidato_batismo || "Candidato a Batismo", count: candidatosBatismo, color: statusHexColors.candidato_batismo || "#F59E0B", percentage: total > 0 ? Math.round((candidatosBatismo / total) * 100) : 0 },
          { title: statusLabels.membro || "Membro", count: membros, color: statusHexColors.membro || "#10B981", percentage: total > 0 ? Math.round((membros / total) * 100) : 0 },
        ]);
      }
    };

    fetchStats();
  }, [user, configLoading, statusHexColors, statusLabels, startDate, endDate, selectedRegion, selectedArea, selectedChurch]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    // Limpar apenas filtros que o usuário pode alterar
    if (!isRegionLocked) {
      setSelectedRegion("all");
    }
    if (!isAreaLocked) {
      setSelectedArea("all");
    }
    if (!isChurchLocked) {
      setSelectedChurch("all");
    }
    setIsFiltering(false);
  };

  const statsCards = [
    { title: "Total de Visitantes", value: stats.totalVisitors, icon: Users, trend: { value: 0, isPositive: true }, iconColor: statusHexColors?.visitante || "#3B82F6" },
    { title: "Interessados", value: stats.interessados, icon: Users, trend: { value: 0, isPositive: true }, iconColor: statusHexColors?.interessado || "#6B7280" },
    { title: "Membros", value: stats.membros, icon: UserPlus, trend: { value: 0, isPositive: true }, iconColor: statusHexColors?.membro || "#10B981" },
    { title: "Resgates", value: stats.resgates, icon: TrendingUp, trend: { value: 0, isPositive: true }, iconColor: "#EF4444" },
    { title: "Taxa de Conversão", value: stats.conversionRate, icon: Target, trend: { value: 0, isPositive: true }, iconColor: conversionRateColor },
  ];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
        <ModernHeader
          title="Dashboard"
          description="Acompanhe as métricas e estatísticas do sistema"
          icon={BarChart3}
          colorScheme="red-coral"
        />

        {/* Filtros */}
        <div className="mb-6 p-4 bg-card border border-border rounded-xl shadow-apple-sm">
          <div className="flex flex-col gap-4">
            {/* Filtros Hierárquicos */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <Select 
                  value={selectedRegion} 
                  onValueChange={setSelectedRegion}
                  disabled={isRegionLocked}
                >
                  <SelectTrigger className={cn(isRegionLocked && "opacity-70")}>
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
              </div>

              <div className="flex-1 min-w-[200px]">
                <Select 
                  value={selectedArea} 
                  onValueChange={setSelectedArea}
                  disabled={isAreaLocked || !selectedRegion || selectedRegion === "all"}
                >
                  <SelectTrigger className={cn((isAreaLocked || !selectedRegion || selectedRegion === "all") && "opacity-70")}>
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
              </div>

              <div className="flex-1 min-w-[200px]">
                <Select 
                  value={selectedChurch} 
                  onValueChange={setSelectedChurch}
                  disabled={isChurchLocked || !selectedArea || selectedArea === "all"}
                >
                  <SelectTrigger className={cn((isChurchLocked || !selectedArea || selectedArea === "all") && "opacity-70")}>
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
            </div>

            {/* Filtros de Data */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
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
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[200px] justify-start text-left font-normal",
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
                    />
                  </PopoverContent>
                </Popover>

                {(startDate || endDate || (selectedRegion && selectedRegion !== "all" && !isRegionLocked) || (selectedArea && selectedArea !== "all" && !isAreaLocked) || (selectedChurch && selectedChurch !== "all" && !isChurchLocked)) && (
                  <Button onClick={clearFilters} variant="ghost">
                    Limpar Filtros
                  </Button>
                )}
              </div>

              {(startDate || endDate || (selectedRegion && selectedRegion !== "all") || (selectedArea && selectedArea !== "all") || (selectedChurch && selectedChurch !== "all")) && (
                <Badge variant="secondary" className="animate-fade-in">
                  Filtros Ativos
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 md:gap-6 mb-6 md:mb-8">
          {statsCards.map((stat, index) => (
            <div key={stat.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-foreground">Funil de Conversão</h2>
              <p className="text-xs md:text-sm text-muted-foreground">Visualização da jornada dos visitantes</p>
            </div>
          </div>

          <div className="mb-6 md:mb-8">
            <FunnelChart stages={pipelineData} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
            {pipelineData.map((stage, index) => (
              <div key={stage.title} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <PipelineStage {...stage} />
              </div>
            ))}
          </div>
        </div>
    </div>
  );
}
