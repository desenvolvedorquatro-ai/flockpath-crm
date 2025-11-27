import { useState } from "react";
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import * as XLSX from "xlsx";
import { ModernHeader } from "@/components/ModernHeader";
import { ImportPreviewDialog } from "@/components/ImportPreviewDialog";
import { validateImportData, ValidationResult } from "@/lib/importValidation";

export default function Importacao() {
  const { isAdmin, isPastor } = useUserRole();
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("regioes");
  const [validationResults, setValidationResults] = useState<ValidationResult | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<{ data: any[], type: string } | null>(null);

  const downloadTemplate = (type: string) => {
    let headers: string[] = [];
    let filename = "";
    
    switch (type) {
      case "regioes":
        headers = ["nome", "pastor_email"];
        filename = "template_regioes.xlsx";
        break;
      case "areas":
        headers = ["nome", "nome_regiao", "pastor_email"];
        filename = "template_areas.xlsx";
        break;
      case "igrejas":
        headers = ["nome", "nome_regiao", "nome_area", "pastor_email", "nome_pastor", "email", "telefone", "endereco", "cidade", "estado"];
        filename = "template_igrejas.xlsx";
        break;
      case "visitantes":
        headers = ["nome", "email", "whatsapp", "sexo", "nome_igreja", "nome_area", "nome_regiao", "nome_grupo", "endereco", "data_visita", "convidado_por", "observacoes", "status", "categoria", "profissao", "estado_civil", "data_nascimento", "tem_filhos", "candidato_batismo", "data_batismo", "resgate"];
        filename = "template_visitantes.xlsx";
        break;
    }

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, filename);
    
    toast({
      title: "Template baixado!",
      description: `O arquivo ${filename} foi baixado com sucesso.`,
    });
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo não contém dados para importar.",
          variant: "destructive",
        });
        setImporting(false);
        e.target.value = "";
        return;
      }

      // Validar dados
      toast({
        title: "Validando dados...",
        description: "Aguarde enquanto validamos os registros.",
      });

      const results = await validateImportData(jsonData, type);
      
      setValidationResults(results);
      setPendingImportData({ data: jsonData, type });
      setShowPreviewDialog(true);
      setImporting(false);
    } catch (error: any) {
      toast({
        title: "Erro ao ler arquivo",
        description: error.message,
        variant: "destructive",
      });
      setImporting(false);
    } finally {
      e.target.value = "";
    }
  };

  const confirmImport = async () => {
    if (!pendingImportData || !validationResults) return;

    setImporting(true);

    try {
      let success = 0;
      let errors = 0;

      // Importar apenas registros válidos
      for (const item of validationResults.valid) {
        try {
          switch (pendingImportData.type) {
            case "regioes":
              await importRegiao(item.row);
              break;
            case "areas":
              await importArea(item.row);
              break;
            case "igrejas":
              await importIgreja(item.row);
              break;
            case "visitantes":
              await importVisitante(item.row);
              break;
          }
          success++;
        } catch (error: any) {
          console.error(`Erro ao importar:`, item.row, error);
          errors++;
          
          // Mostrar erro específico ao usuário
          toast({
            title: `Erro ao importar registro (linha ${item.row.__rowNum__ || 'desconhecida'})`,
            description: error.message || "Erro desconhecido",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Importação concluída!",
        description: `${success} registros importados com sucesso. ${errors} erros durante a importação.`,
        variant: errors > 0 ? "destructive" : "default",
      });

      setShowPreviewDialog(false);
      setValidationResults(null);
      setPendingImportData(null);
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const importRegiao = async (row: any) => {
    if (!row.nome) {
      throw new Error("Nome da região é obrigatório");
    }

    let pastor_id = null;
    
    if (row.pastor_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", row.pastor_email)
        .maybeSingle();
      
      if (profile) {
        pastor_id = profile.id;
      }
    }

    const { error } = await supabase.from("regions").insert({
      name: row.nome,
      pastor_id,
    });

    if (error) throw error;
  };

  const importArea = async (row: any) => {
    if (!row.nome || !row.nome_regiao) {
      throw new Error("Nome da área e região são obrigatórios");
    }

    // Buscar região pelo nome
    const { data: region } = await supabase
      .from("regions")
      .select("id")
      .eq("name", row.nome_regiao)
      .maybeSingle();

    if (!region) {
      throw new Error(`Região '${row.nome_regiao}' não encontrada`);
    }

    let pastor_id = null;
    
    if (row.pastor_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", row.pastor_email)
        .maybeSingle();
      
      if (profile) {
        pastor_id = profile.id;
      }
    }

    const { error } = await supabase.from("areas").insert({
      name: row.nome,
      region_id: region.id,
      pastor_id,
    });

    if (error) throw error;
  };

  const importIgreja = async (row: any) => {
    if (!row.nome) {
      throw new Error("Nome da igreja é obrigatório");
    }

    let region_id = null;
    let area_id = null;
    let pastor_id = null;

    // Buscar região pelo nome
    if (row.nome_regiao) {
      const { data: region } = await supabase
        .from("regions")
        .select("id")
        .eq("name", row.nome_regiao)
        .maybeSingle();

      if (region) {
        region_id = region.id;
      }
    }

    // Buscar área pelo nome
    if (row.nome_area) {
      const { data: area } = await supabase
        .from("areas")
        .select("id")
        .eq("name", row.nome_area)
        .maybeSingle();

      if (area) {
        area_id = area.id;
      }
    }

    // Buscar pastor pelo email
    if (row.pastor_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", row.pastor_email)
        .maybeSingle();
      
      if (profile) {
        pastor_id = profile.id;
      }
    }

    const { error } = await supabase.from("churches").insert({
      name: row.nome,
      region_id,
      area_id,
      pastor_id,
      pastor_name: row.nome_pastor || null,
      email: row.email || null,
      phone: row.telefone || null,
      address: row.endereco || null,
      city: row.cidade || null,
      state: row.estado || null,
    });

    if (error) throw error;
  };

  const importVisitante = async (row: any) => {
    if (!row.nome || !row.nome_igreja) {
      throw new Error("Nome do visitante e igreja são obrigatórios");
    }

    // Buscar igreja pelo nome, com filtros opcionais de área e região para maior precisão
    let churchQuery = supabase
      .from("churches")
      .select("id, areas(name, regions(name))")
      .eq("name", row.nome_igreja);

    const { data: churches } = await churchQuery;

    if (!churches || churches.length === 0) {
      throw new Error(`Igreja '${row.nome_igreja}' não encontrada`);
    }

    // Se forneceu área ou região, filtra para encontrar a igreja correta
    let church = churches[0];
    if (churches.length > 1 && (row.nome_area || row.nome_regiao)) {
      const filtered = churches.find(c => {
        const areaMatch = !row.nome_area || c.areas?.name === row.nome_area;
        const regionMatch = !row.nome_regiao || c.areas?.regions?.name === row.nome_regiao;
        return areaMatch && regionMatch;
      });
      if (filtered) {
        church = filtered;
      }
    }

    // Buscar grupo de assistência se fornecido
    let assistance_group_id = null;
    if (row.nome_grupo) {
      const { data: group } = await supabase
        .from("assistance_groups")
        .select("id")
        .eq("name", row.nome_grupo)
        .eq("church_id", church.id)
        .maybeSingle();
      
      if (group) {
        assistance_group_id = group.id;
      }
    }

    // Converter datas do formato DDMMAAAA, DD/MM/AAAA ou número serial do Excel para AAAA-MM-DD
    const convertDateFormat = (date: string | number): string | null => {
      if (!date) return null;
      
      // Se for número (serial do Excel)
      if (typeof date === 'number') {
        const excelEpoch = new Date(1899, 11, 30);
        const convertedDate = new Date(excelEpoch.getTime() + date * 86400000);
        const year = convertedDate.getFullYear();
        const month = String(convertedDate.getMonth() + 1).padStart(2, '0');
        const day = String(convertedDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      const dateStr = String(date).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [day, month, year] = dateStr.split('/');
        return `${year}-${month}-${day}`;
      }
      if (/^\d{8}$/.test(dateStr)) {
        const day = dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const year = dateStr.substring(4, 8);
        return `${year}-${month}-${day}`;
      }
      return null;
    };

    const { error } = await supabase.from("visitors").insert({
      full_name: row.nome,
      email: row.email || null,
      phone: row.whatsapp || null,
      sexo: row.sexo || null,
      church_id: church.id,
      assistance_group_id,
      address: row.endereco || null,
      first_visit_date: convertDateFormat(row.data_visita) || new Date().toISOString().split('T')[0],
      invited_by: row.convidado_por || null,
      notes: row.observacoes || null,
      status: row.status || "visitante",
      categoria: row.categoria || null,
      profissao: row.profissao || null,
      estado_civil: row.estado_civil || null,
      data_nascimento: convertDateFormat(row.data_nascimento),
      tem_filhos: row.tem_filhos === "Sim" ? true : row.tem_filhos === "Não" ? false : null,
      candidato_batismo: row.candidato_batismo === "Sim" ? true : row.candidato_batismo === "Não" ? false : row.candidato_batismo || false,
      data_batismo: convertDateFormat(row.data_batismo),
      resgate: row.resgate === "Sim" ? true : row.resgate === "Não" ? false : false,
    });

    if (error) throw error;
  };

  if (!isAdmin && !isPastor) {
    return (
      <div className="min-h-screen bg-background">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHeader
        title="Importação de Dados"
        description="Importe dados em lote através de arquivos Excel"
        icon={Upload}
        colorScheme="red-coral"
      />

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Como importar:</strong> Baixe o template, preencha com seus dados e faça o upload.
          Use nomes exatos para conectar os registros (exemplo: nome da região, nome da igreja).
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="regioes">Regiões</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
          <TabsTrigger value="igrejas">Igrejas</TabsTrigger>
          <TabsTrigger value="visitantes">Visitantes</TabsTrigger>
        </TabsList>

        <TabsContent value="regioes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Importar Regiões
              </CardTitle>
              <CardDescription>
                Campos: <strong>nome</strong> (obrigatório), pastor_email (opcional - deve existir no sistema)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => downloadTemplate("regioes")} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Baixar Template Excel
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="file-regioes">Upload do Arquivo</Label>
                <Input
                  id="file-regioes"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleImport(e, "regioes")}
                  disabled={importing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="areas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Importar Áreas
              </CardTitle>
              <CardDescription>
                Campos: <strong>nome, nome_regiao</strong> (obrigatórios), pastor_email (opcional)
                <br/>
                <em>A região deve estar cadastrada antes</em>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => downloadTemplate("areas")} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Baixar Template Excel
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="file-areas">Upload do Arquivo</Label>
                <Input
                  id="file-areas"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleImport(e, "areas")}
                  disabled={importing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="igrejas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Importar Igrejas
              </CardTitle>
              <CardDescription>
                Campos: <strong>nome</strong> (obrigatório), nome_regiao, nome_area, pastor_email, nome_pastor, email, telefone, endereco, cidade, estado (opcionais)
                <br/>
                <em>Regiões e áreas devem estar cadastradas antes</em>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => downloadTemplate("igrejas")} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Baixar Template Excel
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="file-igrejas">Upload do Arquivo</Label>
                <Input
                  id="file-igrejas"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleImport(e, "igrejas")}
                  disabled={importing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visitantes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                Importar Visitantes
              </CardTitle>
              <CardDescription>
                <div className="space-y-2">
                  <div>
                    <strong>Campos obrigatórios:</strong> nome, nome_igreja
                  </div>
                  <div>
                    <strong>Campos opcionais:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>sexo</strong>: masculino, feminino</li>
                      <li><strong>status</strong>: interessado, visitante, visitante_frequente, candidato_batismo, membro</li>
                      <li><strong>categoria</strong>: crianca, intermediario, adolescente, jovem, senhora, varao, idoso</li>
                      <li><strong>nome_grupo</strong>: nome do grupo de assistência (deve estar cadastrado na igreja)</li>
                      <li>nome_area, nome_regiao: ajudam a identificar a igreja correta</li>
                      <li>email, telefone, endereco</li>
                      <li><strong>data_visita, data_nascimento, data_batismo</strong>: formato DD/MM/AAAA, DDMMAAAA ou AAAA-MM-DD</li>
                      <li>convidado_por, observacoes</li>
                      <li>profissao, estado_civil, tem_filhos (Sim/Não)</li>
                      <li>candidato_batismo (Sim/Não), resgate (Sim/Não)</li>
                    </ul>
                  </div>
                  <div className="text-muted-foreground italic text-sm mt-2">
                    💡 Dica: Informar área e região ajuda a identificar a igreja correta quando há igrejas com nomes similares
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={() => downloadTemplate("visitantes")} variant="outline" className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Baixar Template Excel
              </Button>
              
              <div className="space-y-2">
                <Label htmlFor="file-visitantes">Upload do Arquivo</Label>
                <Input
                  id="file-visitantes"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => handleImport(e, "visitantes")}
                  disabled={importing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportPreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        validationResults={validationResults}
        onConfirm={confirmImport}
        importing={importing}
        type={pendingImportData?.type || ""}
      />
    </div>
  );
}
