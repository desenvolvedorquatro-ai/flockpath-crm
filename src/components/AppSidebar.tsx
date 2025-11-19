import { Home, Users, Building2, UserCog, UsersRound, Settings, MapPin, Map, Upload, Shield, FileBarChart, CheckSquare, Calendar, MessageSquare } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePermissions, type ModuleName } from "@/hooks/usePermissions";
import { useUserRole } from "@/hooks/useUserRole";
import logoAprisco from "@/assets/logo-aprisco.png";

type MenuItem = {
  title: string;
  url: string;
  icon: any;
  module?: ModuleName;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: Home
}, {
  title: "Visitantes",
  url: "/visitantes",
  icon: Users,
  module: "visitantes"
}, {
  title: "Regiões",
  url: "/regioes",
  icon: MapPin,
  module: "regioes"
}, {
  title: "Áreas",
  url: "/areas",
  icon: Map,
  module: "areas"
}, {
  title: "Igrejas",
  url: "/igrejas",
  icon: Building2,
  module: "igrejas"
}, {
  title: "Grupos",
  url: "/grupos",
  icon: UsersRound,
  module: "grupos"
}, {
  title: "Tarefas",
  url: "/tarefas",
  icon: CheckSquare,
  module: "tarefas"
}, {
  title: "Atendimento",
  url: "/atendimento",
  icon: MessageSquare,
  module: "atendimento"
}, {
  title: "Relatórios",
  url: "/relatorios",
  icon: FileBarChart
}, {
  title: "Mapa de Frequência",
  url: "/mapa-frequencia",
  icon: Calendar,
  module: "frequencia"
}];

const systemMenuItems: MenuItem[] = [{
  title: "Usuários",
  url: "/usuarios",
  icon: UserCog,
  module: "usuarios"
}, {
  title: "Importação",
  url: "/importacao",
  icon: Upload,
  module: "importacao"
}, {
  title: "Gerenciar Funções",
  url: "/gerenciar-funcoes",
  icon: Shield,
  adminOnly: true
}, {
  title: "Config. do Sistema",
  url: "/configuracoes-status",
  icon: Settings,
  adminOnly: true
}, {
  title: "Config. Usuário",
  url: "/configuracoes",
  icon: Settings
}];
export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();
  const { can, loading: permissionsLoading } = usePermissions();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filterMenuItems = (items: MenuItem[]) => {
    return items.filter(item => {
      // Items without module or adminOnly are always visible
      if (!item.module && !item.adminOnly) return true;
      
      // Admin-only items
      if (item.adminOnly) return isAdmin;
      
      // Module-based permissions
      if (item.module) return can(item.module, 'view');
      
      return true;
    });
  };

  const loading = permissionsLoading || roleLoading;
  const filteredMenuItems = filterMenuItems(menuItems);
  const filteredSystemItems = filterMenuItems(systemMenuItems);

  return <Sidebar className="border-r border-border bg-background" collapsible="icon">
      <SidebarContent>
        <div className="p-4 md:p-6 flex items-center justify-center">
          <img src={logoAprisco} alt="APRISCO" className="h-40 md:h-30 w-auto" />
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            {filteredMenuItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-base">Menu Principal</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredMenuItems.map(item => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} end onClick={handleMenuClick} className={({
                            isActive
                          }) => isActive ? "bg-primary/10 text-primary border-l-4 border-primary text-lg" : "text-lg"}>
                            <item.icon className="w-6 h-6" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {filteredSystemItems.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel className="text-base">Sistema</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {filteredSystemItems.map(item => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild>
                          <NavLink to={item.url} onClick={handleMenuClick} className={({
                            isActive
                          }) => isActive ? "bg-primary/10 text-primary border-l-4 border-primary text-lg" : "text-lg"}>
                            <item.icon className="w-6 h-6" />
                            <span>{item.title}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
    </Sidebar>;
}