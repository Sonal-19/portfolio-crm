# Shimla Wale — Portfolio Website + CRM Admin Panel

## Context

**Bhai Gurpreet Singh Ji Shimla Wale** is a Gurbani kirtan artist. On Google his profile shows "Musical artist", about 94K Instagram followers, and the jukebox "Best Of Bhai Gurpreet Singh Shimla Wale – Non Stop Kirtan" with 66 lakh+ views. He runs a **professional recording studio at Ghanta Ghar, Ludhiana** for raagis and other artists. The studio does song recording and music-video shoots.

We need two things. Both go on **shimlawale.com**:
1. **Public portfolio / landing site**: introduction, studio booking (preset packages or a custom build), live feeds from Facebook, Instagram and YouTube (dummy data behind a provider interface for now), a blog managed from admin, and a contact section with two forms (**Query** and **Record with Us**).
2. **Admin CRM** (admin email + password only): blog CRUD, contact queries and studio bookings stored as **leads**, remarks, a follow-up calendar, WhatsApp broadcast lists, community channel and content sharing, a dashboard, and settings.

The new project lives in `/Users/sonal/Developer/Projects/shimlawale-crm`. It already has `.gitignore` and `.claude/launch.json`. **Ports change to api 4200 and web 3200** so they don't collide with ecw (4000/3001) or sikhglory (4000/5173). The `launch.json` entries, `env.ts` `PORT` default, the web `dev` script (`vite --port 3200`) and the Vite proxy target (`http://localhost:4200`) will be updated to match. It follows the **ecw** architecture: Bun workspaces, Elysia, Drizzle + Postgres, TanStack Router/Query/Form/Table, and shadcn/Radix components. It reuses **sikhglory**'s simplifications: single admin role, local-disk WebP uploads, and SVG asset generation.

Decisions already made:
- Frontend stack: ecw style (TanStack + shadcn).
- WhatsApp: click-to-send now through `wa.me` links, with a provider interface so the WhatsApp Cloud API can be added later.
- Socials: FB `facebook.com/shimlawaleofficial`, IG `instagram.com/shimlawaleofficial`, YT `youtube.com/shimlawale`, X `x.com/gsshimlawale`. Spotify and Apple Music links are also editable in settings.
- Photos: generated placeholder art for now. The admin uploads real photos (hero portrait, about photo, studio gallery) from Settings.
- **The studio is completely free.** Recording and video shoots cost nothing for any talented person. There are **no prices, quotes, rates or payments anywhere**. A booking is a **request/application** that the admin reviews, approves and schedules. The public site says so clearly ("Free for talented artists – seva by Bhai Gurpreet Singh Ji").

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
- **Uploads**: copy `sikhglory/apps/api/src/lib/services/storage-service.ts`, which converts to WebP with Bun `Image`. Folders: `brand | gallery | blog | studio | social`.
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
- studio address, map embed URL, phone, WhatsApp number, email
- social URLs (fb, ig, yt, x, spotify, apple music), WhatsApp channel URL
- stats (followers, views, years, albums), editable

