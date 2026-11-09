# EchoMemories

A quiet social space of **echoes** (posts), **rooms** (communities) and **Pulse** (presence score).
Anonymous posting in *Space*, focused conversation in *EchoRooms*.

**Stack:** Next.js 15 (App Router) · React 19 · PostgreSQL · Prisma 7 · JWT sessions in httpOnly cookies

## Features

- **Auth:** email-verified signup (OTP), login, forgot/reset password (emailed code; resetting signs out other devices)
- **Space:** anonymous echoes, including anonymous replies from the original author
- **Rooms:** public and private, join/leave, room feeds
- **Room roles:** owner, admins and members; only the owner and admins can see the member list
- **Invites:** invite by username (accept/decline inbox) or share a revocable invite link that expires after 7 days
- **Echoes:** resonate, save, reply, @mentions, notifications
- **Pulse:** score, daily streaks, leaderboard
- **Theme:** light and dark (follows the system, remembers the choice)

## Run locally

```bash
npm install
cp .env.example .env        # then fill it in (see below)
npm run setup               # apply migrations + seed rooms, sample writers and echoes
npm run dev                 # http://localhost:3000
```

With `EMAIL_USER` and `EMAIL_PASS` empty, verification and reset codes are printed in the server console (development only).

## Environment

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_SECRET` | yes | 32+ random characters; signs sessions and OTP cookies |
| `EMAIL_USER`, `EMAIL_PASS` | in production | Gmail address and App Password, used to send codes |
| `CRON_SECRET` | for the daily jobs | Protects the two Pulse jobs |
| `APP_TZ_OFFSET_MINUTES` | no | Minutes ahead of UTC that define a "day" (default 330) |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public URL, used for social-preview images |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

The production server refuses to start if `DATABASE_URL` or `JWT_SECRET` is missing or weak.

## Deploy on Vercel

1. **Database:** create a free PostgreSQL database (Neon or Supabase) and copy its **pooled** connection string.
2. **Create the tables once, from your computer:**
   ```bash
   DATABASE_URL="<your connection string>" npm run db:deploy
   DATABASE_URL="<your connection string>" npm run db:seed
   ```
   Run `db:deploy` again whenever a new migration is added.
3. **Import the project** in Vercel (framework: Next.js, defaults are fine) and add these environment variables: `DATABASE_URL`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` (your Vercel URL) and optionally `APP_TZ_OFFSET_MINUTES`.
4. **Deploy.** `vercel.json` already schedules the two daily Pulse jobs, and Vercel authenticates them with `CRON_SECRET`.

Any other Node 20.19+ host works too: `npm ci && npm run build && npm run db:deploy && npm start`.

**Daily jobs** (`POST` or `GET`, header `Authorization: Bearer $CRON_SECRET`):

- `/api/pulse/recalculate-daily` recomputes Pulse scores
- `/api/pulse/check-streak` resets broken streaks and applies the 2% Pulse decay

**Health check:** `GET /api/health` returns `{"status":"ok"}` (503 if the database is unreachable).

Rate limits are kept in server memory, so on Vercel they apply per serverless instance. That is fine for a project of this size.

## Room permissions

| | Member | Admin | Owner |
|---|:-:|:-:|:-:|
| Read, post, reply | yes | yes | yes |
| See the member list | | yes | yes |
| Invite people / manage invite link | | yes | yes |
| Remove regular members | | yes | yes |
| Delete any echo or reply in the room | | yes | yes |
| Rename the room, edit description | | yes | yes |
| Promote / demote admins, remove admins | | | yes |
| Make the room public/private, transfer, delete | | | yes |

The owner is the room's creator (`Room.createdById`) and can hand the room to another member. The owner cannot leave until ownership is transferred.

Room endpoints: `GET/PATCH/DELETE /api/rooms/:id`, `GET /api/rooms/:id/members`, `PATCH/DELETE /api/rooms/:id/members/:userId`, `POST /api/rooms/:id/transfer`, `GET/POST /api/rooms/:id/invites`, `DELETE /api/rooms/:id/invites/:inviteId`, `GET/POST/DELETE /api/rooms/:id/invite-link`, `GET /api/invites`, `PATCH /api/invites/:inviteId`, `GET/POST /api/invites/code/:code`, `GET /api/search/users`.

Test the room features end to end (needs a running server and a development database): `npm run test:e2e`.

## Structure

```
src/app/            pages and API routes (app/api/**/route.js)
src/components/     UI (Ghost = the brand character, forms, header, feed…)
src/services/       business logic used by the API routes
src/libs/           prisma, auth/session, cookies, rate limiting, mail, helpers, route.js (auth + error wrapper for routes)
prisma/             schema, migrations, seed
public/brand/       ghost logo in three sizes
scripts/doctor.mjs  dev environment checker (runs before `npm run dev`)
```

Design tokens (colours, radii, fonts) live at the top of `src/app/globals.css`, with a `:root[data-theme="dark"]` override.

## Author

Built by **Naveen Kumar**: [GitHub](https://github.com/official-naveen) · [LinkedIn](https://www.linkedin.com/in/naveen-kumar-854737446)
