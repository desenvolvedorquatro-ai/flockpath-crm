import { useEffect, useState } from "react";
import { BarChart3, Users, UserPlus, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PipelineStage } from "@/components/dashboard/PipelineStage";
import { FunnelChart } from "@/components/dashboard/FunnelChart";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernHeader } from "@/components/ModernHeader";

interface DashboardStats {
  totalVisitors: number;
  newMembers: number;
  inFollowUp: number;
  conversionRate: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { isAdmin, isPastor } = useUserRole();
  const [stats, setStats] = useState<DashboardStats>({
    totalVisitors: 0,
    newMembers: 0,
    inFollowUp: 0,
    conversionRate: "0%",
  });
  const [pipelineData, setPipelineData] = useState([
    { title: "Visitante", count: 0, color: "blue-500", percentage: 0 },
    { title: "Interessado", count: 0, color: "purple-500", percentage: 0 },
    { title: "Em Acompanhamento", count: 0, color: "indigo-500", percentage: 0 },
    { title: "Novo Membro", count: 0, color: "violet-500", percentage: 0 },
    { title: "Engajado", count: 0, color: "fuchsia-500", percentage: 0 },
  ]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      let visitors;

      if (isAdmin) {
        // Admin vê todos os visitantes
        const { data } = await supabase
          .from("visitors")
          .select("status");
        visitors = data;
      } else if (isPastor) {
        // Pastor vê visitantes de todas as igrejas que ele gerencia
        const { data: pastorChurches } = await supabase
          .from("churches")
          .select("id")
          .eq("pastor_id", user.id);

        if (pastorChurches && pastorChurches.length > 0) {
          const churchIds = pastorChurches.map(c => c.id);
          const { data } = await supabase
            .from("visitors")
            .select("status")
            .in("church_id", churchIds);
          visitors = data;
        }
      } else {
        // Outros usuários veem apenas da sua igreja
        const { data: profile } = await supabase
          .from("profiles")
          .select("church_id")
          .eq("id", user.id)
          .single();

        if (!profile?.church_id) return;

        const { data } = await supabase
          .from("visitors")
          .select("status")
          .eq("church_id", profile.church_id);
        visitors = data;
      }

      if (visitors) {
        const total = visitors.length;
        const newMembers = visitors.filter((v) => v.status === "novo_membro" || v.status === "engajado").length;
        const inFollowUp = visitors.filter((v) => v.status === "em_acompanhamento").length;
        const conversionRate = total > 0 ? ((newMembers / total) * 100).toFixed(1) : "0";

        setStats({
          totalVisitors: total,
          newMembers,
          inFollowUp,
          conversionRate: `${conversionRate}%`,
        });

        const visitante = visitors.filter((v) => v.status === "visitante").length;
        const interessado = visitors.filter((v) => v.status === "interessado").length;
        const emAcomp = visitors.filter((v) => v.status === "em_acompanhamento").length;
        const novoMembro = visitors.filter((v) => v.status === "novo_membro").length;
        const engajado = visitors.filter((v) => v.status === "engajado").length;

        setPipelineData([
          { title: "Visitante", count: visitante, color: "blue-500", percentage: total > 0 ? Math.round((visitante / total) * 100) : 0 },
          { title: "Interessado", count: interessado, color: "purple-500", percentage: total > 0 ? Math.round((interessado / total) * 100) : 0 },
          { title: "Em Acompanhamento", count: emAcomp, color: "indigo-500", percentage: total > 0 ? Math.round((emAcomp / total) * 100) : 0 },
          { title: "Novo Membro", count: novoMembro, color: "violet-500", percentage: total > 0 ? Math.round((novoMembro / total) * 100) : 0 },
          { title: "Engajado", count: engajado, color: "fuchsia-500", percentage: total > 0 ? Math.round((engajado / total) * 100) : 0 },
        ]);
      }
    };

    fetchStats();
  }, [user, isAdmin, isPastor]);

  const statsCards = [
    { title: "Total de Visitantes", value: stats.totalVisitors, icon: Users, trend: { value: 0, isPositive: true }, color: "primary" },
    { title: "Novos Membros", value: stats.newMembers, icon: UserPlus, trend: { value: 0, isPositive: true }, color: "primary" },
    { title: "Em Acompanhamento", value: stats.inFollowUp, icon: TrendingUp, trend: { value: 0, isPositive: true }, color: "primary" },
    { title: "Taxa de Conversão", value: stats.conversionRate, icon: BarChart3, trend: { value: 0, isPositive: true }, color: "primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 md:p-8 animate-fade-in">
        <ModernHeader
          title="Dashboard"
          description="Acompanhe as métricas e estatísticas do sistema"
          icon={BarChart3}
          colorScheme="blue-purple"
        />

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
    </div>
  );
}
