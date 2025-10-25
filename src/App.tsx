import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
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
import ConfiguracoesStatus from "./pages/ConfiguracoesStatus";
import Relatorios from "./pages/Relatorios";
import Tarefas from "./pages/Tarefas";
import MapaFrequencia from "./pages/MapaFrequencia";
import Auth from "./pages/Auth";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Building2, LogOut } from "lucide-react";
import logoAprisco from "@/assets/logo-aprisco.png";
import { supabase } from "@/integrations/supabase/client";
const queryClient = new QueryClient();
const AppLayout = () => {
  const {
    user,
    signOut
  } = useAuth();
  const location = useLocation();
  const [userFullName, setUserFullName] = React.useState<string>("");
  const [userChurchInfo, setUserChurchInfo] = React.useState<string>("");

  React.useEffect(() => {
    if (!user) return;
    
    const fetchUserProfile = async () => {
      // Verificar se é admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isAdmin = roles?.some(r => r.role === "admin");

      const { data: profile } = await supabase
        .from("profiles")
        .select(`
          full_name,
          church_id,
          churches (
            name,
            area_id,
            region_id,
            areas (
              name
            ),
            regions (
              name
            )
          )
        `)
        .eq("id", user.id)
        .maybeSingle();
      
      if (profile?.full_name) {
        setUserFullName(profile.full_name);
      }

      // Admin não precisa ter igreja, então não exibir
      if (isAdmin) {
        setUserChurchInfo("");
        return;
      }

      // Montar informações da igreja para não-admin
      if (profile?.churches) {
        const church = profile.churches as any;
        const churchName = church.name || "";
        const areaName = church.areas?.name || "";
        const regionName = church.regions?.name || "";
        
        const parts = [];
        if (regionName) parts.push(regionName);
        if (areaName) parts.push(areaName);
        if (churchName) parts.push(churchName);
        
        setUserChurchInfo(parts.join(" | "));
      } else {
        setUserChurchInfo("");
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
          <header className="h-12 border-b border-border bg-white shadow-sm sticky top-0 z-10 flex items-center justify-between px-3 md:px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              {userChurchInfo && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="w-3.5 h-3.5" />
                  <span className="font-medium">{userChurchInfo}</span>
                </div>
              )}
            </div>
            <div className="flex-1" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="text-xs font-medium text-foreground hidden md:inline">{userFullName || user?.email}</span>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
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
          <main className="flex-1 overflow-x-hidden p-3 md:p-4 lg:p-6">
            {location.pathname === "/dashboard" && <Dashboard />}
            {location.pathname === "/visitantes" && <Visitantes />}
            {location.pathname === "/igrejas" && <Igrejas />}
            {location.pathname === "/grupos" && <Grupos />}
            {location.pathname === "/usuarios" && <Usuarios />}
            {location.pathname === "/regioes" && <Regioes />}
            {location.pathname === "/areas" && <Areas />}
            {location.pathname === "/importacao" && <Importacao />}
            {location.pathname === "/relatorios" && <Relatorios />}
            {location.pathname === "/tarefas" && <Tarefas />}
            {location.pathname === "/mapa-frequencia" && <MapaFrequencia />}
            {location.pathname === "/configuracoes" && <Configuracoes />}
            {location.pathname === "/gerenciar-funcoes" && <GerenciarFuncoes />}
            {location.pathname === "/configuracoes-status" && <ConfiguracoesStatus />}
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
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/visitantes" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/igrejas" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/grupos" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/regioes" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/areas" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/importacao" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/tarefas" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/mapa-frequencia" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/gerenciar-funcoes" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="/configuracoes-status" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>;
export default App;