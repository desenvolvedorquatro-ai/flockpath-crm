import { Card } from "@/components/ui/card";

interface FunnelStage {
  title: string;
  count: number;
  percentage: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const maxCount = stages.length > 0 ? stages[0].count : 1;
  const itemHeight = stages.length <= 3 ? "clamp(50px, 7vh, 75px)" : "clamp(40px, 5vh, 60px)";

  return (
    <Card className="p-4 md:p-6 bg-card border border-border shadow-apple-lg max-h-[500px] flex flex-col overflow-hidden">
      <div className="space-y-1.5 flex-1 flex flex-col justify-start min-h-0">
        {stages.map((stage, index) => {
          const widthPercentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0;
          const minWidth = 20; // Minimum width percentage for visibility
          const actualWidth = Math.max(widthPercentage, stage.count > 0 ? minWidth : 0);

          return (
            <div key={stage.title} className="relative">
              <div
                className="mx-auto transition-all duration-500 rounded-lg shadow-md hover:shadow-lg relative overflow-hidden group"
                style={{
                  width: `${actualWidth}%`,
                  height: itemHeight,
                  background: `linear-gradient(135deg, ${stage.color} 0%, ${stage.color}dd 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="relative h-full flex flex-col justify-center items-center text-center px-3 md:px-4 py-2">
                  <span className="text-white font-semibold text-xs md:text-sm leading-tight">
                    {stage.title}
                  </span>
                  <div className="mt-1 flex flex-col md:flex-row md:items-center md:gap-2">
                    <span className="text-white text-lg md:text-2xl font-bold">
                      {stage.count}
                    </span>
                    <span className="text-white/90 text-xs md:text-sm">
                      ({stage.percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
