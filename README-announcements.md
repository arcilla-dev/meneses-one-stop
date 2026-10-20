# Announcements (Next.js + Tailwind + Supabase)

Admins post announcements; **every signed-in user** (students and admins) sees them. Both pages run on **Supabase**. Write access comes from Row Level Security policies that check `is_staff()`, **not** from the service-role key.

- **Admin → Manage Announcements:** list, post, edit (for 1 hour after posting) and delete announcements
- **Student → Announcements:** read-only list with search, sort and expand-to-read

## Stack
- Next.js App Router (`'use client'` pages), TypeScript, Tailwind CSS, `lucide-react`
- `@supabase/ssr` browser client from `@/utils/supabase/client`

## Folder layout
```
lib/
  announcementsApi.ts        Everything both pages need: list, my office, create, update, delete
supabase/
  admin-announcements.sql    Documentation copy of the SQL (run it in the SQL Editor; also appended to rpcFunction.sql)
admin/announcements/
  page.tsx                   Manage announcements (post / edit / delete)
student/announcements/
  page.tsx                   Read-only list
```
Put the two `page.tsx` files wherever your admin and student routes live.

## How it works
- **Reading:** `fetchAnnouncements()` selects from `announcements`, newest first. The policy `Signed-in users read announcements` allows every authenticated user. Logged-out visitors get nothing.
- **Posting:** `createAnnouncement()` sends only `title`, `message` and `announcement_type`. The database trigger `announcements_before_insert` fills `created_at`, `created_by` and `office`, so the browser can't fake them.
- **Office:** the page shows "Posting as `<office>`", read from `profiles.office` of the signed-in admin (`fetchMyOffice()`). The insert trigger stamps the same value. An admin with no office set posts as **Administration**.
- **Editing:** allowed for 1 hour after `created_at`. The window is enforced by the RLS policy `Staff edit announcements within 1 hour`; the pencil icon is hidden after an hour only for convenience.
- **Deleting:** any staff account, at any time. Removes it for every user.
- **Notifications:** none. Announcements are not copied into the `notifications` table.

## Field mapping
| UI field | Source |
|---|---|
| Title | `announcements.title` (max 120) |
| Message | `announcements.message` (max 1000) |
| Category / icon | `announcements.announcement_type`: `general` (document icon), `enrollment`, `infirmary`, `scholarship`, `printing` |
| "From: ..." | `announcements.office` (set by the database from `profiles.office`) |
| Relative time ("2h ago") | `announcements.created_at` |
| Edit allowed | `created_at` within the last hour |

## Database objects added
| Object | Purpose |
|---|---|
| Columns `announcement_type`, `office`, `updated_at` | Added to the existing `announcements` table (created by the LSC SQL) |
| Column `profiles.office` | Which office an admin posts for |
| Constraints `announcements_type_check`, `announcements_title_len`, `announcements_message_len` | Allowed categories and the 120 / 1000 length limits |
| `announcements_before_insert()` + trigger | Server sets `created_by`, `created_at`, `office`; trims text |
| `announcements_before_update()` + trigger | Trims text, sets `updated_at` |
| Column grants | Browser may insert/update only `title`, `message`, `announcement_type`, `pinned`. It can never write `created_at`, `created_by` or `office` |
| Policies `Signed-in users read announcements`, `Staff create announcements`, `Staff edit announcements within 1 hour`, `Staff delete announcements` | Replace the old `lsc ann read` and `lsc ann staff write` policies |

## Setup order
1. Student-side SQL for LSC (creates `announcements`) and `supabase/admin-registrar.sql` (creates `is_staff()` and the staff profile read policy).
2. `supabase/admin-announcements.sql` (this folder). It is also appended at the end of `rpcFunction.sql`.
3. Set each admin's office (see below).
4. Copy `announcementsApi.ts` into `lib/` and replace the two pages.
5. Make sure the admin account's `profiles.role` is `admin` or `superadmin`.

## Setting an admin's office
```sql
update public.profiles set office = 'Registrar''s Office'
  where id = (select id from auth.users where email = 'registrar.admin@example.com');
```

## Handling announcements without the UI
Run in the SQL Editor (`created_at` is always set to now, and `office` falls back to the value you give when the profile has none):
```sql
insert into public.announcements (title, message, announcement_type, office)
values ('Enrollment opens Monday', 'Check your college schedule.', 'enrollment', 'Registrar''s Office');

delete from public.announcements where id = '<announcement id>';
```

## Conventions
- **IDs are uuids.** The `id` type in `AnnouncementItem` is `string`.
- **Errors:** API functions throw `Error(message)`; pages show the message. A permission failure (`42501`) is translated to "Only staff accounts can manage announcements".
- **RLS hides rows silently.** An update or delete that matches no visible row returns no error, so `updateAnnouncement` / `deleteAnnouncement` check that a row came back and throw otherwise.
- **Never use the service-role client (`supabaseAdmin`) in a `'use client'` file.**
- **Changing the edit window:** change `interval '1 hour'` in the policy **and** `EDIT_WINDOW_MS` in `announcementsApi.ts`.
- **Adding a category:** add it to `announcements_type_check` in SQL, to `TYPE_OPTIONS` in the admin page, and to `ICON_MAP` in both pages.

## Known limitations
- **Security: any student may be able to make themselves staff.** The profile SQL in `rpcFunction.sql` grants `update` on the whole `profiles` table and lets users update their own row, which includes `role`. Unless a trigger elsewhere blocks it, `update({ role: 'superadmin' })` on their own profile makes them staff, and staff can post announcements and read all requests. The fix is commented at the bottom of `admin-announcements.sql` (column-level `grant update (full_name, avatar_url)`). Check which columns your profile page saves before applying it.
- **Any admin can post as, edit and delete every office's announcements.** Only the displayed office differs. Separating offices needs policies that compare `profiles.office` with `announcements.office`.
- **Not real-time.** Both pages load once on mount. Reload to see announcements posted by someone else.
- **No pagination.** Every announcement is loaded. Fine for a campus; add `.range()` if the table grows into the thousands.
- **The edit window uses two clocks.** The icon is hidden using the browser's clock, the policy uses the database's. If a device clock is wrong, the pencil may show or hide at the wrong moment, but the database is always right.
- **Column-restricted writes.** If another page (for example an LSC admin screen) inserts or updates other columns of `announcements`, it fails with "permission denied for column". Add the column to the `grant` lines in the SQL.
- **Posted announcements aren't pinned or sorted by `pinned`.** The column still exists from the LSC SQL, but neither page uses it.
- **Existing announcements** (from the LSC SQL) show office **Administration** and category **General** after the migration. Fix them once with an `update` if that matters.

## Troubleshooting
| Symptom | Likely cause |
|---|---|
| "Only staff accounts can manage announcements" when posting | The account's `profiles.role` isn't `admin` / `superadmin`, or `admin-announcements.sql` wasn't run |
| `permission denied for column ...` | Something is sending a column other than `title`, `message`, `announcement_type`, `pinned` |
| "Nothing was updated" when editing | The 1-hour window ended, or the announcement was already deleted |
| Students see an empty list | No rows yet, or the student isn't signed in. Check `select * from public.announcements;` |
| Everything says "Posting as Administration" | `profiles.office` is empty for that admin |
| `relation "announcements" does not exist` | LSC SQL wasn't run; the script creates the table, so re-run it from the top |
| 401 errors | The page is using a different Supabase client than the login; import from `@/utils/supabase/client` |
