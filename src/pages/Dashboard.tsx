import { useEffect, useState } from "react";
import { BarChart3, Users, UserPlus, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PipelineStage } from "@/components/dashboard/PipelineStage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalVisitors: number;
  newMembers: number;
  inFollowUp: number;
  conversionRate: string;
}

export default function Dashboard() {
  const { user } = useAuth();
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
      const { data: profile } = await supabase
        .from("profiles")
        .select("church_id")
        .eq("id", user.id)
        .single();

      if (!profile?.church_id) return;

      const { data: visitors } = await supabase
        .from("visitors")
        .select("status")
        .eq("church_id", profile.church_id);

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
  }, [user]);

  const statsCards = [
    { title: "Total de Visitantes", value: stats.totalVisitors, icon: Users, trend: { value: 0, isPositive: true }, color: "primary" },
    { title: "Novos Membros", value: stats.newMembers, icon: UserPlus, trend: { value: 0, isPositive: true }, color: "primary" },
    { title: "Em Acompanhamento", value: stats.inFollowUp, icon: TrendingUp, trend: { value: 0, isPositive: true }, color: "primary" },
    { title: "Taxa de Conversão", value: stats.conversionRate, icon: BarChart3, trend: { value: 0, isPositive: true }, color: "primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 animate-fade-in">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da jornada de visitantes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={stat.title} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Funil de Conversão</h2>
              <p className="text-sm text-muted-foreground">Acompanhe a jornada dos visitantes</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
