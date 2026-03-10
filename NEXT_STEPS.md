# Lift Aptitudes -- Next Steps Guide

## What's Been Completed

| Area | Status | Details |
|------|--------|---------|
| Project scaffold | Done | Next.js 16, TypeScript, Tailwind CSS v4, ESLint |
| Prisma schema | Done | 4 models, 3 enums, relations, unique constraints |
| Database migrations | Done | 2 migrations applied to Supabase PostgreSQL |
| Seed data | Done | 7 lifts, 14 CSVs parsed, 1,260 strength standard rows inserted |
| Generated Prisma client | Done | Output at `src/generated/prisma/` (gitignored, regenerated on build) |
| Folder structure | Done | `src/lib/`, `src/components/`, `src/types/`, `src/app/api/`, page routes |

## What's Empty / Remaining

| File or Area | Purpose |
|---|---|
| `src/lib/prisma.ts` | Prisma client singleton for the app runtime |
| `src/lib/supabase.ts` | Supabase browser + server clients |
| `src/lib/rep-max.ts` | 1RM estimation formula |
| `src/lib/rankings.ts` | Interpolation + percentile calculation |
| `src/types/index.ts` | Shared TypeScript types |
| `src/app/api/profile/` | User profile CRUD endpoints |
| `src/app/api/lifts/` | User lift entry CRUD endpoints |
| `src/app/api/rankings/` | Ranking calculation endpoint |
| `src/app/dashboard/` | Main body diagram page |
| `src/app/lifts/` | Lift entry form page |
| `src/app/profile/` | User profile page |
| `src/components/*.tsx` | All 5 component files (Navbar, BodyDiagram, MuscleGroup, LiftInput, RankBadge) |
| Auth pages | Login / signup pages don't exist yet |
| Auth middleware | Route protection doesn't exist yet |
| `src/app/layout.tsx` | Still has default Next.js boilerplate, needs customisation |
| `src/app/page.tsx` | Still has default Next.js landing page |

---

## Step 1: Environment Variables

Before writing any application code, you need to add Supabase credentials to your `.env` file.

### What to do

1. Go to your Supabase dashboard: **Settings > API**
2. Copy the **Project URL** and **Anon (public) Key**
3. Add them to your `.env` file alongside the existing `CONNECTION` variable:

