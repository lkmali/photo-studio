"use client";

import { Trash2 } from "lucide-react";

/** Submit button for a delete form that asks for confirmation first. */
export function ConfirmButton({ message, label = "Delete" }: { message: string; label?: string }) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      className="rounded-md p-1.5 text-neutral-500 hover:bg-red-50 hover:text-red-700"
      onClick={(e) => {
        e.stopPropagation();
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
