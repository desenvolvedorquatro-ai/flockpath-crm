import { Home, Users, Building2, UserCog, UsersRound, Settings, MapPin, Map } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import logoAprisco from "@/assets/logo-aprisco.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Visitantes", url: "/visitantes", icon: Users },
  { title: "Regiões", url: "/regioes", icon: MapPin },
  { title: "Áreas", url: "/areas", icon: Map },
  { title: "Igrejas", url: "/igrejas", icon: Building2 },
  { title: "Grupos", url: "/grupos", icon: UsersRound },
  { title: "Usuários", url: "/usuarios", icon: UserCog },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-border bg-sidebar">
      <SidebarContent>
        <div className="p-6 flex items-center justify-center">
          <img src={logoAprisco} alt="APRISCO" className="h-12" />
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive ? "bg-primary/10 text-primary border-l-4 border-primary" : ""
                      }
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/configuracoes"
                    className={({ isActive }) =>
                      isActive ? "bg-primary/10 text-primary border-l-4 border-primary" : ""
                    }
                  >
                    <Settings className="w-5 h-5" />
                    <span>Configurações</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
