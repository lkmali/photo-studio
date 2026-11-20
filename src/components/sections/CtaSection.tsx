import type { CSSProperties } from "react";
import { cssUrl, type CtaSettings } from "@/lib/site/schemas";
import { anchor, Lines, SiteButton } from "./shared";

export function CtaSection({ settings: s }: { settings: CtaSettings }) {
  const style = { "--cta-img": cssUrl(s.background_image_url) } as CSSProperties;

  return (
    <section className="cta" id={anchor(s.anchor_id)} style={style}>
      <div className="wrap">
        <div className="ctacopy">
          {s.eyebrow && <div className="eyebrow">{s.eyebrow}</div>}
          {s.heading && (
            <h2>
              <Lines text={s.heading} />
            </h2>
          )}
          {s.text && <p>{s.text}</p>}
          <SiteButton button={s.button} />
        </div>
      </div>
    </section>
  );
}
