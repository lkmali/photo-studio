import Link from "next/link";
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, Film, Image as ImageIcon } from "lucide-react";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { MediaForm } from "@/components/admin/MediaForm";
import { emptyMedia } from "@/components/admin/media-form-value";
import { autoThumbnail } from "@/lib/site/media";
import { createClient } from "@/lib/supabase/server";
import type { Category, MediaItem } from "@/types/database";
import { deleteMedia, moveMedia, saveMedia, setMediaPublished } from "./actions";

export const metadata = { title: "Media Library" };

const iconBtn =
  "rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent";

const TABS = [
  { key: "image", label: "Photos", icon: ImageIcon },
  { key: "video", label: "Videos / Films", icon: Film },
] as const;

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type: typeParam } = await searchParams;
  const type = typeParam === "video" ? "video" : "image";

  const supabase = await createClient();
  const [{ data: media }, { data: cats }] = await Promise.all([
    supabase
      .from("media_items")
      .select("*")
      .eq("media_type", type)
      .order("position")
      .order("created_at")
      .returns<MediaItem[]>(),
    supabase.from("categories").select("id, name, slug, position, is_active").order("position").returns<Category[]>(),
  ]);
  const items = media ?? [];
  const categories = cats ?? [];
  const catName = new Map(categories.map((c) => [c.id, c.name]));
  const published = items.filter((m) => m.is_published).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-semibold">Media Library</h1>
        <Link href="/admin/categories" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-white">
          Manage categories
        </Link>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-1.5 rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-white"
        >
          View site <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="text-sm text-neutral-600">
        {type === "image"
          ? "Photos shown here fill the “Our Work” grid on the home page, with a filter button for each category."
          : "Videos shown here fill the “Featured Films” grid on the home page."}{" "}
        Until you add one, the site keeps the demo cards from the Website Builder.
      </p>

      <div className="flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = t.key === type;
          return (
            <Link
              key={t.key}
              href={`/admin/media?type=${t.key}`}
              className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm ${
                active ? "border-neutral-900 font-medium text-neutral-900" : "border-transparent text-neutral-500 hover:text-neutral-900"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden /> {t.label}
            </Link>
          );
        })}
      </div>

      <section className="rounded-xl bg-white p-6 ring-1 ring-neutral-200">
        <h2 className="mb-4 font-medium">{type === "image" ? "Add a photo" : "Add a video"}</h2>
        {/* key resets the form when switching tabs */}
        <MediaForm
          key={type}
          initial={emptyMedia(type)}
          categories={categories}
          action={saveMedia.bind(null, null)}
          submitLabel="Add"
          resetOnSave
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm text-neutral-600">
          {items.length} {type === "image" ? "photo" : "video"}
          {items.length === 1 ? "" : "s"} · {published} shown on the website
        </h2>
        {items.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-sm text-neutral-500 ring-1 ring-neutral-200">Nothing added yet.</p>
        )}
        <ol className="space-y-3">
          {items.map((m, i) => {
            const thumb = m.thumbnail_url || (m.media_type === "image" ? m.original_url : autoThumbnail(m.original_url));
            return (
              <li key={m.id} className="rounded-xl bg-white ring-1 ring-neutral-200">
                <div className="flex items-center gap-3 px-4 py-3">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt="" className="h-12 w-16 shrink-0 rounded object-cover ring-1 ring-neutral-200" />
                  ) : (
                    <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded bg-neutral-100 text-neutral-400">
                      <Film className="h-5 w-5" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{m.title || "Untitled"}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {(m.category_id && catName.get(m.category_id)) || "No category"}
                      {m.media_type === "image" && m.subtitle ? ` · ${m.subtitle}` : ""}
                      {m.media_type === "video" && m.duration ? ` · ${m.duration}` : ""}
                    </span>
                  </span>
                  {!m.is_published && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">Hidden</span>
                  )}
                  <form action={moveMedia.bind(null, m.id, -1)}>
                    <button className={iconBtn} disabled={i === 0} aria-label="Move up" title="Move up">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                  </form>
                  <form action={moveMedia.bind(null, m.id, 1)}>
                    <button className={iconBtn} disabled={i === items.length - 1} aria-label="Move down" title="Move down">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </form>
                  <form action={setMediaPublished.bind(null, m.id, !m.is_published)}>
                    <button
                      className={iconBtn}
                      aria-label={m.is_published ? "Hide from website" : "Show on website"}
                      title={m.is_published ? "Hide" : "Show"}
                    >
                      {m.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </form>
                  <form action={deleteMedia.bind(null, m.id)}>
                    <ConfirmButton message={`Delete "${m.title || "this item"}"? This can't be undone.`} />
                  </form>
                </div>
                <details className="group border-t border-neutral-200">
                  <summary className="flex cursor-pointer list-none items-center gap-1.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
                    <span className="text-[10px] text-neutral-400 transition group-open:rotate-90">▶</span> Edit
                  </summary>
                  <div className="border-t border-neutral-200 p-4">
                    <MediaForm
                      initial={{
                        media_type: m.media_type === "video" ? "video" : "image",
                        original_url: m.original_url,
                        thumbnail_url: m.thumbnail_url ?? "",
                        title: m.title,
                        category_id: m.category_id ?? "",
                        subtitle: m.subtitle ?? "",
                        duration: m.duration ?? "",
                        alt_text: m.alt_text,
                        is_published: m.is_published,
                      }}
                      categories={categories}
                      action={saveMedia.bind(null, m.id)}
                      submitLabel="Save changes"
                    />
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
