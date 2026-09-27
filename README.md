# Shimla Wale: Portfolio + CRM

Official website of **Bhai Gurpreet Singh Ji Shimla Wale** (shimlawale.com) plus the admin CRM
for leads, free studio requests, follow-ups, blog and WhatsApp outreach.

- `apps/api`: Bun + Elysia + Drizzle (Postgres). Port **4200**.
- `apps/web`: React 19 + Vite 8 + Tailwind v4 + TanStack Router/Query/Table. Port **3200**.
  Public site at `/`, admin at `/admin` (login at `/admin-login`).

## First run

```bash
bun install
createdb shimlawale
cp apps/api/.env.example apps/api/.env      # adjust DATABASE_URL if needed
cd apps/api
bun run db:generate && bun run db:migrate  # create tables
bun run assets                             # generate logo/placeholder SVGs into uploads/
bun run db:seed                            # wipes & seeds demo data
cd ../.. && bun run dev                    # api :4200 + web :3200
```

Seeded admin: `admin@shimlawale.com` / `ChangeMe123!`. **Change it** in Admin → Settings before going live.

## What's where

| Area | Backend | Frontend |
| --- | --- | --- |
| Public site data | `controllers/public-controller.ts` | `routes/index.tsx`, `components/landing/*` |
| Free studio booking | `POST /api/public/studio/bookings` | `components/studio/booking-wizard.tsx`, `/studio/book` |
| Leads, remarks, timeline | `admin-leads-controller.ts`, `lib/services/lead-service.ts` | `/admin/leads`, `/admin/leads/$id` |
| Follow-ups & calendar | `admin-follow-ups-controller.ts` | `/admin/calendar` |
| Studio requests review | `admin-bookings-controller.ts` | `/admin/bookings` |
| WhatsApp lists/templates/broadcasts/channel | `admin-whatsapp-controller.ts`, `lib/services/whatsapp/wa-sender.ts` | `/admin/whatsapp` |
| Social feed (FB/IG/YT) | `lib/services/social/*` | `/admin/social`, landing "Latest" section |
| Blog | `admin-blog-controller.ts` | `/admin/blog` |

## Going live with integrations

- **Facebook / Instagram / YouTube**: set `FB_PAGE_ID`+`FB_PAGE_TOKEN`, `IG_USER_ID`+`IG_TOKEN`,
  `YT_CHANNEL_ID`+`YT_API_KEY` in `apps/api/.env`. Each platform switches from demo data to its live
  provider automatically and refreshes every 6h (or use "Sync now" in Admin → Social Feed).
- **WhatsApp**: messages currently open in WhatsApp via `wa.me` links (click-to-send). A
  `WaCloudApiSender` is ready in `wa-sender.ts` for the Meta Cloud API once a business number is verified.
- **Email alerts** for new queries/bookings: set `SMTP_*` and `ADMIN_NOTIFY_EMAIL`.

## Notes

- `apps/api/uploads/` is git-ignored. Run `bun run assets` on a fresh machine to regenerate brand art;
  admin uploads (converted to WebP) are stored there too, so back it up in production.
- All times are Indian Standard Time; the studio's open hours (9:00–21:00) are in `apps/api/src/lib/utils/time.ts`.
