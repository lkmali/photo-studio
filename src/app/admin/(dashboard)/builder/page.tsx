import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Plus } from "lucide-react";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { FieldsForm } from "@/components/admin/FieldsForm";
import { getStaffSession } from "@/lib/auth";
import { SECTION_TYPES, type Field } from "@/lib/site/editor-fields";
import { isSectionType, sectionSchemas } from "@/lib/site/schemas";
import { createClient } from "@/lib/supabase/server";
import type { PageSection } from "@/types/database";
import {
  addDefaultSections,
  addSection,
  deleteSection,
  moveSection,
  saveSection,
  setHomePublished,
  setSectionVisible,
} from "./actions";

export const metadata = { title: "Website Builder" };

const titleField: Field = {
  key: "_title",
  label: "Section name (admin only)",
  type: "text",
  help: "Helps you find the section in this list. Not shown on the site.",
};

const iconBtn =
  "rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent";

export default async function BuilderPage() {
  const session = await getStaffSession();
  const isAdmin = session.status === "staff" && session.profile.role === "admin";
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("website_pages")
    .select("id, is_published")
    .eq("slug", "home")
    .maybeSingle<{ id: string; is_published: boolean }>();

  if (!page) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Website Builder</h1>
        <p className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          The home page doesn&apos;t exist yet. Run the migrations and <code>supabase/seed.sql</code>.
        </p>
      </div>
    );
  }

  const { data: sections } = await supabase
    .from("page_sections")
    .select("id, section_type, title, position, is_visible, settings")
    .eq("page_id", page.id)
    .order("position")
    .order("created_at")
    .returns<Pick<PageSection, "id" | "section_type" | "title" | "position" | "is_visible" | "settings">[]>();
  const list = sections ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold">Website Builder · Home</h1>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-white"
        >
          View site <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-4 text-sm ring-1 ring-neutral-200">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            page.is_published ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {page.is_published ? "Published" : "Not published"}
        </span>
        <span className="mr-auto text-neutral-600">
          {page.is_published
            ? "Visitors see these sections."
            : "Visitors see the default design until the page is published."}
        </span>
        {isAdmin ? (
          <form action={setHomePublished.bind(null, !page.is_published)}>
            <button className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700">
              {page.is_published ? "Unpublish" : "Publish"}
            </button>
          </form>
        ) : (
          <span className="text-xs text-neutral-500">Only admins can publish.</span>
        )}
      </div>

      {list.length === 0 && (
        <div className="rounded-xl bg-white p-6 text-sm ring-1 ring-neutral-200">
          <p className="mb-3 text-neutral-600">This page has no sections yet.</p>
          <form action={addDefaultSections}>
            <button className="rounded-md bg-neutral-900 px-3 py-1.5 font-medium text-white hover:bg-neutral-700">
              Add the default design
            </button>
          </form>
        </div>
      )}

      <ol className="space-y-3">
        {list.map((section, i) => {
          const type = isSectionType(section.section_type) ? section.section_type : null;
          const typeLabel = type ? SECTION_TYPES[type].label : section.section_type;
          return (
            <li key={section.id} className="rounded-xl bg-white ring-1 ring-neutral-200">
              <div className="flex items-center gap-2 px-4 py-3">
                  <span className="w-6 text-xs tabular-nums text-neutral-400">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{section.title || typeLabel}</span>
                    <span className="block text-xs text-neutral-500">{typeLabel}</span>
                  </span>
                  {!section.is_visible && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">Hidden</span>
                  )}
                  <form action={moveSection.bind(null, section.id, -1)}>
                    <button className={iconBtn} disabled={i === 0} aria-label="Move up" title="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </form>
                  <form action={moveSection.bind(null, section.id, 1)}>
                    <button className={iconBtn} disabled={i === list.length - 1} aria-label="Move down" title="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </form>
                  <form action={setSectionVisible.bind(null, section.id, !section.is_visible)}>
                    <button
                      className={iconBtn}
                      aria-label={section.is_visible ? "Hide section" : "Show section"}
                      title={section.is_visible ? "Hide" : "Show"}
                    >
                      {section.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </form>
                  <form action={deleteSection.bind(null, section.id)}>
                    <ConfirmButton message={`Delete the "${section.title || typeLabel}" section? This can't be undone.`} />
                  </form>
                </div>
              <details className="group border-t border-neutral-200">
                <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                  <span className="text-[10px] text-neutral-400 transition group-open:rotate-90">▶</span> Edit content
                </summary>
                <div className="border-t border-neutral-200 px-4 pt-4">
                  {type ? (
                    <FieldsForm
                      fields={[titleField, ...SECTION_TYPES[type].fields]}
                      initial={{
                        _title: section.title,
                        ...sectionSchemas[type].parse(section.settings ?? {}),
                      }}
                      action={saveSection.bind(null, section.id)}
                    />
                  ) : (
                    <p className="pb-4 text-sm text-red-700">
                      Unknown section type &quot;{section.section_type}&quot;. It is skipped on the site.
                    </p>
                  )}
                </div>
              </details>
            </li>
          );
        })}
      </ol>

      <form action={addSection} className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-4 ring-1 ring-neutral-200">
        <label htmlFor="section_type" className="text-sm font-medium">
          Add section
        </label>
        <select
          id="section_type"
          name="section_type"
          className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm"
        >
          {Object.entries(SECTION_TYPES).map(([type, def]) => (
            <option key={type} value={type}>
              {def.label}
            </option>
          ))}
        </select>
        <button className="flex items-center gap-1.5 rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700">
          <Plus className="h-4 w-4" /> Add
        </button>
        <span className="text-xs text-neutral-500">New sections start with the default content.</span>
      </form>
    </div>
  );
}
