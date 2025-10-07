import { Home, Users, Building2, UserCog, UsersRound, Settings, MapPin, Map, Upload, Shield, FileBarChart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAprisco from "@/assets/logo-aprisco.png";
const menuItems = [{
  title: "Dashboard",
  url: "/",
  icon: Home
}, {
  title: "Visitantes",
  url: "/visitantes",
  icon: Users
}, {
  title: "Regiões",
  url: "/regioes",
  icon: MapPin
}, {
  title: "Áreas",
  url: "/areas",
  icon: Map
}, {
  title: "Igrejas",
  url: "/igrejas",
  icon: Building2
}, {
  title: "Grupos",
  url: "/grupos",
  icon: UsersRound
}, {
  title: "Usuários",
  url: "/usuarios",
  icon: UserCog
}];
export function AppSidebar() {
  const { setOpenMobile } = useSidebar();
  const isMobile = useIsMobile();

  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return <Sidebar className="border-r border-border bg-background" collapsible="icon">
      <SidebarContent>
        <div className="p-4 md:p-6 flex items-center justify-center">
          <img src={logoAprisco} alt="APRISCO" className="h-40 md:h-30 w-auto" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-base">Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end onClick={handleMenuClick} className={({
                  isActive
                }) => isActive ? "bg-primary/10 text-primary border-l-4 border-primary text-lg" : "text-lg"}>
                      <item.icon className="w-6 h-6" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-base">Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/importacao" onClick={handleMenuClick} className={({
                  isActive
                }) => isActive ? "bg-primary/10 text-primary border-l-4 border-primary text-lg" : "text-lg"}>
                    <Upload className="w-6 h-6" />
                    <span>Importação</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/relatorios" onClick={handleMenuClick} className={({
                  isActive
                }) => isActive ? "bg-primary/10 text-primary border-l-4 border-primary text-lg" : "text-lg"}>
                    <FileBarChart className="w-6 h-6" />
                    <span>Relatórios</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/gerenciar-funcoes" onClick={handleMenuClick} className={({
                  isActive
                }) => isActive ? "bg-primary/10 text-primary border-l-4 border-primary text-lg" : "text-lg"}>
                    <Shield className="w-6 h-6" />
                    <span>Gerenciar Funções</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/configuracoes" onClick={handleMenuClick} className={({
                  isActive
                }) => isActive ? "bg-primary/10 text-primary border-l-4 border-primary text-lg" : "text-lg"}>
                    <Settings className="w-6 h-6" />
                    <span>Configurações</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>;
}