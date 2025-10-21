// Sistema centralizado de status de visitantes

export const statusOptions = [
  { value: "interessado", label: "Interessado" },
  { value: "visitante", label: "Visitante" },
  { value: "visitante_frequente", label: "Visitante Frequente" },
  { value: "candidato_batismo", label: "Candidato a Batismo" },
  { value: "membro", label: "Membro" },
] as const;

export const statusColors: Record<string, string> = {
  interessado: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  visitante: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  visitante_frequente: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  candidato_batismo: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  membro: "bg-green-500/10 text-green-500 border-green-500/20",
};

export const statusLabels: Record<string, string> = {
  interessado: "Interessado",
  visitante: "Visitante",
  visitante_frequente: "Visitante Frequente",
  candidato_batismo: "Candidato a Batismo",
  membro: "Membro",
};

export const statusHexColors: Record<string, string> = {
  interessado: "#6B7280", // Cinza
  visitante: "#3B82F6", // Azul
  visitante_frequente: "#8B5CF6", // Roxo/Violeta
  candidato_batismo: "#F59E0B", // Laranja
  membro: "#10B981", // Verde
};

// Cor para taxa de conversão
export const conversionRateColor = "#EC4899"; // Rosa