```
CONNECTION=postgresql://...          (already exists)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

### Why the `NEXT_PUBLIC_` prefix

In Next.js, environment variables are server-only by default. The `NEXT_PUBLIC_` prefix exposes them to the browser. The Supabase URL and anon key are safe to expose -- they're public identifiers, not secrets. The anon key only allows operations that your Row Level Security policies permit (which we'll configure later).

---

## Step 2: Prisma Client Singleton (`src/lib/prisma.ts`)

### What this file does

Creates a single shared Prisma client instance for your entire application. Without this, every API route and server component would create its own database connection, exhausting the connection pool.

### How it works

- In production: creates one `PrismaClient` instance
- In development: stores the client on `globalThis` so hot module reloading doesn't create new connections on every file save
- Uses the same `pg` + `PrismaPg` adapter pattern as the seed script
- Reads the `CONNECTION` env variable for the database URL

### Key difference from the seed script

The seed script runs once and exits. This singleton persists for the lifetime of the app. It needs the `globalThis` pattern to survive Next.js dev mode hot reloads.

---

## Step 3: Supabase Client (`src/lib/supabase.ts`)

### What this file does

Sets up two Supabase client instances:

1. **Browser client** -- used in client components (`"use client"`) for login/signup UI flows. Created with `createBrowserClient()` from `@supabase/ssr`.
2. **Server client** -- used in server components, API routes, and middleware to read the authenticated user from cookies. Created with `createServerClient()` from `@supabase/ssr`.

### Dependencies

You may need to install `@supabase/ssr`:

```bash
npm install @supabase/ssr
```

This replaces the older `@supabase/auth-helpers-nextjs` (which you currently have installed). The `@supabase/ssr` package is the current recommended approach for Next.js App Router.

### What each client is used for

| Client | Where it runs | Used for |
|--------|--------------|----------|
| Browser client | Client components | `supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.signOut()`, listening to auth state changes |
| Server client | Server components, API routes, middleware | `supabase.auth.getUser()` to identify who is making the request, protecting routes |

### Important: You do NOT use Supabase for database queries

Prisma handles all database reads/writes. Supabase is only used for authentication (who is this user?). The `user_id` string returned by Supabase Auth is what links to `UserProfiles.user_id` and `UserLiftEntries.user_id` in your Prisma schema.

---

## Step 4: 1RM Estimation (`src/lib/rep-max.ts`)

### What this file does

A pure utility function that takes a weight and rep count and returns an estimated one-rep max (1RM) using the Epley formula:

```
1RM = weight × (1 + reps / 30)
```

### Edge cases to handle

- If `reps === 1`, the 1RM is just the weight itself (no estimation needed)
- If `reps === 0` or `weight <= 0`, return 0
- The formula becomes less accurate above ~10 reps. You could add a warning for high rep counts, but the formula still works as a rough estimate
- Consider also implementing the Brzycki formula as an alternative: `1RM = weight × (36 / (37 - reps))`. Some apps offer both and let the user choose

### This function is called

- By the lift entry form (client-side, for immediate feedback as the user types)
- By the API route when saving a lift entry (server-side, to store `estimated_1rm` in the database)

---

## Step 5: Ranking / Interpolation Logic (`src/lib/rankings.ts`)

### What this file does

The core algorithm of the app. Takes a user's estimated 1RM, bodyweight, gender, and lift ID, then:

1. Queries the `StrengthStandards` table for the two nearest bodyweight brackets
2. Interpolates between them for the user's exact bodyweight
3. Compares the user's 1RM against the interpolated thresholds
4. Returns a tier, percentile, and color

### Step-by-step logic

**A. Clamp the bodyweight**

If the user's bodyweight falls outside the data range, snap to the nearest boundary:
- Males: clamp to 50-140kg
- Females: clamp to 40-120kg

**B. Find the two nearest brackets**

For a user at 62.3kg:
- Lower bracket = 60kg (floor to nearest 5)
- Upper bracket = 65kg (ceil to nearest 5)
- If exactly on a bracket (e.g. 65.0kg), lower and upper are the same -- skip interpolation

**C. Query the database**

Fetch all `StrengthStandards` rows where:
- `lift_id` matches the requested lift
- `gender` matches the user
- `bodyweight` is either the lower or upper bracket value

This returns 10 rows (2 brackets × 5 experience levels) or 5 rows if exactly on a bracket.

**D. Interpolate each tier threshold**

For each experience level, calculate the interpolated standard:

```
ratio = (userWeight - lowerBracketWeight) / (upperBracketWeight - lowerBracketWeight)
interpolatedStandard = lowerStandard + ratio × (upperStandard - lowerStandard)
```

This gives you 5 interpolated thresholds:
```
BEGINNER:     36.12
NOVICE:       53.76
INTERMEDIATE: 75.22
ADVANCED:     99.22
ELITE:        127.14
```

**E. Determine the user's tier**

Compare the user's 1RM against the thresholds:
- Below BEGINNER threshold → BEGINNER tier (or "Untrained")
- Between BEGINNER and NOVICE → BEGINNER tier
- Between NOVICE and INTERMEDIATE → NOVICE tier
- And so on

**F. Calculate percentile within tier**

The tier boundaries map to percentile ranges:

| Tier | Percentile Range |
|------|-----------------|
| Below BEGINNER | 0-20 |
| BEGINNER | 20-40 |
| NOVICE | 40-60 |
| INTERMEDIATE | 60-80 |
| ADVANCED | 80-95 |
| ELITE | 95-100 |

Position within the tier gives a granular percentile:

```
position = (user1RM - currentTierThreshold) / (nextTierThreshold - currentTierThreshold)
percentile = tierPercentileStart + (position × tierPercentileWidth)
```

**G. Map to a color**

| Tier | Color | Hex |
|------|-------|-----|
| Below BEGINNER | Gray | `#9CA3AF` |
| BEGINNER | Red | `#EF4444` |
| NOVICE | Amber | `#F59E0B` |
| INTERMEDIATE | Green | `#22C55E` |
| ADVANCED | Purple | `#8B5CF6` |
| ELITE | Gold | `#EAB308` |

