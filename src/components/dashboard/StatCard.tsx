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
    <Card className="stat-card group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
          <h3 className="text-xl md:text-2xl font-bold mt-1 text-foreground">{value}</h3>
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </p>
          )}
        </div>
        <div 
          className="w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
          style={
            iconColor
              ? { background: `linear-gradient(135deg, ${iconColor}, ${iconColor}dd)` }
              : { background: 'linear-gradient(to-br, hsl(var(--primary)), hsl(var(--primary-glow)))' }
          }
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </Card>
  );
}
