// Hand-written for Phase 1. Replace with generated types later:
//   npx supabase gen types typescript --project-id <id> > src/types/database.ts

export type AppRole = "admin" | "editor";

export type Profile = {
  id: string;
  display_name: string | null;
  role: AppRole | null;
  created_at: string;
};

export type WebsiteSettings = {
  id: string;
  site_name: string;
  logo_url: string | null;
  primary_color: string;
  accent_color: string;
  font_heading: string;
  font_body: string;
  theme: "light" | "dark";
  updated_at: string;
};

export type NavigationItem = {
  id: string;
  location: "header" | "footer";
  label: string;
  href: string;
  position: number;
  is_visible: boolean;
};
