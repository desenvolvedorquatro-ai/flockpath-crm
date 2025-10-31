import { useState, useEffect } from "react";
import { Settings, Plus, Edit, Trash2, Save, X, GripVertical, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ModernHeader } from "@/components/ModernHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface StatusConfig {
  id: string;
  value: string;
  label: string;
  color: string;
  hex_color: string;
  order_position: number;
  active: boolean;
}

interface CategoryConfig {
  id: string;
  value: string;
  label: string;
  order_position: number;
  active: boolean;
}

interface SystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  config_type: string;
  description: string;
  editable_by_admin: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConfiguracoesStatus() {
  const { toast } = useToast();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [statuses, setStatuses] = useState<StatusConfig[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para novo status
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState({ value: "", label: "", color: "", hex_color: "" });

  // Estados para nova categoria
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ value: "", label: "" });

  // Estados para edição
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editStatusData, setEditStatusData] = useState<Partial<StatusConfig>>({});
  const [editCategoryData, setEditCategoryData] = useState<Partial<CategoryConfig>>({});
  const [editingConfig, setEditingConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    if (!roleLoading && isAdmin) {
      fetchStatuses();
      fetchCategories();
      fetchSystemConfig();
    }
  }, [roleLoading, isAdmin]);

  const fetchStatuses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitor_status_config")
      .select("*")
      .order("order_position");

    if (error) {
      toast({
        title: "Erro ao carregar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStatuses(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("visitor_category_config")
      .select("*")
      .order("order_position");

    if (error) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const fetchSystemConfig = async () => {
    const { data, error } = await supabase
      .from("system_config")
      .select("*")
      .order("config_key");

    if (error) {
      toast({
        title: "Erro ao carregar configurações",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSystemConfig(data || []);
    }
  };

  const handleCreateStatus = async () => {
    if (!newStatus.value || !newStatus.label || !newStatus.color || !newStatus.hex_color) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("visitor_status_config").insert({
      value: newStatus.value,
      label: newStatus.label,
      color: newStatus.color,
      hex_color: newStatus.hex_color,
      order_position: statuses.length + 1,
    });

    if (error) {
      toast({
        title: "Erro ao criar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status criado com sucesso!" });
      setIsStatusDialogOpen(false);
      setNewStatus({ value: "", label: "", color: "", hex_color: "" });
      fetchStatuses();
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.value || !newCategory.label) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("visitor_category_config").insert({
      value: newCategory.value,
      label: newCategory.label,
      order_position: categories.length + 1,
    });

    if (error) {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Categoria criada com sucesso!" });
      setIsCategoryDialogOpen(false);
      setNewCategory({ value: "", label: "" });
      fetchCategories();
    }
  };

  const handleUpdateStatus = async (id: string) => {
    const { error } = await supabase
      .from("visitor_status_config")
      .update(editStatusData)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status atualizado com sucesso!" });
      setEditingStatusId(null);
      setEditStatusData({});
      fetchStatuses();
    }
  };

  const handleUpdateCategory = async (id: string) => {
    const { error } = await supabase
      .from("visitor_category_config")
      .update(editCategoryData)
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Categoria atualizada com sucesso!" });
      setEditingCategoryId(null);
      setEditCategoryData({});
      fetchCategories();
    }
  };

  const handleToggleStatusActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("visitor_status_config")
      .update({ active })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchStatuses();
    }
  };

  const handleToggleCategoryActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("visitor_category_config")
      .update({ active })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao atualizar categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchCategories();
    }
  };

  const handleDeleteStatus = async (id: string) => {
    const { error } = await supabase
      .from("visitor_status_config")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar status",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Status deletado com sucesso!" });
      fetchStatuses();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("visitor_category_config")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar categoria",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Categoria deletada com sucesso!" });
      fetchCategories();
    }
  };

  const handleSaveConfig = async (configId: string) => {
    if (!editingConfig) return;

    const { error } = await supabase
      .from("system_config")
      .update({
        config_value: editingConfig.config_value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", configId);

    if (error) {
      toast({
        title: "Erro ao atualizar configuração",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Configuração atualizada",
        description: "A mudança será aplicada no próximo login dos usuários",
      });
      setEditingConfig(null);
      fetchSystemConfig();
    }
  };

  const moveItem = async (
    table: "visitor_status_config" | "visitor_category_config",
    id: string,
    direction: "up" | "down",
    items: any[]
  ) => {
    const currentIndex = items.findIndex((item) => item.id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === items.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newItems = [...items];
    [newItems[currentIndex], newItems[newIndex]] = [newItems[newIndex], newItems[currentIndex]];

    // Atualizar posições
    for (let i = 0; i < newItems.length; i++) {
      await supabase.from(table).update({ order_position: i + 1 }).eq("id", newItems[i].id);
    }

    if (table === "visitor_status_config") {
      fetchStatuses();
    } else {
      fetchCategories();
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Acesso restrito a administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModernHeader
        icon={Settings}
        title="Configurações de Status e Categoria"
        description="Gerencie os status e categorias de visitantes"
      />

      <Tabs defaultValue="status" className="w-full">
        <TabsList>
          <TabsTrigger value="status">Status de Visitantes</TabsTrigger>
          <TabsTrigger value="categoria">Categorias de Visitantes</TabsTrigger>
          <TabsTrigger value="system">Configurações do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Status de Visitantes</CardTitle>
                  <CardDescription>Configure os status disponíveis para visitantes</CardDescription>
                </div>
                <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Status
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Novo Status</DialogTitle>
                      <DialogDescription>
                        Adicione um novo status para visitantes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Valor (slug)</Label>
                        <Input
                          placeholder="ex: novo_status"
                          value={newStatus.value}
                          onChange={(e) =>
                            setNewStatus({ ...newStatus, value: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Nome de Exibição</Label>
                        <Input
                          placeholder="ex: Novo Status"
                          value={newStatus.label}
                          onChange={(e) =>
                            setNewStatus({ ...newStatus, label: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Classes CSS (cor)</Label>
                        <Input
                          placeholder="ex: bg-blue-500/10 text-blue-500 border-blue-500/20"
                          value={newStatus.color}
                          onChange={(e) =>
                            setNewStatus({ ...newStatus, color: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Cor Hex (para gráficos)</Label>
                        <Input
                          placeholder="ex: #3B82F6"
                          value={newStatus.hex_color}
                          onChange={(e) =>
                            setNewStatus({ ...newStatus, hex_color: e.target.value })
                          }
                        />
                      </div>
                      <Button onClick={handleCreateStatus} className="w-full">
                        Criar Status
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Preview</TableHead>
                    <TableHead>Cor Hex</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              moveItem("visitor_status_config", status.id, "up", statuses)
                            }
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              moveItem("visitor_status_config", status.id, "down", statuses)
                            }
                          >
                            ↓
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingStatusId === status.id ? (
                          <Input
                            value={editStatusData.value || status.value}
                            onChange={(e) =>
                              setEditStatusData({ ...editStatusData, value: e.target.value })
                            }
                          />
                        ) : (
                          status.value
                        )}
                      </TableCell>
                      <TableCell>
                        {editingStatusId === status.id ? (
                          <Input
                            value={editStatusData.label || status.label}
                            onChange={(e) =>
                              setEditStatusData({ ...editStatusData, label: e.target.value })
                            }
                          />
                        ) : (
                          status.label
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>{status.label}</Badge>
                      </TableCell>
                      <TableCell>{status.hex_color}</TableCell>
                      <TableCell>
                        <Switch
                          checked={status.active}
                          onCheckedChange={(checked) =>
                            handleToggleStatusActive(status.id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {editingStatusId === status.id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(status.id)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingStatusId(null);
                                setEditStatusData({});
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingStatusId(status.id);
                                setEditStatusData(status);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar este status? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteStatus(status.id)}>
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categoria">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Categorias de Visitantes</CardTitle>
                  <CardDescription>Configure as categorias disponíveis para visitantes</CardDescription>
                </div>
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Criar Nova Categoria</DialogTitle>
                      <DialogDescription>
                        Adicione uma nova categoria para visitantes
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Valor (slug)</Label>
                        <Input
                          placeholder="ex: nova_categoria"
                          value={newCategory.value}
                          onChange={(e) =>
                            setNewCategory({ ...newCategory, value: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>Nome de Exibição</Label>
                        <Input
                          placeholder="ex: Nova Categoria"
                          value={newCategory.label}
                          onChange={(e) =>
                            setNewCategory({ ...newCategory, label: e.target.value })
                          }
                        />
                      </div>
                      <Button onClick={handleCreateCategory} className="w-full">
                        Criar Categoria
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              moveItem("visitor_category_config", category.id, "up", categories)
                            }
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              moveItem("visitor_category_config", category.id, "down", categories)
                            }
                          >
                            ↓
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {editingCategoryId === category.id ? (
                          <Input
                            value={editCategoryData.value || category.value}
                            onChange={(e) =>
                              setEditCategoryData({ ...editCategoryData, value: e.target.value })
                            }
                          />
                        ) : (
                          category.value
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCategoryId === category.id ? (
                          <Input
                            value={editCategoryData.label || category.label}
                            onChange={(e) =>
                              setEditCategoryData({ ...editCategoryData, label: e.target.value })
                            }
                          />
                        ) : (
                          category.label
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={category.active}
                          onCheckedChange={(checked) =>
                            handleToggleCategoryActive(category.id, checked)
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {editingCategoryId === category.id ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateCategory(category.id)}
                            >
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCategoryId(null);
                                setEditCategoryData({});
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCategoryId(category.id);
                                setEditCategoryData(category);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="destructive">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar esta categoria? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteCategory(category.id)}>
                                    Deletar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Configure parâmetros globais do sistema, como tempo de expiração de sessão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Configuração</TableHead>
                      <TableHead>Valor Atual</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemConfig.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">
                          {config.config_key}
                        </TableCell>
                        <TableCell>
                          {editingConfig?.id === config.id ? (
                            <Input
                              type={config.config_type === "number" ? "number" : "text"}
                              value={editingConfig.config_value}
                              onChange={(e) =>
                                setEditingConfig({
                                  ...editingConfig,
                                  config_value: e.target.value,
                                })
                              }
                              className="max-w-[200px]"
                            />
                          ) : (
                            <Badge variant="outline">
                              {config.config_value}
                              {config.config_key.includes("minutes") && " min"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {config.description}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingConfig?.id === config.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveConfig(config.id)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingConfig(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingConfig(config)}
                              disabled={!config.editable_by_admin}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
