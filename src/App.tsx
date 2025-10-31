import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ProtectedLayout } from "./components/ProtectedLayout";
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
const queryClient = new QueryClient();
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          
          {/* Rotas protegidas com layout aninhado */}
          <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/visitantes" element={<Visitantes />} />
            <Route path="/igrejas" element={<Igrejas />} />
            <Route path="/grupos" element={<Grupos />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/regioes" element={<Regioes />} />
            <Route path="/areas" element={<Areas />} />
            <Route path="/importacao" element={<Importacao />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/tarefas" element={<Tarefas />} />
            <Route path="/mapa-frequencia" element={<MapaFrequencia />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
            <Route path="/gerenciar-funcoes" element={<GerenciarFuncoes />} />
            <Route path="/configuracoes-status" element={<ConfiguracoesStatus />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;