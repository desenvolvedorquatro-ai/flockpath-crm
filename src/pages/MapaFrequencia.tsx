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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSunday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Sun, Moon, Clock } from "lucide-react";

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
  const [selectedGroup, setSelectedGroup] = useState("all");
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
      setLoading(true);
      let query = supabase
        .from("visitors")
        .select("id, full_name")
        .order("full_name");

      if (selectedGroup && selectedGroup !== "all") {
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

      if (selectedGroup && selectedGroup !== "all") {
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

  const getAttendanceCount = (visitorId: string) => {
    return attendanceRecords.filter(record => record.visitor_id === visitorId).length;
  };

  const toggleAttendance = async (visitorId: string, date: Date, serviceType: "ebd" | "noite" | "outro") => {
    if (!selectedChurch) {
      toast({
        title: "Erro",
        description: "Selecione uma igreja antes de marcar frequência",
        variant: "destructive",
      });
      return;
    }

    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const exists = hasAttendance(visitorId, date, serviceType);

      if (exists) {
        const { error } = await supabase
          .from("attendance_records")
          .delete()
          .eq("visitor_id", visitorId)
          .eq("attendance_date", dateStr)
          .eq("service_type", serviceType);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("attendance_records")
          .insert({
            visitor_id: visitorId,
            attendance_date: dateStr,
            service_type: serviceType,
            church_id: selectedChurch,
            assistance_group_id: selectedGroup !== "all" ? selectedGroup : null,
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
    <div className="container py-8 space-y-6">
      <ModernHeader
        title="Mapa de Frequência"
        description="Acompanhe a frequência dos visitantes nos cultos"
        icon={Calendar}
        colorScheme="red-coral"
      />

      {/* Legenda */}
      <Card className="bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-6 items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                <Sun className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium">EBD (Escola Bíblica Dominical)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-purple-500 flex items-center justify-center">
                <Moon className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium">Culto Noite</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-gray-500 flex items-center justify-center">
                <Clock className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-medium">Outro Horário</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="church" className="text-base font-semibold">Igreja</Label>
              <Select value={selectedChurch} onValueChange={setSelectedChurch}>
                <SelectTrigger className="mt-2">
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
              <Label htmlFor="group" className="text-base font-semibold">Grupo de Assistência</Label>
              <Select
                value={selectedGroup}
                onValueChange={setSelectedGroup}
                disabled={!selectedChurch}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Todos os GAs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os GAs</SelectItem>
                  {filteredGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month" className="text-base font-semibold">Mês</Label>
              <Select
                value={format(selectedMonth, "yyyy-MM")}
                onValueChange={(value) => setSelectedMonth(new Date(value + "-01"))}
              >
                <SelectTrigger className="mt-2">
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

      {/* Tabela de Frequência */}
      {(selectedChurch || selectedGroup) && (
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
            <CardTitle className="text-xl">
              Frequência - {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse">
                  <thead className="bg-muted/50 sticky top-0 z-20">
                    <tr>
                      <th className="border-r border-border p-3 sticky left-0 bg-muted z-30 min-w-[200px] text-left font-bold">
                        Visitante
                      </th>
                      {daysInMonth.map((day) => (
                        <th
                          key={day.toString()}
                          className={`border-r border-border p-2 text-xs min-w-[80px] ${
                            isSunday(day) ? "bg-amber-50 dark:bg-amber-950/20" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {isSunday(day) && <Sun className="w-4 h-4 text-amber-500" />}
                            <div className="font-bold">{format(day, "dd")}</div>
                            <div className="text-muted-foreground uppercase">
                              {format(day, "EEE", { locale: ptBR })}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map((visitor, index) => (
                      <tr
                        key={visitor.id}
                        className={`hover:bg-accent/20 transition-colors ${
                          index % 2 === 0 ? "bg-background" : "bg-muted/20"
                        }`}
                      >
                        <td className="border-r border-b border-border p-3 sticky left-0 bg-inherit z-10 font-medium">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate">{visitor.full_name}</span>
                            <Badge variant="secondary" className="shrink-0 text-xs">
                              {getAttendanceCount(visitor.id)}
                            </Badge>
                          </div>
                        </td>
                        {daysInMonth.map((day) => (
                          <td
                            key={day.toString()}
                            className={`border-r border-b border-border p-2 text-center ${
                              isSunday(day) ? "bg-amber-50/50 dark:bg-amber-950/10" : ""
                            }`}
                          >
                            {isSunday(day) ? (
                              <div className="flex flex-col items-center gap-2">
                                <div
                                  className="flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
                                  title="EBD"
                                >
                                  <Checkbox
                                    checked={hasAttendance(visitor.id, day, "ebd")}
                                    onCheckedChange={() => toggleAttendance(visitor.id, day, "ebd")}
                                    disabled={!can("frequencia", "create")}
                                    className="w-5 h-5 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-600"
                                  />
                                </div>
                                <div
                                  className="flex items-center gap-1 cursor-pointer hover:scale-110 transition-transform"
                                  title="Noite"
                                >
                                  <Checkbox
                                    checked={hasAttendance(visitor.id, day, "noite")}
                                    onCheckedChange={() => toggleAttendance(visitor.id, day, "noite")}
                                    disabled={!can("frequencia", "create")}
                                    className="w-5 h-5 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-600"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <Checkbox
                                  checked={hasAttendance(visitor.id, day, "outro")}
                                  onCheckedChange={() => toggleAttendance(visitor.id, day, "outro")}
                                  disabled={!can("frequencia", "create")}
                                  className="w-5 h-5 data-[state=checked]:bg-gray-500 data-[state=checked]:border-gray-600"
                                  title="Outro horário"
                                />
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {visitors.length === 0 && (
                      <tr>
                        <td
                          colSpan={daysInMonth.length + 1}
                          className="border p-8 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-12 h-12 opacity-50" />
                            <p className="text-lg font-medium">
                              Nenhum visitante encontrado
                            </p>
                            <p className="text-sm">
                              Selecione uma igreja ou grupo de assistência para visualizar os visitantes
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}