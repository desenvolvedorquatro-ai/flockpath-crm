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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate">{title}</h4>
        <Badge variant="secondary" className="text-xs w-fit">{count}</Badge>
      </div>
      <div className="w-full bg-secondary rounded-full h-2 mb-2">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
          style={{ width: `${percentage || 0}%` }}
        />
      </div>
      {percentage !== undefined && (
        <p className="text-xs text-muted-foreground">{percentage}% do total</p>
      )}
    </Card>
  );
}
