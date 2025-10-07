export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          id: string
          name: string
          pastor_id: string | null
          region_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pastor_id?: string | null
          region_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pastor_id?: string | null
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      assistance_groups: {
        Row: {
          church_id: string
          created_at: string | null
          description: string | null
          id: string
          leader_id: string | null
          name: string
          responsible_id: string | null
          updated_at: string | null
        }
        Insert: {
          church_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string | null
          name: string
          responsible_id?: string | null
          updated_at?: string | null
        }
        Update: {
          church_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          leader_id?: string | null
          name?: string
          responsible_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistance_groups_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          assistance_group_id: string | null
          attendance_date: string
          church_id: string
          created_at: string | null
          id: string
          recorded_by: string
          service_type: string
          visitor_id: string
        }
        Insert: {
          assistance_group_id?: string | null
          attendance_date: string
          church_id: string
          created_at?: string | null
          id?: string
          recorded_by: string
          service_type: string
          visitor_id: string
        }
        Update: {
          assistance_group_id?: string | null
          attendance_date?: string
          church_id?: string
          created_at?: string | null
          id?: string
          recorded_by?: string
          service_type?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_assistance_group_id_fkey"
            columns: ["assistance_group_id"]
            isOneToOne: false
            referencedRelation: "assistance_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      church_permissions: {
        Row: {
          church_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "church_permissions_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      churches: {
        Row: {
          address: string | null
          area_id: string | null
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          pastor_id: string | null
          pastor_name: string | null
          phone: string | null
          region_id: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          area_id?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          pastor_id?: string | null
          pastor_name?: string | null
          phone?: string | null
          region_id?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          area_id?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          pastor_id?: string | null
          pastor_name?: string | null
          phone?: string | null
          region_id?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "churches_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "churches_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          church_id: string
          created_at: string | null
          description: string | null
          event_date: string
          id: string
          name: string
        }
        Insert: {
          church_id: string
          created_at?: string | null
          description?: string | null
          event_date: string
          id?: string
          name: string
        }
        Update: {
          church_id?: string
          created_at?: string | null
          description?: string | null
          event_date?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          area_id: string | null
          church_id: string | null
          cpf: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          region_id: string | null
          updated_at: string | null
        }
        Insert: {
          area_id?: string | null
          church_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          region_id?: string | null
          updated_at?: string | null
        }
        Update: {
          area_id?: string | null
          church_id?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          region_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
          pastor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          pastor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          pastor_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      role_definitions: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          role_name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          role_name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          role_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module: string
          role_name: string | null
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module: string
          role_name?: string | null
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module?: string
          role_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_name_fkey"
            columns: ["role_name"]
            isOneToOne: false
            referencedRelation: "role_definitions"
            referencedColumns: ["role_name"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string
          assistance_group_id: string
          church_id: string
          completed_date: string | null
          completion_notes: string | null
          created_at: string | null
          created_by: string
          description: string | null
          due_date: string
          id: string
          interaction_type: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to: string
          assistance_group_id: string
          church_id: string
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          interaction_type: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string
          assistance_group_id?: string
          church_id?: string
          completed_date?: string | null
          completion_notes?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          interaction_type?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assistance_group_id_fkey"
            columns: ["assistance_group_id"]
            isOneToOne: false
            referencedRelation: "assistance_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_churches: {
        Row: {
          church_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_churches_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          church_id: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          church_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_attendance: {
        Row: {
          attended: boolean | null
          created_at: string | null
          event_id: string
          id: string
          visitor_id: string
        }
        Insert: {
          attended?: boolean | null
          created_at?: string | null
          event_id: string
          id?: string
          visitor_id: string
        }
        Update: {
          attended?: boolean | null
          created_at?: string | null
          event_id?: string
          id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_attendance_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_attendance_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_history: {
        Row: {
          contacted_by: string | null
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          visitor_id: string
        }
        Insert: {
          contacted_by?: string | null
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          visitor_id: string
        }
        Update: {
          contacted_by?: string | null
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_history_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_interactions: {
        Row: {
          created_at: string | null
          created_by: string
          description: string
          frequencia: string | null
          id: string
          interaction_date: string
          interaction_type: string
          ultimo_culto: string | null
          updated_at: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description: string
          frequencia?: string | null
          id?: string
          interaction_date?: string
          interaction_type: string
          ultimo_culto?: string | null
          updated_at?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string
          frequencia?: string | null
          id?: string
          interaction_date?: string
          interaction_type?: string
          ultimo_culto?: string | null
          updated_at?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_interactions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          address: string | null
          assistance_group_id: string | null
          candidato_batismo: boolean | null
          categoria: Database["public"]["Enums"]["visitor_category"] | null
          church_id: string
          convidado_por: string | null
          created_at: string | null
          data_batismo: string | null
          data_nascimento: string | null
          email: string | null
          estado_civil: string | null
          first_visit_date: string | null
          full_name: string
          group_id: string | null
          id: string
          invited_by: string | null
          notes: string | null
          participacao_seminario: string | null
          phone: string | null
          primeira_visita: string | null
          profissao: string | null
          responsavel_assistencia: string | null
          sexo: Database["public"]["Enums"]["visitor_gender"] | null
          status: Database["public"]["Enums"]["visitor_status"]
          tem_filhos: boolean | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          assistance_group_id?: string | null
          candidato_batismo?: boolean | null
          categoria?: Database["public"]["Enums"]["visitor_category"] | null
          church_id: string
          convidado_por?: string | null
          created_at?: string | null
          data_batismo?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado_civil?: string | null
          first_visit_date?: string | null
          full_name: string
          group_id?: string | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          participacao_seminario?: string | null
          phone?: string | null
          primeira_visita?: string | null
          profissao?: string | null
          responsavel_assistencia?: string | null
          sexo?: Database["public"]["Enums"]["visitor_gender"] | null
          status: Database["public"]["Enums"]["visitor_status"]
          tem_filhos?: boolean | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          assistance_group_id?: string | null
          candidato_batismo?: boolean | null
          categoria?: Database["public"]["Enums"]["visitor_category"] | null
          church_id?: string
          convidado_por?: string | null
          created_at?: string | null
          data_batismo?: string | null
          data_nascimento?: string | null
          email?: string | null
          estado_civil?: string | null
          first_visit_date?: string | null
          full_name?: string
          group_id?: string | null
          id?: string
          invited_by?: string | null
          notes?: string | null
          participacao_seminario?: string | null
          phone?: string | null
          primeira_visita?: string | null
          profissao?: string | null
          responsavel_assistencia?: string | null
          sexo?: Database["public"]["Enums"]["visitor_gender"] | null
          status?: Database["public"]["Enums"]["visitor_status"]
          tem_filhos?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_assistance_group_id_fkey"
            columns: ["assistance_group_id"]
            isOneToOne: false
            referencedRelation: "assistance_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "assistance_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_church: {
        Args: { _church_id: string; _user_id: string }
        Returns: boolean
      }
      get_user_church: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role_in_church: {
        Args: {
          _church_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "pastor"
        | "group_leader"
        | "user"
        | "pastor_coordenador"
        | "pastor_regiao"
        | "pastor_geral"
      visitor_category:
        | "crianca"
        | "intermediario"
        | "adolescente"
        | "jovem"
        | "senhora"
        | "varao"
        | "idoso"
      visitor_gender: "masculino" | "feminino"
      visitor_status: "visitante" | "em_assistencia" | "batizado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "pastor",
        "group_leader",
        "user",
        "pastor_coordenador",
        "pastor_regiao",
        "pastor_geral",
      ],
      visitor_category: [
        "crianca",
        "intermediario",
        "adolescente",
        "jovem",
        "senhora",
        "varao",
        "idoso",
      ],
      visitor_gender: ["masculino", "feminino"],
      visitor_status: ["visitante", "em_assistencia", "batizado"],
    },
  },
} as const