### Return value

```typescript
{
  tier: "INTERMEDIATE",
  percentile: 64,
  color: "#22C55E"
}
```

### This function is called

- By `api/rankings/` to return all muscle group rankings for a user
- By the dashboard page to color the body diagram

---

## Step 6: Shared Types (`src/types/index.ts`)

### What to define here

TypeScript types and interfaces that are used across multiple files. These are NOT the Prisma-generated types (those come from `src/generated/prisma/client`). These are app-specific shapes:

- `RankingResult` -- the return type of the ranking calculation (tier, percentile, color)
- `MuscleGroupRanking` -- a muscle group name mapped to its best ranking across related lifts
- `LiftEntryInput` -- the shape of data submitted from the lift entry form (weight, reps, lift_id)
- `UserProfileInput` -- the shape of data submitted from the profile form (bodyweight, gender, unit)

You can import Prisma's generated enums (`Gender`, `WeightUnit`, `ExperienceLevel`) directly from `../generated/prisma/client` and re-export or use them in these types.

---

## Step 7: Authentication

### Overview

Authentication is handled entirely by Supabase Auth. Your app never stores passwords. The flow is:

1. User signs up (email/password or OAuth like Google)
2. Supabase creates a user record in its internal `auth.users` table and returns a UUID
3. Your app creates a matching `UserProfiles` row with that UUID as `user_id`
4. On subsequent visits, the Supabase client reads the session cookie to identify the user

### Files to create

**A. Auth pages**

Create `src/app/login/page.tsx` and optionally `src/app/signup/page.tsx` (or combine them into one page with tabs). These are client components (`"use client"`) that:

- Render email + password input fields
- Call `supabase.auth.signInWithPassword()` or `supabase.auth.signUp()`
- Redirect to `/dashboard` on success
- Show error messages on failure

**B. Auth middleware**

Create `src/middleware.ts` (in the `src/` root, NOT inside `app/`). This is a Next.js middleware that:

- Runs on every request to protected routes (`/dashboard`, `/lifts`, `/profile`)
- Uses the Supabase server client to check if the user has a valid session
- Redirects unauthenticated users to `/login`
- Refreshes the session token if it's close to expiring

**C. Auth callback route**

Create `src/app/auth/callback/route.ts`. This handles the OAuth redirect after a user signs in with Google/GitHub. It exchanges the auth code for a session and redirects to `/dashboard`.

### First-time user flow

When a user signs up, Supabase Auth creates them, but your `UserProfiles` table is empty for that user. You need to handle profile creation:

- **Option A:** After signup, redirect to `/profile` where they fill in bodyweight, gender, etc. On submit, create the `UserProfiles` row.
- **Option B:** Auto-create a minimal profile on first login with defaults, let them edit later.

Option A is recommended -- it's cleaner and avoids storing incomplete data.

---

## Step 8: API Routes

### `src/app/api/profile/route.ts`

**GET** -- Fetch the current user's profile

1. Get the authenticated user from Supabase Auth (via the server client)
2. Query `prisma.userProfiles.findUnique({ where: { user_id } })`
3. Return the profile or 404 if not found

**POST** -- Create a profile (first time after signup)

