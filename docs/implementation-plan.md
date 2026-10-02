# Shimla Wale — Portfolio Website + CRM Admin Panel

## Context

**Bhai Gurpreet Singh Ji Shimla Wale** is a Gurbani kirtan artist with **30+ years** of kirtan. He leads a professional kirtani jatha that travels across India. On Google his profile shows "Musical artist", about 94K Instagram followers, and the jukebox "Best Of Bhai Gurpreet Singh Shimla Wale – Non Stop Kirtan" with 66 lakh+ views.

- He is **Chairman of the Amritvela Trust**, which hosts spiritual programs, Gurbani Kirtan, Amritvela (early-morning) Simran and humanitarian events.
- The **World Book of Records, London** recognised his 43-day Prabhat Pheri and Silent (headphone) Kirtan, held 3:00–5:00 AM during the Guru Nanak Jayanti celebrations in Ulhasnagar.

We need two things. Both go on **shimlawale.com**:
1. **Public portfolio / landing site**: a hero that opens with an auto-scrolling carousel of the latest album/song posters (admin-managed), introduction, a **Kirtan Seva** section, a **Book Kirtan** request form, live feeds from Facebook, Instagram and YouTube (dummy data behind a provider interface for now), a blog managed from admin, and a contact section with two forms (**Query** and **Book Kirtan**).
2. **Admin CRM** (admin email + password only): release posters, blog CRUD, contact queries and kirtan bookings stored as **leads**, remarks, a follow-up calendar, WhatsApp broadcast lists, community channel and content sharing, a dashboard, and settings.

The new project lives in `/Users/sonal/Developer/Projects/shimlawale-crm`. It already has `.gitignore` and `.claude/launch.json`. **Ports change to api 4200 and web 3200** so they don't collide with ecw (4000/3001) or sikhglory (4000/5173). The `launch.json` entries, `env.ts` `PORT` default, the web `dev` script (`vite --port 3200`) and the Vite proxy target (`http://localhost:4200`) will be updated to match. It follows the **ecw** architecture: Bun workspaces, Elysia, Drizzle + Postgres, TanStack Router/Query/Form/Table, and shadcn/Radix components. It reuses **sikhglory**'s simplifications: single admin role, local-disk WebP uploads, and SVG asset generation.

Decisions already made:
- Frontend stack: ecw style (TanStack + shadcn).
- WhatsApp: click-to-send now through `wa.me` links, with a provider interface so the WhatsApp Cloud API can be added later.
- Socials: FB `facebook.com/shimlawaleofficial`, IG `instagram.com/shimlawaleofficial`, YT `youtube.com/shimlawale`, X `x.com/gsshimlawale`. Spotify and Apple Music links are also editable in settings.
- Photos: generated placeholder art for now. The admin uploads real photos (hero portrait, about photo, "Kirtan moments" gallery) from Settings, and release posters from Releases.
- **Kirtan bookings are paid, but no amount is shown anywhere.** The form never mentions a fee, price or payment. A booking is a **request** that the team follows up by phone/WhatsApp, then confirms and schedules.
- **The recording studio was removed (2026-10-01).** There is no studio booking, catalog or "Record with Us" anywhere in the product.

## Architecture

```
shimlawale-crm/
  package.json            # bun workspaces + catalog (same versions as ecw: elysia 1.4.30, drizzle 1.0.0-rc.4,
                          # react 19.2.8, typescript 7.0.2, biome 2.5.12)
  tsconfig.json, biome.jsonc
  docs/implementation-plan.md   # copy of this plan (the requested md plan file)
  apps/
    api/   # Elysia + Bun + drizzle-orm/bun-sql + Postgres (port 4200)
    web/   # React 19 + Vite 8 + Tailwind v4 + TanStack Router/Query/Form/Table (port 3200)
           # one app: public site at "/" and the CRM at "/admin/*" (same as ecw's _admin layout)
```

