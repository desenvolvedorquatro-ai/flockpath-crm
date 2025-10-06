import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewToggleProps {
  view: "card" | "list";
  onViewChange: (view: "card" | "list") => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-lg">
      <Button
        variant={view === "list" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("list")}
        className="gap-2"
      >
        <List className="w-4 h-4" />
        Lista
      </Button>
      <Button
        variant={view === "card" ? "default" : "ghost"}
        size="sm"
        onClick={() => onViewChange("card")}
        className="gap-2"
      >
        <LayoutGrid className="w-4 h-4" />
        Cards
      </Button>
    </div>
  );
}