1. Get the authenticated user
2. Validate the request body (bodyweight, gender, display_name, bodyweight_unit, experience_level)
3. Create via `prisma.userProfiles.create()`
4. Return the created profile

**PUT** -- Update the profile

1. Get the authenticated user
2. Validate the request body
3. Update via `prisma.userProfiles.update({ where: { user_id } })`
4. Return the updated profile

### `src/app/api/lifts/route.ts`

**GET** -- Fetch all of the current user's lift entries

1. Get the authenticated user
2. Query `prisma.userLiftEntries.findMany({ where: { user_id }, include: { lift: true } })`
3. Return the entries with lift info

**POST** -- Add a new lift entry

1. Get the authenticated user
2. Validate the request body (lift_id, weight, reps)
3. Calculate the estimated 1RM using the `rep-max.ts` formula
4. Create via `prisma.userLiftEntries.create()`
5. Return the created entry

**PUT** -- Update an existing lift entry

1. Get the authenticated user
2. Verify the entry belongs to this user
3. Recalculate 1RM if weight or reps changed
4. Update via `prisma.userLiftEntries.update()`

**DELETE** -- Remove a lift entry

1. Get the authenticated user
2. Verify the entry belongs to this user
3. Delete via `prisma.userLiftEntries.delete()`

### `src/app/api/rankings/route.ts`

**GET** -- Calculate rankings for all of the current user's lifts

1. Get the authenticated user
2. Fetch their profile (need bodyweight and gender)
3. Fetch their latest lift entry for each lift (or best 1RM per lift)
4. For each lift entry, call the `calculateRanking()` function from `rankings.ts`
5. Group results by muscle group (using the `muscle_group` and `secondary_muscles` from the Lifts table)
6. Return a map of muscle group → ranking result

The response shape would look like:

```json
{
  "Chest": { "tier": "INTERMEDIATE", "percentile": 64, "color": "#22C55E" },
  "Quads": { "tier": "ADVANCED", "percentile": 82, "color": "#8B5CF6" },
  "Back": { "tier": "NOVICE", "percentile": 45, "color": "#F59E0B" },
  ...
}
```

### Authentication on every API route

Every API route must:
1. Create a Supabase server client
2. Call `supabase.auth.getUser()` to get the authenticated user
3. If no user, return 401 Unauthorized
4. Use `user.id` as the `user_id` for all database queries

Never trust a `user_id` sent from the client. Always derive it from the auth session.

---

## Step 9: Layout and Navigation (`src/app/layout.tsx` + `Navbar.tsx`)

### Layout changes

The root layout needs to be updated from the default Next.js boilerplate:

- Change the page title and description to "Lift Aptitudes"
- The layout itself doesn't need an auth provider wrapping -- Supabase Auth works through cookies, not React context

### Navbar (`src/components/Navbar.tsx`)

A navigation bar that appears on all pages (rendered in the layout). It should include:

- App name / logo on the left
- Navigation links: Dashboard, My Lifts, Profile
- Auth state: Show "Login" if not authenticated, show user info + "Logout" if authenticated
- This is a client component (`"use client"`) because it needs to read auth state and handle logout

---

## Step 10: Profile Page (`src/app/profile/page.tsx`)

### What it does

A form where the user enters their physical stats:

- **Display name** (text input)
- **Gender** (select: Male / Female)
- **Bodyweight** (number input, allows decimals)
- **Weight unit** (select: Kilograms / Pounds)
- **Experience level** (select: Beginner through Elite) -- this is self-reported and informational, it does not affect rankings

### Behaviour

- On load: fetch the user's existing profile from `GET /api/profile`
- If no profile exists (first visit after signup): show empty form, submit creates a new profile via `POST /api/profile`
- If profile exists: pre-populate the form, submit updates via `PUT /api/profile`
- After successful save: show a success message or redirect to dashboard

### Unit conversion note

