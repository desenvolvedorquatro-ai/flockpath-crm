import { Users, UserPlus, UserCheck, TrendingUp, Building2 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { PipelineStage } from "@/components/dashboard/PipelineStage";

export default function Dashboard() {
  // Mock data - will be replaced with real data from backend
  const stats = [
    {
      title: "Total de Visitantes",
      value: 248,
      icon: Users,
      trend: { value: 12, isPositive: true },
      color: "primary"
    },
    {
      title: "Novos este Mês",
      value: 42,
      icon: UserPlus,
      trend: { value: 8, isPositive: true },
      color: "primary"
    },
    {
      title: "Novos Membros",
      value: 18,
      icon: UserCheck,
      trend: { value: 15, isPositive: true },
      color: "primary"
    },
    {
      title: "Taxa de Conversão",
      value: "7.3%",
      icon: TrendingUp,
      trend: { value: 3, isPositive: true },
      color: "primary"
    },
  ];

  const pipelineStages = [
    { title: "Visitante (1ª vez)", count: 85, color: "blue-500", percentage: 34 },
    { title: "Interessado", count: 62, color: "purple-500", percentage: 25 },
    { title: "Em Acompanhamento", count: 48, color: "indigo-500", percentage: 19 },
    { title: "Novo Membro", count: 35, color: "violet-500", percentage: 14 },
    { title: "Engajado", count: 18, color: "fuchsia-500", percentage: 8 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Visão geral da jornada de visitantes
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={stat.title}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <StatCard {...stat} />
            </div>
          ))}
        </div>

        {/* Pipeline Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Funil de Conversão</h2>
              <p className="text-sm text-muted-foreground">
                Acompanhe a jornada dos visitantes
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pipelineStages.map((stage, index) => (
              <div
                key={stage.title}
                className="animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <PipelineStage {...stage} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">
              Atividade Recente
            </h3>
          </div>
          <div className="space-y-3">
            {[
              { name: "João Silva", action: "cadastrado como visitante", time: "há 2 horas" },
              { name: "Maria Santos", action: "movida para Em Acompanhamento", time: "há 4 horas" },
              { name: "Pedro Oliveira", action: "tornou-se membro", time: "há 1 dia" },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div>
                  <p className="font-medium text-foreground">{activity.name}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
