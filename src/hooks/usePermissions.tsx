import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export type ModuleName = "visitantes" | "igrejas" | "regioes" | "areas" | "grupos" | "usuarios" | "importacao";
export type PermissionAction = "view" | "create" | "edit" | "delete";

interface Permission {
  module: ModuleName;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export function usePermissions() {
  const { roles, loading: rolesLoading } = useUserRole();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (rolesLoading) return;

    const fetchPermissions = async () => {
      if (roles.length === 0) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("role_permissions")
        .select("*")
        .in("role_name", roles);

      if (error) {
        console.error("Error fetching permissions:", error);
        setPermissions([]);
      } else {
        setPermissions((data as Permission[]) || []);
      }
      setLoading(false);
    };

    fetchPermissions();
  }, [roles, rolesLoading]);

  const can = (module: ModuleName, action: PermissionAction): boolean => {
    if (loading) return false;
    
    // Admins têm permissão total
    if (roles.includes("admin")) return true;

    // Busca permissão específica para o módulo
    const modulePermissions = permissions.filter((p) => p.module === module);
    
    if (modulePermissions.length === 0) return false;

    // Se qualquer role tiver a permissão, retorna true
    return modulePermissions.some((p) => {
      switch (action) {
        case "view":
          return p.can_view;
        case "create":
          return p.can_create;
        case "edit":
          return p.can_edit;
        case "delete":
          return p.can_delete;
        default:
          return false;
      }
    });
  };

  return { can, permissions, loading };
}
