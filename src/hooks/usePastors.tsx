import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Pastor {
  id: string;
  full_name: string;
  email: string;
  role: string;
  region_id: string | null;
  area_id: string | null;
}

interface UsePastorsOptions {
  regionId?: string | null;
  areaId?: string | null;
}

export function usePastors(options?: UsePastorsOptions) {
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastors();
  }, [options?.regionId, options?.areaId]);

  const fetchPastors = async () => {
    setLoading(true);
    try {
      // Busca usuários com roles de pastor
      const { data: userRolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["pastor", "pastor_geral", "pastor_regiao", "pastor_coordenador"]);

      if (rolesError) {
        console.error("Error fetching pastor roles:", rolesError);
        setPastors([]);
        setLoading(false);
        return;
      }

      if (!userRolesData || userRolesData.length === 0) {
        setPastors([]);
        setLoading(false);
        return;
      }

      // Busca os perfis dos usuários
      const userIds = userRolesData.map(ur => ur.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, region_id, area_id")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching pastor profiles:", profilesError);
        setPastors([]);
        setLoading(false);
        return;
      }

      // Combina roles com profiles
      const pastorsList: Pastor[] = profilesData.map(profile => {
        const userRole = userRolesData.find(ur => ur.user_id === profile.id);
        return {
          id: profile.id,
          full_name: profile.full_name || profile.email,
          email: profile.email,
          role: userRole?.role || "pastor",
          region_id: profile.region_id,
          area_id: profile.area_id,
        };
      });

      // Aplica filtros se fornecidos
      let filteredPastors = pastorsList;

      if (options?.areaId) {
        // Filtra pastores da área específica, da região da área, ou pastores gerais
        filteredPastors = pastorsList.filter(pastor => {
          // Pastores gerais (sem região/área)
          if (!pastor.region_id && !pastor.area_id && pastor.role === "pastor_geral") {
            return true;
          }
          // Pastores da área específica
          if (pastor.area_id === options.areaId) {
            return true;
          }
          // Pastores da região (precisa buscar a região da área)
          // Por enquanto, incluímos pastores de região
          if (pastor.role === "pastor_regiao" && !pastor.area_id) {
            return true;
          }
          return false;
        });
      } else if (options?.regionId) {
        // Filtra pastores da região específica ou pastores gerais
        filteredPastors = pastorsList.filter(pastor => {
          if (!pastor.region_id && !pastor.area_id && pastor.role === "pastor_geral") {
            return true;
          }
          if (pastor.region_id === options.regionId) {
            return true;
          }
          return false;
        });
      }

      setPastors(filteredPastors);
    } catch (error) {
      console.error("Error in fetchPastors:", error);
      setPastors([]);
    } finally {
      setLoading(false);
    }
  };

  return { pastors, loading, refetch: fetchPastors };
}
