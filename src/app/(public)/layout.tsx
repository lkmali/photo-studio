import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getSiteChrome } from "@/lib/site/data";
import "./site.css";

export const revalidate = 60;

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const chrome = await getSiteChrome();

  return (
    <div className="site">
      <SiteHeader chrome={chrome} />
      <main>{children}</main>
      <SiteFooter chrome={chrome} />
    </div>
  );
}
