import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";

export interface Region {
  id: string;
  name: string;
}

export interface Area {
  id: string;
  name: string;
  region_id: string;
}

export interface Church {
  id: string;
  name: string;
  area_id: string | null;
  region_id: string | null;
}

export interface AssistanceGroup {
  id: string;
  name: string;
  church_id: string;
  responsible_id: string | null;
}

export interface UserProfile {
  id: string;
  church_id: string | null;
  area_id: string | null;
  region_id: string | null;
}

export function useHierarchyFilters() {
  const { user } = useAuth();
  const { roles, isAdmin, hasRole } = useUserRole();
  
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Dados completos
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [groups, setGroups] = useState<AssistanceGroup[]>([]);
  
  // Valores selecionados
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedArea, setSelectedArea] = useState<string>("all");
  const [selectedChurch, setSelectedChurch] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  
  // Flags de bloqueio
  const [isRegionLocked, setIsRegionLocked] = useState(false);
  const [isAreaLocked, setIsAreaLocked] = useState(false);
  const [isChurchLocked, setIsChurchLocked] = useState(false);
  const [isGroupLocked, setIsGroupLocked] = useState(false);
  
  // Dados filtrados
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<AssistanceGroup[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadInitialData = async () => {
      try {
        setLoading(true);

        // Carregar perfil do usuário
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, church_id, area_id, region_id")
          .eq("id", user.id)
          .maybeSingle();

        setUserProfile(profile);

        // Carregar hierarquia completa
        const [regionsData, areasData, churchesData, groupsData] = await Promise.all([
          supabase.from("regions").select("*").order("name"),
          supabase.from("areas").select("*").order("name"),
          supabase.from("churches").select("*").order("name"),
          supabase.from("assistance_groups").select("*").order("name"),
        ]);

        setRegions(regionsData.data || []);
        setAreas(areasData.data || []);
        setChurches(churchesData.data || []);
        setGroups(groupsData.data || []);

        // Aplicar pré-seleção baseada no perfil
        await applyPreselection(profile, groupsData.data || []);
      } catch (error) {
        console.error("Erro ao carregar dados da hierarquia:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [user]);

  // Aplicar pré-seleção baseada no perfil e role do usuário
  const applyPreselection = async (profile: UserProfile | null, allGroups: AssistanceGroup[]) => {
    if (!profile || !user) return;

    // Admin e Pastor Geral: sem pré-seleção
    if (isAdmin || hasRole("pastor_geral")) {
      setIsRegionLocked(false);
      setIsAreaLocked(false);
      setIsChurchLocked(false);
      setIsGroupLocked(false);
      return;
    }

    // Pastor de Região
    if (hasRole("pastor_regiao") && profile.region_id) {
      setSelectedRegion(profile.region_id);
      setIsRegionLocked(true);
      return;
    }

    // Pastor Coordenador (Área)
    if (hasRole("pastor_coordenador") && profile.area_id && profile.region_id) {
      setSelectedRegion(profile.region_id);
      setSelectedArea(profile.area_id);
      setIsRegionLocked(true);
      setIsAreaLocked(true);
      return;
    }

    // Pastor de Igreja
    if (hasRole("pastor") && profile.church_id && profile.area_id && profile.region_id) {
      setSelectedRegion(profile.region_id);
      setSelectedArea(profile.area_id);
      setSelectedChurch(profile.church_id);
      setIsRegionLocked(true);
      setIsAreaLocked(true);
      setIsChurchLocked(true);
      return;
    }

    // Diácono GA (responsável por um grupo)
    if (hasRole("Diacono") && profile.church_id) {
      const myGroup = allGroups.find(g => g.responsible_id === user.id);
      
      if (myGroup) {
        setSelectedRegion(profile.region_id || "all");
        setSelectedArea(profile.area_id || "all");
        setSelectedChurch(profile.church_id);
        setSelectedGroup(myGroup.id);
        setIsRegionLocked(true);
        setIsAreaLocked(true);
        setIsChurchLocked(true);
        setIsGroupLocked(true);
        return;
      }
    }

    // Diácono sem GA, Obreiro, Usuário (grupos atribuídos em user_group_access)
    if ((hasRole("Diacono") || hasRole("obreiro") || hasRole("user")) && profile.church_id) {
      // Buscar grupos atribuídos
      const { data: userGroupAccess } = await supabase
        .from("user_group_access")
        .select("group_id")
        .eq("user_id", user.id);

      if (userGroupAccess && userGroupAccess.length > 0) {
        const firstGroupId = userGroupAccess[0].group_id;
        
        setSelectedRegion(profile.region_id || "all");
        setSelectedArea(profile.area_id || "all");
        setSelectedChurch(profile.church_id);
        setSelectedGroup(firstGroupId);
        setIsRegionLocked(true);
        setIsAreaLocked(true);
        setIsChurchLocked(true);
        setIsGroupLocked(false); // Pode trocar entre grupos atribuídos
        
        // Filtrar apenas grupos atribuídos
        const assignedGroupIds = userGroupAccess.map(uga => uga.group_id);
        setFilteredGroups(allGroups.filter(g => assignedGroupIds.includes(g.id)));
        return;
      }

      // Se não tem grupos atribuídos, bloquear até a igreja
      setSelectedRegion(profile.region_id || "all");
      setSelectedArea(profile.area_id || "all");
      setSelectedChurch(profile.church_id);
      setIsRegionLocked(true);
      setIsAreaLocked(true);
      setIsChurchLocked(true);
    }
  };

  // Filtragem cascata: Região -> Área -> Igreja -> Grupo
  useEffect(() => {
    if (selectedRegion && selectedRegion !== "all") {
      const filtered = areas.filter(a => a.region_id === selectedRegion);
      setFilteredAreas(filtered);
      
      // Limpar seleção de área se não for bloqueada e não existir na nova região
      if (!isAreaLocked && selectedArea !== "all" && !filtered.find(a => a.id === selectedArea)) {
        setSelectedArea("all");
      }
    } else {
      setFilteredAreas(areas);
    }
  }, [selectedRegion, areas, isAreaLocked, selectedArea]);

  useEffect(() => {
    if (selectedArea && selectedArea !== "all") {
      const filtered = churches.filter(c => c.area_id === selectedArea);
      setFilteredChurches(filtered);
      
      // Limpar seleção de igreja se não for bloqueada e não existir na nova área
      if (!isChurchLocked && selectedChurch !== "all" && !filtered.find(c => c.id === selectedChurch)) {
        setSelectedChurch("all");
      }
    } else if (selectedRegion && selectedRegion !== "all") {
      const filtered = churches.filter(c => c.region_id === selectedRegion);
      setFilteredChurches(filtered);
    } else {
      setFilteredChurches(churches);
    }
  }, [selectedArea, selectedRegion, churches, isChurchLocked, selectedChurch]);

  useEffect(() => {
    // Se já tem grupos filtrados (usuário com grupos atribuídos), não refiltrar
    if (filteredGroups.length > 0 && isGroupLocked === false) {
      return;
    }

    if (selectedChurch && selectedChurch !== "all") {
      const filtered = groups.filter(g => g.church_id === selectedChurch);
      setFilteredGroups(filtered);
      
      // Limpar seleção de grupo se não for bloqueada e não existir na nova igreja
      if (!isGroupLocked && selectedGroup !== "all" && !filtered.find(g => g.id === selectedGroup)) {
        setSelectedGroup("all");
      }
    } else {
      // Se não filtrou antes (grupos atribuídos), mostrar todos
      if (filteredGroups.length === 0 || isGroupLocked) {
        setFilteredGroups(groups);
      }
    }
  }, [selectedChurch, groups, isGroupLocked, selectedGroup]);

  // Funções para atualizar seleção
  const handleSetSelectedRegion = (value: string) => {
    if (!isRegionLocked) {
      setSelectedRegion(value);
      if (!isAreaLocked) setSelectedArea("all");
      if (!isChurchLocked) setSelectedChurch("all");
      if (!isGroupLocked) setSelectedGroup("all");
    }
  };

  const handleSetSelectedArea = (value: string) => {
    if (!isAreaLocked) {
      setSelectedArea(value);
      if (!isChurchLocked) setSelectedChurch("all");
      if (!isGroupLocked) setSelectedGroup("all");
    }
  };

  const handleSetSelectedChurch = (value: string) => {
    if (!isChurchLocked) {
      setSelectedChurch(value);
      if (!isGroupLocked) setSelectedGroup("all");
    }
  };

  const handleSetSelectedGroup = (value: string) => {
    if (!isGroupLocked) {
      setSelectedGroup(value);
    }
  };

  return {
    // Valores selecionados
    selectedRegion,
    selectedArea,
    selectedChurch,
    selectedGroup,
    
    // Dados completos
    regions,
    areas,
    churches,
    groups,
    
    // Dados filtrados
    filteredAreas,
    filteredChurches,
    filteredGroups,
    
    // Flags de bloqueio
    isRegionLocked,
    isAreaLocked,
    isChurchLocked,
    isGroupLocked,
    
    // Funções de atualização
    setSelectedRegion: handleSetSelectedRegion,
    setSelectedArea: handleSetSelectedArea,
    setSelectedChurch: handleSetSelectedChurch,
    setSelectedGroup: handleSetSelectedGroup,
    
    // Estado
    loading,
    userProfile,
  };
}
