// Path:    src/shared/types/database.ts
// Purpose: Supabase generated DB types (run: npx supabase gen types typescript).
//          This stub matches schema.sql — regenerate after schema changes.
// Used by: db.ts

export interface Database {
  public: {
    Tables: {
      banners: {
        Row: {
          id:               string;
          slug:             string;
          name:             string;
          banner_styles:    string | null;
          button_config:    Record<string, unknown> | null;
          image_assets:     Record<string, unknown> | null;
          js_trigger:       string | null;
          countdown_config: Record<string, unknown> | null;
          slider_config:    Record<string, unknown> | null;
          is_published:     boolean;
          allowed_domains:  string[];
          created_at:       string;
          updated_at:       string;
          published_at:     string | null;
        };
        Insert: {
          id?:               string;
          slug:              string;
          name:              string;
          banner_styles?:    string | null;
          button_config?:    Record<string, unknown> | null;
          image_assets?:     Record<string, unknown> | null;
          js_trigger?:       string | null;
          countdown_config?: Record<string, unknown> | null;
          slider_config?:    Record<string, unknown> | null;
          is_published?:     boolean;
          allowed_domains?:  string[];
          published_at?:     string | null;
        };
        Update: {
          id?:               string;
          slug?:             string;
          name?:             string;
          banner_styles?:    string | null;
          button_config?:    Record<string, unknown> | null;
          image_assets?:     Record<string, unknown> | null;
          js_trigger?:       string | null;
          countdown_config?: Record<string, unknown> | null;
          slider_config?:    Record<string, unknown> | null;
          is_published?:     boolean;
          allowed_domains?:  string[];
          published_at?:     string | null;
        };
        Relationships: [];
      };
      banner_audit_logs: {
        Row: {
          id:         string;
          banner_id:  string | null;
          action:     string;
          changes:    Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?:        string;
          banner_id?: string | null;
          action:     string;
          changes?:   Record<string, unknown> | null;
        };
        Update: {
          id?:        string;
          banner_id?: string | null;
          action?:    string;
          changes?:   Record<string, unknown> | null;
        };
        Relationships: [];
      };
    };
    Views:          Record<string, never>;
    Functions:      Record<string, never>;
    Enums:          Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}