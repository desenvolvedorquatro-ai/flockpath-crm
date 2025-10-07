import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernHeader } from "@/components/ModernHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSunday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

interface Visitor {
  id: string;
  full_name: string;
}

interface Church {
  id: string;
  name: string;
}

interface AssistanceGroup {
  id: string;
  name: string;
  church_id: string;
}

interface AttendanceRecord {
  visitor_id: string;
  attendance_date: string;
  service_type: "ebd" | "noite" | "outro";
}

export default function MapaFrequencia() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { isPastor, isAdmin } = useUserRole();
  const { toast } = useToast();

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [churches, setChurches] = useState<Church[]>([]);
  const [assistanceGroups, setAssistanceGroups] = useState<AssistanceGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<AssistanceGroup[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedChurch, setSelectedChurch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedMonth),
    end: endOfMonth(selectedMonth),
  });

  useEffect(() => {
    if (user) {
      fetchChurches();
      fetchAssistanceGroups();
    }
  }, [user]);

  useEffect(() => {
    if (selectedChurch) {
      const filtered = assistanceGroups.filter(ag => ag.church_id === selectedChurch);
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups([]);
    }
  }, [selectedChurch, assistanceGroups]);

  useEffect(() => {
    if (selectedGroup || selectedChurch) {
      fetchVisitors();
      fetchAttendanceRecords();
    }
  }, [selectedGroup, selectedChurch, selectedMonth]);

  const fetchChurches = async () => {
    const { data, error } = await supabase
      .from("churches")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Erro ao carregar igrejas:", error);
      return;
    }

    setChurches(data || []);
  };

  const fetchAssistanceGroups = async () => {
    const { data, error } = await supabase
      .from("assistance_groups")
      .select("id, name, church_id")
      .order("name");

    if (error) {
      console.error("Erro ao carregar grupos:", error);
      return;
    }

    setAssistanceGroups(data || []);
  };

  const fetchVisitors = async () => {
    try {
      let query = supabase
        .from("visitors")
        .select("id, full_name")
        .order("full_name");

      if (selectedGroup) {
        query = query.eq("assistance_group_id", selectedGroup);
      } else if (selectedChurch) {
        query = query.eq("church_id", selectedChurch);
      }

      const { data, error } = await query;

      if (error) throw error;
      setVisitors(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar visitantes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const startDate = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(selectedMonth), "yyyy-MM-dd");

      let query = supabase
        .from("attendance_records")
        .select("visitor_id, attendance_date, service_type")
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate);

      if (selectedGroup) {
        query = query.eq("assistance_group_id", selectedGroup);
      } else if (selectedChurch) {
        query = query.eq("church_id", selectedChurch);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAttendanceRecords((data || []) as AttendanceRecord[]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar frequência",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const hasAttendance = (visitorId: string, date: Date, serviceType: "ebd" | "noite" | "outro") => {
    const dateStr = format(date, "yyyy-MM-dd");
    return attendanceRecords.some(
      (record) =>
        record.visitor_id === visitorId &&
        record.attendance_date === dateStr &&
        record.service_type === serviceType
    );
  };

  const toggleAttendance = async (visitorId: string, date: Date, serviceType: "ebd" | "noite" | "outro") => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const exists = hasAttendance(visitorId, date, serviceType);

      if (exists) {
        // Remove attendance
        const { error } = await supabase
          .from("attendance_records")
          .delete()
          .eq("visitor_id", visitorId)
          .eq("attendance_date", dateStr)
          .eq("service_type", serviceType);

        if (error) throw error;
      } else {
        // Add attendance
        const { error } = await supabase
          .from("attendance_records")
          .insert({
            visitor_id: visitorId,
            attendance_date: dateStr,
            service_type: serviceType,
            church_id: selectedChurch,
            assistance_group_id: selectedGroup || null,
            recorded_by: user!.id,
          });

        if (error) throw error;
      }

      fetchAttendanceRecords();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar frequência",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (!can("frequencia", "view")) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Acesso Negado</h2>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar este módulo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <ModernHeader
        title="Mapa de Frequência"
        description="Acompanhe a frequência dos visitantes nos cultos"
        icon={Calendar}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="church">Igreja</Label>
              <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma igreja" />
                </SelectTrigger>
                <SelectContent>
                  {churches.map((church) => (
                    <SelectItem key={church.id} value={church.id}>
                      {church.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="group">Grupo de Assistência</Label>
              <Select
                value={selectedGroup}
                onValueChange={setSelectedGroup}
                disabled={!selectedChurch}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os GAs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os GAs</SelectItem>
                  {filteredGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Mês</Label>
              <Select
                value={format(selectedMonth, "yyyy-MM")}
                onValueChange={(value) => setSelectedMonth(new Date(value + "-01"))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const date = new Date();
                    date.setMonth(i);
                    return date;
                  }).map((date) => (
                    <SelectItem key={format(date, "yyyy-MM")} value={format(date, "yyyy-MM")}>
                      {format(date, "MMMM yyyy", { locale: ptBR })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {(selectedChurch || selectedGroup) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Frequência - {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border p-2 sticky left-0 bg-background z-10">Visitante</th>
                    {daysInMonth.map((day) => (
                      <th key={day.toString()} className="border p-2 text-xs">
                        <div>{format(day, "dd")}</div>
                        <div className="text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitors.map((visitor) => (
                    <tr key={visitor.id}>
                      <td className="border p-2 sticky left-0 bg-background z-10 font-medium">
                        {visitor.full_name}
                      </td>
                      {daysInMonth.map((day) => (
                        <td key={day.toString()} className="border p-1 text-center">
                          {isSunday(day) ? (
                            <div className="flex flex-col gap-1">
                              <Checkbox
                                checked={hasAttendance(visitor.id, day, "ebd")}
                                onCheckedChange={() => toggleAttendance(visitor.id, day, "ebd")}
                                disabled={!can("frequencia", "create")}
                                title="EBD"
                              />
                              <Checkbox
                                checked={hasAttendance(visitor.id, day, "noite")}
                                onCheckedChange={() => toggleAttendance(visitor.id, day, "noite")}
                                disabled={!can("frequencia", "create")}
                                title="Noite"
                              />
                            </div>
                          ) : (
                            <Checkbox
                              checked={hasAttendance(visitor.id, day, "outro")}
                              onCheckedChange={() => toggleAttendance(visitor.id, day, "outro")}
                              disabled={!can("frequencia", "create")}
                            />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {visitors.length === 0 && (
                    <tr>
                      <td colSpan={daysInMonth.length + 1} className="border p-4 text-center text-muted-foreground">
                        Selecione uma igreja ou GA para visualizar os visitantes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
