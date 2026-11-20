import type { Metadata } from "next";
import { RenderSection } from "@/components/sections/registry";
import { getHomePage, getMediaLibrary, getSiteChrome } from "@/lib/site/data";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getHomePage();
  return { title: page.seoTitle, description: page.seoDescription };
}

export default async function HomePage() {
  const [page, chrome, media] = await Promise.all([getHomePage(), getSiteChrome(), getMediaLibrary()]);
  return (
    <>
      {page.sections.map((section) => (
        <RenderSection key={section.id} section={section} ui={chrome.ui} media={media} />
      ))}
    </>
  );
}
