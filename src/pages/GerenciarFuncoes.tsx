import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ViewToggle } from "@/components/ViewToggle";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Edit, Trash2 } from "lucide-react";
import { ModuleName } from "@/hooks/usePermissions";
import { ModernHeader } from "@/components/ModernHeader";
import { cn } from "@/lib/utils";

interface RoleDefinition {
  id: string;
  role_name: string;
  display_name: string;
  description: string;
  color: string;
}

interface RolePermission {
  id: string;
  role_name: string;
  module: ModuleName;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

const MODULES: ModuleName[] = ["visitantes", "igrejas", "regioes", "areas", "grupos", "usuarios", "importacao", "interacoes", "tarefas", "frequencia", "config_status", "atendimento"];
const MODULE_LABELS: Record<ModuleName, string> = {
  visitantes: "Visitantes",
  igrejas: "Igrejas",
  regioes: "Regiões",
  areas: "Áreas",
  grupos: "Grupos",
  usuarios: "Usuários",
  importacao: "Importação",
  tarefas: "Tarefas",
  frequencia: "Mapa de Frequência",
  interacoes: "Interações",
  config_status: "Config. do Sistema",
  atendimento: "Atendimento",
};

// Mapeamento de cores Tailwind para hexadecimal
const TAILWIND_TO_HEX: Record<string, string> = {
  // Red
  'bg-red-300': '#FCA5A5',
  'bg-red-400': '#F87171',
  'bg-red-500': '#EF4444',
  'bg-red-600': '#DC2626',
  'bg-red-700': '#B91C1C',
  // Orange
  'bg-orange-300': '#FDBA74',
  'bg-orange-400': '#FB923C',
  'bg-orange-500': '#F97316',
  'bg-orange-600': '#EA580C',
  'bg-orange-700': '#C2410C',
  // Amber
  'bg-amber-300': '#FCD34D',
  'bg-amber-400': '#FBBF24',
  'bg-amber-500': '#F59E0B',
  'bg-amber-600': '#D97706',
  'bg-amber-700': '#B45309',
  // Yellow
  'bg-yellow-300': '#FDE047',
  'bg-yellow-400': '#FACC15',
  'bg-yellow-500': '#EAB308',
  'bg-yellow-600': '#CA8A04',
  'bg-yellow-700': '#A16207',
  // Lime
  'bg-lime-300': '#BEF264',
  'bg-lime-400': '#A3E635',
  'bg-lime-500': '#84CC16',
  'bg-lime-600': '#65A30D',
  'bg-lime-700': '#4D7C0F',
  // Green
  'bg-green-300': '#86EFAC',
  'bg-green-400': '#4ADE80',
  'bg-green-500': '#22C55E',
  'bg-green-600': '#16A34A',
  'bg-green-700': '#15803D',
  // Emerald
  'bg-emerald-300': '#6EE7B7',
  'bg-emerald-400': '#34D399',
  'bg-emerald-500': '#10B981',
  'bg-emerald-600': '#059669',
  'bg-emerald-700': '#047857',
  // Teal
  'bg-teal-300': '#5EEAD4',
  'bg-teal-400': '#2DD4BF',
  'bg-teal-500': '#14B8A6',
  'bg-teal-600': '#0D9488',
  'bg-teal-700': '#0F766E',
  // Cyan
  'bg-cyan-300': '#67E8F9',
  'bg-cyan-400': '#22D3EE',
  'bg-cyan-500': '#06B6D4',
  'bg-cyan-600': '#0891B2',
  'bg-cyan-700': '#0E7490',
  // Sky
  'bg-sky-300': '#7DD3FC',
  'bg-sky-400': '#38BDF8',
  'bg-sky-500': '#0EA5E9',
  'bg-sky-600': '#0284C7',
  'bg-sky-700': '#0369A1',
  // Blue
  'bg-blue-300': '#93C5FD',
  'bg-blue-400': '#60A5FA',
  'bg-blue-500': '#3B82F6',
  'bg-blue-600': '#2563EB',
  'bg-blue-700': '#1D4ED8',
  // Indigo
  'bg-indigo-300': '#A5B4FC',
  'bg-indigo-400': '#818CF8',
  'bg-indigo-500': '#6366F1',
  'bg-indigo-600': '#4F46E5',
  'bg-indigo-700': '#4338CA',
  // Violet
  'bg-violet-300': '#C4B5FD',
  'bg-violet-400': '#A78BFA',
  'bg-violet-500': '#8B5CF6',
  'bg-violet-600': '#7C3AED',
  'bg-violet-700': '#6D28D9',
  // Purple
  'bg-purple-300': '#D8B4FE',
  'bg-purple-400': '#C084FC',
  'bg-purple-500': '#A855F7',
  'bg-purple-600': '#9333EA',
  'bg-purple-700': '#7E22CE',
  // Fuchsia
  'bg-fuchsia-300': '#F0ABFC',
  'bg-fuchsia-400': '#E879F9',
  'bg-fuchsia-500': '#D946EF',
  'bg-fuchsia-600': '#C026D3',
  'bg-fuchsia-700': '#A21CAF',
  // Pink
  'bg-pink-300': '#F9A8D4',
  'bg-pink-400': '#F472B6',
  'bg-pink-500': '#EC4899',
  'bg-pink-600': '#DB2777',
  'bg-pink-700': '#BE185D',
  // Rose
  'bg-rose-300': '#FDA4AF',
  'bg-rose-400': '#FB7185',
  'bg-rose-500': '#F43F5E',
  'bg-rose-600': '#E11D48',
  'bg-rose-700': '#BE123C',
  // Gray
  'bg-gray-300': '#D1D5DB',
  'bg-gray-400': '#9CA3AF',
  'bg-gray-500': '#6B7280',
  'bg-gray-600': '#4B5563',
  'bg-gray-700': '#374151',
  // Slate
  'bg-slate-300': '#CBD5E1',
  'bg-slate-400': '#94A3B8',
  'bg-slate-500': '#64748B',
  'bg-slate-600': '#475569',
  'bg-slate-700': '#334155',
  // Zinc
  'bg-zinc-300': '#D4D4D8',
  'bg-zinc-400': '#A1A1AA',
  'bg-zinc-500': '#71717A',
  'bg-zinc-600': '#52525B',
  'bg-zinc-700': '#3F3F46',
  // Neutral
  'bg-neutral-300': '#D4D4D4',
  'bg-neutral-400': '#A3A3A3',
  'bg-neutral-500': '#737373',
  'bg-neutral-600': '#525252',
  'bg-neutral-700': '#404040',
  // Stone
  'bg-stone-300': '#D6D3D1',
  'bg-stone-400': '#A8A29E',
  'bg-stone-500': '#78716C',
  'bg-stone-600': '#57534E',
  'bg-stone-700': '#44403C',
};

export default function GerenciarFuncoes() {
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [permissions, setPermissions] = useState<RolePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRole, setCurrentRole] = useState<RoleDefinition | null>(null);
  const [view, setView] = useState<"card" | "list">("list");

