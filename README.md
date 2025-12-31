# Agent Niuans

Agent Niuans is a powerful, AI-driven Marketing Automation Platform designed to streamline content creation and multi-channel distribution. It serves as a central hub where marketing teams can generate high-quality content using AI, manage their Webflow CMS, and publish directly to LinkedIn.

## 🚀 Features

### 🤖 AI Content Generation
- **Magic Fill**: One-click generation of post content (Title = Post), including rich text bodies and SEO keywords.
- **Visual AI**: Integrated Text-to-Image generation using **Google Imagen 3 (Gemini 2.5)**.
- **Context-Aware**: Inject knowledge from external URLs or raw text notes to guide the AI.
- **Auto-Formatting**: Automatically populates complex Webflow CMS schemas (Rich Text, Plain Text).

### 🌐 Webflow Integration
- **Seamless CMS Management**: Create and update CMS items directly from the dashboard.
- **Dynamic Schemas**: Automatically adapts to your Webflow Collection structure.
- **Media Handling**: Integrated image uploading and management.

### 💼 LinkedIn Publishing
- **Smart Sharing**: Share CMS posts, articles, or status updates.
- **Link Previews**: Automatic Open Graph image fetching for beautiful link cards.
- **Profile & Page Support**: Publish to your personal profile (Organization support coming soon).

### 🎨 Visual Template Designer
- **Drag & Drop Builder**: Intuitive visual editor for creating Open Graph image templates.
- **Dynamic Data Binding**: Link layers to live content (e.g., Post Title, Author Avatar) for automated generation.
- **Smart Tools**: Auto-fit text sizing, generic layer rotation, and shape tools.
- **SVG Support**: Paste raw SVG code directly for custom graphics and logos.
- **Template Management**: Create, save, and manage multiple reusable branded templates.

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React, Tailwind CSS v4, Shadcn UI.
- **Backend/Auth**: Supabase (PostgreSQL).
- **AI**: Google Generative AI SDK.
- **Styling**: "Neo-Brutalist" design system (High contrast, 0px radius, Orange/Black/White).

## ⚡ Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account
- Webflow Account (for API access)
- Google AI Studio Key (Gemini)
- LinkedIn Developer App (Client ID/Secret)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/agent-niuans.git
    cd agent-niuans
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory:
    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

    # Google AI
    GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

    # LinkedIn
    LINKEDIN_CLIENT_ID=your_linkedin_client_id
    LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
    LINKEDIN_REDIRECT_URI=http://localhost:3000/linkedin/callback

    # Webflow
    # (Tokens are usually managed per user in the DB, but system-wide tokens can go here if needed)
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  **Open the app:**
    Navigate to [http://localhost:3000](http://localhost:3000).

## 📄 License
[MIT](LICENSE)
