import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown } from "lucide-react";
import { statusHexColors } from "@/lib/visitorStatus";

interface FunnelStage {
  title: string;
  count: number;
  percentage: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
  isLoading?: boolean;
}

export function FunnelChart({ stages, isLoading = false }: FunnelChartProps) {
  const maxCount = stages.length > 0 ? stages[0].count : 1;
  
  // Calculate dynamic height based on number of stages for optimal UX
  const getItemHeight = () => {
    if (stages.length <= 2) return "70px";
    if (stages.length <= 3) return "58px";
    if (stages.length <= 4) return "50px";
    if (stages.length <= 5) return "44px";
    return "38px";
  };

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-border shadow-apple-lg bg-gradient-to-br from-card via-card to-card/95">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <div className="p-4 pt-0 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" style={{ width: `${100 - i * 15}%`, margin: '0 auto' }} />
          ))}
        </div>
      </Card>
    );
  }

  if (stages.length === 0) {
    return (
      <Card className="overflow-hidden border-border shadow-apple-lg bg-gradient-to-br from-card via-card to-card/95">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <div className="p-8 text-center text-muted-foreground">
          Nenhum dado disponível para exibir
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border shadow-apple-lg bg-gradient-to-br from-card via-card to-card/95 transition-smooth hover:shadow-apple-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      
      <div className="px-4 pb-3 space-y-1 max-h-[380px] overflow-hidden">
        {stages.map((stage, index) => {
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const minWidth = 25; // Minimum width for visibility and accessibility
          const actualWidth = Math.max(widthPercentage, stage.count > 0 ? minWidth : 0);
          
          // Map stage titles to dashboard icon colors
          const getStageColor = (title: string) => {
            const colorMap: Record<string, string> = {
              'Visitante': 'from-blue-500 via-blue-600 to-blue-700',      // Azul (#3B82F6)
              'Em Assistência': 'from-orange-500 via-orange-600 to-orange-700', // Laranja (#F59E0B)
              'Batizados': 'from-green-500 via-green-600 to-green-700',   // Verde (#10B981)
            };
            return colorMap[title] || 'from-primary via-primary to-primary-glow';
          };

          return (
            <div 
              key={stage.title} 
              className="relative group"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeIn 0.5s ease-out forwards',
              }}
            >
              <div
                className={`
                  mx-auto rounded-xl relative overflow-hidden
                  transition-all duration-500 ease-out
                  bg-gradient-to-r ${getStageColor(stage.title)}
                  hover:scale-[1.02] hover:shadow-glow
                  cursor-pointer
                  border-2 border-primary/20 hover:border-primary/40
                `}
                style={{
                  width: `${actualWidth}%`,
                  height: getItemHeight(),
                }}
              >
                {/* Animated shine effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                
                {/* Content container */}
                <div className="relative h-full flex items-center justify-center px-3 py-1.5">
                  <div className="flex flex-col items-center justify-center text-center w-full gap-1">
                    {/* Stage title */}
                    <span className="text-white font-semibold text-xs md:text-sm leading-tight tracking-wide drop-shadow-sm">
                      {stage.title}
                    </span>
                    
                    {/* Metrics */}
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-white text-lg md:text-xl font-bold drop-shadow-md tabular-nums">
                        {stage.count}
                      </span>
                      <span className="text-white/90 text-xs md:text-sm font-medium bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {stage.percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Connector line between stages */}
              {index < stages.length - 1 && (
                <div className="flex justify-center my-1">
                  <div className="w-0.5 h-2 bg-gradient-to-b from-border to-transparent" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
