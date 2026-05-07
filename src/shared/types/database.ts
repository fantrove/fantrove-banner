// Path: src/shared/types/database.ts — v4: custom_css + framework_imports columns
//
// SQL migration needed (run once in Supabase SQL Editor):
//
//   ALTER TABLE banners
//     ADD COLUMN IF NOT EXISTS custom_css        jsonb DEFAULT '{}'::jsonb,
//     ADD COLUMN IF NOT EXISTS framework_imports jsonb DEFAULT '[]'::jsonb;
//
export interface Database {
  public: {
    Tables: {
      banners: {
        Row: {
          id: string; slug: string; name: string;
          banner_styles:      string | null;
          editor_mode:        string | null;
          custom_html:        Record<string, unknown> | null;
          // v4: per-lang CSS (not scoped) for full mode
          custom_css:         Record<string, unknown> | null;
          // v4: CDN framework imports [{type, url}]
          framework_imports:  Record<string, unknown>[] | null;
          translations:       Record<string, unknown> | null;
          supported_langs:    string[] | null;
          content:            Record<string, unknown>[] | null;
          buttons:            Record<string, unknown>[] | null;
          button_config:      Record<string, unknown> | null;
          image_assets:       Record<string, unknown> | null;
          js_trigger:         string | null;
          countdown_config:   Record<string, unknown> | null;
          slider_config:      Record<string, unknown> | null;
          is_published:       boolean;
          allowed_domains:    string[];
          created_at:         string;
          updated_at:         string;
          published_at:       string | null;
        };
        Insert: {
          id?: string; slug: string; name: string;
          banner_styles?:     string | null;
          editor_mode?:       string | null;
          custom_html?:       Record<string, unknown> | null;
          custom_css?:        Record<string, unknown> | null;
          framework_imports?: Record<string, unknown>[] | null;
          translations?:      Record<string, unknown> | null;
          supported_langs?:   string[] | null;
          content?:           Record<string, unknown>[] | null;
          buttons?:           Record<string, unknown>[] | null;
          button_config?:     Record<string, unknown> | null;
          image_assets?:      Record<string, unknown> | null;
          js_trigger?:        string | null;
          countdown_config?:  Record<string, unknown> | null;
          slider_config?:     Record<string, unknown> | null;
          is_published?:      boolean;
          allowed_domains?:   string[];
          published_at?:      string | null;
        };
        Update: {
          id?: string; slug?: string; name?: string;
          banner_styles?:     string | null;
          editor_mode?:       string | null;
          custom_html?:       Record<string, unknown> | null;
          custom_css?:        Record<string, unknown> | null;
          framework_imports?: Record<string, unknown>[] | null;
          translations?:      Record<string, unknown> | null;
          supported_langs?:   string[] | null;
          content?:           Record<string, unknown>[] | null;
          buttons?:           Record<string, unknown>[] | null;
          button_config?:     Record<string, unknown> | null;
          image_assets?:      Record<string, unknown> | null;
          js_trigger?:        string | null;
          countdown_config?:  Record<string, unknown> | null;
          slider_config?:     Record<string, unknown> | null;
          is_published?:      boolean;
          allowed_domains?:   string[];
          published_at?:      string | null;
        };
        Relationships: [];
      };
      banner_audit_logs: {
        Row: {
          id: string; banner_id: string|null;
          action: string;
          changes: Record<string,unknown>|null;
          created_at: string;
        };
        Insert: {
          id?: string; banner_id?: string|null;
          action: string;
          changes?: Record<string,unknown>|null;
        };
        Update: {
          id?: string; banner_id?: string|null;
          action?: string;
          changes?: Record<string,unknown>|null;
        };
        Relationships: [];
      };
    };
    Views: Record<string,never>; Functions: Record<string,never>;
    Enums: Record<string,never>; CompositeTypes: Record<string,never>;
  };
}