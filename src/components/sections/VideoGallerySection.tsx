"use client";

import { useEffect, useState } from "react";
import { toPlayer, type Player } from "@/lib/site/media";
import type { VideoGallerySettings, UiLabels } from "@/lib/site/schemas";
import { Modal } from "./Modal";
import { anchor, SiteButton } from "./shared";

type Item = VideoGallerySettings["items"][number];

export function VideoGallerySection({ settings: s, ui }: { settings: VideoGallerySettings; ui: UiLabels }) {
  const [playing, setPlaying] = useState<{ item: Item; player: Player } | null>(null);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  function open(item: Item) {
    if (!item.video_url) return setToast(true);
    const player = toPlayer(item.video_url);
    if (player) setPlaying({ item, player });
    else window.open(item.video_url, "_blank", "noopener,noreferrer");
  }

  return (
    <section className="films" id={anchor(s.anchor_id)}>
      <div className="wrap">
        {s.heading && <h2 className="heading">{s.heading}</h2>}
        {s.subtitle && <p className="sub">{s.subtitle}</p>}
        <div className="filmgrid">
          {s.items.map((item, i) => (
            <div className="film" key={i}>
              <div
                className="filmimg"
                role="button"
                tabIndex={0}
                aria-label={ui.play_label.replaceAll("{title}", item.title) || undefined}
                onClick={() => open(item)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(item))}
              >
                {item.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img loading="lazy" src={item.thumbnail_url} alt={item.alt} />
                )}
                {ui.play_icon && <span className="play">{ui.play_icon}</span>}
                {item.duration && <span className="duration">{item.duration}</span>}
              </div>
              <b>{item.title}</b>
            </div>
          ))}
        </div>
        {s.button && s.button.label.trim() && (
          <div className="center">
            <SiteButton button={s.button} />
          </div>
        )}
      </div>
      <Modal ui={ui} open={playing !== null} onClose={() => setPlaying(null)} caption={playing?.item.title}>
        {playing?.player.kind === "iframe" && (
          <iframe
            src={playing.player.src}
            title={playing.item.title}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
          />
        )}
        {playing?.player.kind === "video" && <video src={playing.player.src} controls autoPlay />}
      </Modal>
      <div className={toast ? "toast show" : "toast"} role="status">
        {s.placeholder_message}
      </div>
    </section>
  );
}
