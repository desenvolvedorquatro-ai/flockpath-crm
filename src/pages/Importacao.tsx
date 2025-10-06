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

export default function Importacao() {
  const { isAdmin, isPastor } = useUserRole();
  const [importing, setImporting] = useState(false);
  const [activeTab, setActiveTab] = useState("regioes");

  const downloadTemplate = (type: string) => {
    let headers: string[] = [];
    let filename = "";
    
    switch (type) {
      case "regioes":
        headers = ["codigo", "nome", "pastor_email"];
        filename = "template_regioes.xlsx";
        break;
      case "areas":
        headers = ["codigo", "nome", "codigo_regiao", "pastor_email"];
        filename = "template_areas.xlsx";
        break;
      case "igrejas":
        headers = ["codigo", "nome", "codigo_regiao", "codigo_area", "pastor_email", "endereco", "cidade", "estado"];
        filename = "template_igrejas.xlsx";
        break;
      case "visitantes":
        headers = ["nome", "email", "telefone", "codigo_igreja", "data_visita", "observacoes"];
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

      let success = 0;
      let errors = 0;

      for (const row of jsonData as any[]) {
        try {
          switch (type) {
            case "regioes":
              await importRegiao(row);
              break;
            case "areas":
              await importArea(row);
              break;
            case "igrejas":
              await importIgreja(row);
              break;
            case "visitantes":
              await importVisitante(row);
              break;
          }
          success++;
        } catch (error) {
          console.error(`Erro na linha:`, row, error);
          errors++;
        }
      }

      toast({
        title: "Importação concluída!",
        description: `${success} registros importados com sucesso. ${errors} erros.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const importRegiao = async (row: any) => {
    let pastor_id = null;
    
    if (row.pastor_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", row.pastor_email)
        .single();
      
      pastor_id = profile?.id || null;
    }

    await supabase.from("regions").upsert({
      id: row.codigo,
      name: row.nome,
      pastor_id,
    }, { onConflict: "id" });
  };

  const importArea = async (row: any) => {
    let pastor_id = null;
    
    if (row.pastor_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", row.pastor_email)
        .single();
      
      pastor_id = profile?.id || null;
    }

    await supabase.from("areas").upsert({
      id: row.codigo,
      name: row.nome,
      region_id: row.codigo_regiao,
      pastor_id,
    }, { onConflict: "id" });
  };

  const importIgreja = async (row: any) => {
    let pastor_id = null;
    
    if (row.pastor_email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", row.pastor_email)
        .single();
      
      pastor_id = profile?.id || null;
    }

    await supabase.from("churches").upsert({
      id: row.codigo,
      name: row.nome,
      region_id: row.codigo_regiao || null,
      area_id: row.codigo_area || null,
      pastor_id,
      address: row.endereco || null,
      city: row.cidade || null,
      state: row.estado || null,
    }, { onConflict: "id" });
  };

  const importVisitante = async (row: any) => {
    await supabase.from("visitors").insert({
      full_name: row.nome,
      email: row.email || null,
      phone: row.telefone || null,
      church_id: row.codigo_igreja,
      first_visit_date: row.data_visita || new Date().toISOString().split('T')[0],
      notes: row.observacoes || null,
      status: "visitante",
    });
  };

  if (!isAdmin && !isPastor) {
    return (
      <div className="min-h-screen bg-background p-8">
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
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Importação de Dados</h1>
          <p className="text-sm md:text-base text-muted-foreground">Importe dados em lote através de arquivos Excel</p>
        </div>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Para importar dados, primeiro baixe o template Excel correspondente, preencha com os dados e depois faça o upload do arquivo.
          Os códigos devem ser únicos e são usados para conectar os registros entre os módulos.
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
                Campos: codigo (único), nome, pastor_email (opcional)
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
                Campos: codigo (único), nome, codigo_regiao, pastor_email (opcional)
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
                Campos: codigo (único), nome, codigo_regiao, codigo_area, pastor_email, endereco, cidade, estado
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
                Campos: nome, email, telefone, codigo_igreja, data_visita, observacoes
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
    </div>
  );
}
