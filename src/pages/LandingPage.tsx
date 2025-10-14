import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, BarChart3, Calendar, UsersRound, Shield, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoAprisco from "@/assets/logo-aprisco.png";

const features = [
  {
    icon: Building2,
    title: "Gestão de Igrejas",
    description: "Organize regiões, áreas e igrejas de forma hierárquica e eficiente"
  },
  {
    icon: Users,
    title: "Controle de Membros",
    description: "Gerencie membros e visitantes com histórico completo de interações"
  },
  {
    icon: BarChart3,
    title: "Relatórios Completos",
    description: "Visualize estatísticas e métricas detalhadas em tempo real"
  },
  {
    icon: Calendar,
    title: "Mapa de Frequência",
    description: "Acompanhe presença e atividades de forma visual e intuitiva"
  },
  {
    icon: UsersRound,
    title: "Grupos de Assistência",
    description: "Organize grupos e líderes com sistema de responsabilidades"
  },
  {
    icon: Shield,
    title: "Controle de Acesso",
    description: "Permissões hierárquicas com segurança e flexibilidade"
  }
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <img 
          src={logoAprisco} 
          alt="APRISCO" 
          className="h-24 md:h-32 mb-8 animate-fade-in" 
        />
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-center mb-6 animate-fade-in-up">
          <span className="gradient-text">Sistema APRISCO</span>
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl text-center mb-10 animate-fade-in-up px-4" style={{ animationDelay: "100ms" }}>
          Gerencie suas igrejas, membros e visitantes com eficiência e organização em um único lugar
        </p>
        <Button 
          size="lg" 
          className="btn-hover-lift shadow-glow text-lg px-8 py-6 animate-scale-in"
          style={{ animationDelay: "200ms" }}
          onClick={() => navigate("/auth")}
        >
          Realizar Login
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Funcionalidades
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar sua comunidade de forma profissional
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className="stat-card hover-scale border-2 transition-all duration-300 hover:border-primary/20 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader>
                  <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Pronto para começar?
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 px-4">
            Acesse o sistema e transforme a gestão da sua comunidade
          </p>
          <Button 
            size="lg" 
            className="btn-hover-lift shadow-glow text-lg px-8 py-6"
            onClick={() => navigate("/auth")}
          >
            Começar Agora
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground border-t bg-background">
        <p className="text-sm md:text-base">
          © 2025 APRISCO. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
