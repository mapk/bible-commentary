# CLAUDE.md

Project guide for Claude Code. Keep it current: if a change makes something here wrong, update this file in the same PR.

## Project

**Tолкование** ("commentary/interpretation") is a Bible reader that syncs commentary from trusted community elders to specific KJV verses. Readers browse books, chapters, and verses, and can request commentary on a verse. Logged-in contributors write commentary and define chiasms (chiastic literary structures), which appear as colored verse highlights.

- Repo: `mapk/bible-commentary` (**public**, so never commit secrets or private data)
- Hosting: Netlify, per the About page. The repo has no `netlify.toml`, so deploy settings live in the Netlify dashboard.
- The site name mixes a Latin `T` with Cyrillic `олкование`. Copy it exactly from `src/app/layout.tsx` rather than retyping it.

Treat this as religious community content. Don't rewrite, reword, or generate commentary or scripture text unless explicitly asked. Keep the KJV text as the API returns it, apart from existing cleanup such as `stripParagraphMarkers`.

## Stack

- Next.js 15.5 App Router, React 18 in `package.json`, TypeScript (`strict`)
- Tailwind CSS 3 with shadcn/ui (Radix) in `src/components/ui`, `lucide-react` icons
- `next-themes` for dark mode (class strategy), local Geist fonts through `next/font`
- Supabase: Postgres, Auth, and RLS. The browser talks to it directly using the anon key.
- [API.Bible](https://scripture.api.bible) for KJV text, books, chapters, and search (Bible ID `de4e12af7f28f599-02`)

## Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint     # next lint
npx tsc --noEmit # type check
npm run build    # production build; also lints and type checks
```

There is no test framework, CI, or formatter config. Before calling work done, run lint, `tsc`, and `npm run build`, then exercise the change in a browser (use the `run` skill), in both light and dark mode for UI changes. Tell the user what was and wasn't verified.

`npm run lint` currently reports one known warning, `react-hooks/exhaustive-deps` in `src/components/Chapter.tsx`. Don't add new ones.

## Environment

`.env.local` (gitignored) must define:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key, safe in the browser only because RLS protects the data |
| `BIBLE_API_KEY` | API.Bible key, **server-only**. Never prefix it with `NEXT_PUBLIC_` |

`.env.example` lists these. All three must also be set in Netlify. `src/lib/supabase.js` throws at import time if a Supabase variable is missing, and Bible content fails to load without `BIBLE_API_KEY`. Never read or print `.env.local` values, and never use a Supabase `service_role` key in this app.

## Layout

```
src/app/                    Routes
  page.tsx                  Home: book list
  book/[bookId]/            Chapter list
  book/[bookId]/chapter/[chapterNumber]/   Chapter reader (server component, renders Chapter.tsx)
  search/  requests/  about/
  login/  reset-password/  update-password/
  api/bible/[...path]/      Server proxy to API.Bible with a path allowlist; holds the key
  layout.tsx                Providers: Theme > Auth > Chiasm, then header and Toaster
src/components/
  Chapter.tsx               Core reader (largest file): parses verse HTML, commentary panel,
                            chiasm highlights, ?verse= deep links, arrow-key navigation
  CommentaryForm.tsx        Create and edit commentary
  ChiasmForm.tsx            Create and edit chiasms
  ChiasmDetails.tsx         Chiasm side panel
  Header.tsx, HeaderWrapper.tsx   Nav, settings popover, chiasm toggle
  ui/                       shadcn primitives
src/contexts/               AuthContext (useAuth: user, loading, isAdmin), ChiasmContext (useChiasm, stored in sessionStorage)
src/lib/
  api.ts                    Data layer for API.Bible (bibleApi) and Supabase
  bible-config.ts           API.Bible URL and KJV Bible ID
  supabase.js               Supabase client singleton
  verse-parser.ts           Parses references such as "Genesis 1:1-3" into VerseReference
  chiasm-colors.ts          Rainbow colors by distance from the chiasm's center
supabase/migrations/        SQL for the chiasm tables only
CHIASM_SETUP.md             Chiasm feature notes
```

`src/components/ChapterContent.tsx`, `ChapterHandler.tsx`, and `SearchResults.tsx` appear to be unused. Confirm before editing them, and don't build on them.

## Data model

| Table | Columns the code uses | Schema in repo? |
| --- | --- | --- |
| `commentary` | `id`, `user_id`, `book`, `chapter`, `verse_range`, `commentary_author`, `commentary_text`, `created_at` | Base table no; `user_id` and policies yes |
| `commentary_requests` | `id`, `book`, `chapter`, `verse`, `status`, `created_at` | Base table no; policies yes |
| `profiles` | `id`, `email`, `username`, `updated_at` | Base table no; policies yes |
| `admins` | `user_id`, `created_at` | Yes |
| `chiasms` | `id`, `user_id`, `name`, `description`, `color_scheme`, timestamps | Yes |
| `chiasm_units` | `id`, `chiasm_id`, `unit_order`, `verse_references` (JSONB), `description`, timestamps | Yes |

- `book` holds the API.Bible book ID (such as `GEN`), not the display name.
- `verse_range` is a string: `"5"` or `"5-8"`. Use the existing range helpers in `Chapter.tsx`.
- `verse_references` may be one object or an array, so handle both, as `api.ts` does.
- Chiasm colors are derived from `unit_order`. Reordering units changes the structure.

### Identity and permissions

- `commentary.user_id` is the owner. `commentary_author` is only a display name. A `NULL` owner means the author has no account, so the row is admin-only.
- The `enforce_commentary_identity` trigger sets owner and author from the session, so don't rely on values submitted by the client. Admins can post on behalf of a named author, and the row links to that author's account if one exists.
- `public.admins` decides who is an admin, and `public.is_admin()` checks it in policies. It has no write policies, so manage it in the SQL editor.
- Usernames are unique and admin-managed. Users can read only their own profile, and a user without a username can't post commentary.
- Accounts are created by an admin; the app has no signup flow. Keep public signup disabled in Supabase Auth settings.

### Migrations

- The live schema is the source of truth for base tables not in the repo. Inspect it instead of guessing.
- Older migration filenames have no timestamp prefix, and the Supabase CLI only picks up `<timestamp>_name.sql`. Those were meant to be applied manually in the SQL editor, despite what `CHIASM_SETUP.md` suggests.
- Name new migrations `YYYYMMDDHHMMSS_description.sql`, make them idempotent where possible, and enable RLS with explicit policies on every new table.
- Never run schema changes or destructive SQL against the live database without explicit approval. There is no separate staging environment documented.

## Conventions

- **Data access:** add API.Bible and Supabase calls to `src/lib/api.ts`, not inline in components. Some older components still query directly; don't copy that. Use `bibleApi` for API.Bible, and add any new endpoint to the allowlist in the proxy route.
- **CDN caching:** Netlify's CDN ignores query strings on these responses. Never set a shared cache header on a response that depends on its query string.
- **Types:** export shared types from `api.ts` or `verse-parser.ts`. Avoid `any`.
- **Server vs client:** most UI is `"use client"` because auth and Supabase are browser-side. There is no server-side session, so server components can't see the current user.
- **Route params:** `params` is a Promise in Next 15, so `await` it in pages and route handlers.
- **Imports:** use the `@/` alias for `src/`.
- **UI:** reuse `src/components/ui` first. Add primitives with the shadcn CLI, and merge classes with `cn()`.
- **Styling:** use semantic tokens (`bg-background`, `text-muted-foreground`, `border-border`) from `globals.css` so dark mode works. Avoid fixed colors like `text-slate-400` or `bg-white` in new code; any exception needs a `dark:` variant.
- **Toasts:** use `useToast` from `@/hooks/use-toast`. Don't introduce `sonner` in new code.
- **Animation:** use `tailwindcss-animate` utilities (`animate-in`, `fade-in-0`), kept subtle, and respect reduced motion in new animations.
- **Errors:** show users a toast or inline message for failures, and log the detail with `console.error`. No debug `console.log` in new code.

## Accessibility and responsive

- Reading is the core experience, so it must work on phones and with a keyboard.
- Use real `button` and `a` elements with visible focus states. Give icon-only buttons an `aria-label`.
- Never convey meaning by color alone, and check contrast for chiasm highlights in both themes.
- The global arrow-key chapter navigation must keep ignoring form fields, contentEditable elements, and open panels. Keep that guard in `Chapter.tsx` up to date when adding dialogs or sheets.
- Keep `?verse=N` deep links working; search and requests pages depend on them.

## Security

- **RLS is the real access control.** Hiding UI doesn't protect anything because the anon key is public. Every permission must be enforced by a policy in the database, and `isAdmin` in the UI only decides what to show.
- Never base a policy on a value users can change, such as a display name.
- API.Bible keys must stay on the server. Browser code goes through `/api/bible`.
- Render commentary and other user content as text. Don't add `dangerouslySetInnerHTML` for it. The existing uses render search results that contain `<strong>` highlights from `highlightKeywords`, and API.Bible's chapter HTML is parsed in `Chapter.tsx`.
- Never add secrets to code, logs, docs, or commits. Anything prefixed `NEXT_PUBLIC_` ships to the browser.

## Known issues

Don't copy these patterns. Fix them only when asked or when working in that area, and mention them if they affect your task.

- **Old API.Bible key in git history:** treat any key found in history as compromised. It must never be reused.
- **Public `/api/bible` proxy:** it's limited to KJV reads and CDN-cached, but has no rate limit. Commentary requests also accept anonymous inserts without one, so spam is possible.
- **Dependency overrides:** `package.json` overrides the `postcss` bundled with `next` and the `minimatch` used by `@typescript-eslint/typescript-estree`, because neither has a patched release otherwise. Remove them once those packages ship fixes. `npm audit` should stay at 0.
- **Chiasm lookups:** `fetchChiasmsForChapter` and `fetchChiasmsForBook` load every chiasm and filter in the client, with one query per chiasm for units. Middle chapters of a multi-chapter range are missed, since only start and end chapters are matched.
- **`updateChiasm` isn't atomic:** it deletes then re-inserts units, and doesn't check the delete's error. A failed insert can lose units.
- **Docs drift:** `README.md` is mostly the create-next-app template.

## Git workflow

- `main` is the production branch. Don't commit to it directly.
- Branch as `feature/<name>`, `fix/<name>`, `update/<name>`, or `docs/<name>`, and merge through a PR to `main`.
- Write commit messages and PR titles as short imperative summaries, such as `Add dark mode toggle and load the Geist font`.
- Only commit, push, or open a PR when asked.
- Keep PRs focused, and list how the change was verified in the description.
- Don't commit `.env*.local`, `.next/`, `*.tsbuildinfo`, or `next-env.d.ts`.
