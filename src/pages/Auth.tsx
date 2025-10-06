import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import logoAprisco from "@/assets/logo-aprisco.png";
import { UserPlus } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleCreateAdmin = async () => {
    setCreatingAdmin(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-admin-user');
      
      if (error) throw error;
      
      toast({
        title: "Usuário admin criado!",
        description: "Use admin@sistema.com / 123456 para fazer login",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao criar admin",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/10">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto mb-2">
            <img src={logoAprisco} alt="APRISCO" className="w-40 h-auto mx-auto" />
          </div>
          <CardDescription>Sistema de gestão de visitantes e membros</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-email">E-mail</Label>
              <Input
                id="signin-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signin-password">Senha</Label>
              <Input
                id="signin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full btn-hover-lift bg-gradient-to-r from-primary to-primary-glow"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Primeiro acesso</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleCreateAdmin}
              disabled={creatingAdmin}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {creatingAdmin ? "Criando..." : "Criar usuário admin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
