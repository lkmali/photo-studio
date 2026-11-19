# Photography Website Builder --- Final Product & Implementation Plan

**Product type:** Dynamic photography portfolio website + visual admin
website builder\
**Deployment:** Vercel\
**Frontend:** Next.js, React, TypeScript\
**Backend platform:** Supabase (PostgreSQL, Auth, Row Level Security)\
**Media strategy:** Public URLs only --- no admin file uploads

------------------------------------------------------------------------

## 1. Product vision

Build a reusable photography website platform that lets an administrator
create and manage a complete public-facing photography website without
developer involvement.

The administrator must be able to:

-   Paste public image, video and audio URLs.
-   Use supported providers such as YouTube, Vimeo, Instagram, Google
    Drive, SoundCloud and direct CDN/media URLs, subject to provider
    permissions and embed restrictions.
-   Add, edit, duplicate, hide, show, reorder and delete website
    sections.
-   Restore deleted sections from a Trash area.
-   Drag components from a component library onto a visual page canvas.
-   Select any section and edit its content, layout, dimensions and
    styling.
-   Resize columns, image grids and supported components.
-   Preview desktop, tablet and mobile layouts.
-   Save drafts, preview changes privately and publish a new website
    version.
-   Undo and redo editor changes.

The public website and the admin preview must use the **same component
renderer and the same saved page configuration**. The editor adds
selection outlines and editing controls around the shared components; it
must not maintain a separate approximation of the customer website.

## 2. Core product principles

1.  **Database-driven, not hardcoded:** Page content, section order,
    visibility and supported layout settings come from Supabase.
2.  **No file uploads:** The admin pastes URLs. Do not build an upload
    workflow or require Supabase Storage for the initial product.
3.  **Approved components only:** The database stores component types
    and validated settings, never arbitrary React code or executable
    HTML.
4.  **Preview equals production:** The same renderer powers admin
    preview and the published website.
5.  **Safe publishing:** Draft changes remain private until explicitly
    published.
6.  **Recoverable editing:** Deletes are soft deletes first; retain
    revision history and undo/redo.
7.  **Responsive by design:** Desktop, tablet and mobile layouts are
    independently configurable where supported.
8.  **Provider-aware media:** A URL is classified and rendered using a
    provider adapter, not treated as a generic direct media file.

------------------------------------------------------------------------

## 3. Recommended technology stack

  ------------------------------------------------------------------------
  Area                    Technology               Responsibility
  ----------------------- ------------------------ -----------------------
  Web application         Next.js + React +        Public website, admin
                          TypeScript               dashboard and server
                                                   routes

  Styling                 Tailwind CSS + shadcn/ui Responsive UI and
                                                   editor controls

  Drag and drop           dnd-kit                  Drag components onto
                                                   canvas and reorder
                                                   sections

  Resizable panels        react-resizable-panels   Editor workspace panels

  Rich text               Tiptap (optional)        Safe rich-text content
                                                   editing

  Database                Supabase PostgreSQL      Pages, sections, media
                                                   metadata, revisions

  Authentication          Supabase Auth            Admin login and
                                                   sessions

  Authorization           Supabase Row Level       Protect admin data and
                          Security                 public reads

  Hosting                 Vercel                   Next.js deployment

  Icons                   Lucide                   Consistent interface
                                                   icons
  ------------------------------------------------------------------------

Do not add a separate Node.js API server for the first release. Use
Next.js server components, server actions or route handlers where
server-side operations are required.

### Environment variables

