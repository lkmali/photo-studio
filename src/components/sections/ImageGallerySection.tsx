"use client";

import { useState } from "react";
import type { ImageGallerySettings, UiLabels } from "@/lib/site/schemas";
import { Modal } from "./Modal";
import { anchor } from "./shared";

type Item = ImageGallerySettings["items"][number];

export function ImageGallerySection({ settings: s, ui }: { settings: ImageGallerySettings; ui: UiLabels }) {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Item | null>(null);

  const filters = [{ label: s.all_label, value: "all" }, ...s.filters];

  return (
    <section className="content" id={anchor(s.anchor_id)}>
      <div className="wrap">
        {s.heading && <h2 className="heading">{s.heading}</h2>}
        {s.filters.length > 0 && (
          <div className="filters">
            {filters.map((f, i) => (
              <button
                key={`${f.value}-${i}`}
                className={filter === f.value ? "filter active" : "filter"}
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        <div className="grid">
          {s.items.map((item, i) => (
            <article
              key={i}
              className="card"
              hidden={!(filter === "all" || item.category === filter)}
              onClick={() => setSelected(item)}
            >
              {item.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" src={item.image_url} alt={item.alt} />
              )}
              {item.glyph && <span className="glyph">{item.glyph}</span>}
              <div className="tag">
                <strong>{item.title}</strong>
                {item.subtitle && <small>{item.subtitle}</small>}
              </div>
            </article>
          ))}
        </div>
      </div>
      <Modal ui={ui} open={selected !== null} onClose={() => setSelected(null)} caption={selected?.title}>
        {selected && (selected.full_image_url || selected.image_url) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={selected.full_image_url || selected.image_url} alt={selected.alt || selected.title} />
        )}
      </Modal>
    </section>
  );
}