If the user selects Pounds, you need to convert their bodyweight to kilograms before querying strength standards (which are all stored in kg). The conversion happens in the API layer, not the frontend. Store the user's preferred unit so you can display values back in their chosen unit.

```
kg = lbs × 0.453592
lbs = kg × 2.20462
```

---

## Step 11: Lifts Page (`src/app/lifts/page.tsx`)

### What it does

A page where the user can enter their stats for each lift.

### Layout

- Show a list/grid of all available lifts (fetched from the `Lifts` table)
- Each lift shows: name, muscle group, whether it's compound
- Each lift has input fields for **weight** and **reps**
- As the user types, show the **estimated 1RM** calculated in real-time (client-side, using `rep-max.ts`)
- A save button per lift (or a save-all button)

### The `LiftInput` component (`src/components/LiftInput.tsx`)

A reusable component for a single lift entry. Props:

- Lift name, muscle group
- Current weight and reps (if they have an existing entry)
- onChange/onSave callbacks

Displays:
- Weight input (number, allows decimals)
- Reps input (number, integers only)
- Calculated 1RM (updated live as they type)
- Save button

### Saving

When the user saves a lift entry:
1. Client sends `POST /api/lifts` with `{ lift_id, weight, reps }`
2. API calculates the 1RM server-side and stores it
3. If an entry already exists for this user + lift, update it instead of creating a duplicate (or keep history -- design decision)

### Design decision: latest entry vs. history

- **Option A: One entry per lift** -- The user always updates their current stats. Simple. This is what most strength standards apps do.
- **Option B: Entry history** -- Keep every submission with a timestamp. Allows progress tracking over time. More complex but enables Phase 4 features (charts).

The current schema supports Option B (each entry has its own `id` and `created_at`). For the MVP, you could default to showing/editing only the most recent entry per lift, but keep the history in the database for future use.

---

## Step 12: Dashboard Page (`src/app/dashboard/page.tsx`)

### What it does

The main page of the app. Shows the user's body diagram with color-coded muscles based on their rankings.

### Data flow

1. Page loads (server component or client component with `useEffect`)
2. Fetch rankings from `GET /api/rankings`
3. Pass the muscle group → ranking map to the `BodyDiagram` component
4. Each muscle region on the SVG gets colored based on its ranking

### Components involved

**`BodyDiagram.tsx`** -- The main component. Renders front and back SVG views of a human body. Receives rankings data and passes the appropriate color to each muscle group.

**`MuscleGroup.tsx`** -- A single SVG `<path>` element representing one muscle group. Receives a fill color and handles hover/click interactions. On hover: show a tooltip with the muscle name, tier, percentile, and which lifts contribute to it.

**`RankBadge.tsx`** -- A small UI element that shows a tier label with its color. Used in tooltips and potentially in the lifts page to show the user's current tier per lift.

### The SVG body diagram

This is the most custom part of the project. You need SVG paths for each muscle group, viewed from front and back:

**Front view muscles:**
- Chest (left/right pec)
- Shoulders (front delts)
- Biceps (left/right)
- Quads (left/right)
- Core/Abs
- Calves (front, if applicable)

**Back view muscles:**
- Upper Back / Traps
- Lats
- Rear Delts
- Triceps (left/right)
- Hamstrings (left/right)
- Glutes
- Calves (rear)
- Lower Back

### Where to get the SVG

Options:
- **Find a free anatomical SVG online** and modify it to separate muscle groups into individual `<path>` elements with IDs you can target
- **Draw your own** in a tool like Figma or Inkscape -- simpler shapes are fine, it doesn't need to be photorealistic
- **Use a simplified/stylised body outline** and overlay colored regions for each muscle group

Each muscle group path needs a unique ID or class name that maps to your ranking data (e.g. `id="chest"`, `id="quads"`, `id="lats"`).

### Muscle group mapping

You need a mapping between your `Lifts` table's `muscle_group` / `secondary_muscles` values and the SVG region IDs:

