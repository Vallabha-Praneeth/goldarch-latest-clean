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
      activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          attachment_urls: string[] | null
          created_at: string | null
          description: string | null
          id: string
          next_follow_up_date: string | null
          outcome: string | null
          project_id: string | null
          supplier_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          attachment_urls?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          next_follow_up_date?: string | null
          outcome?: string | null
          project_id?: string | null
          supplier_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          attachment_urls?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          next_follow_up_date?: string | null
          outcome?: string | null
          project_id?: string | null
          supplier_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_color: string | null
          icon_name: string | null
          icon_type: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_color?: string | null
          icon_name?: string | null
          icon_type?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_color?: string | null
          icon_name?: string | null
          icon_type?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          actual_close_date: string | null
          actual_delivery_date: string | null
          bom_item_ids: string[] | null
          created_at: string | null
          currency: string | null
          description: string | null
          estimated_value: number | null
          expected_close_date: string | null
          expected_delivery_date: string | null
          final_value: number | null
          id: string
          is_won: boolean | null
          lost_reason: string | null
          owner_id: string
          probability: number | null
          project_id: string | null
          quoted_value: number | null
          stage: Database["public"]["Enums"]["deal_stage"] | null
          supplier_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_close_date?: string | null
          actual_delivery_date?: string | null
          bom_item_ids?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          expected_delivery_date?: string | null
          final_value?: number | null
          id?: string
          is_won?: boolean | null
          lost_reason?: string | null
          owner_id: string
          probability?: number | null
          project_id?: string | null
          quoted_value?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          supplier_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_close_date?: string | null
          actual_delivery_date?: string | null
          bom_item_ids?: string[] | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          estimated_value?: number | null
          expected_close_date?: string | null
          expected_delivery_date?: string | null
          final_value?: number | null
          id?: string
          is_won?: boolean | null
          lost_reason?: string | null
          owner_id?: string
          probability?: number | null
          project_id?: string | null
          quoted_value?: number | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          supplier_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          category: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          subject: string
          variables: string[] | null
        }
        Insert: {
          body: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          subject: string
          variables?: string[] | null
        }
        Update: {
          body?: string
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          subject?: string
          variables?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_batches: {
        Row: {
          auto_categorized_count: number | null
          batch_name: string
          created_at: string | null
          failed_imports: number | null
          id: string
          import_metadata: Json | null
          imported_by: string | null
          source: string | null
          successful_imports: number | null
          total_records: number | null
        }
        Insert: {
          auto_categorized_count?: number | null
          batch_name: string
          created_at?: string | null
          failed_imports?: number | null
          id?: string
          import_metadata?: Json | null
          imported_by?: string | null
          source?: string | null
          successful_imports?: number | null
          total_records?: number | null
        }
        Update: {
          auto_categorized_count?: number | null
          batch_name?: string
          created_at?: string | null
          failed_imports?: number | null
          id?: string
          import_metadata?: Json | null
          imported_by?: string | null
          source?: string | null
          successful_imports?: number | null
          total_records?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          deal_id: string | null
          id: string
          is_pinned: boolean | null
          mentions: string[] | null
          project_id: string | null
          supplier_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          is_pinned?: boolean | null
          mentions?: string[] | null
          project_id?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          deal_id?: string | null
          id?: string
          is_pinned?: boolean | null
          mentions?: string[] | null
          project_id?: string | null
          supplier_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      project_access: {
        Row: {
          access_level: string
          can_edit: boolean | null
          can_view_bom: boolean | null
          can_view_drawings: boolean | null
          granted_at: string | null
          granted_by: string | null
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          access_level: string
          can_edit?: boolean | null
          can_view_bom?: boolean | null
          can_view_drawings?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          access_level?: string
          can_edit?: boolean | null
          can_view_bom?: boolean | null
          can_view_drawings?: boolean | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_bom_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          item_category: string | null
          item_name: string
          procurement_notes: string | null
          project_id: string
          quantity: number | null
          status: string | null
          supplier_id: string | null
          total_price: number | null
          unit: string | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_category?: string | null
          item_name: string
          procurement_notes?: string | null
          project_id: string
          quantity?: number | null
          status?: string | null
          supplier_id?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          item_category?: string | null
          item_name?: string
          procurement_notes?: string | null
          project_id?: string
          quantity?: number | null
          status?: string | null
          supplier_id?: string | null
          total_price?: number | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_bom_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_bom_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          mime_type: string | null
          project_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
          project_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
          project_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          budget: number | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          location: string | null
          name: string
          owner_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name: string
          owner_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          location?: string | null
          name?: string
          owner_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string | null
          currency: string | null
          deal_id: string
          id: string
          items: Json | null
          notes: string | null
          quote_date: string
          quote_file_url: string | null
          quote_number: string | null
          status: string | null
          subtotal: number | null
          supplier_id: string
          tax: number | null
          total: number | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          deal_id: string
          id?: string
          items?: Json | null
          notes?: string | null
          quote_date: string
          quote_file_url?: string | null
          quote_number?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id: string
          tax?: number | null
          total?: number | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          deal_id?: string
          id?: string
          items?: Json | null
          notes?: string | null
          quote_date?: string
          quote_file_url?: string | null
          quote_number?: string | null
          status?: string | null
          subtotal?: number | null
          supplier_id?: string
          tax?: number | null
          total?: number | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_rating_history: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          rated_by: string | null
          rating: number | null
          rating_type: string
          source: string | null
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rated_by?: string | null
          rating?: number | null
          rating_type: string
          source?: string | null
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          rated_by?: string | null
          rating?: number | null
          rating_type?: string
          source?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_rating_history_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_rating_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          auto_categorization_confidence: number | null
          auto_categorized: boolean | null
          catalog_title: string | null
          catalog_url: string | null
          category_id: string | null
          city: string | null
          comments: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          export_notes: string | null
          external_rating: number | null
          external_rating_count: number | null
          external_rating_last_updated: string | null
          external_rating_source: string | null
          external_rating_url: string | null
          featured: boolean | null
          id: string
          import_batch: string | null
          logo_url: string | null
          moq: string | null
          name: string
          owner_rating: number | null
          owner_rating_date: string | null
          owner_rating_notes: string | null
          phone: string | null
          price: string | null
          products: string | null
          updated_at: string | null
          user_id: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          address?: string | null
          auto_categorization_confidence?: number | null
          auto_categorized?: boolean | null
          catalog_title?: string | null
          catalog_url?: string | null
          category_id?: string | null
          city?: string | null
          comments?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          export_notes?: string | null
          external_rating?: number | null
          external_rating_count?: number | null
          external_rating_last_updated?: string | null
          external_rating_source?: string | null
          external_rating_url?: string | null
          featured?: boolean | null
          id?: string
          import_batch?: string | null
          logo_url?: string | null
          moq?: string | null
          name: string
          owner_rating?: number | null
          owner_rating_date?: string | null
          owner_rating_notes?: string | null
          phone?: string | null
          price?: string | null
          products?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          address?: string | null
          auto_categorization_confidence?: number | null
          auto_categorized?: boolean | null
          catalog_title?: string | null
          catalog_url?: string | null
          category_id?: string | null
          city?: string | null
          comments?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          export_notes?: string | null
          external_rating?: number | null
          external_rating_count?: number | null
          external_rating_last_updated?: string | null
          external_rating_source?: string | null
          external_rating_url?: string | null
          featured?: boolean | null
          id?: string
          import_batch?: string | null
          logo_url?: string | null
          moq?: string | null
          name?: string
          owner_rating?: number | null
          owner_rating_date?: string | null
          owner_rating_notes?: string | null
          phone?: string | null
          price?: string | null
          products?: string | null
          updated_at?: string | null
          user_id?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"] | null
          project_id: string | null
          reminder_sent: boolean | null
          reminder_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          supplier_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          reminder_sent?: boolean | null
          reminder_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          supplier_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"] | null
          project_id?: string | null
          reminder_sent?: boolean | null
          reminder_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          supplier_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      activity_type:
        | "call"
        | "email"
        | "meeting"
        | "quote_request"
        | "quote_received"
        | "order_placed"
        | "delivery"
        | "payment"
        | "note"
        | "rating_change"
      deal_stage:
        | "inquiry"
        | "quote_requested"
        | "quote_received"
        | "negotiating"
        | "po_sent"
        | "confirmed"
        | "in_production"
        | "shipped"
        | "delivered"
        | "completed"
        | "lost"
      project_status:
        | "planning"
        | "design"
        | "procurement"
        | "construction"
        | "completed"
        | "on_hold"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "completed" | "cancelled"
      user_role: "owner" | "vendor" | "procurement" | "admin"
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
      activity_type: [
        "call",
        "email",
        "meeting",
        "quote_request",
        "quote_received",
        "order_placed",
        "delivery",
        "payment",
        "note",
        "rating_change",
      ],
      deal_stage: [
        "inquiry",
        "quote_requested",
        "quote_received",
        "negotiating",
        "po_sent",
        "confirmed",
        "in_production",
        "shipped",
        "delivered",
        "completed",
        "lost",
      ],
      project_status: [
        "planning",
        "design",
        "procurement",
        "construction",
        "completed",
        "on_hold",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: ["pending", "in_progress", "completed", "cancelled"],
      user_role: ["owner", "vendor", "procurement", "admin"],
    },
  },
} as const
