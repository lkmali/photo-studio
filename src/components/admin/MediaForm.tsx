"use client";

import { useActionState, useId, useRef, useState } from "react";
import type { FormState } from "./FieldsForm";
import type { MediaFormValue } from "./media-form-value";

const input =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900";
const label = "block text-sm font-medium text-neutral-800";
const help = "mt-1 text-xs text-neutral-500";

/** Add or edit one Media Library item. `resetOnSave` clears the form after adding. */
export function MediaForm({
  initial,
  categories,
  action,
  submitLabel = "Save",
  resetOnSave = false,
}: {
  initial: MediaFormValue;
  categories: { id: string; name: string; is_active: boolean }[];
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel?: string;
  resetOnSave?: boolean;
}) {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState(initial.media_type);
  const [link, setLink] = useState(initial.original_url);
  const [thumb, setThumb] = useState(initial.thumbnail_url);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result?.ok && resetOnSave) {
      formRef.current?.reset();
      setType(initial.media_type);
      setLink("");
      setThumb("");
    }
    return result;
  }, null);

  const isPhoto = type === "image";
  const preview = isPhoto ? thumb || link : thumb;

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className={label}>Type</legend>
        <div className="mt-1.5 flex gap-2">
          {(["image", "video"] as const).map((t) => (
            <label
              key={t}
              className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm ${
                type === t ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white"
              }`}
            >
              <input
                type="radio"
                name="media_type"
                value={t}
                className="sr-only"
                defaultChecked={initial.media_type === t}
                onChange={() => setType(t)}
              />
              {t === "image" ? "Photo" : "Video / Film"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="sm:col-span-2">
        <label className={label} htmlFor={`${uid}-original_url`}>
          {isPhoto ? "Photo link" : "Video link"}
        </label>
        <input
          id={`${uid}-original_url`}
          name="original_url"
          type="url"
          required
          pattern="https://.*"
          placeholder={isPhoto ? "https://…/photo.jpg" : "https://www.youtube.com/watch?v=…"}
          defaultValue={initial.original_url}
          onChange={(e) => setLink(e.target.value)}
          className={input}
        />
        <p className={help}>
          {isPhoto
            ? "Direct https link to the image. Shown full size when a visitor opens the photo."
            : "YouTube, Vimeo or a direct .mp4/.webm link (https)."}
        </p>
      </div>

      <div>
        <label className={label} htmlFor={`${uid}-title`}>
          Title
        </label>
        <input id={`${uid}-title`} name="title" defaultValue={initial.title} className={input} placeholder={isPhoto ? "Wedding Stories" : "Rohan & Priya – Wedding Film"} />
      </div>

      <div>
        <label className={label} htmlFor={`${uid}-category_id`}>
          Category
        </label>
        <select id={`${uid}-category_id`} name="category_id" defaultValue={initial.category_id} className={input}>
          <option value="">— None (shows under All only) —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.is_active ? "" : " (hidden)"}
            </option>
          ))}
        </select>
      </div>

      {isPhoto ? (
        <div>
          <label className={label} htmlFor={`${uid}-subtitle`}>
            Subtitle
          </label>
          <input id={`${uid}-subtitle`} name="subtitle" defaultValue={initial.subtitle} className={input} placeholder="120 Photos · 4 Videos" />
          <p className={help}>Small line under the title. Optional.</p>
        </div>
      ) : (
        <div>
          <label className={label} htmlFor={`${uid}-duration`}>
            Duration
          </label>
          <input id={`${uid}-duration`} name="duration" defaultValue={initial.duration} className={input} placeholder="04:32" />
          <p className={help}>Shown on the thumbnail. Optional.</p>
        </div>
      )}

      <div>
        <label className={label} htmlFor={`${uid}-thumbnail_url`}>
          Thumbnail link <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input
          id={`${uid}-thumbnail_url`}
          name="thumbnail_url"
          type="url"
          pattern="https://.*"
          defaultValue={initial.thumbnail_url}
          onChange={(e) => setThumb(e.target.value)}
          className={input}
        />
        <p className={help}>
          {isPhoto
            ? "A smaller image for the grid. Empty uses the photo link."
            : "Empty uses the YouTube thumbnail. Needed for Vimeo and direct video links."}
        </p>
      </div>

      <div className="sm:col-span-2">
        <label className={label} htmlFor={`${uid}-alt_text`}>
          Image description (alt)
        </label>
        <input id={`${uid}-alt_text`} name="alt_text" defaultValue={initial.alt_text} className={input} placeholder="Bride and groom at sunset" />
        <p className={help}>For screen readers and search engines. Empty uses the title.</p>
      </div>

      {/^https:\/\//i.test(preview) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="" className="h-28 w-40 rounded-md object-cover ring-1 ring-neutral-200 sm:col-span-2" />
      )}

      <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_published" defaultChecked={initial.is_published} className="h-4 w-4" />
          Show on website
        </label>
        <button
          type="submit"
          disabled={pending}
          className="ml-auto rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {state && !pending && (
          <span role="status" className={state.ok ? "text-xs text-green-700" : "text-xs text-red-700"}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}
