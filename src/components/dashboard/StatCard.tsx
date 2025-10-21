import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, trend, color = "primary", iconColor }: StatCardProps) {
  return (
    <Card className="stat-card group p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium mb-2 line-clamp-2">{title}</p>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground tabular-nums">{value}</h3>
          {trend && (
            <p className={`text-xs mt-2 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        <div 
          className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          style={
            iconColor
              ? { background: `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)` }
              : { background: 'linear-gradient(to-br, hsl(var(--primary)), hsl(var(--primary-glow)))' }
          }
        >
          <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
        </div>
      </div>
    </Card>
  );
}
