import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ViewToggle } from "@/components/ViewToggle";
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

const MODULES: ModuleName[] = ["visitantes", "igrejas", "regioes", "areas", "grupos", "usuarios", "importacao", "interacoes", "tarefas", "frequencia", "config_status"];
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
  config_status: "Configurações de Status",
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
    setColor(role.color);

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

  // Função helper para renderizar Badge com cor
  const renderBadgeWithColor = (displayName: string, colorValue: string) => {
    const isHex = isHexColor(colorValue);
    
    if (isHex) {
      return (
        <Badge 
          className="border-0"
          style={{ 
            backgroundColor: colorValue,
            color: getContrastColor(colorValue)
          }}
        >
          {displayName}
        </Badge>
      );
    }
    
    return <Badge className={colorValue}>{displayName}</Badge>;
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

    try {
      if (isEditing && currentRole) {
        // Atualizar função existente
        const { error: roleError } = await supabase
          .from("role_definitions")
          .update({
            display_name: displayName,
            description: description,
            color: color,
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
            color: color,
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

      setDialogOpen(false);
      fetchRoles();
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
                  onChange={(e) => setColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  id="colorText"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Ex: #8B5CF6 ou bg-purple-500"
                  className="flex-1"
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
                Use código hexadecimal (#8B5CF6) ou classe Tailwind (bg-purple-500)
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
