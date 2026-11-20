"use client";

import { useEffect, type ReactNode } from "react";
import type { UiLabels } from "@/lib/site/schemas";

export function Modal({
  open,
  onClose,
  caption,
  ui,
  children,
}: {
  open: boolean;
  onClose: () => void;
  caption?: string;
  ui: UiLabels;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={open ? "modal open" : "modal"}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modalbox">
        <button className="close" aria-label={ui.close_label || undefined} onClick={onClose}>
          {ui.close_icon}
        </button>
        {open && children}
        {caption && <div className="caption">{caption}</div>}
      </div>
    </div>
  );
}
