import type { SiteChrome } from "@/lib/site/data";
import { Brand } from "./Brand";

export function SiteFooter({ chrome }: { chrome: SiteChrome }) {
  const copyright = chrome.footerCopyright.replaceAll("{year}", String(new Date().getFullYear()));

  return (
    <footer className="site-footer">
      <div className="wrap foot">
        <div className="brand">
          <Brand chrome={chrome} />
        </div>
        <div className="footlinks">
          {chrome.footerNav.map((item, i) => (
            <a key={`${item.href}-${i}`} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>
        <small>{copyright}</small>
      </div>
    </footer>
  );
}
