export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      audit_link_events: {
        Row: {
          event_timestamp: string;
          event_type: Database["public"]["Enums"]["link_event_type"];
          id: string;
          link_id: string | null;
          user_id: string;
        };
        Insert: {
          event_timestamp?: string;
          event_type: Database["public"]["Enums"]["link_event_type"];
          id?: string;
          link_id?: string | null;
          user_id: string;
        };
        Update: {
          event_timestamp?: string;
          event_type?: Database["public"]["Enums"]["link_event_type"];
          id?: string;
          link_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_link_events_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      import_errors: {
        Row: {
          created_at: string;
          error_code: string | null;
          error_details: Json | null;
          id: string;
          import_id: string;
          row_number: number | null;
          url: string | null;
        };
        Insert: {
          created_at?: string;
          error_code?: string | null;
          error_details?: Json | null;
          id?: string;
          import_id: string;
          row_number?: number | null;
          url?: string | null;
        };
        Update: {
          created_at?: string;
          error_code?: string | null;
          error_details?: Json | null;
          id?: string;
          import_id?: string;
          row_number?: number | null;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "import_errors_import_id_fkey";
            columns: ["import_id"];
            referencedRelation: "imports";
            referencedColumns: ["id"];
          },
        ];
      };
      imports: {
        Row: {
          created_at: string;
          duplicate_rows: number;
          failed_rows: number;
          id: string;
          imported_rows: number;
          source: string | null;
          status: Database["public"]["Enums"]["import_status"];
          total_rows: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duplicate_rows?: number;
          failed_rows?: number;
          id?: string;
          imported_rows?: number;
          source?: string | null;
          status?: Database["public"]["Enums"]["import_status"];
          total_rows?: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          duplicate_rows?: number;
          failed_rows?: number;
          id?: string;
          imported_rows?: number;
          source?: string | null;
          status?: Database["public"]["Enums"]["import_status"];
          total_rows?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "imports_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      link_tags: {
        Row: {
          link_id: string;
          tag_id: string;
        };
        Insert: {
          link_id: string;
          tag_id: string;
        };
        Update: {
          link_id?: string;
          tag_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "link_tags_link_id_fkey";
            columns: ["link_id"];
            referencedRelation: "links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "link_tags_tag_id_fkey";
            columns: ["tag_id"];
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
        ];
      };
      links: {
        Row: {
          comment: string | null;
          created_at: string;
          fav_icon_path: string | null;
          id: string;
          metadata_source: Json | null;
          title: string;
          updated_at: string;
          url: string;
          user_id: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          fav_icon_path?: string | null;
          id?: string;
          metadata_source?: Json | null;
          title?: string;
          updated_at?: string;
          url: string;
          user_id: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          fav_icon_path?: string | null;
          id?: string;
          metadata_source?: Json | null;
          title?: string;
          updated_at?: string;
          url?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "links_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          theme: Database["public"]["Enums"]["theme_preference"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          theme?: Database["public"]["Enums"]["theme_preference"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          theme?: Database["public"]["Enums"]["theme_preference"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tags: {
        Row: {
          color: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      import_status: "pending" | "completed" | "failed";
      link_event_type: "created" | "updated" | "deleted" | "imported";
      theme_preference: "light" | "dark" | "system";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type PublicEnums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
