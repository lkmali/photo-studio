import type { SiteChrome } from "@/lib/site/data";

/** Logo mark + site name, with the trailing accent part highlighted. */
export function Brand({ chrome }: { chrome: SiteChrome }) {
  const { siteName, brandAccent, tagline, logoUrl, ui } = chrome;
  const split = brandAccent && siteName.endsWith(brandAccent) && siteName !== brandAccent;
  const lead = split ? siteName.slice(0, -brandAccent.length) : siteName;

  return (
    <>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="brand-logo" src={logoUrl} alt={ui.logo_alt || siteName} />
      ) : (
        <span className="camera" />
      )}
      <span>
        <b>
          {lead}
          {split && <em>{brandAccent}</em>}
        </b>
        {tagline && <small>{tagline}</small>}
      </span>
    </>
  );
}
