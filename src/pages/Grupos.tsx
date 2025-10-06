import { UsersRound, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Grupos() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Grupos de Assistência</h1>
          <p className="text-muted-foreground">Gerencie células e grupos de acompanhamento</p>
        </div>
        <Button className="gap-2 btn-hover-lift bg-gradient-to-r from-primary to-primary-glow">
          <Plus className="w-4 h-4" />
          Novo Grupo
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-8 text-center">
        <UsersRound className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Em breve: Cadastro de grupos e atribuição de líderes</p>
      </div>
    </div>
  );
}
