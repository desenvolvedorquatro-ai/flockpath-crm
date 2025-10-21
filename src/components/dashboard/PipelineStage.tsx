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
    <Card className="pipeline-stage p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <h4 className="font-semibold text-sm text-foreground line-clamp-1">{title}</h4>
        <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">{count}</Badge>
      </div>
      <div className="w-full bg-secondary rounded-full h-2.5 mb-2">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all"
          style={{ width: `${percentage || 0}%` }}
        />
      </div>
      {percentage !== undefined && (
        <p className="text-sm text-muted-foreground font-medium">{percentage}% do total</p>
      )}
    </Card>
  );
}
