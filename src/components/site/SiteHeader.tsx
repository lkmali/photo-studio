"use client";

import Link from "next/link";
import { useState } from "react";
import type { SiteChrome } from "@/lib/site/data";
import { Brand } from "./Brand";

export function SiteHeader({ chrome }: { chrome: SiteChrome }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="site-header">
      <div className="wrap nav">
        <Link className="brand" href={chrome.ui.brand_href}>
          <Brand chrome={chrome} />
        </Link>
        <button
          className="menu"
          aria-label={chrome.ui.menu_label || undefined}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {chrome.ui.menu_icon}
        </button>
        <nav className={open ? "links open" : "links"}>
          {chrome.headerNav.map((item, i) => (
            <a key={`${item.href}-${i}`} href={item.href} onClick={close}>
              {item.label}
            </a>
          ))}
          {chrome.headerCta && (
            <a className="btn" href={chrome.headerCta.href} onClick={close}>
              {chrome.headerCta.label}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
