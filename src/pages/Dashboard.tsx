import { useEffect, useState } from "react";
import { BarChart3, Users, UserPlus, TrendingUp, Calendar as CalendarIcon, MapPin, Building2, Church } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PipelineStage } from "@/components/dashboard/PipelineStage";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernHeader } from "@/components/ModernHeader";
import { statusLabels, statusHexColors } from "@/lib/visitorStatus";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tables } from "@/integrations/supabase/types";

interface DashboardStats {
  totalVisitors: number;
  batizados: number;
  emAssistencia: number;
  conversionRate: string;
}

type Region = Tables<"regions">;
type Area = Tables<"areas">;
type Church = Tables<"churches">;

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin, isPastor, roles } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    batizados: 0,
    emAssistencia: 0,
    conversionRate: "0%",
  });
  const [pipelineData, setPipelineData] = useState([
    { title: "Visitante", count: 0, color: statusHexColors.visitante, percentage: 0 },
    { title: "Interessado", count: 0, color: statusHexColors.interessado, percentage: 0 },
    { title: "Em Assistência", count: 0, color: statusHexColors.em_assistencia, percentage: 0 },
    { title: "Batizados", count: 0, color: statusHexColors.batizado, percentage: 0 },
  ]);
  
  // Estados para filtros de data
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [isFiltering, setIsFiltering] = useState(false);

  // Estados para filtros hierárquicos
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedChurch, setSelectedChurch] = useState<string>("all");
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  // Carregar dados hierárquicos e perfil do usuário
  useEffect(() => {
    if (!user) return;

    const loadInitialData = async () => {
      // Carregar regiões, áreas e igrejas
      const [regionsRes, areasRes, churchesRes, profileRes] = await Promise.all([
        supabase.from("regions").select("*").order("name"),
        supabase.from("areas").select("*").order("name"),
        supabase.from("churches").select("*").order("name"),
        supabase.from("profiles").select("church_id, region_id, area_id, churches(area_id, areas(region_id))").eq("id", user.id).single()
      ]);

      if (regionsRes.data) setRegions(regionsRes.data);
      if (areasRes.data) setAreas(areasRes.data);
      if (churchesRes.data) setChurches(churchesRes.data);
      if (profileRes.data) setUserProfile(profileRes.data);

      // Pré-selecionar filtros baseado no nível do usuário
      if (roles.includes("pastor")) {
        // Pastor de igreja: pré-selecionar tudo e bloquear
        if (profileRes.data?.church_id) {
          setSelectedChurch(profileRes.data.church_id);
          const church = churchesRes.data?.find(c => c.id === profileRes.data.church_id);
          if (church?.area_id) {
            setSelectedArea(church.area_id);
            const area = areasRes.data?.find(a => a.id === church.area_id);
            if (area?.region_id) {
              setSelectedRegion(area.region_id);
            }
          }
        }
      } else if (roles.includes("pastor_coordenador")) {
        // Pastor de área: pré-selecionar região e área
        if (profileRes.data?.area_id) {
          setSelectedArea(profileRes.data.area_id);
          const area = areasRes.data?.find(a => a.id === profileRes.data.area_id);
          if (area?.region_id) {
            setSelectedRegion(area.region_id);
          }
        }
      } else if (roles.includes("pastor_regiao")) {
        // Pastor de região: pré-selecionar apenas região
        if (profileRes.data?.region_id) {
          setSelectedRegion(profileRes.data.region_id);
        }
      }
    };

    loadInitialData();
  }, [user, roles]);

  // Filtrar áreas quando região mudar
  useEffect(() => {
    if (selectedRegion && selectedRegion !== "all") {
      setFilteredAreas(areas.filter(a => a.region_id === selectedRegion));
    } else {
      setFilteredAreas(areas);
    }
    // Limpar área e igreja se região mudou
    if (!roles.includes("pastor_coordenador") && !roles.includes("pastor")) {
      setSelectedArea("all");
      setSelectedChurch("all");
    }
  }, [selectedRegion, areas, roles]);

  // Filtrar igrejas quando área mudar
  useEffect(() => {
    if (selectedArea && selectedArea !== "all") {
      setFilteredChurches(churches.filter(c => c.area_id === selectedArea));
    } else if (selectedRegion && selectedRegion !== "all") {
      // Se tem região mas não tem área, mostrar igrejas da região
      const regionAreas = areas.filter(a => a.region_id === selectedRegion).map(a => a.id);
      setFilteredChurches(churches.filter(c => c.area_id && regionAreas.includes(c.area_id)));
    } else {
      setFilteredChurches(churches);
    }
    // Limpar igreja se área mudou
    if (!roles.includes("pastor")) {
      setSelectedChurch("all");
    }
  }, [selectedArea, selectedRegion, churches, areas, roles]);

  useEffect(() => {
    if (!user) return;

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
      } else if (!isAdmin) {
        // Se não é admin e não tem filtros, aplicar lógica antiga
        if (isPastor) {
          const { data: pastorChurches } = await supabase
            .from("churches")
            .select("id")
            .eq("pastor_id", user.id);

          if (pastorChurches && pastorChurches.length > 0) {
            const churchIds = pastorChurches.map(c => c.id);
            query = query.in("church_id", churchIds);
          } else {
            return;
          }
        } else {
          const { data: profile } = await supabase
            .from("profiles")
            .select("church_id")
            .eq("id", user.id)
            .single();

          if (!profile?.church_id) return;
          query = query.eq("church_id", profile.church_id);
        }
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
        const batizados = visitors.filter((v) => v.status === "batizado").length;
        const emAssistencia = visitors.filter((v) => v.status === "em_assistencia").length;
        const conversionRate = total > 0 ? ((batizados / total) * 100).toFixed(1) : "0";

        setStats({
          totalVisitors: total,
          batizados,
          emAssistencia,
          conversionRate: `${conversionRate}%`,
        });

        const visitante = visitors.filter((v) => v.status === "visitante").length;
        const interessado = visitors.filter((v) => v.status === "interessado").length;
        const emAssist = visitors.filter((v) => v.status === "em_assistencia").length;
        const batizado = visitors.filter((v) => v.status === "batizado").length;

        setPipelineData([
          { title: "Visitante", count: visitante, color: statusHexColors.visitante, percentage: total > 0 ? Math.round((visitante / total) * 100) : 0 },
          { title: "Interessado", count: interessado, color: statusHexColors.interessado, percentage: total > 0 ? Math.round((interessado / total) * 100) : 0 },
          { title: "Em Assistência", count: emAssist, color: statusHexColors.em_assistencia, percentage: total > 0 ? Math.round((emAssist / total) * 100) : 0 },
          { title: "Batizados", count: batizado, color: statusHexColors.batizado, percentage: total > 0 ? Math.round((batizado / total) * 100) : 0 },
        ]);
      }
    };

    fetchStats();
  }, [user, isAdmin, isPastor, startDate, endDate, selectedRegion, selectedArea, selectedChurch]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    // Limpar apenas filtros que o usuário pode alterar
    if (isAdmin) {
      setSelectedRegion("all");
      setSelectedArea("all");
      setSelectedChurch("all");
    } else if (roles.includes("pastor_regiao")) {
      setSelectedArea("all");
      setSelectedChurch("all");
    } else if (roles.includes("pastor_coordenador")) {
      setSelectedChurch("all");
    }
    setIsFiltering(false);
  };

  const isRegionLocked = roles.includes("pastor_regiao") || roles.includes("pastor_coordenador") || roles.includes("pastor");
  const isAreaLocked = roles.includes("pastor_coordenador") || roles.includes("pastor");
  const isChurchLocked = roles.includes("pastor");

  const statsCards = [
    { title: "Total de Visitantes", value: stats.totalVisitors, icon: Users, trend: { value: 0, isPositive: true }, iconColor: statusHexColors.visitante },
    { title: "Batizados", value: stats.batizados, icon: UserPlus, trend: { value: 0, isPositive: true }, iconColor: statusHexColors.batizado },
    { title: "Em Assistência", value: stats.emAssistencia, icon: TrendingUp, trend: { value: 0, isPositive: true }, iconColor: statusHexColors.em_assistencia },
    { title: "Taxa de Conversão", value: stats.conversionRate, icon: BarChart3, trend: { value: 0, isPositive: true }, iconColor: undefined },
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
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
