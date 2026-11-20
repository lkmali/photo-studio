import { Fragment } from "react";
import type { ButtonSettings } from "@/lib/site/schemas";

/** Renders text with "\n" as line breaks. */
export function Lines({ text }: { text: string }) {
  const parts = text.split("\n");
  return (
    <>
      {parts.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  );
}

export function SiteButton({ button }: { button: ButtonSettings | null }) {
  if (!button || !button.label.trim()) return null;
  return (
    <a className={button.variant === "ghost" ? "btn ghost" : "btn"} href={button.href}>
      {button.label}
    </a>
  );
}

/** id attribute from an anchor setting; empty means no id. */
export const anchor = (id: string) => (id.trim() ? id.trim() : undefined);
