import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
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

const MODULES: ModuleName[] = ["visitantes", "igrejas", "regioes", "areas", "grupos", "usuarios", "importacao", "interacoes"];
const MODULE_LABELS: Record<ModuleName, string> = {
  visitantes: "Visitantes",
  igrejas: "Igrejas",
  regioes: "Regiões",
  areas: "Áreas",
  grupos: "Grupos",
  usuarios: "Usuários",
  importacao: "Importação",
  interacoes: "Interações",
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

  // Form state
  const [roleName, setRoleName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("bg-gray-500");
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
    setColor("bg-gray-500");
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

      <div className="grid gap-4">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-3">
                <Badge className={role.color}>{role.display_name}</Badge>
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
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex: bg-purple-500"
              />
            </div>

            <div className="space-y-4">
              <Label>Permissões por Módulo</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
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