  // Form state
  const [roleName, setRoleName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#6B7280");
  const [rolePermissions, setRolePermissions] = useState<Record<ModuleName, {
    can_view: boolean;
    can_create: boolean;
    can_edit: boolean;
    can_delete: boolean;
  }>>({} as any);

  useEffect(() => {
    if (isAdmin) {
      fetchRoles();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchRoles = async () => {
    setLoading(true);
    const { data: rolesData } = await supabase
      .from("role_definitions")
      .select("*")
      .order("display_name");

    const { data: permsData } = await supabase
      .from("role_permissions")
      .select("*");

    setRoles(rolesData || []);
    setPermissions((permsData as RolePermission[]) || []);
    setLoading(false);
  };

  // Função para validar se é uma cor hexadecimal
  const isHexColor = (color: string): boolean => /^#([0-9A-F]{3}){1,2}$/i.test(color);

  // Função para calcular contraste e retornar cor de texto adequada
  const getContrastColor = (hexColor: string): string => {
    if (!isHexColor(hexColor)) return "#000000";
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000000" : "#FFFFFF";
  };

  // Função para validar e normalizar cor (sempre retorna hexadecimal)
  const validateAndNormalizeColor = (colorValue: string): string => {
    const trimmedColor = colorValue.trim();
    
    // Se for hexadecimal válido, retornar como está
    if (isHexColor(trimmedColor)) {
      return trimmedColor;
    }
    
    // Se for classe Tailwind válida, converter para hex
    if (TAILWIND_TO_HEX[trimmedColor]) {
      return TAILWIND_TO_HEX[trimmedColor];
    }
    
    // Fallback: retornar cor padrão
    console.warn(`Cor inválida "${colorValue}", usando cor padrão #6B7280`);
    return '#6B7280';
  };

  const openCreateDialog = () => {
    setIsEditing(false);
    setCurrentRole(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (role: RoleDefinition) => {
    setIsEditing(true);
    setCurrentRole(role);
    setRoleName(role.role_name);
    setDisplayName(role.display_name);
    setDescription(role.description || "");
    
    // Sempre normalizar para hexadecimal
    setColor(validateAndNormalizeColor(role.color));

    // Carregar permissões existentes
    const rolePerms: any = {};
    MODULES.forEach((module) => {
      const perm = permissions.find((p) => p.role_name === role.role_name && p.module === module);
      rolePerms[module] = {
        can_view: perm?.can_view || false,
        can_create: perm?.can_create || false,
        can_edit: perm?.can_edit || false,
        can_delete: perm?.can_delete || false,
      };
    });
    setRolePermissions(rolePerms);
    setDialogOpen(true);
  };

  const resetForm = () => {
    setRoleName("");
    setDisplayName("");
    setDescription("");
    setColor("#6B7280");
    const emptyPerms: any = {};
    MODULES.forEach((module) => {
      emptyPerms[module] = {
        can_view: false,
        can_create: false,
        can_edit: false,
        can_delete: false,
      };
    });
    setRolePermissions(emptyPerms);
  };

  // Handler específico para o color picker
  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hexColor = e.target.value;
    setColor(hexColor);
  };

  // Handler para input de texto de cor com validação
  const handleColorTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputColor = e.target.value.trim();
    setColor(inputColor);
  };

  // Função helper para renderizar Badge com cor
  const renderBadgeWithColor = (displayName: string, colorValue: string) => {
    // Normalizar cor para hex (caso ainda tenha Tailwind no banco)
    const normalizedColor = validateAndNormalizeColor(colorValue);
    
    return (
      <Badge 
        className="border-0"
        style={{ 
          backgroundColor: normalizedColor,
          color: getContrastColor(normalizedColor)
        }}
      >
        {displayName}
      </Badge>
    );
  };

  const handleSave = async () => {
    if (!displayName.trim() || !roleName.trim()) {
      toast({
        title: "Erro",
        description: "Nome e identificador da função são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    // Validar cor antes de continuar
    const normalizedColor = validateAndNormalizeColor(color);
    if (!normalizedColor || !isHexColor(normalizedColor)) {
      toast({
        title: "Erro de Validação",
        description: "Cor inválida. Use formato hexadecimal (#8B5CF6)",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && currentRole) {
        // Atualizar função existente
        const { error: roleError } = await supabase
          .from("role_definitions")
          .update({
            display_name: displayName,
            description: description,
            color: normalizedColor,
          })
          .eq("id", currentRole.id);

        if (roleError) throw roleError;

        // Deletar permissões antigas
        await supabase
          .from("role_permissions")
          .delete()
          .eq("role_name", currentRole.role_name);

        // Inserir novas permissões
        const permsToInsert = MODULES.map((module) => ({
          role_name: currentRole.role_name,
          module,
          ...rolePermissions[module],
        }));

        const { error: permsError } = await supabase
          .from("role_permissions")
          .insert(permsToInsert);

        if (permsError) throw permsError;

        toast({
          title: "Sucesso",
          description: "Função atualizada com sucesso",
        });
      } else {
        // Criar nova função
        const { error: roleError } = await supabase
          .from("role_definitions")
          .insert({
            role_name: roleName,
            display_name: displayName,
            description: description,
            color: normalizedColor,
          });

        if (roleError) throw roleError;

        // Inserir permissões
        const permsToInsert = MODULES.map((module) => ({
          role_name: roleName,
          module,
          ...rolePermissions[module],
        }));

        const { error: permsError } = await supabase
          .from("role_permissions")
          .insert(permsToInsert);

        if (permsError) throw permsError;

        toast({
          title: "Sucesso",
          description: "Função criada com sucesso",
        });
      }

      await fetchRoles();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (role: RoleDefinition) => {
    if (!confirm(`Tem certeza que deseja excluir a função "${role.display_name}"?`)) return;

    const { error } = await supabase
      .from("role_definitions")
      .delete()
      .eq("id", role.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Função excluída com sucesso",
      });
      fetchRoles();
    }
  };

  const togglePermission = (module: ModuleName, action: keyof RolePermission) => {
    setRolePermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module]?.[action],
      },
    }));
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Acesso não autorizado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <ModernHeader
        title="Gerenciamento de Funções"
        description="Crie e gerencie funções personalizadas com permissões específicas"
        icon={Shield}
        colorScheme="red-coral"
        onAction={openCreateDialog}
        actionText="Nova Função"
      />

      <div className="mb-6 flex justify-end">
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {view === "list" ? (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Função</TableHead>
                  <TableHead>Identificador</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      {renderBadgeWithColor(role.display_name, role.color)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{role.role_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{role.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {permissions
                        .filter((p) => p.role_name === role.role_name)
                        .map((p) => MODULE_LABELS[p.module])
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(role)}
                          disabled={["admin", "pastor", "user"].includes(role.role_name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <Card key={role.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  {renderBadgeWithColor(role.display_name, role.color)}
                  <div>
                    <CardTitle className="text-sm font-medium">{role.role_name}</CardTitle>
                    <CardDescription className="text-xs">{role.description}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(role)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(role)}
                    disabled={["admin", "pastor", "user"].includes(role.role_name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  Permissões:{" "}
                  {permissions
                    .filter((p) => p.role_name === role.role_name)
                    .map((p) => MODULE_LABELS[p.module])
                    .join(", ")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Função" : "Nova Função"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Nome da Função</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Pastor"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="roleName">Identificador</Label>
                <Input
                  id="roleName"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Ex: pastor"
                  disabled={isEditing}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição da função..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="colorPicker"
                  type="color"
                  value={isHexColor(color) ? color : "#6B7280"}
                  onChange={handleColorPickerChange}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  id="colorText"
                  value={color}
                  onChange={handleColorTextChange}
                  placeholder="Ex: #8B5CF6"
                  className={cn(
                    "flex-1",
                    !isHexColor(color) && color !== "" && "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <div 
                  className="w-10 h-10 rounded border border-input flex items-center justify-center"
                  style={{ 
                    backgroundColor: isHexColor(color) ? color : "transparent",
                    color: isHexColor(color) ? getContrastColor(color) : "inherit"
                  }}
                >
                  {isHexColor(color) && <span className="text-xs font-bold">A</span>}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Use código hexadecimal (ex: #8B5CF6)
              </p>
            </div>

            <div className="space-y-4">
              <Label>Permissões por Módulo</Label>
              <div className="border rounded-lg overflow-hidden overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Módulo</th>
                      <th className="text-center p-2 font-medium">Ver</th>
                      <th className="text-center p-2 font-medium">Criar</th>
                      <th className="text-center p-2 font-medium">Editar</th>
                      <th className="text-center p-2 font-medium">Deletar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((module) => (
                      <tr key={module} className="border-t">
                        <td className="p-2">{MODULE_LABELS[module]}</td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={rolePermissions[module]?.can_view || false}
                            onCheckedChange={() => togglePermission(module, "can_view")}
                          />
                        </td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={rolePermissions[module]?.can_create || false}
                            onCheckedChange={() => togglePermission(module, "can_create")}
                          />
                        </td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={rolePermissions[module]?.can_edit || false}
                            onCheckedChange={() => togglePermission(module, "can_edit")}
                          />
                        </td>
                        <td className="text-center p-2">
                          <Checkbox
                            checked={rolePermissions[module]?.can_delete || false}
                            onCheckedChange={() => togglePermission(module, "can_delete")}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
