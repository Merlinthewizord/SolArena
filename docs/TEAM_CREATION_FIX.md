# Team Creation Fix

## Problem
The `teams` table had a `NOT NULL` constraint on the `team_mint` column, which prevented creating draft teams before token launch.

## Root Cause
Original schema in `scripts/004_create_teams_tables.sql` defined:
```sql
team_mint TEXT UNIQUE NOT NULL, -- SPL token mint address
```

This made it impossible to create teams without immediately launching a token.

## Solution
Created migration `scripts/012_make_team_mint_nullable.sql` to:
1. Remove the `NOT NULL` constraint from `team_mint`
2. Allow teams to be created as drafts first
3. Token launch happens later via the server-side API

## New Flow
1. **Create Draft Team** (`/teams` page)
   - User fills out team info (name, symbol, description, logo)
   - Team is saved to database with `status: "draft"` and `team_mint: null`
   - No blockchain transaction required yet

2. **Launch Token** (`/teams/[id]` page)
   - User clicks "Launch Team Token" on the team detail page
   - Server-side API at `/api/teams/[teamId]/launch` handles:
     - Uploads logo to Supabase Storage
     - Creates metadata JSON
     - Creates SPL token with Meteora DBC
     - Updates team record with `team_mint`, `bonding_curve_address`, `launch_tx`
     - Sets `status: "active"`

## Migration Instructions
Run the migration script to apply the fix:
```bash
# The migration script will be automatically executed when viewing the app
# Or manually run it in your Supabase SQL editor
```

## Files Changed
- `scripts/012_make_team_mint_nullable.sql` - Migration to fix schema
- `app/teams/page.tsx` - Already correctly creates draft teams
- `app/api/teams/[teamId]/launch/route.ts` - Server-side token launch
- `app/teams/[id]/page.tsx` - UI for launching tokens

## Benefits
- Separates team creation from token launch
- Better UX: users can create team info first, launch token later
- No wasted transactions if users change their mind
- Follows Meteora Invent fun-launch scaffold pattern
