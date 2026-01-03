# Agent Niuans - LLM Developer Guide

## Project Overview
**Agent Niuans** is a Marketing Automation Platform (SaaS) designed to centralize content creation and distribution. It allows users to manage Webflow CMS content, generate AI-driven posts, and publish directly to LinkedIn.

- **Core Function**: Create content once (AI-assisted), publish to Webflow (CMS), and distribute to LinkedIn.
- **Architecture**: Multi-tenant SaaS (Organizations > Users).
- **Current State**: Production-ready MVP with Webflow & LinkedIn integrations.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + Shadcn UI
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **AI**: Google Generative AI (Gemini Flash 1.5) via Vercel AI SDK
- **Integrations**:
    - **Webflow Data API**: CMS Collection management.
    - **LinkedIn API**: OAuth 2.0, Share on Profile/Organization.

## Design System (Aligned with Niuans.studio)
- **Aesthetic**: **Neo-Brutalist / Functional**. High contrast, clean lines, grid-based.
- **Font**: **Inter** (Google Fonts). Headings often uppercase/bold.
- **Color Palette**:
    - **Primary**: `#eb4f27` (Vibrant Orange). Used for accents, buttons, and decorative grid lines.
    - **Background**: `#ffffff` (Pure White).
    - **Text**: `#000000` (Pure Black).
    - **Grid/Borders**: Sharp lines (1px), often using the primary orange for emphasis or black for structure.
- **Shapes**: **Radius 0px**. Sharp corners on all elements (Buttons, Cards, Inputs).
- **Theme**: Light mode default (High Contrast). Dark mode supported via CSS variables.

## Project Structure
- `/src/app`: Next.js App Router pages.
  - `/auth`: Server Actions (`actions.ts` for Supabase).
  - `/linkedin`: LinkedIn OAuth callbacks and server actions (`actions.ts`).
  - `/posts`: Main Post Editor (`dynamic-post-editor.tsx`) and listing logic.
  - `/settings`: Organization and profile settings.
  - `/`: Protected Dashboard (Overview).
- `/src/components`:
  - `/linkedin`: LinkedIn specific components (`post-creator.tsx`, link preview cards).
  - `/ui`: Shadcn UI components (Customized for 0px radius).
- `/src/lib`: Core utilities (Webflow client, Types).
- `/src/utils/supabase`: Supabase clients (Client, Server, Middleware).

## Key Features & Workflows

### 1. Webflow CMS Integration
- **Dynamic Editor**: `DynamicPostEditor` fetches Webflow Collection Schema and generates a form.
- **Image Handling**: Images are staged in Supabase Storage then passed to Webflow.
- **Custom Domains**: Resolves `orgDomain` or `customDomains` to build correct canonical URLs for posts.

### 2. LinkedIn Publishing
- **Separate Workflow**: Post to Webflow first, then use the LinkedIn Dashboard to share.
- **Link Previews**: 
    - Fetches Open Graph (OG) images from the target URL server-side (`fetchOpenGraphImage`).
    - passing `thumbnailUrl` explicitly to LinkedIn API allows for custom image overrides.
- **Auth**: Handles LinkedIn OAuth tokens stored in `profiles` table.

### 3. AI Content Generator
- **Engine**: Gemini 1.5 Flash (Text) & **Gemini 2.5 Flash / Imagen 3** (Image).
- **Capabilities**:
    - **Magic Fill**: Generates titles, subtitles, and SEO keywords from minimal context.
    - **Visual Generation**: Creates on-brand images using `gemini-2.5-flash-image`.
    - **Alt Text**: Auto-generates accessibility descriptions for images.
    - **Field Mapping**: Automatically maps generated content to Webflow Schema fields (slugs).
    - **Smart Sync**: Normalized data flow ensures correct handling of complex objects (e.g. `{ url, alt }`) when pushing to Webflow API V2.

### 4. Dynamic Template Engine
- **Visual Designer**: A React-based drag-and-drop editor (`TemplateBuilder`) for creating Open Graph templates.
- **Rendering Engine**: Uses `satori` and `@vercel/og` to convert HTML/CSS templates into dynamic PNG images on the Edge.
- **Dynamic Binding**:
    - Layers can be bound to `variableId` (e.g., `title`, `authorAvatar`).
    - Engine resolves variables against content data at runtime.
- **Features**: Auto-fit text (heuristic-based), generic rotation, raw SVG rendering, and Z-index management.

### 5. Google Integration & Analytics
- **OAuth2 Flow**: Secure connection to Google via `googleapis` Auth. Handles token lifecycle and permission scopes.
- **Bento Grid Dashboard**:
    - **Visuals**: Modern, responsive grid layout using `recharts` for data visualization.
    - **Metrics**: Real-time fetching of GA4 (Active Users, New Users, Engagement Rate) and Search Console (Clicks, Impressions).
    - **PageSpeed**: Integration with PSI API for performance, SEO, and accessibility scores.
- **AI Reporting**:
    - **Intelligent Analysis**: Feeds fetched analytics data into Gemini to generate actionable insights and summary reports.
    - **Tooling**: Built with Shadcn UI Cards, Tabs, and custom Tooltips (`@radix-ui/react-tooltip`) for enhanced UX.

## Database Schema Highlights
- `profiles`: Linked to Supabase Auth, stores `linkedin_access_token`, `linkedin_urn`.
- `organizations`: Tenant management.
- `posts`: Local mirror of content items (Draft/Published status).
- `post_distributions`: Tracks where a post has been shared (LinkedIn, etc.).
- `image_templates`: Stores Open Graph image templates (JSON configuration, organization mapping, and metadata).
- `template-assets` (Storage): Public Supabase bucket for template-related assets like background images and icons.

## Development Guidelines
1.  **Server Actions**: Use `server-only` actions for all API integrations (Webflow, LinkedIn, AI).
2.  **Client Components**: Keep UI interactive (forms) in Client Components, but pass data via props/Server Actions.
3.  **Error Handling**: Surface errors via UI (toast/alert) but log detailed objects in server console.
