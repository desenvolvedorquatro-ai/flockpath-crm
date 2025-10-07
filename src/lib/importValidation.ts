import { supabase } from "@/integrations/supabase/client";

export interface ValidationResult {
  valid: Array<{ row: any; index: number }>;
  invalid: Array<{ row: any; index: number; errors: string[] }>;
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

// Validação de email
export const validateEmail = (email: string): boolean => {
  if (!email) return true; // email opcional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validação de telefone
export const validatePhone = (phone: string): boolean => {
  if (!phone) return true; // telefone opcional
  const phoneRegex = /^\(?([0-9]{2})\)?[-. ]?([0-9]{4,5})[-. ]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ""));
};

// Validação de data
export const validateDate = (date: string): boolean => {
  if (!date) return true; // data opcional
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  const parsedDate = new Date(date);
  return !isNaN(parsedDate.getTime());
};

// Verificar existência de região
export const validateRegionExists = async (regionName: string): Promise<boolean> => {
  if (!regionName) return true;
  const { data } = await supabase
    .from("regions")
    .select("id")
    .eq("name", regionName)
    .maybeSingle();
  return !!data;
};

// Verificar existência de área
export const validateAreaExists = async (areaName: string): Promise<boolean> => {
  if (!areaName) return true;
  const { data } = await supabase
    .from("areas")
    .select("id")
    .eq("name", areaName)
    .maybeSingle();
  return !!data;
};

// Verificar existência de igreja
export const validateChurchExists = async (churchName: string): Promise<boolean> => {
  if (!churchName) return false;
  const { data } = await supabase
    .from("churches")
    .select("id")
    .eq("name", churchName)
    .maybeSingle();
  return !!data;
};

// Verificar existência de pastor
export const validatePastorExists = async (email: string): Promise<boolean> => {
  if (!email) return true;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return !!data;
};

// Validação para Regiões
const validateRegiao = async (row: any): Promise<string[]> => {
  const errors: string[] = [];

  if (!row.nome || String(row.nome).trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (row.pastor_email) {
    if (!validateEmail(row.pastor_email)) {
      errors.push("Email do pastor inválido");
    } else {
      const pastorExists = await validatePastorExists(row.pastor_email);
      if (!pastorExists) {
        errors.push("Pastor não encontrado no sistema");
      }
    }
  }

  return errors;
};

// Validação para Áreas
const validateArea = async (row: any): Promise<string[]> => {
  const errors: string[] = [];

  if (!row.nome || String(row.nome).trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (!row.nome_regiao || String(row.nome_regiao).trim() === "") {
    errors.push("Nome da região é obrigatório");
  } else {
    const regionExists = await validateRegionExists(row.nome_regiao);
    if (!regionExists) {
      errors.push(`Região '${row.nome_regiao}' não encontrada`);
    }
  }

  if (row.pastor_email) {
    if (!validateEmail(row.pastor_email)) {
      errors.push("Email do pastor inválido");
    } else {
      const pastorExists = await validatePastorExists(row.pastor_email);
      if (!pastorExists) {
        errors.push("Pastor não encontrado no sistema");
      }
    }
  }

  return errors;
};

// Validação para Igrejas
const validateIgreja = async (row: any): Promise<string[]> => {
  const errors: string[] = [];

  if (!row.nome || String(row.nome).trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (row.email && !validateEmail(row.email)) {
    errors.push("Email inválido");
  }

  if (row.telefone && !validatePhone(row.telefone)) {
    errors.push("Telefone inválido");
  }

  if (row.nome_regiao) {
    const regionExists = await validateRegionExists(row.nome_regiao);
    if (!regionExists) {
      errors.push(`Região '${row.nome_regiao}' não encontrada`);
    }
  }

  if (row.nome_area) {
    const areaExists = await validateAreaExists(row.nome_area);
    if (!areaExists) {
      errors.push(`Área '${row.nome_area}' não encontrada`);
    }
  }

  if (row.pastor_email) {
    if (!validateEmail(row.pastor_email)) {
      errors.push("Email do pastor inválido");
    } else {
      const pastorExists = await validatePastorExists(row.pastor_email);
      if (!pastorExists) {
        errors.push("Pastor não encontrado no sistema");
      }
    }
  }

  return errors;
};

// Validação para Visitantes
const validateVisitante = async (row: any): Promise<string[]> => {
  const errors: string[] = [];

  if (!row.nome || String(row.nome).trim() === "") {
    errors.push("Nome é obrigatório");
  }

  if (!row.nome_igreja || String(row.nome_igreja).trim() === "") {
    errors.push("Nome da igreja é obrigatório");
  } else {
    const churchExists = await validateChurchExists(row.nome_igreja);
    if (!churchExists) {
      errors.push(`Igreja '${row.nome_igreja}' não encontrada`);
    }
  }

  if (row.email && !validateEmail(row.email)) {
    errors.push("Email inválido");
  }

  if (row.telefone && !validatePhone(row.telefone)) {
    errors.push("Telefone inválido");
  }

  if (row.data_visita && !validateDate(row.data_visita)) {
    errors.push("Data de visita inválida (use formato AAAA-MM-DD)");
  }

  if (row.data_batismo && !validateDate(row.data_batismo)) {
    errors.push("Data de batismo inválida (use formato AAAA-MM-DD)");
  }

  // Validar status se fornecido
  if (row.status && !['visitante', 'em_assistencia', 'batizado'].includes(row.status)) {
    errors.push("Status inválido. Use: visitante, em_assistencia ou batizado");
  }

  // Validar categoria se fornecido
  if (row.categoria && !['crianca', 'intermediario', 'adolescente', 'jovem', 'senhora', 'varao', 'idoso'].includes(row.categoria)) {
    errors.push("Categoria inválida. Use: crianca, intermediario, adolescente, jovem, senhora, varao ou idoso");
  }

  return errors;
};

// Função principal de validação
export const validateImportData = async (
  jsonData: any[],
  type: string
): Promise<ValidationResult> => {
  const valid: Array<{ row: any; index: number }> = [];
  const invalid: Array<{ row: any; index: number; errors: string[] }> = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    let errors: string[] = [];

    switch (type) {
      case "regioes":
        errors = await validateRegiao(row);
        break;
      case "areas":
        errors = await validateArea(row);
        break;
      case "igrejas":
        errors = await validateIgreja(row);
        break;
      case "visitantes":
        errors = await validateVisitante(row);
        break;
    }

    if (errors.length === 0) {
      valid.push({ row, index: i });
    } else {
      invalid.push({ row, index: i, errors });
    }
  }

  return {
    valid,
    invalid,
    stats: {
      total: jsonData.length,
      valid: valid.length,
      invalid: invalid.length,
    },
  };
};
