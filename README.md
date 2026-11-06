## Bible Commentary

<img width="1549" alt="commentary" src="https://github.com/user-attachments/assets/8b0f4d8f-bf28-442e-a330-b7f8150a1476" />

The web app syncs commentary from trusted community elders with specific verses throughout the Bible.

Readers browse the King James Bible by book, chapter, and verse, and can request commentary on a verse. Contributors write commentary and define chiasms, which appear as colored verse highlights.

## Stack

- Next.js App Router, React, TypeScript, and Tailwind CSS with shadcn/ui
- Supabase for the database and login
- [API.Bible](https://scripture.api.bible) for KJV text
- Netlify for hosting

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

`.env.example` lists the required settings. They're also needed in Netlify. Never commit real values, since this repo is public.

## Commands

```bash
npm run dev      # local server
npm run lint     # lint
npx tsc --noEmit # type check
npm run build    # production build
npm run backup   # save a local database backup to backups/
```

GitHub Actions runs lint, build, and the type check on every pull request.

## More

- [CLAUDE.md](CLAUDE.md): architecture, data model, conventions, security rules, and known issues
- [CHIASM_SETUP.md](CHIASM_SETUP.md): how chiasms work and how to enter them
