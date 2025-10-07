// Sistema centralizado de status de visitantes

export const statusOptions = [
  { value: "visitante", label: "Visitante" },
  { value: "em_assistencia", label: "Em Assistência" },
  { value: "batizado", label: "Batizados" },
] as const;

export const statusColors: Record<string, string> = {
  visitante: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  em_assistencia: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  batizado: "bg-green-500/10 text-green-500 border-green-500/20",
};

export const statusLabels: Record<string, string> = {
  visitante: "Visitante",
  em_assistencia: "Em Assistência",
  batizado: "Batizados",
};

export const statusHexColors: Record<string, string> = {
  visitante: "#3B82F6", // Azul
  em_assistencia: "#F59E0B", // Amarelo/Laranja
  batizado: "#10B981", // Verde
};

// Cor para taxa de conversão
export const conversionRateColor = "#8B5CF6"; // Roxo/Violeta
