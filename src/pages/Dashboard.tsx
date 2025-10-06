import { useEffect, useState } from "react";
import { BarChart3, Users, UserPlus, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
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

interface DashboardStats {
  totalVisitors: number;
  batizados: number;
  emAssistencia: number;
  conversionRate: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin, isPastor } = useUserRole();
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

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      let query = supabase.from("visitors").select("status, first_visit_date");

      if (isAdmin) {
        // Admin vê todos os visitantes
      } else if (isPastor) {
        // Pastor vê visitantes de todas as igrejas que ele gerencia
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
        // Outros usuários veem apenas da sua igreja
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("id", user.id)
          .single();

        if (!profile?.church_id) return;
        query = query.eq("church_id", profile.church_id);
      }

      // Aplicar filtros de data
      if (startDate) {
        query = query.gte("first_visit_date", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        query = query.lte("first_visit_date", format(endDate, "yyyy-MM-dd"));
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
  }, [user, isAdmin, isPastor, startDate, endDate]);

  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setIsFiltering(false);
  };

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

        {/* Filtros de Data */}
        <div className="mb-6 p-4 bg-card border border-border rounded-xl shadow-apple-sm">
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

              {(startDate || endDate) && (
                <Button onClick={clearFilters} variant="ghost">
                  Limpar Filtros
                </Button>
              )}
            </div>

            {(startDate || endDate) && (
              <Badge variant="secondary" className="animate-fade-in">
                Filtros Ativos
              </Badge>
            )}
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
