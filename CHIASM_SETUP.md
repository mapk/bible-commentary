# Chiasm Feature Setup Guide

This guide will help you set up the chiastic structure feature in your Bible commentary app.

## Database Setup

### 1. Run the Migration

Execute the SQL migration file to create the necessary tables:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in your Supabase dashboard
# File: supabase/migrations/create_chiasms.sql
```

The migration creates:
- `chiasms` table - Stores chiasm metadata
- `chiasm_units` table - Stores individual units of each chiasm
- Row Level Security (RLS) policies for data access
- Indexes for performance

### 2. Verify Tables

After running the migration, verify the tables exist in your Supabase dashboard:
- Go to Table Editor
- You should see `chiasms` and `chiasm_units` tables

## Features Implemented

### Part 1: UI System for Creating Chiasms

✅ **Global Header Update**
- User's first name displayed as a clickable button
- Popover menu with "Create a Chiasm" option

✅ **Chiasm Creation UI**
- Modal form with:
  - Name field (required)
  - Description field (optional)
  - Dynamic unit list with drag-and-drop reordering
  - Verse reference input for each unit
  - Support for various reference formats:
    - Single verse: `Genesis 1:1`
    - Verse range: `Genesis 1:1-3`
    - Cross-book range: `Genesis 50:24 - Exodus 1:3`
    - Multiple discrete verses: `Genesis 1:1;1:3;1:7`

✅ **Save Behavior**
- Validates all verse references
- Converts references to structured format
- Saves to Supabase
- Shows success/error notifications

### Part 2: Presenting Chiasms

✅ **Toggle Button**
- "Show Chiasms" / "Hide Chiasms" toggle in header
- State persists per user session (sessionStorage)

✅ **Chapter List View**
- Shows sparkle icon (✨) next to chapters with chiasms
- Only visible when "Show Chiasms" is enabled

✅ **Chapter Reading View**
- Verses with chiasms highlighted with rainbow colors
- Colors follow symmetric pattern from center outward
- Multiple overlapping chiasms supported (shows count badge)

✅ **Side Panel for Chiasm Details**
- Opens when clicking a chiasm-highlighted verse
- Displays:
  - Chiasm name and description
  - Full chiastic structure with all units
  - Color-coded units with level indicators
  - Verse references for each unit

### Part 3: Supabase Schema

✅ **Tables Created**
- `chiasms`: Main chiasm records
- `chiasm_units`: Individual units with verse references

✅ **Security**
- Row Level Security (RLS) enabled
- Users can only create/edit/delete their own chiasms
- All users can read all chiasms (public viewing)

### Part 4: Implementation Details

✅ **Components Created**
- `ChiasmForm.tsx` - Modal for creating/editing chiasms
- `ChiasmDetails.tsx` - Side panel for viewing chiasm details
- `HeaderWrapper.tsx` - Wrapper managing chiasm state
- Updated `Header.tsx` - Added user profile popover and toggle
- Updated `Chapter.tsx` - Added chiasm highlighting
- Updated `ChapterList.tsx` - Added chiasm markers

✅ **Utilities Created**
- `verse-parser.ts` - Parses various verse reference formats
- `chiasm-colors.ts` - Generates rainbow colors for chiastic levels

✅ **API Functions**
- `createChiasm()` - Create new chiasm
- `fetchChiasms()` - Fetch all chiasms
- `fetchChiasmsForChapter()` - Fetch chiasms for specific chapter
- `fetchChiasmsForBook()` - Get chapters with chiasms for a book
- `updateChiasm()` - Update existing chiasm
- `deleteChiasm()` - Delete chiasm

## Usage

### Creating a Chiasm

1. Log in to your account
2. Click your name in the header (top right)
3. Click "Create a Chiasm"
4. Fill in the form:
   - Enter a name for the chiasm
   - (Optional) Add a description
   - Click "Add Unit" to add chiastic units
   - Enter verse references for each unit (e.g., "Genesis 1:1" or "Genesis 1:1-3")
   - Drag units to reorder them (important for chiastic structure)
5. Click "Save Chiasm"

### Viewing Chiasms

1. Toggle "Show Chiasms" in the header
2. Navigate to any book/chapter
3. Chapters with chiasms will show a sparkle icon (✨)
4. Verses that are part of chiasms will be highlighted with colors
5. Click a highlighted verse to see chiasm details

## Color Algorithm

The rainbow color algorithm generates colors based on distance from the center:
- **Center** (level 0): Red
- **Outward** (increasing levels): Orange → Yellow → Green → Blue → Indigo → Violet

Colors are automatically calculated based on the total number of units in the chiasm.

## Verse Reference Formats Supported

- Single verse: `Genesis 1:1`
- Verse range: `Genesis 1:1-3`
- Cross-chapter: `Genesis 1:1 - Genesis 2:3`
- Cross-book: `Genesis 50:24 - Exodus 1:3`
- Multiple discrete: `Genesis 1:1;1:3;1:7` (partial support)

## Notes

- Chiasms are public (all users can view them)
- Only the creator can edit/delete their chiasms
- The "Show Chiasms" toggle state persists during the browser session
- Multiple chiasms can overlap on the same verse (shows count badge)

## Troubleshooting

### Chiasms not showing
- Make sure "Show Chiasms" toggle is enabled
- Verify the migration ran successfully
- Check browser console for errors

### Verse references not parsing
- Ensure format matches supported patterns
- Book names should match Bible book names (case-insensitive)
- Check that the book exists in your Bible data

### Colors not appearing
- Verify chiasm has units with valid verse references
- Check that verses match the current chapter being viewed

