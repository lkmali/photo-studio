import type { CSSProperties } from "react";
import { cssUrl, type HeroSettings } from "@/lib/site/schemas";
import { anchor, Lines, SiteButton } from "./shared";

export function HeroSection({ settings: s }: { settings: HeroSettings }) {
  const style = {
    "--hero-img": cssUrl(s.background_image_url),
    "--hero-img-mobile": cssUrl(s.mobile_background_image_url),
  } as CSSProperties;

  return (
    <section className="hero" id={anchor(s.anchor_id)} style={style}>
      <div className="wrap">
        <div className="hero-copy">
          {s.eyebrow && <div className="eyebrow">{s.eyebrow}</div>}
          <h1>
            <Lines text={s.heading} />
            {s.heading_highlight && (
              <>
                {s.heading && <br />}
                <span>{s.heading_highlight}</span>
              </>
            )}
          </h1>
          {s.text && <p>{s.text}</p>}
          {s.buttons.length > 0 && (
            <div className="actions">
              {s.buttons.map((b, i) => (
                <SiteButton key={i} button={b} />
              ))}
            </div>
          )}
        </div>
      </div>
      {s.social_links.length > 0 && (
        <div className="social">
          {s.social_links.map((l, i) => (
            <a key={i} href={l.href} aria-label={l.label || undefined}>
              {l.icon}
            </a>
          ))}
        </div>
      )}
      {s.show_dots && (
        <div className="dots" aria-hidden>
          <i />
          <i />
          <i />
        </div>
      )}
    </section>
  );
}
