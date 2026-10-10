# FrameFlow

A responsive photography studio prototype built with React, TypeScript, Vite, React Router, Tailwind CSS, and Lucide icons.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create a production bundle, run `npm run build`. Preview it with `npm run preview`.

## Explore the complete workflow

The demo clock is **10 October 2026**, so the seeded studio always has upcoming shoots, overdue payments, and editing deadlines. The overview starts with **₹3,85,000 collected** and **₹1,25,000 pending**.

1. In Bookings, drag **Vignesh & Karthiga** from Awaiting Advance to Confirmed.
2. Open the booking and record the remaining **₹25,000**. The balance, milestones, and activity history update together.
3. Open Calendar. The wedding is reserved on **14 October, 07:00–15:00**.
4. Create another booking for that time to see the schedule conflict and the explicit override option.
5. Set the wedding to Shoot Completed. Its project automatically enters Editing.
6. Open the editing workspace. Complete Photo Selection, add a client request, and assign the highlight film to an editor.
7. Mark the project Ready for Delivery. Preview and confirm the client handoff.
8. Refresh any page to verify persistence.

Keyboard shortcuts: **Ctrl/Cmd + K** for universal search, **N** for a new booking, **Escape** to close dialogs. On a booking drag handle, use **Space**, **arrow keys**, and **Space** for keyboard movement.

Calendar supports month/week/day views, date-range and hourly-slot blocking, all-day blocks, weekly/monthly repeats, and conflict detection. On mobile, payments use cards with direct record-payment actions.

## Architecture

- `src/data/types.ts`: domain models.
- `src/data/seed.ts`: Indian photography studio sample data, using Vignesh & Karthiga throughout.
- `src/data/repository.ts`: localStorage adapter; replace with a Supabase/API adapter later.
- `src/data/store.tsx`: connected booking, payment, project, and activity updates.
- `src/components`: shared UI, accessible dialogs, action drawers, workflow widgets, and pointer/touch/keyboard drag-and-drop.
- `src/pages`: lazy-loaded product screens.
- `src/data/utils.ts`: currency formatting, demo date, and replaceable product brand.

No backend or authentication is required. Payment collection, WhatsApp sending, file hosting, and client gallery delivery are preview interactions. Download workspace data or payment reports from Settings and Payments. Reset the sample workspace through the confirmed reset action in Settings.

## Verification

```sh
npm run build
npx playwright install chromium
npm test
```

Playwright covers the complete booking-to-delivery journey, creation automation, conflicts, recurring availability, keyboard and pointer interactions, local persistence, and desktop/tablet/mobile layout checks. Audit screenshots are saved in `artifacts/`.