**studio/**:
None of these tables has a price column.
- `studio_packages`: name, slug, description, durationHours, includes (jsonb list), isFeatured, sortOrder, isActive. These are preset session types.
- `studio_instruments`: name, icon, isActive. Seed: harmonium, tabla, dilruba, rabab, taus, flute, keyboard, guitar, dholak, chimta.
- `studio_engineers`: name, bio, photoPath, isActive
- `studio_addons`: name, description, kind `mixing|mastering|video_shoot|other`
- `studio_bookings` (a recording application):
  - who: name, phone, email, city, artistType (raagi, kirtani jatha, singer, band, other)
  - talent: experience, sampleLink (YouTube/IG/audio link), about
  - what: packageId? or custom (instrumentIds[], engineerId?, addonIds[], durationHours), projectTitle, notes
  - when: preferredDate, preferredStartTime; the admin sets scheduledStart and scheduledEnd when approving
  - status: `pending|under_review|approved|scheduled|completed|rejected|cancelled`
  - adminRemark, leadId FK

**crm/**:
- `leads`: name, phone, email, source `booking|query|manual|whatsapp|event`, status `new|contacted|follow_up|shortlisted|recorded|closed`, priority, tags text[], assignedTo (admin id), whatsappOptIn bool, lastContactedAt. There are no money fields.
- `contact_queries`: name, phone, email, subject, message, leadId
- `lead_notes`: leadId, adminId, body. These are the remarks.
- `follow_ups`: leadId, dueAt, type `call|whatsapp|visit|email|meeting`, title, notes, status `pending|done|missed`, completedAt
- `lead_activities`: an automatic timeline. Entries: status changed, note added, follow-up created/done, booking confirmed, broadcast sent.

**content/**:
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
- `GET studio/catalog` (packages, instruments, engineers, addons)
- `GET studio/availability?date=`: scheduled slots, used to grey out taken times
- `GET social?platform=&limit=`
- `GET blog`, `GET blog/:slug`
- `POST contact/query` and `POST studio/bookings`: both **auto-create or merge a lead** matched on phone, write an activity, and send an optional admin email
- Honeypot field + IP rate limit on both POSTs

**Auth**: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

**Admin** (`protectedAdmin`, `/api/admin/*`):
- `dashboard/summary`
- `leads`: list with filters (status, source, tag, search, date) and pagination, detail with timeline, create, update status/priority/tags, CSV export
- `leads/:id/notes`: CRUD
- `follow-ups`: CRUD, `?from=&to=` for the calendar, mark done, `today`/`overdue`
- `bookings`: list, detail, and review flow:
  - status change: approve and schedule with a time slot, reject with a remark, complete
  - each change writes an activity
  - scheduling puts the session on the calendar and creates a reminder follow-up
  - a clash check stops two sessions overlapping
- `queries`: list, detail, mark read, convert to lead
- `blog`: CRUD + cover upload + publish toggle
- `social`: list, hide/unhide, `POST sync` (runs the provider; mock now), manual add
- `studio/*`: CRUD for packages, instruments, engineers and addons
- `whatsapp`: templates CRUD, lists CRUD + add/remove members (bulk add from a lead filter), `POST broadcasts` (renders per-recipient messages and returns a queue of `wa.me` links), recipient status update
- `settings`: GET/PATCH + image uploads

### Provider interfaces (so real APIs drop in later without UI changes)
- `lib/services/social/social-provider.ts`: `interface SocialProvider { fetchLatest(limit): Promise<SocialPostInput[]> }`. It has a `MockSocialProvider` that reads seed JSON, plus stubs `FacebookGraphProvider`, `InstagramGraphProvider` and `YouTubeDataProvider` that are chosen when their tokens are present in env. `socialSyncService.sync(platform)` upserts into `social_posts`. It runs from the admin "Sync now" button and on a `setInterval` every 6 hours when real providers are configured.
- `lib/services/whatsapp/wa-sender.ts`: `interface WaSender { send(to, text) }`. It has `WaLinkSender`, which builds `https://wa.me/<num>?text=<encoded>`; the admin UI opens each link and marks it sent. It also has a stub `WaCloudApiSender` for later.

## Frontend routes

**Public** (dark devotional theme: deep navy `#0f1b3d`, saffron `#f08a24`, gold `#d4a64a`, cream `#fbf7ef`; Gurmukhi-friendly font such as *Mukta* or *Noto Sans Gurmukhi* with a serif display font; mobile-first):
- `/`: a single landing page with anchor nav. Sections in order:
  1. **Hero**: portrait, name, tagline, CTA "Book Studio" and "Listen" (YT/Spotify/Apple Music)
  2. **About / Introduction**: bio and stats counters
  3. **Professional Studio**:
     - the intro text from the brief
     - a prominent **"100% Free – Seva for talented artists"** badge
     - preset session cards (duration and what's included, no prices)
     - a "Build your own session" CTA
     - a short "How it works" row: Apply → Review → Scheduled → Record
  4. **Latest from Facebook / Instagram / YouTube**: tabs; the YouTube tab has embedded players
  5. **Blog**: latest 3 posts
  6. **Contact**: two tabs, *Send a Query* and *Record with Us*, plus the studio address and map, plus a WhatsApp channel CTA
- `/studio/book`: a free booking request form in steps:
  1. preset session or custom
  2. instruments, duration, sound engineer, mixing/mastering/video-shoot add-ons, with a live summary and no pricing
  3. preferred date/time, showing availability
  4. about you: contact details, artist type, experience, and a sample link
  5. a confirmation screen: "Request received, we'll contact you on WhatsApp"
- `/blog`, `/blog/$slug`

**Admin**: `/admin-login`, then under the `_admin` guard, with a sidebar layout copied from ecw's admin shell:
- `/admin` dashboard: KPI cards (new leads this week, pending applications, today's and overdue follow-ups, sessions recorded this month), leads-by-source chart, upcoming scheduled sessions
- `/admin/leads`: TanStack Table with filters and a Kanban toggle by status
- `/admin/leads/$id`: profile, status/priority/tags, remarks, follow-ups, activity timeline, linked bookings/queries, "WhatsApp" quick button with a template picker
- `/admin/calendar`: month/week view of follow-ups and confirmed bookings, color-coded. Click an empty day to add a follow-up.
- `/admin/bookings`, `/admin/queries`
- `/admin/blog` (list + editor with markdown preview and cover upload)
- `/admin/social` (feed cache, sync, hide)
- `/admin/studio` (tabs: packages, instruments, engineers, add-ons)
- `/admin/whatsapp`: tabs:
  - **Broadcast Lists**
  - **Templates**
  - **Send Broadcast**: pick a list and a template, optionally a blog/social post to share, preview, then a sending queue
  - **Community Channel**: set the channel URL, a share-to-channel helper, copyable post text
- `/admin/settings` (profile, contact, socials, photos)

## Generated assets (`apps/api/scripts/gen-assets.ts`, SVG like `sikhglory/apps/api/scripts/gen-svgs.ts`)
Output goes to `apps/api/uploads/brand/...` and the favicon to `apps/web/public/`:
- **Logo**: a circular emblem with a stylized microphone and sound-wave arcs, with a saffron/gold gradient, next to the wordmark "SHIMLA WALE" and the sub-line "Bhai Gurpreet Singh Ji". There are also mark-only and light/dark variants and a favicon.
- **Hero background**: navy with a soft gold light-ray and mandala pattern. **Portrait placeholder**: a dastar-and-beard silhouette in the brand colors. Real photos replace these through Settings.
- **Studio art**: mixing desk, mic booth and camera (video shoot) illustrations, plus package card icons
- Blog cover placeholders (6) and social thumbnails (FB/IG/YT styled cards)

## Seed data (`apps/api/src/db/seed/`)
- **Admin**: `admin@shimlawale.com` / `ChangeMe123!`. It must be changed before deploying.
- **Site settings**: bio, social links above, stats (94K IG followers, 66 lakh+ views), and "Ghanta Ghar, Ludhiana, Punjab".
- **Studio**:
  - 4 packages: *Shabad Recording*, *Kirtan Album Day*, *Record + Mix + Master*, *Music Video Shoot*
  - 10 instruments, 2 engineers, 4 add-ons
- **Social**:
  - YT posts from real titles: "Satgur Tumre Kaaj Saware" (16 Dec 2024), "Aukhi Ghadi Na Dekhan Deyi" (19 Feb 2023), "Best Of … Non Stop Kirtan" (12 Feb 2016), and the "Narayan" album
  - FB and IG posts with dummy captions
- **Blog**: 6 posts, with dummy devotional and studio-tips content.
- **CRM**:
  - about 20 leads across all statuses and sources, with notes and follow-ups (some overdue, some today)
  - 6 bookings, 5 queries
  - 3 WhatsApp lists (Raagi Jathas, Studio Clients, Gurpurab Updates) and 4 templates

## Build phases
1. Scaffold the monorepo, configs, env, db connect, auth (copied from sikhglory), and the web shell with ui components copied from ecw.
2. Schema, migrations, asset generator, seed.
3. Public API and landing page, booking builder, blog pages.
4. Admin: login and layout, dashboard, leads (with detail, notes, follow-ups), calendar, bookings, queries.
5. Admin: blog, social, studio catalog, settings, WhatsApp module.
6. Polish: responsive pass, SEO meta/OG tags, typecheck and lint, and a copy of this plan at `docs/implementation-plan.md`.

## Verification
1. `bun install`, run `createdb shimlawale`, then `bun run --cwd apps/api db:generate && db:migrate && db:seed`, then `bun scripts/gen-assets.ts`.
2. Start `api` (:4200) and `web` (:3200) through `preview_start`, using the updated launch.json. Check `http://localhost:4200/health`.
3. Public site in the browser pane at desktop and mobile (375px):
   - every section renders the seed data, and the social tabs switch
   - submit a Query and a custom Booking. No price appears anywhere, the summary updates live, and a taken slot is greyed out.
   - both appear in admin as leads
4. Admin:
   - `/admin/*` redirects when logged out; log in
   - on the new lead, add a remark and a follow-up for tomorrow; confirm it shows on the calendar and dashboard
   - approve and schedule the booking; it appears on the calendar, and the status and timeline update. Reject another with a remark.
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
- **Studio is free**: there are no price columns anywhere. A booking is an application: pending → under review → approved/scheduled → completed (or rejected/cancelled). Scheduling runs a clash check, moves the lead to *shortlisted*, and adds a reminder follow-up the day before; completing moves the lead to *recorded*.
- **Admin login** is rate-limited: 5 attempts per 15 minutes per IP. Public forms have a honeypot plus 5 submissions per 10 minutes per IP.
