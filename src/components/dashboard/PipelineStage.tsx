import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PipelineStageProps {
  title: string;
  count: number;
  color: string;
  percentage?: number;
}

export function PipelineStage({ title, count, color, percentage }: PipelineStageProps) {
  return (
    <Card className="pipeline-stage">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm text-foreground">{title}</h4>
        <Badge variant="secondary" className="text-xs">{count}</Badge>
      </div>
      <div className="w-full bg-secondary rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full bg-gradient-to-r from-${color} to-${color}/80 transition-all`}
          style={{ width: `${percentage || 0}%` }}
        />
      </div>
      {percentage !== undefined && (
        <p className="text-xs text-muted-foreground">{percentage}% do total</p>
      )}
    </Card>
  );
}
