import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Visitantes from "./pages/Visitantes";
import Igrejas from "./pages/Igrejas";
import Grupos from "./pages/Grupos";
import Usuarios from "./pages/Usuarios";
import Configuracoes from "./pages/Configuracoes";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarProvider defaultOpen>
                  <div className="min-h-screen flex w-full bg-background">
                    <AppSidebar />
                    <div className="flex-1 flex flex-col min-w-0">
                      <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center px-4 md:px-6">
                        <SidebarTrigger className="mr-2 md:mr-4" />
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs md:text-sm font-bold">IC</span>
                          </div>
                          <span className="font-semibold text-sm md:text-base text-foreground truncate">Igreja CRM</span>
                        </div>
                      </header>
                      <main className="flex-1 overflow-x-hidden">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/visitantes" element={<Visitantes />} />
                          <Route path="/igrejas" element={<Igrejas />} />
                          <Route path="/grupos" element={<Grupos />} />
                          <Route path="/usuarios" element={<Usuarios />} />
                          <Route path="/configuracoes" element={<Configuracoes />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
