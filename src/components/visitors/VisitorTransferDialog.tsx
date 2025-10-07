import { useState, useEffect } from "react";
import { ArrowRightLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Region {
  id: string;
  name: string;
}

interface Area {
  id: string;
  name: string;
  region_id: string;
}

interface Church {
  id: string;
  name: string;
  area_id: string | null;
  region_id: string | null;
}

interface VisitorTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visitorId: string;
  visitorName: string;
  currentChurchId: string;
  currentChurchName?: string;
  onTransferComplete: () => void;
}

export function VisitorTransferDialog({
  open,
  onOpenChange,
  visitorId,
  visitorName,
  currentChurchId,
  currentChurchName,
  onTransferComplete,
}: VisitorTransferDialogProps) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState<string>("");
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [selectedChurchId, setSelectedChurchId] = useState<string>("");
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [filteredChurches, setFilteredChurches] = useState<Church[]>([]);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  useEffect(() => {
    if (selectedRegionId) {
      const areasInRegion = areas.filter((a) => a.region_id === selectedRegionId);
      setFilteredAreas(areasInRegion);
      
      const churchesInRegion = churches.filter(
        (c) => c.region_id === selectedRegionId
      );
      setFilteredChurches(churchesInRegion);
    } else {
      setFilteredAreas([]);
      setFilteredChurches([]);
    }
    setSelectedAreaId("");
    setSelectedChurchId("");
  }, [selectedRegionId, areas, churches]);

  useEffect(() => {
    if (selectedAreaId && selectedRegionId) {
      const churchesInArea = churches.filter(
        (c) => c.area_id === selectedAreaId && c.region_id === selectedRegionId
      );
      setFilteredChurches(churchesInArea);
    } else if (selectedRegionId) {
      const churchesInRegion = churches.filter(
        (c) => c.region_id === selectedRegionId
      );
      setFilteredChurches(churchesInRegion);
    }
    setSelectedChurchId("");
  }, [selectedAreaId, selectedRegionId, churches]);

  const fetchData = async () => {
    const [regionsData, areasData, churchesData] = await Promise.all([
      supabase.from("regions").select("*").order("name"),
      supabase.from("areas").select("*").order("name"),
      supabase.from("churches").select("*").order("name"),
    ]);

    if (regionsData.data) setRegions(regionsData.data);
    if (areasData.data) setAreas(areasData.data);
    if (churchesData.data) setChurches(churchesData.data);
  };

  const handleTransfer = async () => {
    if (!selectedChurchId) {
      toast({
        title: "Erro",
        description: "Selecione uma igreja de destino.",
        variant: "destructive",
      });
      return;
    }

    if (selectedChurchId === currentChurchId) {
      toast({
        title: "Aviso",
        description: "A igreja selecionada é a mesma atual.",
        variant: "destructive",
      });
      return;
    }

    setIsTransferring(true);

    try {
      const selectedChurch = churches.find((c) => c.id === selectedChurchId);
      
      // Atualizar o visitante com a nova igreja, área e região
      const { error: updateError } = await supabase
        .from("visitors")
        .update({
          church_id: selectedChurchId,
          area_id: selectedChurch?.area_id || null,
          region_id: selectedChurch?.region_id || null,
        })
        .eq("id", visitorId);

      if (updateError) throw updateError;

      // Registrar a transferência como uma interação
      const newChurchName = churches.find((c) => c.id === selectedChurchId)?.name || "Nova igreja";
      
      await supabase.from("visitor_interactions").insert({
        visitor_id: visitorId,
        interaction_type: "outro",
        interaction_date: new Date().toISOString().split("T")[0],
        description: `Transferido de ${currentChurchName || "igreja anterior"} para ${newChurchName}`,
        created_by: null,
      });

      toast({
        title: "Transferência realizada!",
        description: `${visitorName} foi transferido com sucesso.`,
      });

      onOpenChange(false);
      onTransferComplete();
      
      // Resetar seleções
      setSelectedRegionId("");
      setSelectedAreaId("");
      setSelectedChurchId("");
    } catch (error: any) {
      console.error("Erro ao transferir visitante:", error);
      toast({
        title: "Erro na transferência",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle>Transferir Visitante</DialogTitle>
              <DialogDescription>
                Transferir {visitorName} para outra igreja
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentChurchName && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Igreja atual:</span>
                <span className="font-semibold">{currentChurchName}</span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-region">Região</Label>
              <Select
                value={selectedRegionId}
                onValueChange={setSelectedRegionId}
              >
                <SelectTrigger id="transfer-region">
                  <SelectValue placeholder="Selecione a região" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-area">Área (opcional)</Label>
              <Select
                value={selectedAreaId}
                onValueChange={setSelectedAreaId}
                disabled={!selectedRegionId}
              >
                <SelectTrigger id="transfer-area">
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-church">Igreja *</Label>
              <Select
                value={selectedChurchId}
                onValueChange={setSelectedChurchId}
                disabled={!selectedRegionId}
              >
                <SelectTrigger id="transfer-church">
                  <SelectValue placeholder="Selecione a igreja" />
                </SelectTrigger>
                <SelectContent>
                  {filteredChurches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isTransferring}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600"
              onClick={handleTransfer}
              disabled={isTransferring || !selectedChurchId}
            >
              {isTransferring ? "Transferindo..." : "Confirmar Transferência"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