```
"Chest"     → SVG region "chest"
"Quads"     → SVG region "quads"
"Back"      → SVG regions "upper-back", "lats"
"Shoulders" → SVG region "shoulders"
"Biceps"    → SVG region "biceps"
"Glutes"    → SVG region "glutes"
```

When a muscle group has multiple lifts targeting it (e.g. Chest has Bench Press as primary, Shoulder Press lists it as secondary), use the **best ranking** among them to color that region.

---

## Step 13: Landing Page (`src/app/page.tsx`)

### What it does

The public-facing page users see before logging in. Replace the default Next.js content with:

- App name and tagline (e.g. "See where you stack up")
- Brief explanation of what the app does
- A sample body diagram (static, with example colors) to show the concept
- "Get Started" / "Login" button that links to `/login`

This page should not require authentication.

---

## Step 14: Auth Middleware (`src/middleware.ts`)

### What it does

A Next.js middleware file that runs before every request. It:

1. Checks if the requested route is protected (`/dashboard`, `/lifts`, `/profile`)
2. If protected, verifies the user has a valid Supabase session
3. If not authenticated, redirects to `/login`
4. If authenticated, allows the request to proceed
5. Also refreshes the session cookie if it's near expiry

### Route configuration

Define which routes are public and which are protected:

```
Public:  /, /login, /signup, /auth/callback
Protected: /dashboard, /lifts, /profile, /api/*
```

---

## Build Order Summary

The implementation order matters because of dependencies. Here's the recommended sequence:

```
Step 1:  .env variables (SUPABASE_URL, SUPABASE_ANON_KEY)
Step 2:  src/lib/prisma.ts (Prisma singleton)
Step 3:  src/lib/supabase.ts (Supabase clients)
Step 4:  src/lib/rep-max.ts (1RM formula)
Step 5:  src/lib/rankings.ts (interpolation + percentile)
Step 6:  src/types/index.ts (shared types)
Step 7:  Auth pages + middleware (login, signup, callback, middleware.ts)
Step 8:  API routes (profile, lifts, rankings)
Step 9:  Layout + Navbar
Step 10: Profile page
Step 11: Lifts page + LiftInput component
Step 12: Dashboard page + BodyDiagram + MuscleGroup + RankBadge
Step 13: Landing page
Step 14: Middleware for route protection
```

Steps 2-6 are the foundation -- everything else depends on them.
Steps 7 + 14 (auth) block the API routes and protected pages.
Steps 8 (API routes) block the pages that consume them.
Steps 9-13 are the UI, built last because they depend on everything above.

---

## Testing Strategy

### Manual testing checkpoints

After each step, verify it works before moving on:

- **After Step 2:** Run `npx prisma studio` to confirm the Prisma singleton connects to the database
- **After Step 4:** Write a quick test in the browser console or a scratch file: `calculate1RM(100, 5)` should return `116.67`
- **After Step 7:** Sign up with a test email, verify the session persists across page reloads
- **After Step 8:** Use the browser dev tools Network tab or a tool like Postman/curl to hit the API routes
- **After Step 10:** Create a profile, refresh the page, confirm the data persists
- **After Step 11:** Enter lift stats, confirm they save and the 1RM calculation displays correctly
- **After Step 12:** Confirm the body diagram renders with correct colors based on your entered stats

### Running the dev server

```bash
npm run dev
```

Opens at `http://localhost:3000`. The page auto-reloads on file changes.

---

## Future Phases (Not Part of Current Build)

For reference, these are planned but should not be started until all of the above is complete:

- **Phase 2:** Full body SVG visualisation with interactive hover/click on muscles
- **Phase 3:** Expand from 7 lifts to 20+ lifts, add more CSVs and re-seed
- **Phase 4:** Progress tracking over time with charts (Recharts), public sharing of body diagram, dark mode, mobile responsiveness, kg/lb toggle in the UI
