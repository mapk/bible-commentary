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
| Separate verses | `Genesis 1:1;1:3;1:7` or `Genesis 1:1; Exodus 2:3` |

Book names aren't case-sensitive. A part with no book name uses the book before it.

These don't work:

- `Genesis 1:5-4:2`, `Genesis 1:1,3`, and `Genesis 1:1;3` are rejected. If any part is invalid, the whole unit is marked invalid.
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
- **Verses missing from an older unit:** before this was fixed, `Genesis 1:1;1:3` saved only the first verse. Edit the unit and retype its references.
