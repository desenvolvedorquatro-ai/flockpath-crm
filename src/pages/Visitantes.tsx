import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Visitantes() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Visitantes</h1>
          <p className="text-muted-foreground">Gerencie todos os visitantes e membros</p>
        </div>
        <Button className="gap-2 btn-hover-lift bg-gradient-to-r from-primary to-primary-glow">
          <UserPlus className="w-4 h-4" />
          Novo Visitante
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">Em breve: Lista completa de visitantes com filtros e busca</p>
      </div>
    </div>
  );
}
