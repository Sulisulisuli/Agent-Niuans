# Agent Niuans - LLM Developer Guide

## Project Overview
**Agent Niuans** is a Marketing Automation Platform (SaaS) designed to centralize content creation and distribution.
- **Core Function**: Create content once, distribute to Webflow (blog), LinkedIn, Instagram, etc.
- **Architecture**: Multi-tenant SaaS (Organizations > Users).

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Database/Auth**: Supabase (PostgreSQL + Auth)

## Design System (Aligned with Niuans.studio)
- **Aesthetic**: **Neo-Brutalist / Functional**. High contrast, clean lines, grid-based.
- **Font**: **Inter** (Google Fonts). Headings often uppercase/bold.
- **Color Palette**:
    - **Primary**: `#eb4f27` (Vibrant Orange). Used for accents, buttons, and decorative grid lines.
    - **Background**: `#ffffff` (Pure White).
    - **Text**: `#000000` (Pure Black).
    - **Grid/Borders**: Sharp lines, often using the primary orange for emphasis.
- **Shapes**: **Radius 0px**. Sharp corners on all elements (Buttons, Cards, Inputs).
- **Theme**: Light mode default (High Contrast). Dark mode supported via CSS variables.

## Project Structure
- `/src/app`: Next.js App Router pages.
  - `/auth`: Server Actions (`actions.ts`).
  - `/login`, `/signup`: Auth pages.
  - `/`: Protected Dashboard.
- `/src/components/ui`: Shadcn UI components (Customized for 0px radius).
- `/src/utils/supabase`: Supabase clients (Client, Server, Middleware).
- `/db`: SQL Schemas and migrations.

## Key Conventions
1. **Server Components**: Default. Use `'use client'` only when necessary.
2. **Supabase**: Access via `utils/supabase/server.ts` in Server Actions/Components.
3. **Styling**: Use Tailwind utility classes.
4. **Forms**: Use Server Actions for form handling.

## Database Schema Highlights
- `profiles`: Linked to Supabase Auth.
- `organizations`: Tenant management.
- `posts`: Content items (Draft/Published).
- `post_distributions`: Integration status tracking.
