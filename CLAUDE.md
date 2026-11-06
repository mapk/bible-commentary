# CLAUDE.md

Project guide for Claude Code. Keep it current: if a change makes something here wrong, update this file in the same PR.

## Project

**Tолкование** ("commentary/interpretation") is a Bible reader that syncs commentary from trusted community elders to specific KJV verses. Readers browse books, chapters, and verses, and can request commentary on a verse. Logged-in contributors write commentary and define chiasms (chiastic literary structures), which appear as colored verse highlights.

- Repo: `mapk/bible-commentary` (**public**, so never commit secrets or private data)
- Hosting: Netlify, per the About page. The repo has no `netlify.toml`, so deploy settings live in the Netlify dashboard.
- The site name mixes a Latin `T` with Cyrillic `олкование`. Copy it exactly from `src/app/layout.tsx` rather than retyping it.

Treat this as religious community content. Don't rewrite, reword, or generate commentary or scripture text unless explicitly asked. Keep the KJV text as the API returns it, apart from existing cleanup such as `stripParagraphMarkers`.

## Stack

- Next.js 14.2 App Router, React 18, TypeScript (`strict`)
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

`npm run lint` currently reports one known warning, `react-hooks/exhaustive-deps` at `src/components/Chapter.tsx:400`. Don't add new ones.

## Environment

`.env.local` (gitignored) must define:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key, safe in the browser only because RLS protects the data |

`src/lib/supabase.js` throws at import time if either is missing, so they must also be set in Netlify. Never read or print `.env.local` values, and never use a Supabase `service_role` key in this app.

## Layout

```
src/app/                    Routes
  page.tsx                  Home: book list
  book/[bookId]/            Chapter list
  book/[bookId]/chapter/[chapterNumber]/   Chapter reader (server component, renders Chapter.tsx)
  search/  requests/  about/
  login/  reset-password/  update-password/
  layout.tsx                Providers: Theme > Auth > Chiasm, then header and Toaster
src/components/
  Chapter.tsx               Core reader (largest file): parses verse HTML, commentary panel,
                            chiasm highlights, ?verse= deep links, arrow-key navigation
  CommentaryForm.tsx        Create and edit commentary
  ChiasmForm.tsx            Create and edit chiasms
  ChiasmDetails.tsx         Chiasm side panel
  Header.tsx, HeaderWrapper.tsx   Nav, settings popover, chiasm toggle
  ui/                       shadcn primitives
src/contexts/               AuthContext (useAuth), ChiasmContext (useChiasm, stored in sessionStorage)
src/lib/
  api.ts                    Data layer for API.Bible and Supabase
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
| `commentary` | `id`, `book`, `chapter`, `verse_range`, `commentary_author`, `commentary_text`, `created_at` | No |
| `commentary_requests` | `id`, `book`, `chapter`, `verse`, `status`, `created_at` | No |
| `profiles` | `id`, `email`, `username`, `updated_at` | No |
| `chiasms` | `id`, `user_id`, `name`, `description`, `color_scheme`, timestamps | Yes |
| `chiasm_units` | `id`, `chiasm_id`, `unit_order`, `verse_references` (JSONB), `description`, timestamps | Yes |

- `book` holds the API.Bible book ID (such as `GEN`), not the display name.
- `verse_range` is a string: `"5"` or `"5-8"`. Use the existing range helpers in `Chapter.tsx`.
- `verse_references` may be one object or an array, so handle both, as `api.ts` does.
- Chiasm colors are derived from `unit_order`. Reordering units changes the structure.

### Migrations

- The live schema is the source of truth for tables not in the repo. Inspect it instead of guessing, and don't assume what their RLS policies allow.
- Migration filenames have no timestamp prefix, and the Supabase CLI only picks up `<timestamp>_name.sql`. Existing ones were meant to be applied manually in the SQL editor, despite what `CHIASM_SETUP.md` suggests.
- Name new migrations `YYYYMMDDHHMMSS_description.sql`, make them idempotent where possible, and enable RLS with explicit policies on every new table.
- Never run schema changes or destructive SQL against the live database without explicit approval. There is no separate staging environment documented.

## Conventions

- **Data access:** add API.Bible and Supabase calls to `src/lib/api.ts`, not inline in components. Some older components still query directly; don't copy that.
- **Types:** export shared types from `api.ts` or `verse-parser.ts`. Avoid `any`.
- **Server vs client:** most UI is `"use client"` because auth and Supabase are browser-side. There is no server-side session, so server components can't see the current user.
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

- **RLS is the real access control.** Hiding UI doesn't protect anything because the anon key is public. Every permission must be enforced by a policy in the database.
- Render commentary and other user content as text. Don't add `dangerouslySetInnerHTML` for it. The existing uses render search results that contain `<strong>` highlights from `highlightKeywords`, and API.Bible's chapter HTML is parsed in `Chapter.tsx`.
- Never add secrets to code, logs, docs, or commits. Anything prefixed `NEXT_PUBLIC_` ships to the browser.

## Known issues

Don't copy these patterns. Fix them only when asked or when working in that area, and mention them if they affect your task.

- **Exposed API.Bible key:** hardcoded in `src/lib/api.ts` and `src/app/requests/page.tsx`, and in git history. Moving it to `NEXT_PUBLIC_*` wouldn't help, because the browser calls API.Bible directly. The fix is to rotate the key and proxy the calls through a server route using a server-only variable.
- **Client-side authorization:** the super admin check compares a hardcoded email in `CommentaryForm.tsx`. Commentary edit and delete buttons appear when `profiles.username` equals the free-text `commentary_author`. Neither is a security boundary, and `commentary` has no owner ID column in the code's types.
- **No route guards:** there is no `middleware.ts`, so routes are public and gated only by conditional UI.
- **Chiasm lookups:** `fetchChiasmsForChapter` and `fetchChiasmsForBook` load every chiasm and filter in the client, with one query per chiasm for units. Middle chapters of a multi-chapter range are missed, since only start and end chapters are matched.
- **`updateChiasm` isn't atomic:** it deletes then re-inserts units, and doesn't check the delete's error. A failed insert can lose units.
- **Duplication:** the Bible ID is repeated across `api.ts` (the `BIBLE_ID` constant exists but isn't always used), and `requests/page.tsx` builds its own axios client.
- **Chapter page directive:** the page has a top-level `"use server"`, which isn't the correct directive for a server component page.
- **Docs drift:** `README.md` is mostly the create-next-app template.

## Git workflow

- `main` is the production branch. Don't commit to it directly.
- Branch as `feature/<name>`, `fix/<name>`, or `update/<name>`, and merge through a PR to `main`.
- Write commit messages and PR titles as short imperative summaries, such as `Add dark mode toggle and load the Geist font`.
- Only commit, push, or open a PR when asked.
- Keep PRs focused, and list how the change was verified in the description.
- Don't commit `.env*.local`, `.next/`, `*.tsbuildinfo`, or `next-env.d.ts`.