``` env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

-   The service-role key must only be used in trusted server-side code.
-   Never expose it through a `NEXT_PUBLIC_` variable or browser bundle.
-   Use the publishable/anon key with RLS for normal client access.

------------------------------------------------------------------------

## 4. Application areas

### 4.1 Public photography website

Recommended pages:

-   Home
-   Portfolio
-   Album / Event detail
-   Services
-   About
-   Packages / Pricing (optional)
-   Contact / Booking enquiry
-   Privacy policy and other legal pages

Photography categories should be admin-managed rather than fixed in
code. Example initial categories:

-   Wedding
-   Pre-wedding
-   Birthday
-   Events
-   Portraits
-   Family
-   Commercial
-   Other

### 4.2 Admin dashboard

Recommended navigation:

  Module            Capabilities
  ----------------- ---------------------------------------------------------
  Dashboard         Overview, published status, media and enquiry counts
  Website Builder   Visual editor for pages and sections
  Media Library     Add and manage public media URLs
  Albums            Create event stories and attach media
  Categories        Create, rename, reorder and archive categories
  Pages             Manage Home, About, Portfolio, Contact and custom pages
  Appearance        Brand name, logo URL, fonts, colors and theme
  Navigation        Header and footer links
  Enquiries         View and manage booking enquiries
  SEO               Page title, meta description, social sharing image URL
  Trash             Restore or permanently delete removed items
  Settings          Admin users, domain and website settings

------------------------------------------------------------------------

## 5. Visual website builder --- primary feature

### 5.1 Editor workspace

Use a three-panel editor layout.

**Left panel --- Components and page structure**

-   Component library.
-   Existing page section tree.
-   Search/filter components.
-   Add component by drag-and-drop or click.
-   Duplicate and delete controls.
-   Section visibility indicator.
-   Reorder controls.
-   Trash access.

**Center panel --- Website canvas**

-   Render the actual page using the shared component renderer.
-   Select a section by clicking it.
-   Show a visible selection outline and contextual toolbar.
-   Drag sections to reorder them.
-   Drop new components between existing sections.
-   Support nested rows/columns only where the component schema allows
    it.
-   Provide desktop, tablet and mobile preview modes.
-   Provide zoom controls for the editor canvas without changing the
    published page dimensions.

**Right panel --- Properties inspector**

Show controls relevant to the selected component:

-   Content: title, subtitle, description, button labels and links.
-   Media: public URL, provider, thumbnail URL and alt text.
-   Layout: width, max-width, height, columns, gap and alignment.
-   Spacing: padding and margin per side.
-   Appearance: background color, gradient, border, radius and shadow.
-   Typography: font family, size, weight, line height and text
    alignment.
-   Responsive settings: breakpoint-specific columns, spacing,
    visibility and typography.
-   Advanced settings: only safe, schema-approved options.

The properties panel should change based on the selected component type.
Do not show irrelevant settings.

### 5.2 Required editor interactions

  -----------------------------------------------------------------------
  Interaction                         Expected behavior
  ----------------------------------- -----------------------------------
  Drag from component library         Insert a new component at the drop
                                      position

  Click Add                           Insert a component at the end or
                                      selected insertion point

  Drag existing section               Reorder it on the canvas

  Select section                      Open its properties in the right
                                      panel

  Duplicate                           Create a copy with a new ID

  Hide / Show                         Toggle public visibility without
                                      deleting content

  Delete                              Move the section to Trash (soft
                                      delete)

  Restore                             Return a trashed section to the
                                      page

  Resize                              Change supported width, height,
                                      columns or media ratio

  Undo / Redo                         Reverse and reapply editor
                                      operations

  Preview                             Show the page without editor
                                      outlines and controls

  Save draft                          Persist draft configuration without
                                      publishing

  Publish                             Validate and publish the draft as a
                                      new version
  -----------------------------------------------------------------------

### 5.3 Drag-and-drop behavior

Use dnd-kit with clear drag handles and insertion indicators.

-   Use a dedicated drag handle so buttons and text remain selectable.
-   Show a drop indicator between sections.
-   Support keyboard-accessible reordering in addition to pointer
    drag-and-drop.
-   Prevent invalid nesting and unsupported component combinations.
-   Preserve stable section IDs when reordering.
-   Reordering changes the in-memory draft state; the draft (including
    all `position` values) is persisted by debounced autosave or Save
    draft, in a single transaction. Individual drags are not separate
    database writes.
-   Use optimistic UI updates, with rollback and an error message if
    saving fails.

### 5.4 Delete, Trash and restore

Do not permanently delete a section when the admin clicks Delete.

-   Set `deleted_at` and `deleted_by`.
-   Remove it from the active canvas and published page only after the
    relevant draft is published.
-   Show it in the Trash panel.
-   Allow Restore.
-   Allow permanent deletion only through a separate confirmation action
    and appropriate authorization.
-   Keep revisions so an earlier published version can also be restored.

### 5.5 Undo and redo

Implement editor history as a sequence of typed operations or immutable
page-state snapshots.

Support at least:

-   Add section
-   Delete section
-   Restore section
-   Reorder section
-   Edit text
-   Change media URL
-   Change layout and styling
-   Change visibility

Provide toolbar buttons and keyboard shortcuts:

-   Ctrl/Cmd + Z: Undo
-   Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo

History should be scoped to the current editing session/page. Saving a
draft should not unexpectedly clear the undo stack.

------------------------------------------------------------------------

## 6. Component library

Create a fixed, extensible registry of approved React components.

  -----------------------------------------------------------------------
  Component type          Purpose                 Key settings
  ----------------------- ----------------------- -----------------------
  `hero`                  Main banner             Background media,
                                                  heading, text, CTA

  `image_gallery`         Photo collection        Media IDs,
                                                  grid/masonry, columns,
                                                  gap

  `video_gallery`         Video collection        Provider URLs,
                                                  thumbnails, layout

  `audio_gallery`         Audio stories/playlists Audio URLs, titles,
                                                  artwork

  `album_grid`            Event albums            Category, album count,
                                                  card layout

  `about`                 Studio introduction     Text, image URL, stats

  `services`              Photography services    Service cards,
                                                  descriptions, images

  `testimonials`          Customer feedback       Quote, name, optional
                                                  image

  `pricing`               Packages                Package name, features,
                                                  price text

  `team`                  Photographer profiles   Name, role, portrait
                                                  URL

  `text`                  Custom content          Safe rich text and
                                                  alignment

  `cta`                   Call to action          Heading, text, button
                                                  and background

  `contact`               Contact/enquiry section Contact details and
                                                  form settings

  `instagram_embed`       Social content          Supported public
                                                  post/embed URL
  -----------------------------------------------------------------------

The registry maps each `section_type` to a React component and a
settings schema. Unknown component types must be safely skipped or shown
as an editor error; they must never be dynamically executed.

Example:

``` ts
export const sectionRegistry = {
  hero: HeroSection,
  image_gallery: ImageGallerySection,
  video_gallery: VideoGallerySection,
  audio_gallery: AudioGallerySection,
  album_grid: AlbumGridSection,
  about: AboutSection,
  services: ServicesSection,
  testimonials: TestimonialsSection,
  pricing: PricingSection,
  team: TeamSection,
  text: TextSection,
  cta: CtaSection,
  contact: ContactSection,
  instagram_embed: InstagramEmbedSection,
};
```

Each component should define:

-   Default settings.
-   Validation schema.
-   Properties inspector fields.
-   Responsive behavior.
-   Public renderer.
-   Editor selection behavior.

------------------------------------------------------------------------

## 7. Layout, sizing and responsive controls

Allow admins to customize composition while keeping the site visually
stable.

### Section-level settings

-   Width: full, contained or custom supported width.
-   Max width: e.g. 1200px or 1400px.
-   Height: auto, preset or custom supported value.
-   Minimum height where appropriate.
-   Padding and margin: top, right, bottom, left.
-   Background: solid color, approved gradient or public image URL.
-   Alignment: left, center or right.
-   Border radius and shadow.
-   Content alignment and vertical alignment.

### Gallery settings

-   Number of columns.
-   Grid or masonry layout.
-   Gap between items.
-   Image aspect ratio: square, portrait, landscape or original.
-   Image fit: cover or contain.
-   Number of visible items.
-   Load-more or pagination behavior.

### Responsive breakpoints

Provide three editor modes:

  Device      Suggested preview width Typical controls
  --------- ------------------------- ----------------------
  Desktop                      1440px 3--4 gallery columns
  Tablet                        768px 2 gallery columns
  Mobile                        375px 1--2 gallery columns

Store breakpoint-specific settings, for example:

``` json
{
  "desktop": { "columns": 4, "gap": 20 },
  "tablet": { "columns": 2, "gap": 16 },
  "mobile": { "columns": 1, "gap": 12 }
}
```

Use CSS breakpoints for the actual public website. The editor device
selector should preview those same responsive rules. Do not treat the
editor canvas zoom as a published width setting.

------------------------------------------------------------------------

## 8. Media URL manager --- no uploads

The admin pastes links; the application validates and renders supported
media.

### Supported media categories

-   Image
-   Video
-   Audio

### Provider support

  -----------------------------------------------------------------------
  Provider                Intended support        Notes
  ----------------------- ----------------------- -----------------------
  Direct public image URL Image                   Must be
                                                  browser-accessible; use
                                                  HTTPS

  Direct public video URL Video                   Browser-compatible
                                                  format and CORS/range
                                                  behavior may matter

  Direct public audio URL Audio                   Browser-compatible
                                                  format

  YouTube                 Video                   Use official
                                                  embed/player URL

  Vimeo                   Video                   Use supported Vimeo
                                                  embed

  Instagram               Image/video/reel        Public embed
                                                  availability and
                                                  platform restrictions
                                                  apply

  Google Drive            Image/video/audio       Public permissions
                          preview                 required; direct
                                                  playback is not
                                                  guaranteed

  SoundCloud              Audio                   Use supported
                                                  embed/player

  Spotify                 Audio/media preview     Use supported embed;
                                                  not a generic
                                                  downloadable audio URL
  -----------------------------------------------------------------------

### Media item fields

-   Title
-   Media type
-   Original URL
-   Detected provider
-   Resolved embed URL, where applicable
-   Optional thumbnail URL
-   Alt text / description
-   Category
-   Album association
-   Published/draft status
-   Validation status
-   Created and updated timestamps

### Provider adapter design

Create a provider adapter per supported source:

``` ts
type MediaProviderResult = {
  provider: string;
  mediaType: "image" | "video" | "audio";
  renderMode: "image" | "native_video" | "native_audio" | "embed";
  embedUrl?: string;
  previewUrl?: string;
  validationStatus: "valid" | "needs_permission" | "unsupported";
};
```

Provider detection must validate the hostname and URL shape. Do not
accept arbitrary embed HTML from admins.

### Important provider limitations

-   A public sharing URL does not always mean a direct media URL.
-   Google Drive links may show a preview but may not support reliable
    direct playback.
-   Instagram embedding depends on public availability and Meta's
    current embed requirements.
-   YouTube and Vimeo should use their supported embed mechanisms.
-   Some sites block embedding through CSP or `X-Frame-Options`.
-   Do not proxy arbitrary user-provided URLs through the server to
    generate thumbnails. This can create SSRF vulnerabilities.
-   Show a clear fallback state and a way to replace a broken link.

------------------------------------------------------------------------

## 9. Supabase database design

Use PostgreSQL with JSONB for flexible, validated component settings.

### Suggested tables

#### `profiles`

-   `id` --- references `auth.users`
-   `display_name`
-   `role` --- e.g. `admin`, `editor`
-   `created_at`

#### `website_settings`

-   `id`
-   `site_name`
-   `logo_url`
-   `primary_color`
-   `accent_color`
-   `font_heading`
-   `font_body`
-   `theme`
-   `updated_at`

#### `website_pages`

-   `id`
-   `slug`
-   `title`
-   `status`
-   `published_revision_id` --- pointer to the live `page_revisions` row
-   `seo_title`
-   `seo_description`
-   `og_image_url`
-   `deleted_at`
-   `created_at`
-   `updated_at`

#### `page_sections`

**Draft data only.** Public routes never read this table; they read the
configuration snapshot of `website_pages.published_revision_id`.

-   `id`
-   `page_id`
-   `section_type`
-   `title`
-   `position`
-   `is_visible`
-   `settings` JSONB
-   `responsive_settings` JSONB
-   `deleted_at`
-   `deleted_by`
-   `created_at`
-   `updated_at`

#### `media_items`

-   `id`
-   `title`
-   `media_type`
-   `provider`
-   `original_url`
-   `embed_url`
-   `thumbnail_url`
-   `alt_text`
-   `category_id`
-   `is_published`
-   `validation_status`
-   `deleted_at`
-   `created_at`
-   `updated_at`

#### `categories`

-   `id`
-   `name`
-   `slug`
-   `position`
-   `is_active`

#### `albums`

-   `id`
-   `title`
-   `slug`
-   `description`
-   `cover_media_id`
-   `category_id`
-   `event_date`
-   `is_published`
-   `deleted_at`

#### `album_media`

-   `album_id`
-   `media_item_id`
-   `position`

#### `page_revisions`

-   `id`
-   `page_id`
-   `version_number`
-   `configuration` JSONB
-   `created_by`
-   `created_at`
-   `publish_note`

#### `website_publications`

-   `id`
-   `page_id`
-   `revision_id`
-   `published_at`
-   `published_by`

#### `enquiries`

-   `id`
-   `name`
-   `email`
-   `phone`
-   `event_type`
-   `event_date`
-   `message`
-   `status`
-   `ip_hash` --- for rate limiting (never store raw IPs)
-   `created_at`

#### `navigation_items`

-   `id`
-   `location` --- `header` or `footer`
-   `label`
-   `href` --- internal path or validated HTTPS URL
-   `position`
-   `is_visible`

#### `audit_log`

-   `id`
-   `actor_id`
-   `action` --- e.g. `publish`, `rollback`, `permanent_delete`
-   `entity_type`
-   `entity_id`
-   `details` JSONB
-   `created_at`

Use UUID primary keys, foreign keys, indexes for common lookups and
constraints for valid values.

### Example section configuration

``` json
{
  "section_type": "image_gallery",
  "title": "Our Wedding Stories",
  "settings": {
    "layout": "masonry",
    "columns": 4,
    "gap": 16,
    "max_width": "1400px",
    "image_ratio": "4:5",
    "media_ids": []
  },
  "responsive_settings": {
    "desktop": { "columns": 4 },
    "tablet": { "columns": 2 },
    "mobile": { "columns": 1 }
  }
}
```

Use migrations checked into Git rather than making production schema
changes manually.

------------------------------------------------------------------------

## 10. Draft, preview and publish architecture

This is essential. Do not let an admin's unfinished edits immediately
change the customer website.

### Workflow

1.  Admin opens a page.
2.  Application loads the latest draft, or copies the current published
    configuration into a new draft.
3.  Admin adds, edits, hides, resizes, reorders or deletes sections.
4.  Changes are saved as draft data.
5.  Admin previews the draft using the same renderer as the public
    website.
6.  Application validates component settings and media references.
7.  Admin clicks Publish.
8.  Server verifies admin permissions and creates an immutable page
    revision.
9.  `website_pages.published_revision_id` is updated in the same
    transaction (a Postgres function called via RPC), and a
    `website_publications` row is appended as the publish log.
10. Public routes read only the configuration of
    `published_revision_id`, never `page_sections`.

**Appearance and navigation (MVP):** `website_settings` and
`navigation_items` changes apply when the admin clicks "Save & apply"
(with confirmation and an audit record). Versioning these through
revisions is a Version 2 item.

### Required states

-   Draft
-   Preview
-   Published
-   Archived / superseded revision

### Publish safeguards

-   Confirm before publishing.
-   Show validation errors and broken media links.
-   Record who published and when.
-   Keep the previous published revision.
-   Provide rollback by republishing a previous revision.
-   Revalidate relevant Next.js cache paths after publication.
-   Do not rely on a browser-only flag to protect draft content.

A private preview should be authorized on the server and should not be
publicly indexable.

------------------------------------------------------------------------

## 11. Security requirements

1.  Enable RLS on all tables exposed through Supabase APIs.
2.  Public visitors can only read published pages, published sections
    and published media.
3.  Only authenticated users with the correct role can manage drafts or
    publish.
4.  Validate all component settings against server-side schemas.
5.  Never store or execute arbitrary React, JavaScript or HTML from the
    database.
6.  Sanitize rich text and render only allowed markup.
7.  Validate external URLs and allow only supported protocols, normally
    HTTPS.
8.  Use a strict provider hostname allowlist for embeds.
9.  Never expose the Supabase service-role key to the browser.
10. Rate-limit public enquiry endpoints and validate input. Vercel
    functions are stateless, so counters must live in shared storage
    (e.g. a Postgres check on `enquiries.ip_hash` + `created_at`, or
    Upstash Redis).
11. Add spam protection to contact forms.
12. Avoid server-side requests to arbitrary pasted URLs; protect against
    SSRF.
13. Set an appropriate Content Security Policy for approved media/embed
    hosts.
14. Keep audit records for publishing and destructive actions.

------------------------------------------------------------------------

## 12. Suggested project structure

``` text
src/
  app/
    (public)/
      page.tsx
      portfolio/
      albums/[slug]/
      services/
      about/
      contact/
    admin/
      layout.tsx
      page.tsx
      builder/[pageId]/
      media/
      albums/
      categories/
      appearance/
      settings/
    api/
      enquiries/
      publish/
      media-validation/

  components/
    builder/
      BuilderShell.tsx
      ComponentLibrary.tsx
      PageCanvas.tsx
      SectionTree.tsx
      PropertiesPanel.tsx
      EditorToolbar.tsx
      DevicePreview.tsx
      TrashPanel.tsx
      HistoryControls.tsx
    sections/
      HeroSection.tsx
      ImageGallerySection.tsx
      VideoGallerySection.tsx
      AudioGallerySection.tsx
      AlbumGridSection.tsx
      AboutSection.tsx
      ServicesSection.tsx
      TestimonialsSection.tsx
      PricingSection.tsx
      TeamSection.tsx
      TextSection.tsx
      CtaSection.tsx
      ContactSection.tsx
      InstagramEmbedSection.tsx
    media/
      ImageRenderer.tsx
      VideoRenderer.tsx
      AudioRenderer.tsx
      EmbedRenderer.tsx

  lib/
    supabase/
      client.ts
      server.ts
    providers/
      detect-provider.ts
      youtube.ts
      vimeo.ts
      instagram.ts
      google-drive.ts
      soundcloud.ts
      spotify.ts
      direct-media.ts
    builder/
      section-registry.ts
      section-schemas.ts
      history.ts
      layout-validation.ts
    publishing/
      publish-page.ts
      get-published-page.ts

  types/
    database.ts
    builder.ts
    media.ts

