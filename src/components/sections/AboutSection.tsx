import type { AboutSettings } from "@/lib/site/schemas";
import { anchor, Lines, SiteButton } from "./shared";

export function AboutSection({ settings: s }: { settings: AboutSettings }) {
  return (
    <section className="content about" id={anchor(s.anchor_id)}>
      <div className="wrap aboutgrid">
        <div className="aboutphoto">
          {s.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img loading="lazy" src={s.image_url} alt={s.image_alt} />
          )}
        </div>
        <div className="aboutcopy">
          {s.eyebrow && <div className="eyebrow">{s.eyebrow}</div>}
          {s.heading && (
            <h2>
              <Lines text={s.heading} />
            </h2>
          )}
          {s.text && <p>{s.text}</p>}
          {s.stats.length > 0 && (
            <div className="stats">
              {s.stats.map((stat, i) => (
                <div key={i}>
                  <strong>{stat.value}</strong>
                  <small>{stat.label}</small>
                </div>
              ))}
            </div>
          )}
          <SiteButton button={s.button} />
        </div>
      </div>
    </section>
  );
}
