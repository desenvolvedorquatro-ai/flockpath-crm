import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StatusConfig {
  value: string;
  label: string;
  color: string;
  hex_color: string;
  order_position: number;
  active: boolean;
}

interface CategoryConfig {
  value: string;
  label: string;
  order_position: number;
  active: boolean;
}

export function useVisitorConfig() {
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);

    // Buscar status ativos
    const { data: statusData } = await supabase
      .from("visitor_status_config")
      .select("*")
      .eq("active", true)
      .order("order_position");

    // Buscar categorias ativas
    const { data: categoryData } = await supabase
      .from("visitor_category_config")
      .select("*")
      .eq("active", true)
      .order("order_position");

    if (statusData) setStatuses(statusData);
    if (categoryData) setCategories(categoryData);

    setLoading(false);
  };

  // Converter para o formato usado nas options de select
  const statusOptions = statuses.map(s => ({ value: s.value, label: s.label }));
  const categoryOptions = categories.map(c => ({ value: c.value, label: c.label }));

  // Criar mapeamento de cores
  const statusColors: Record<string, string> = statuses.reduce((acc, s) => {
    acc[s.value] = s.color;
    return acc;
  }, {} as Record<string, string>);

  const statusHexColors: Record<string, string> = statuses.reduce((acc, s) => {
    acc[s.value] = s.hex_color;
    return acc;
  }, {} as Record<string, string>);

  // Criar mapeamento de labels
  const statusLabels: Record<string, string> = statuses.reduce((acc, s) => {
    acc[s.value] = s.label;
    return acc;
  }, {} as Record<string, string>);

  const categoryLabels: Record<string, string> = categories.reduce((acc, c) => {
    acc[c.value] = c.label;
    return acc;
  }, {} as Record<string, string>);

  return {
    statuses,
    categories,
    statusOptions,
    categoryOptions,
    statusColors,
    statusHexColors,
    statusLabels,
    categoryLabels,
    loading,
  };
}
