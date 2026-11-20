"use client";

import { useActionState, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { IMAGE_PATTERN, LINK_PATTERN, type Field } from "@/lib/site/editor-fields";

export type FormState = { ok: boolean; message: string } | null;
type Value = Record<string, unknown>;

const input =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-900 invalid:border-red-400";
const iconBtn =
  "rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-30 disabled:hover:bg-transparent";

/** An empty value for a new list item. */
function emptyItem(fields: Field[]): Value {
  const item: Value = {};
  for (const f of fields) {
    if (f.type === "boolean") item[f.key] = f.key === "is_visible";
    else if (f.type === "select") item[f.key] = f.options[0]?.value ?? "";
    else if (f.type === "group") item[f.key] = emptyItem(f.fields);
    else if (f.type === "list") item[f.key] = [];
    else item[f.key] = "";
  }
  return item;
}

/**
 * Edits a settings object described by `fields` and submits it as JSON
 * (form field "json") to a server action.
 */
export function FieldsForm({
  fields,
  initial,
  action,
  submitLabel = "Save changes",
}: {
  fields: Field[];
  initial: Value;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel?: string;
}) {
  const [value, setValue] = useState<Value>(initial);
  const [dirty, setDirty] = useState(false);
  const [state, formAction, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const result = await action(prev, fd);
    if (result?.ok) setDirty(false);
    return result;
  }, null);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="json" value={JSON.stringify(value)} />
      <FieldList
        fields={fields}
        value={value}
        onChange={(v) => {
          setValue(v);
          setDirty(true);
        }}
      />
      <div className="sticky bottom-0 -mx-1 flex items-center gap-3 bg-white/90 px-1 py-3 backdrop-blur">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
        {dirty && !pending && state?.ok !== false && <span className="text-xs text-amber-700">Unsaved changes</span>}
        {state && !pending && (!dirty || !state.ok) && (
          <span role="status" className={state.ok ? "text-xs text-green-700" : "text-xs text-red-700"}>
            {state.message}
          </span>
        )}
      </div>
    </form>
  );
}

function FieldList({ fields, value, onChange }: { fields: Field[]; value: Value; onChange: (v: Value) => void }) {
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <FieldInput key={f.key} field={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
      ))}
    </div>
  );
}

function Label({ field }: { field: Field }) {
  return (
    <>
      <span className="block text-sm font-medium text-neutral-800">{field.label}</span>
      {field.help && <span className="block text-xs text-neutral-500">{field.help}</span>}
    </>
  );
}

function FieldInput({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.type) {
    case "boolean":
      return (
        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          {field.label}
        </label>
      );

    case "select":
      return (
        <label className="block space-y-1">
          <Label field={field} />
          <select className={input} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );

    case "group":
      return (
        <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
          <legend className="px-1">
            <Label field={field} />
          </legend>
          <FieldList fields={field.fields} value={(value as Value) ?? {}} onChange={onChange} />
        </fieldset>
      );

    case "list":
      return <ListInput field={field} value={Array.isArray(value) ? (value as Value[]) : []} onChange={onChange} />;

    case "textarea":
      return (
        <label className="block space-y-1">
          <Label field={field} />
          <textarea
            className={input}
            rows={3}
            value={String(value ?? "")}
            onChange={(e) => onChange(e.target.value)}
          />
        </label>
      );

    default: {
      const str = String(value ?? "");
      const pattern =
        field.type === "image" ? IMAGE_PATTERN : field.type === "link" ? field.pattern ?? LINK_PATTERN : undefined;
      return (
        <label className="block space-y-1">
          <Label field={field} />
          <div className="flex items-center gap-2">
            {field.type === "image" && str.startsWith("https://") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={str} alt="" className="h-9 w-14 shrink-0 rounded object-cover ring-1 ring-neutral-200" />
            )}
            <input
              className={field.type === "icon" ? `${input} max-w-24 text-center` : input}
              type="text"
              value={str}
              pattern={pattern}
              title={
                field.type === "image"
                  ? "Must start with https://"
                  : field.type === "link"
                    ? `Must match ${pattern}`
                    : undefined
              }
              placeholder={field.type === "image" ? "https://…" : undefined}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        </label>
      );
    }
  }
}

function ListInput({
  field,
  value,
  onChange,
}: {
  field: Extract<Field, { type: "list" }>;
  value: Value[];
  onChange: (v: Value[]) => void;
}) {
  const move = (i: number, d: number) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
      <legend className="px-1">
        <Label field={field} />
      </legend>
      {value.map((item, i) => (
        <div key={i} className="rounded-md bg-neutral-50 p-3 ring-1 ring-neutral-200">
          <div className="mb-2 flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-neutral-500">
            <span className="mr-auto">
              {field.itemLabel} {i + 1}
            </span>
            <button type="button" className={iconBtn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={iconBtn}
              disabled={i === value.length - 1}
              onClick={() => move(i, 1)}
              aria-label="Move down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={`${iconBtn} hover:text-red-700`}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={`Remove ${field.itemLabel}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field.fields.map((f) => (
              <div key={f.key} className={f.type === "textarea" || f.type === "image" ? "sm:col-span-2" : undefined}>
                <FieldInput field={f} value={item[f.key]} onChange={(v) => onChange(value.map((it, j) => (j === i ? { ...it, [f.key]: v } : it)))} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, emptyItem(field.fields)])}
        className="flex items-center gap-1.5 rounded-md border border-dashed border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:border-neutral-500"
      >
        <Plus className="h-4 w-4" /> Add {field.itemLabel}
      </button>
    </fieldset>
  );
}