- **API client**: Eden Treaty (`@elysiajs/eden`) with an `@api` path alias to `apps/api` `Server` type. This follows `ecw/packages/libs/src/api/index.ts`, inlined into `apps/web/src/lib/api.ts` because there's only one frontend. The Vite proxy forwards `/api` and `/uploads` to :4200, following `sikhglory/apps/web/vite.config.ts`.
- **Composition**: copied from `sikhglory/apps/api/src/index.ts` and `controllers/index.ts`. A `mainController` with prefix `/api` composes `authController`, `publicController` and `adminControllers`, plus the `/uploads/*` static route.
- **Auth**: copy `sikhglory/apps/api/src/lib/services/core-auth-service.ts` and `sikhglory/apps/api/src/pre-processor.ts` (`authProcessor` + `protectedAdmin`). These use opaque tokens in an httpOnly `token` cookie, hashed with `Bun.password`. Add a login rate limit of 5 attempts per 15 minutes per IP, kept in memory.
- **Uploads**: copy `sikhglory/apps/api/src/lib/services/storage-service.ts`, which converts to WebP with Bun `Image`. Folders (`uploadFolders`): `brand | gallery | blog | releases | social`.
- **Frontend**: take from ecw:
  - `components/ui/*`: button, card, dialog, input, select, tabs, table, badge, calendar, popover, dropdown-menu, switch, textarea, tooltip
  - `lib/utils.ts` (cn)
  - the `routes/_admin.tsx` guard and the `admin-login.tsx` pattern
  - the Zustand `auth-store`
  - `sonner` toasts, `lucide-react` icons, `date-fns`, and `motion` for the landing-page animations

  New additions: `react-markdown` for the blog body and a light `react-big-calendar`-style month/week view. The calendar is built on `date-fns`, so no heavy dependency.
- **Env** (`apps/api/src/env.ts`): `DATABASE_URL` (default `postgres://sonal@localhost:5432/shimlawale`), `PORT`, `SESSION_DAYS`, `UPLOADS_DIR`, `ALLOWED_ORIGIN_HOSTS` (shimlawale.com, www), optional `SMTP_*` + `ADMIN_NOTIFY_EMAIL`, and future `FB_PAGE_TOKEN`, `IG_TOKEN`, `YT_API_KEY`, `WA_CLOUD_TOKEN`.

## Data model (`apps/api/src/db/schema/<domain>/*.sql.ts`, pgTable callback style like sikhglory)

