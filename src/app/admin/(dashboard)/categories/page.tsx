import Link from "next/link";
import { ArrowDown, ArrowUp } from "lucide-react";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";
import { deleteCategory, moveCategory, saveCategory } from "./actions";

export const metadata = { title: "Categories" };

const iconBtn =
  "rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: cats }, { data: media }] = await Promise.all([
    supabase.from("categories").select("*").order("position").order("created_at").returns<Category[]>(),
    supabase.from("media_items").select("category_id, media_type").returns<{ category_id: string | null; media_type: string }[]>(),
  ]);
  const categories = cats ?? [];
  const counts = new Map<string, { photos: number; videos: number }>();
  for (const m of media ?? []) {
    if (!m.category_id) continue;
    const c = counts.get(m.category_id) ?? { photos: 0, videos: 0 };
    if (m.media_type === "image") c.photos++;
    else if (m.media_type === "video") c.videos++;
    counts.set(m.category_id, c);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold">Categories</h1>
        <Link href="/admin/media" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-white">
          Media Library
        </Link>
      </div>
      <p className="text-sm text-neutral-600">
        Types of work, such as Wedding or Birthday. Each visible category that has photos gets a filter button in the
        “Our Work” grid, in this order.
      </p>

      <section className="rounded-xl bg-white p-4 ring-1 ring-neutral-200">
        <h2 className="mb-3 text-sm font-medium">Add a category</h2>
        <CategoryForm initial={{ name: "", slug: "", is_active: true }} action={saveCategory.bind(null, null)} submitLabel="Add" resetOnSave />
      </section>

      <ol className="space-y-2">
        {categories.map((c, i) => {
          const n = counts.get(c.id) ?? { photos: 0, videos: 0 };
          return (
            <li key={c.id} className="flex items-start gap-2 rounded-xl bg-white p-4 ring-1 ring-neutral-200">
              <div className="min-w-0 flex-1 space-y-1">
                <CategoryForm
                  initial={{ name: c.name, slug: c.slug, is_active: c.is_active }}
                  action={saveCategory.bind(null, c.id)}
                  submitLabel="Save"
                />
                <p className="text-xs text-neutral-500">
                  {n.photos} photo{n.photos === 1 ? "" : "s"} · {n.videos} video{n.videos === 1 ? "" : "s"}
                </p>
              </div>
              <form action={moveCategory.bind(null, c.id, -1)}>
                <button className={iconBtn} disabled={i === 0} aria-label="Move up" title="Move up">
                  <ArrowUp className="h-4 w-4" />
                </button>
              </form>
              <form action={moveCategory.bind(null, c.id, 1)}>
                <button className={iconBtn} disabled={i === categories.length - 1} aria-label="Move down" title="Move down">
                  <ArrowDown className="h-4 w-4" />
                </button>
              </form>
              <form action={deleteCategory.bind(null, c.id)}>
                <ConfirmButton message={`Delete "${c.name}"? Its photos and videos are kept, without a category.`} />
              </form>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
