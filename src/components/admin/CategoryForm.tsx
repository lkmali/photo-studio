"use client";

import { useActionState, useRef } from "react";
import type { FormState } from "./FieldsForm";

const input =
  "rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-900 outline-none focus:border-neutral-900";

/** One-line form to add or edit a category. */
export function CategoryForm({
  initial,
  action,
  submitLabel,
  resetOnSave = false,
}: {
  initial: { name: string; slug: string; is_active: boolean };
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  resetOnSave?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result?.ok && resetOnSave) formRef.current?.reset();
    return result;
  }, null);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-center gap-2">
      <input name="name" required aria-label="Name" placeholder="Name, e.g. Wedding" defaultValue={initial.name} className={`${input} min-w-40 flex-1`} />
      <input
        name="slug"
        aria-label="Key"
        placeholder="key (auto)"
        title="Used in links and filters. Leave empty to make it from the name."
        defaultValue={initial.slug}
        className={`${input} w-36`}
      />
      <label className="flex items-center gap-1.5 text-sm text-neutral-700">
        <input type="checkbox" name="is_active" defaultChecked={initial.is_active} className="h-4 w-4" />
        Visible
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
      {state && !pending && (
        <span role="status" className={`w-full text-xs ${state.ok ? "text-green-700" : "text-red-700"}`}>
          {state.message}
        </span>
      )}
    </form>
  );
}
