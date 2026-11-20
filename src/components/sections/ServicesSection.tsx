import type { ServicesSettings } from "@/lib/site/schemas";
import { anchor } from "./shared";

export function ServicesSection({ settings: s }: { settings: ServicesSettings }) {
  return (
    <section className="content services" id={anchor(s.anchor_id)}>
      <div className="wrap">
        {s.heading && <h2 className="heading">{s.heading}</h2>}
        {s.subtitle && <p className="sub">{s.subtitle}</p>}
        <div className="servicegrid">
          {s.items.map((item, i) => (
            <article className="service" key={i}>
              {item.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img loading="lazy" src={item.image_url} alt={item.alt} />
              )}
              <div>
                <h3>
                  {item.icon && <span>{item.icon}</span>}
                  {item.title}
                </h3>
                {item.text && <p>{item.text}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
