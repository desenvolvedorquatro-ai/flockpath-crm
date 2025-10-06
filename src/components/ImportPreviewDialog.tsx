import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidationResult {
  valid: Array<{ row: any; index: number }>;
  invalid: Array<{ row: any; index: number; errors: string[] }>;
  stats: {
    total: number;
    valid: number;
    invalid: number;
  };
}

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  validationResults: ValidationResult | null;
  onConfirm: () => void;
  importing: boolean;
  type: string;
}

export function ImportPreviewDialog({
  open,
  onOpenChange,
  validationResults,
  onConfirm,
  importing,
  type
}: ImportPreviewDialogProps) {
  if (!validationResults) return null;

  const { valid, invalid, stats } = validationResults;
  const allRows = [...valid, ...invalid].sort((a, b) => a.index - b.index);

  const getRowClass = (index: number) => {
    const isInvalid = invalid.some(item => item.index === index);
    return isInvalid ? "bg-destructive/10 hover:bg-destructive/20" : "bg-success/10 hover:bg-success/20";
  };

  const getErrors = (index: number) => {
    const invalidRow = invalid.find(item => item.index === index);
    return invalidRow?.errors || [];
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      regioes: "Regiões",
      areas: "Áreas",
      igrejas: "Igrejas",
      visitantes: "Visitantes"
    };
    return labels[type] || type;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preview da Importação - {getTypeLabel()}</DialogTitle>
          <DialogDescription>
            Revise os dados antes de confirmar a importação
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 my-4">
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="p-2 bg-primary/10 rounded-full">
              <AlertTriangle className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="p-2 bg-success/10 rounded-full">
              <CheckCircle2 className="w-4 h-4 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Válidos</p>
              <p className="text-2xl font-bold text-success">{stats.valid}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="p-2 bg-destructive/10 rounded-full">
              <XCircle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Com Erros</p>
              <p className="text-2xl font-bold text-destructive">{stats.invalid}</p>
            </div>
          </div>
        </div>

        {stats.invalid > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {stats.invalid} registro(s) contém erros e não serão importados. Apenas os registros válidos serão processados.
            </AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[400px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Status</TableHead>
                <TableHead>Dados</TableHead>
                <TableHead>Erros</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRows.map((item) => {
                const errors = getErrors(item.index);
                const isValid = errors.length === 0;
                
                return (
                  <TableRow key={item.index} className={getRowClass(item.index)}>
                    <TableCell>
                      {isValid ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {Object.entries(item.row).map(([key, value]) => (
                          <div key={key} className="text-sm">
                            <span className="font-medium">{key}:</span>{" "}
                            <span className="text-muted-foreground">{String(value || '-')}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {errors.length > 0 && (
                        <div className="space-y-1">
                          {errors.map((error, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              {error}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            disabled={importing || stats.valid === 0}
          >
            {importing ? "Importando..." : `Confirmar Importação (${stats.valid} registros)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
