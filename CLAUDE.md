# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server (http://localhost:3000)
- `npm run build` / `npm start` — production build / serve
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`); `npm run lint:fix` auto-fixes
- No test runner is configured yet.

## Stack

Next.js 16 (App Router, `src/` dir) + React 19, Tailwind CSS v4 (CSS-first config in `src/app/globals.css`, no tailwind config file), shadcn/ui (new-york style, neutral base; config in `components.json`), Clerk for auth, sonner for toasts. Path alias `@/*` → `src/*`.

Add UI primitives with `npx shadcn add <component>` into `src/components/ui/`; helpers like `cn` live in `src/lib/utils.ts`.

Prisma ORM 7 with Prisma Postgres (project `resonance`, db `resonance-db`; linked via `.prisma/local.json`). Schema in `prisma/schema.prisma` (models: `Voice` and `Generation`; migrations in `prisma/migrations/`, apply with `npx prisma migrate dev --name <name>`), config in `prisma.config.ts` (reads `DATABASE_URL`). Client is generated to `src/generated/prisma` (git-ignored; run `npx prisma generate` after schema changes) and used through the singleton in `src/lib/prisma.ts` with the `@prisma/adapter-pg` driver adapter. `@t3-oss/env-nextjs` is installed but env validation is not wired up yet.

Data model: `Voice` (`variant` SYSTEM/CUSTOM; `orgId` is null for system voices) has many `Generation`s (text-to-speech runs, always scoped by a required `orgId`). `Generation.voiceId` is optional with `onDelete: SetNull`, so deleting a voice keeps its generations (the `voiceName` snapshot is stored on each). Audio files are referenced by `r2ObjectKey` (Cloudflare R2). Filter queries by `orgId` for tenant isolation.

## Architecture

- **Next.js 16 uses `src/proxy.ts` instead of `middleware.ts`.** It exports a Clerk middleware that implements the auth/org gating for the whole app:
  1. `/sign-in(.*)` and `/sign-up(.*)` are public.
  2. Unauthenticated users are sent through `auth.protect()`.
  3. Authenticated users with no active Clerk organization (`orgId`) are redirected to `/org-selection`, so every other route can assume both `userId` and `orgId` exist (multi-tenant by organization).
- `src/app/layout.tsx` wraps everything in `ClerkProvider` and mounts the sonner `<Toaster />`.
- Auth pages use optional catch-all routes (`sign-in/[[...sign-in]]`, `sign-up/[[...sign-up]]`) for Clerk's embedded components; `/org-selection` renders Clerk's `OrganizationList` (personal accounts hidden) and returns to `/` after selection/creation.

## Environment

`.env` holds `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` (required for the app to run) plus `DATABASE_URL` (Prisma Postgres TCP URL).
