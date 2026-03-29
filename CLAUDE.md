@AGENTS.md

# Rank — Codebase Guide for AI Assistants

## Overview

**Rank** is a mobile-first list-ranking app. Users authenticate via SMS OTP, create named/colored lists, add items, and rank them using a binary-search comparison UI. Ranked lists can be shared publicly via a token URL.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Firebase (Auth + Firestore) · Motion (animations) · Lucide React (icons)

---

## Project Structure

```
app/                    # Next.js App Router pages (all client-rendered)
  page.tsx              # Landing/splash page → redirects to /lists if authed
  layout.tsx            # Root layout (wraps app with AuthProvider)
  globals.css           # Tailwind imports + custom variants
  auth/page.tsx         # Phone + OTP authentication
  lists/page.tsx        # Dashboard: list of all user lists
  lists/[listId]/page.tsx           # List detail: items, ranking triggers, sharing
  lists/[listId]/rank/[itemId]/page.tsx  # Ranking comparison flow
  share/[shareToken]/page.tsx       # Public read-only list view

components/             # React components (all 'use client')
  AuthProvider.tsx      # Global auth context; exports useAuth()
  PhoneAuthForm.tsx     # Phone input + reCAPTCHA → sends OTP
  OtpForm.tsx           # 6-digit OTP input → verifies and signs in
  ListsDashboard.tsx    # Dashboard grid + create-list modal
  ListDetail.tsx        # Ranked/unranked item sections, drag-reorder, sharing
  AddItemForm.tsx       # Item name input with duplicate detection
  RankingFlow.tsx       # Binary search comparison UI
  ColorPicker.tsx       # 8-color grid selector
  PublicList.tsx        # Public share view

lib/
  firebase.ts           # Firebase SDK init; exports auth, db
  firestore.ts          # All Firestore operations (see below)
  types.ts              # Shared TypeScript types
```

---

## Routing Conventions

All pages use the **Next.js App Router**. Every page and component is client-side (`'use client'`). There are no Server Components, Server Actions, or API routes in this project.

Navigation uses `useRouter()` from `next/navigation` (not `next/router`).

---

## Data Model (Firestore)

```
users/{uid}
  phone: string
  createdAt: Timestamp

lists/{listId}
  ownerId: string
  title: string
  color?: ListColor          # 'red'|'orange'|'yellow'|'green'|'sky'|'violet'|'pink'|'white'
  shareToken: string         # UUID-derived hex string for public sharing
  rankedItems: string[]      # Ordered array of item IDs (index 0 = top-ranked)
  createdAt: Timestamp
  updatedAt: Timestamp

lists/{listId}/items/{itemId}
  name: string
  createdAt: Timestamp
```

All data is synced via `onSnapshot()` listeners — no polling. Items not in `rankedItems` are "unranked".

---

## Firestore Operations (`lib/firestore.ts`)

| Function | Description |
|---|---|
| `createUserDoc(uid, phone)` | Upsert user document on sign-in |
| `createList(ownerId, title, color?)` | Creates list, returns new listId |
| `updateListColor(listId, color)` | Updates list color |
| `addItem(listId, name)` | Adds item to subcollection, returns itemId |
| `deleteItem(listId, itemId)` | Deletes item doc + removes from rankedItems array |
| `setRankedItems(listId, rankedItems)` | Overwrites ranked order after ranking completes |
| `deleteList(listId)` | Deletes list document (items subcollection left; Firestore doesn't cascade) |
| `generateToken()` | Returns a 32-char hex string via `crypto.randomUUID()` |

---

## Authentication Flow

1. User submits phone number → `signInWithPhoneNumber()` with reCAPTCHA verifier
2. SMS OTP received → `confirmationResult.confirm(code)` signs user in
3. `createUserDoc()` called on first sign-in
4. `AuthProvider` listens to `onAuthStateChanged`; exposes `{ user, loading }` via `useAuth()`
5. Unauthenticated users are redirected to `/auth` by page-level guards

---

## Ranking Algorithm

`RankingFlow` uses **binary search insertion** (O(log n) comparisons):

- State managed via `useReducer` with actions: `CHOOSE_BETTER`, `CHOOSE_WORSE`, `SKIP`
- `lo`/`hi` pointers narrow the insertion window each comparison
- Pivot is always `Math.floor((lo + hi) / 2)` from the existing `rankedItems`
- `SKIP` picks a random pivot within the remaining range
- When `lo === hi`, the new item is inserted at index `lo` and `setRankedItems()` is called
- Progress is computed as `Math.log2(hi - lo + 1)` comparisons remaining

---

## Styling

- **Tailwind CSS v4** — uses `@import "tailwindcss"` syntax in `globals.css`
- Custom variant `pointer-hover` targets devices with fine pointers (hover-capable)
- Color themes: stone neutrals for backgrounds/text; accent colors follow `ListColor`
- Gradient backgrounds are derived from list color (e.g., `from-red-400 to-red-600`)
- Mobile-first: fixed FAB buttons on mobile, static layout on `sm:` and up
- Animations via **Motion** (`motion/react`) — not Framer Motion directly

---

## Key Conventions

1. **All components are client components** — every file starts with `'use client'`
2. **No server-side logic** — no `getServerSideProps`, API routes, or Server Actions
3. **Firebase is the backend** — Firestore for data, Firebase Auth for identity
4. **Real-time by default** — use `onSnapshot()` for live data; clean up listeners in `useEffect` returns
5. **TypeScript strict mode** — all new code must be properly typed; use types from `lib/types.ts`
6. **Path alias** — use `@/` to import from the project root (e.g., `@/lib/firestore`)
7. **No test framework** — no tests exist; ESLint (`npm run lint`) is the only automated check

---

## Environment Variables

Required in `.env.local` (all `NEXT_PUBLIC_` prefixed for client access):

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

---

## Development Commands

```bash
npm run dev    # Start dev server (http://localhost:3000)
npm run build  # Production build
npm run lint   # Run ESLint
```

---

## Things to Watch Out For

- `deleteList` does **not** delete the items subcollection. If this matters, you must batch-delete items first.
- `createList` and `addItem` do not `await` the `setDoc` call — they return the new ID immediately and let the write happen in the background.
- The `color` field on `ListDoc` is optional (`color?`) — default to `'white'` when absent.
- `rankedItems` stores item **IDs**, not names. Always resolve IDs against the items map before displaying.
- reCAPTCHA is initialized in `PhoneAuthForm` using a `RecaptchaVerifier` attached to a DOM element — don't remove that element.
