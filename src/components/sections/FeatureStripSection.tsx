import type { FeatureStripSettings } from "@/lib/site/schemas";
import { anchor } from "./shared";

export function FeatureStripSection({ settings: s }: { settings: FeatureStripSettings }) {
  return (
    <section className="strip" id={anchor(s.anchor_id)}>
      <div className="wrap stripgrid">
        {s.items.map((item, i) => (
          <div className="stripitem" key={i}>
            <i>{item.icon}</i>
            <b>{item.title}</b>
            <small>{item.text}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
