# Photography Website Builder

A Next.js + Supabase photography portfolio with a visual admin builder.
Full product plan: [cphotography_website_builder_final_plan.md](cphotography_website_builder_final_plan.md).

## Status

Phase 1 (Foundation) is in place: Next.js app, Supabase clients, schema and RLS migrations, admin sign-in, and a protected admin layout.

## Setup

1. Create a Supabase project.
2. `cp .env.example .env.local` and fill in the URL, anon key and service-role key.
3. Apply the migrations in `supabase/migrations/` in order, then `supabase/seed.sql`
   (SQL editor, or `npx supabase db push` once the CLI is linked).
4. In Supabase → Authentication, **disable public sign-ups**.
5. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env.local`. The first sign-in at `/admin/login`
   with those credentials creates the user and grants the admin role. Remove them once you
   have your own admin account (signing in still works; they only bootstrap).
6. `npm install && npm run dev` and open http://localhost:3000/admin.

## Roles

| Role   | Can |
| ------ | --- |
| editor | Edit drafts, media, albums, categories, navigation, enquiries |
| admin  | Everything an editor can, plus publish, roll back, permanent delete, manage users |

Publishing, rollback and permanent delete run as Postgres functions (`publish_page`, `rollback_page`, `permanently_delete`), so the role checks happen in the database.
