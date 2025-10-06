import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Visitantes from "./pages/Visitantes";
import Igrejas from "./pages/Igrejas";
import Grupos from "./pages/Grupos";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import Regioes from "./pages/Regioes";
import Areas from "./pages/Areas";
import Importacao from "./pages/Importacao";
import GerenciarFuncoes from "./pages/GerenciarFuncoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import logoAprisco from "@/assets/logo-aprisco.png";
import React from "react";
import { supabase } from "@/integrations/supabase/client";
const queryClient = new QueryClient();
const AppLayout = () => {
  const {
    user,
    signOut
  } = useAuth();
  const [userFullName, setUserFullName] = React.useState<string>("");

  React.useEffect(() => {
    if (!user) return;
    
    const fetchUserProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();
      
      if (profile?.full_name) {
        setUserFullName(profile.full_name);
      }
    };

    fetchUserProfile();
  }, [user]);

  const getUserInitials = () => {
    if (!userFullName) return "U";
    const names = userFullName.split(" ");
    return names.length > 1 
      ? (names[0][0] + names[names.length - 1][0]).toUpperCase()
      : names[0].substring(0, 2).toUpperCase();
  };

  return <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b border-border bg-white shadow-sm sticky top-0 z-10 flex items-center justify-end px-4 md:px-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <span className="text-sm font-medium text-foreground">{userFullName || user?.email}</span>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card">
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 overflow-x-hidden p-4 md:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/visitantes" element={<Visitantes />} />
              <Route path="/igrejas" element={<Igrejas />} />
              <Route path="/grupos" element={<Grupos />} />
              <Route path="/usuarios" element={<Usuarios />} />
              <Route path="/regioes" element={<Regioes />} />
              <Route path="/areas" element={<Areas />} />
              <Route path="/importacao" element={<Importacao />} />
              <Route path="/configuracoes" element={<Configuracoes />} />
              <Route path="/gerenciar-funcoes" element={<GerenciarFuncoes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>;
};
const App = () => <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/*" element={<ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;