**auth/**: `admins` (id, name, email, passwordHash, role `admin`), `auths` (sessions).

**site/**: `site_settings`, a single row with id=1:
- artist name, tagline, bio (markdown), hero/about image paths
- `gallery` jsonb (Kirtan moments photo cards), hero music track
- `kirtanIntro`, office/Amritvela Trust `address`, map embed URL, phone, WhatsApp number, email
- social URLs (fb, ig, yt, x, spotify, apple music), WhatsApp channel URL
- stats (followers, views, years, albums), editable

**kirtan/**: `kirtan_bookings` (a Book Kirtan request; no money columns)
- who: name, phone, whatsapp, email
- what: eventType (`sukhmani_sahib | akhand_path_bhog | sehaj_path_bhog | anand_karaj | gurpurab | amritvela_simran | prabhat_pheri | silent_kirtan | griha_pravesh | birthday_anniversary | antim_ardas | business_opening | other`), subject, language (`punjabi|hindi|either`), expectedSangat (`under_50|50_200|200_500|500_plus`), requirements text[] (sound available / need sound / Silent Kirtan headphones / langar arranged / live stream), message, referralSource
- when: eventDate, startTime, durationHours, alternateDate; the admin sets scheduledStart and scheduledEnd when confirming
- where: venueType (`gurdwara|home|banquet_hall|open_ground|other`), venueName, address, city, state, pincode
- status: `new|contacted|confirmed|completed|declined|cancelled`, adminRemark, leadId FK

**crm/**:
- `leads`: name, phone, email, source `kirtan_booking|query|manual|whatsapp|event`, status `new|contacted|follow_up|confirmed|completed|closed`, priority, tags text[], assignedTo (admin id), whatsappOptIn bool, lastContactedAt. There are no money fields.
- `contact_queries`: name, phone, email, subject, message, leadId
- `lead_notes`: leadId, adminId, body. These are the remarks.
- `follow_ups`: leadId, dueAt, type `call|whatsapp|visit|email|meeting|program`, title, notes, status `pending|done|missed`, completedAt
- `lead_activities`: an automatic timeline. Entries: status changed, note added, follow-up created/done, kirtan booking received / status changed, broadcast sent.

**content/**:
- `releases`: title, subtitle (small label), caption, posterPath, aspect `square|wide` (album art 1:1 or video thumbnail 16:9), links jsonb `{ platform, url }[]` (platform `youtube|youtube_music|spotify|apple_music|jiosaavn|amazon_music|gaana|instagram|other`), releaseDate, isActive, sortOrder
- `blog_posts`: title, slug, excerpt, body (markdown), coverImagePath, tags, status `draft|published`, publishedAt, seo title/description
- `social_posts`: platform `facebook|instagram|youtube`, externalId unique per platform, caption, mediaType, mediaUrl, thumbnailUrl, permalink, publishedAt, stats jsonb, isHidden. This is a cache that the future API sync fills.

**whatsapp/**:
- `wa_templates`: name, body with `{{name}}`/`{{link}}` variables, category `broadcast|followup|share`
- `wa_broadcast_lists` and `wa_broadcast_list_members` (listId, leadId)
- `wa_broadcasts`: listId, templateId, renderedPreview, shareRef (blog/social/custom URL), status
- `wa_broadcast_recipients`: broadcastId, leadId, status `pending|opened|sent|skipped`, sentAt

## API routes

**Public** (`/api/public/*`):
- `GET site-settings`
- `GET releases`: active posters ordered by sortOrder, then releaseDate desc
- `GET kirtan-availability?date=`: only `{ busy: boolean }` (a confirmed program exists that day); no program details are exposed
- `GET social?platform=&limit=`
- `GET blog`, `GET blog/:slug`
- `POST contact/query` and `POST kirtan-bookings`: both **auto-create or merge a lead** matched on phone (kirtan source `kirtan_booking`, tags `kirtan`, event type, city), write an activity, add a "call back" follow-up within 24h, and send an optional admin email
- Honeypot field + IP rate limit on both POSTs

**Auth**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

**Admin** (`protectedAdmin`, `/api/admin/*`):
- `dashboard/summary`
- `leads`: list with filters (status, source, tag, search, date) and pagination, detail with timeline, create, update status/priority/tags, CSV export
- `leads/:id/notes`: CRUD
- `follow-ups`: CRUD, `?from=&to=` for the calendar, mark done, `today`/`overdue`
- `kirtan-bookings`: list (filters: status, eventType, date range, search), detail, delete, and `PATCH :id/status`:
  - contacted → lead contacted; confirmed (requires date/time) → lead confirmed; completed → lead completed; declined (requires a remark) → lead closed; cancelled
  - each change writes an activity
  - confirming puts the program on the calendar and creates a `program` reminder follow-up the day before
  - an overlap check (with a 2-hour travel buffer) returns a **warning**, not a block, since the jatha can do two programs a day
- `releases`: list, create, PATCH, DELETE, `PATCH reorder { ids }`
- `queries`: list, detail, mark read, convert to lead
- `blog`: CRUD + cover upload + publish toggle
- `social`: list, hide/unhide, `POST sync` (runs the provider; mock now), manual add
- `whatsapp`: templates CRUD, lists CRUD + add/remove members (bulk add from a lead filter), `POST broadcasts` (renders per-recipient messages and returns a queue of `wa.me` links), recipient status update
- `settings`: GET/PATCH + image uploads

### Provider interfaces (so real APIs drop in later without UI changes)
- `lib/services/social/social-provider.ts`: `interface SocialProvider { fetchLatest(limit): Promise<SocialPostInput[]> }`. It has a `MockSocialProvider` that reads seed JSON, plus stubs `FacebookGraphProvider`, `InstagramGraphProvider` and `YouTubeDataProvider` that are chosen when their tokens are present in env. `socialSyncService.sync(platform)` upserts into `social_posts`. It runs from the admin "Sync now" button and on a `setInterval` every 6 hours when real providers are configured.
- `lib/services/whatsapp/wa-sender.ts`: `interface WaSender { send(to, text) }`. It has `WaLinkSender`, which builds `https://wa.me/<num>?text=<encoded>`; the admin UI opens each link and marks it sent. It also has a stub `WaCloudApiSender` for later.

## Frontend routes

**Public** (dark devotional theme: deep navy `#0f1b3d`, saffron `#f08a24`, gold `#d4a64a`, cream `#fbf7ef`; Gurmukhi-friendly font such as *Mukta* or *Noto Sans Gurmukhi* with a serif display font; mobile-first):
- `/`: a single landing page with anchor nav. Sections in order:
  1. **Hero**:
     - **Latest Releases carousel** at the top: admin posters in an infinite CSS marquee (list rendered twice, `translateX(-50%)`), square and wide cards at one shared height, platform icon buttons on each card, pause on hover/focus, edge fade, a "NEW" ribbon on the newest. 1–2 posters (or reduced motion) show as a static, swipeable row; none hides it. Tapping a card opens a sheet with the big poster, caption and full-width platform buttons.
     - Below it, the original hero: portrait, name, tagline, CTA "Book Kirtan" and "Latest Kirtan", streaming badges, music card, stats.
  2. **About / Introduction**: bio and stats counters
  3. **Kirtan Seva**: intro, badges (30+ years · Chairman, Amritvela Trust · World Book of Records), a World Record highlight card (43-day Prabhat Pheri & Silent Kirtan, 3–5 AM, Ulhasnagar), "Programs we perform", the jatha (dummy line-up), "How it works" (Request → We call you → Confirmed → Kirtan darbar), the Kirtan moments gallery, and a Book Kirtan / WhatsApp CTA
  4. **Latest from Facebook / Instagram / YouTube**: tabs; the YouTube tab has embedded players
  5. **Blog**: latest 3 posts
  6. **Contact**: two tabs, *Send a Query* and *Book Kirtan*, plus the office address and map, plus a WhatsApp channel CTA
- `/kirtan/book`: the Book Kirtan form. A 3-step wizard on phones/tablets (Your details → Program → Venue & notes), one long form with a sticky summary from `lg` up. No amount anywhere. Success screen: "Your request is received; our team will call / WhatsApp you within 24 hours."
- `/blog`, `/blog/$slug`

**Admin**: `/admin-login`, then under the `_admin` guard, with a sidebar layout copied from ecw's admin shell:
- `/admin` dashboard: KPI cards (new leads this week, pending applications, today's and overdue follow-ups, sessions recorded this month), leads-by-source chart, upcoming scheduled sessions
- `/admin/leads`: TanStack Table with filters and a Kanban toggle by status
- `/admin/leads/$id`: profile, status/priority/tags, remarks, follow-ups, activity timeline, linked bookings/queries, "WhatsApp" quick button with a template picker
- `/admin/calendar`: month/week view of follow-ups and confirmed kirtan programs, color-coded. Click an empty day to add a follow-up.
- `/admin/kirtan-bookings` (table on desktop, cards on phones; detail dialog with call/WhatsApp, map link, confirm & schedule, complete, decline with remark), `/admin/queries`
- `/admin/releases` (poster list with reorder and visibility toggle; editor dialog with poster upload, shape, label, caption, release date, a platform-link repeater and a live preview)
- `/admin/blog` (list + editor with markdown preview and cover upload)
- `/admin/social` (feed cache, sync, hide)
- `/admin/whatsapp`: tabs:
  - **Broadcast Lists**
  - **Templates**
  - **Send Broadcast**: pick a list and a template, optionally a blog/social post to share, preview, then a sending queue
  - **Community Channel**: set the channel URL, a share-to-channel helper, copyable post text
- `/admin/settings` (profile, photos, hero music, Kirtan moments gallery, kirtan intro & contact, socials)

## Generated assets (`apps/api/scripts/gen-assets.ts`, SVG like `sikhglory/apps/api/scripts/gen-svgs.ts`)
Output goes to `apps/api/uploads/brand/...` and the favicon to `apps/web/public/`:
- **Logo**: a circular emblem with a stylized microphone and sound-wave arcs, with a saffron/gold gradient, next to the wordmark "SHIMLA WALE" and the sub-line "Bhai Gurpreet Singh Ji". There are also mark-only and light/dark variants and a favicon.
- **Hero background**: navy with a soft gold light-ray and mandala pattern. **Portrait placeholder**: a dastar-and-beard silhouette in the brand colors. Real photos replace these through Settings.
- **Release posters**: 5 placeholders (square and wide) in `uploads/releases/`, and 3 Kirtan moments placeholders in `uploads/gallery/`
- Blog cover placeholders (6) and social thumbnails (FB/IG/YT styled cards)

## Seed data (`apps/api/src/db/seed/`)
- **Admin**: `admin@shimlawale.com` / `ChangeMe123!`. It must be changed before deploying.
- **Site settings**: bio (30+ years, Amritvela Trust, world record), social links above, stats (94K IG followers, 66 lakh+ views, 30+ years), and the Amritvela Trust address in Ludhiana.
- **Releases**: 5 posters: *Amritvela Simran* (new), *Satgur Tumre Kaaj Saware*, *Narayan*, *Aukhi Ghadi Na Dekhan Deyi*, *Best Of — Non Stop Kirtan*, each with 2–4 platform links
- **Social**:
  - YT posts from real titles: "Satgur Tumre Kaaj Saware" (16 Dec 2024), "Aukhi Ghadi Na Dekhan Deyi" (19 Feb 2023), "Best Of … Non Stop Kirtan" (12 Feb 2016), and the "Narayan" album
  - FB and IG posts with dummy captions
- **Blog**: 6 posts, with dummy devotional, kirtan-planning and Amritvela Trust content.
- **CRM**:
  - about 20 leads across all statuses and sources, with notes and follow-ups (some overdue, some today)
  - 8 kirtan bookings across statuses and cities (Amritsar, Ulhasnagar, Ludhiana, Mumbai, Delhi, Jalandhar), 5 queries
  - 3 WhatsApp lists (Raagi Jathas, Kirtan Hosts, Gurpurab Updates) and 4 templates

## Build phases
1. Scaffold the monorepo, configs, env, db connect, auth (copied from sikhglory), and the web shell with ui components copied from ecw.
2. Schema, migrations, asset generator, seed.
3. Public API and landing page, Book Kirtan form, blog pages.
4. Admin: login and layout, dashboard, leads (with detail, notes, follow-ups), calendar, kirtan bookings, queries.
5. Admin: releases, blog, social, settings, WhatsApp module.
6. Polish: responsive pass, SEO meta/OG tags, typecheck and lint, and a copy of this plan at `docs/implementation-plan.md`.

## Verification
1. `bun install`, run `createdb shimlawale`, then `bun run --cwd apps/api db:generate && db:migrate && db:seed`, then `bun scripts/gen-assets.ts`.
2. Start `api` (:4200) and `web` (:3200) through `preview_start`, using the updated launch.json. Check `http://localhost:4200/health`.
3. Public site in the browser pane at desktop and mobile (375px):
   - the release carousel loops seamlessly and pauses on hover; tapping a card on mobile opens the sheet; there is no horizontal page scroll
   - every section renders the seed data, and the social tabs switch
   - submit a Query and a Book Kirtan request (step validation on mobile). No amount appears anywhere.
   - both appear in admin as leads (`kirtan_booking` source for the booking)
4. Admin:
   - `/admin/*` redirects when logged out; log in
   - on the new lead, add a remark and a follow-up for tomorrow; confirm it shows on the calendar and dashboard
   - confirm and schedule the kirtan booking; it appears on the calendar and dashboard, the lead becomes *confirmed*, and a program reminder is added. Decline another with a remark.
   - add a release with a poster and links; it shows in the home carousel; hide it and reorder releases
   - create, publish and unpublish a blog post with a cover upload; it appears on the public site
   - run social "Sync now" (mock)
   - create a WhatsApp list, add filtered leads, send a broadcast sharing a blog post; the queue generates correct `wa.me` links
   - change settings (hero photo upload, socials) and confirm they show on the public site
5. `bun run typecheck` and `bun run check` (Biome) are clean. There are no errors in the console or the api logs.

---

## Implementation notes (post-build)

Built as planned, with these deviations and findings:

- **Forms/selects**: admin filters and forms use a small styled native `<select>` (`components/common/native-select.tsx`) and plain React state instead of Radix Select + TanStack Form. They're lighter and work better on mobile.
- **Calendar**: a custom month/week grid on `date-fns` (`routes/_admin/admin/calendar.tsx`); no calendar library.
- **Enum validation**: Elysia's `t.UnionEnum` injects `default: values[0]`, which silently filled missing optional query/body fields (e.g. a PATCH without `status` reset it). All controllers use `tEnum()` from `apps/api/src/lib/utils/schema.ts`, which has no default.
- **Eden date parsing**: the Eden client turns date-only strings (`"2026-09-27"`) into `Date` objects at runtime even though the type says `string`. Use `ymd()` from `apps/web/src/lib/utils.ts` for `preferredDate`.
- **Timestamps** are `timestamptz`. Plain `timestamp` + `defaultNow()` shifted values by the DB session's +05:30.
- **Kirtan bookings** (replaced the free studio on 2026-10-01): no amounts anywhere. A request goes new → contacted → confirmed → completed (or declined/cancelled). Confirming needs a date/time, warns about nearby programs (2h travel buffer), moves the lead to *confirmed* and adds a `program` reminder the day before; completing moves the lead to *completed*.
- **Admin login** is rate-limited: 5 attempts per 15 minutes per IP. Public forms have a honeypot plus 5 submissions per 10 minutes per IP.

## Change log: 2026-10-01 — release carousel, studio removed, Book Kirtan

- **Studio removed end to end**: `studio_*` tables, the studio catalog and bookings controllers, `/studio/book`, `/admin/bookings`, `/admin/studio`, the booking wizard, the studio landing section and studio art. Lead enums changed (`booking` → `kirtan_booking`, `shortlisted|recorded` → `confirmed|completed`, follow-up `session` → `program`). Migrations were reset: `apps/api/drizzle/migrations/` was deleted and regenerated as one fresh migration, and the DB re-seeded (no production data existed).
- **Settings renames**: `studioIntro` → `kirtanIntro`, `studioAddress` → `address`, `studioGallery` → `gallery` (icons: khanda, harmonium, tabla, sangat, pheri, headphones). `STUDIO_TZ` → `IST_TZ` in web and API.
- **Releases**: new `releases` table, `/api/public/releases`, `/api/admin/releases` (+ `reorder`), upload folder `releases`, `components/landing/release-carousel.tsx` (exports `ReleaseCard`/`PlatformButton`, reused for the admin live preview) and `/admin/releases`. The marquee is plain CSS (`@keyframes marquee` in `styles.css`) so it stays smooth on phones.
- **Book Kirtan**: `kirtan_bookings` table, `POST /api/public/kirtan-bookings`, `GET /api/public/kirtan-availability`, `/api/admin/kirtan-bookings`, `components/kirtan/kirtan-booking-form.tsx`, `/kirtan/book`, `/admin/kirtan-bookings`. Labels live in `apps/web/src/lib/kirtan.ts`; platform icons/colours in `apps/web/src/lib/releases.ts`.
- **Dummy content** to replace later: the jatha line-up in `kirtan-section.tsx`, the release posters/links (Admin → Releases) and the Kirtan moments photos (Admin → Settings).

