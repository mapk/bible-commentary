# Chiasms

A chiasm is a mirrored literary structure. In this app it's a named list of units, each pointing at one or more verses, and shown as colored highlights in the reader.

## Database setup

The tables are already live, so this only applies to a new database. Run these in the Supabase SQL editor, in order. The Supabase CLI won't pick them up, because their filenames have no timestamp.

1. `supabase/migrations/create_chiasms.sql`
2. `supabase/migrations/add_unit_description.sql`

This creates `chiasms` and `chiasm_units`, with row level security. Anyone can read chiasms. Only the creator can edit or delete one, and that includes admins.

## Creating a chiasm

1. Log in, click your name in the header, and choose **Create a Chiasm**.
2. Enter a name and, optionally, a description.
3. Click **Add Unit** for each unit and enter its verse references.
4. Drag units into order. The order sets the structure and the colors.
5. Click **Save Chiasm**.

To edit or delete a chiasm you created, click a highlighted verse and use the buttons in the side panel.

## Verse reference formats

| Format | Example |
| --- | --- |
| Single verse | `Genesis 1:1` |
| Verse range | `Genesis 1:1-3` |
| Across chapters | `Genesis 1:1 - Genesis 2:3` |
| Across books | `Genesis 50:24 - Exodus 1:3` |
| Separate verses | `Genesis 1:1; Genesis 1:3` |

Book names aren't case-sensitive.

These don't work:

- `Genesis 1:1;1:3;1:7` keeps only the first verse and drops the rest without warning. Repeat the book name for each verse.
- `Genesis 1:5-4:2` and `Genesis 1:1,3` are rejected.
- A range across books doesn't highlight chapters between its start and end, such as Exodus 1 in `Genesis 50:24 - Exodus 2:3`.

## Viewing chiasms

1. Open the settings popover in the header and turn on **Show Chiasms**. The setting lasts for the browser session.
2. In a book's chapter list, an icon marks chapters that have chiasms.
3. In a chapter, chiasm verses are highlighted. A badge shows the count when several chiasms overlap on a verse.
4. Click a highlighted verse to see the full structure in a side panel.

Colors come from each unit's distance from the center of the chiasm, starting at red in the center and moving through the rainbow to violet at the edges.

## Troubleshooting

- **No highlights:** check that **Show Chiasms** is on, and that the references match the current chapter.
- **Reference rejected:** use a format from the table above.
- **Verses missing from a saved unit:** check for the `Genesis 1:1;1:3` shorthand described above.