supabase/
  migrations/
  seed.sql
```

------------------------------------------------------------------------

## 13. Implementation phases

### Phase 1 --- Foundation

-   Create Next.js TypeScript project.
-   Configure Tailwind and shadcn/ui.
-   Create Supabase project and environment variables.
-   Add database migrations.
-   Configure Supabase Auth.
-   Add admin roles and RLS policies.
-   Build protected admin layout.

**Acceptance criteria:** Admin can sign in; unauthorized users cannot
access admin operations.

### Phase 2 --- Media and content management

-   Build media URL form.
-   Detect media provider.
-   Validate URL shape and protocol.
-   Add image, video and audio preview/fallback.
-   Create categories and albums.
-   Attach media to albums.
-   Support draft/published media status.

**Acceptance criteria:** Admin can add and manage supported public URLs
without uploading files.

### Phase 3 --- Component registry and public renderer

-   Build approved section registry.
-   Define schemas and default settings.
-   Build reusable section components.
-   Load published page configuration from Supabase.
-   Implement public portfolio and album pages.
-   Add safe fallbacks for invalid or unknown sections.

**Acceptance criteria:** Public website is rendered entirely from
published database configuration.

### Phase 4 --- Visual builder

-   Build three-panel editor.
-   Add component library.
-   Add section selection and properties inspector.
-   Implement drag-and-drop insertion and reordering using dnd-kit.
-   Add duplicate, hide, show, soft delete and restore.
-   Add layout controls and responsive settings.
-   Add desktop/tablet/mobile preview.
-   Add undo and redo.

**Acceptance criteria:** Admin can construct and rearrange a page
visually without code changes.

### Phase 5 --- Drafts and publishing

-   Save draft configuration.
-   Build private preview.
-   Validate page before publishing.
-   Create immutable page revisions.
-   Publish transactionally.
-   Add rollback to earlier revision.
-   Revalidate Next.js cache after publication.

**Acceptance criteria:** Visitors see only published content; draft
changes never leak to the public website.

### Phase 6 --- Appearance and website management

-   Add branding controls.
-   Add font and color settings.
-   Add navigation and footer builder.
-   Add SEO fields.
-   Add enquiry management.
-   Add Trash and audit history.

**Acceptance criteria:** Admin can manage the complete website's content
and appearance.

### Phase 7 --- Testing and deployment

-   Unit-test provider detection and component schemas.
-   Test drag/drop and keyboard accessibility.
-   Test RLS with public and admin users.
-   Test desktop, tablet and mobile.
-   Test invalid and inaccessible media URLs.
-   Test draft isolation and publishing rollback.
-   Configure Vercel production environment variables.
-   Deploy preview and production environments.
-   Configure custom domain and monitoring.

**Acceptance criteria:** Production deployment is secure, responsive and
recoverable.

------------------------------------------------------------------------

## 14. Testing checklist

### Builder

-   [ ] Add a component from the library.
-   [ ] Drag a component between two sections.
-   [ ] Reorder existing sections.
-   [ ] Duplicate a component.
-   [ ] Edit title and description.
-   [ ] Hide and show a section.
-   [ ] Delete a section to Trash.
-   [ ] Restore a deleted section.
-   [ ] Permanently delete only after confirmation.
-   [ ] Resize supported components.
-   [ ] Change gallery columns and image ratio.
-   [ ] Change responsive settings.
-   [ ] Undo and redo each supported operation.
-   [ ] Save and reload a draft without losing changes.

### Media

-   [ ] Add a direct image URL.
-   [ ] Add a YouTube URL.
-   [ ] Add a Vimeo URL.
-   [ ] Add a supported Instagram embed URL.
-   [ ] Add a public Google Drive link.
-   [ ] Add a direct audio URL.
-   [ ] Handle private, expired and malformed URLs.
-   [ ] Show an informative fallback for unsupported embeds.
-   [ ] Confirm no upload control exists.

### Publishing and security

-   [ ] Draft is not visible to public visitors.
-   [ ] Preview requires authorization.
-   [ ] Publish creates a revision.
-   [ ] Previous revision can be restored.
-   [ ] Public API only returns published content.
-   [ ] RLS blocks unauthorized writes.
-   [ ] Service-role key is not exposed.
-   [ ] External URL validation blocks unsafe protocols.
-   [ ] Public enquiry endpoint has validation and rate limiting.

------------------------------------------------------------------------

## 15. Performance and operational recommendations

-   Use Next.js server rendering or static generation with cache
    revalidation for published pages.
-   Cache public published configuration; do not cache private drafts
    publicly.
-   Use lazy loading for gallery images and video embeds.
-   Load third-party embeds only when needed or when the user interacts.
-   Use explicit image dimensions/aspect ratios to reduce layout shift.
-   Avoid loading every video iframe immediately.
-   Add pagination or load-more for large portfolios.
-   Monitor Vercel deployment logs and Supabase database performance.
-   Add error monitoring and basic uptime checks.
-   Keep provider integrations isolated so a provider change does not
    affect the entire site.

------------------------------------------------------------------------

## 16. MVP scope and later enhancements

### MVP --- build first

1.  Admin authentication.
2.  Supabase schema and RLS.
3.  Public URL-based media manager.
4.  Categories and albums.
5.  Approved component registry.
6.  Public website renderer.
7.  Visual three-panel builder.
8.  Drag-and-drop section ordering.
9.  Add, edit, duplicate, hide, show, delete and restore.
10. Width, height, spacing and gallery layout controls.
11. Desktop/tablet/mobile preview.
12. Draft, preview and publish workflow.
13. Vercel deployment.

### Version 2

-   More advanced nested layouts and columns.
-   Reusable section templates.
-   Global design tokens and theme presets.
-   Full revision comparison.
-   Multiple admin/editor roles.
-   Multiple photography websites/tenants.
-   Custom domains per photography business.
-   Advanced SEO and analytics.
-   More provider adapters.

Do not attempt unrestricted, arbitrary page-code editing in the first
release. A validated component library with flexible layout settings is
safer, easier to maintain and sufficient for the photography use case.

------------------------------------------------------------------------

## 17. Final architecture decision

**Build a mini visual website builder for photography businesses.**

The admin should be able to see the same website customers see, drag in
approved components, paste media links, change layout and dimensions,
remove or restore sections, preview all device sizes and publish safely.

Use:

-   **Next.js + TypeScript** for the application.
-   **dnd-kit** for drag-and-drop.
-   **Supabase PostgreSQL + Auth + RLS** for data and security.
-   **Vercel** for deployment.
-   **Public external media URLs** instead of uploads.
-   **One shared React component renderer** for editor preview and the
    public website.
-   **Drafts and immutable published revisions** for safe content
    updates.

The most important engineering rule is that the admin editor, preview
and customer website must all be driven by the same validated page
configuration and component renderer. This avoids preview mismatches and
makes the platform reusable for many photography businesses.
