import { Settings } from "lucide-react";

export default function Configuracoes() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground">Personalize o sistema de acordo com suas necessidades</p>
      </div>

      <div className="glass-card rounded-2xl p-8 text-center">
        <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">Em breve: Configurações do sistema</p>
      </div>
    </div>
  );
}
