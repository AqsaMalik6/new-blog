# skill-frontend.md — Frontend Build Instructions

## AI Blog Generator SaaS Platform

---

## OVERVIEW

Build the frontend using Next.js 14 App Router, TypeScript, Tailwind CSS, and shadcn/ui. Every page must have professional, production-grade UI. Do not use generic or template-looking designs. The workspace must feel like Gemini or Claude — clean, focused, dark-capable.

---

## STEP 1 — PROJECT INITIALISATION

```bash
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd frontend
npx shadcn-ui@latest init
npm install axios lucide-react react-markdown remark-gfm sonner clsx tailwind-merge
```

When shadcn asks for config: choose Default style, Slate base colour, CSS variables: yes.

---

## STEP 2 — GLOBAL CONFIGURATION

### src/app/globals.css

Set a dark, premium colour palette. Add these CSS variables:

```css
:root {
  --background: 0 0% 98%;
  --foreground: 222 47% 8%;
  --primary: 221 83% 53%;
  --primary-foreground: 0 0% 100%;
  --muted: 220 14% 94%;
  --muted-foreground: 220 9% 46%;
  --border: 220 13% 88%;
  --card: 0 0% 100%;
  --accent: 221 83% 97%;
}

.dark {
  --background: 222 47% 6%;
  --foreground: 210 40% 96%;
  --primary: 217 91% 60%;
  --muted: 217 33% 13%;
  --muted-foreground: 215 20% 60%;
  --border: 217 33% 18%;
  --card: 222 47% 9%;
}
```

### src/app/layout.tsx

- Import Inter font from next/font/google
- Add `<Toaster />` from sonner for toast notifications
- Wrap children in a ThemeProvider if dark mode toggle is desired (optional for v1)
- Set metadata: title "AI Blog Generator — SEO, AEO & GEO Optimised Blogs", description matching the platform

### tailwind.config.ts

- Extend theme with the CSS variables above
- Add animation for fadeIn, slideUp transitions
- Content paths must include `./src/**/*.{ts,tsx}`

---

## STEP 3 — TYPE DEFINITIONS

### src/types/user.ts

```typescript
export interface User {
  id: string;
  email: string;
  brand_name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignupPayload {
  email: string;
  password: string;
  brand_name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}
```

### src/types/blog.ts

```typescript
export interface Blog {
  id: string;
  brand_id: string;
  title: string;
  content: string;
  meta_description: string;
  image_url: string | null;
  source_url: string | null;
  keyword_targets: string[];
  word_count: number;
  created_at: string;
}

export interface BlogListItem {
  id: string;
  title: string;
  meta_description: string;
  image_url: string | null;
  word_count: number;
  created_at: string;
}

export interface GenerateRequest {
  query: string;
  source_url?: string;
}
```

---

## STEP 4 — API AND AUTH UTILITIES

### src/lib/api.ts

- Create an axios instance with `baseURL: process.env.NEXT_PUBLIC_API_URL`
- Add request interceptor: read token from localStorage key `"blog_gen_token"`, attach as `Authorization: Bearer <token>` header
- Add response interceptor: if status 401, clear token from localStorage and redirect to `/login`
- Export typed functions: `authAPI.signup()`, `authAPI.login()`, `authAPI.me()`, `blogAPI.generate()`, `blogAPI.list()`, `blogAPI.getById()`, `blogAPI.delete()`

### src/lib/auth.ts

```typescript
const TOKEN_KEY = "blog_gen_token";

export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);
export const isAuthenticated = () => !!getToken();
```

### src/hooks/useAuth.ts

- React hook that reads token on mount
- Exposes: `user`, `isLoading`, `login(payload)`, `signup(payload)`, `logout()`
- On logout: calls `removeToken()`, redirects to `/login`

### src/hooks/useBlogs.ts

- Exposes: `blogs`, `isLoading`, `fetchBlogs()`, `generateBlog(request)`, `getBlog(id)`

---

## STEP 5 — BUILD HOME/MARKETING PAGE (`src/app/page.tsx`)

This is the most important public-facing page. It must look like a funded startup's landing page — not a template.

### Components to build (in order, all in `src/components/home/`):

#### HeroSection.tsx

- Full viewport height section
- Background: dark gradient (deep navy to near-black) with subtle animated grid or dot pattern using CSS
- Large headline: "Write Blogs That Rank on Google, Answer Engines & AI Tools"
- Sub-headline: "The only blog generator powered by SEO, AEO, and GEO agents working together."
- Two buttons: "Start for Free" → `/signup`, "See How It Works" → scrolls to HowItWorks section
- Visual element on right: animated card showing a blog being "generated" with agent names appearing one by one (CSS animation, not video)
- Do NOT use stock photo backgrounds

#### StrategySection.tsx

- Section title: "Three Strategies. One Blog. Complete Visibility."
- Three cards side by side (or stacked on mobile):
  - **SEO Card** — icon: search, title: "Search Engine Optimisation", description: explains keyword targeting, meta tags, heading structure, how this helps rank on Google
  - **AEO Card** — icon: message-circle, title: "Answer Engine Optimisation", description: explains FAQ schema, featured snippets, direct answer targeting for Google's answer boxes and voice search
  - **GEO Card** — icon: bot, title: "Generative Engine Optimisation", description: explains entity-rich writing, citation signals, how to appear in ChatGPT, Gemini, Perplexity responses
- Cards have hover lift effect, accent border on top

#### HowItWorks.tsx

- Section title: "How It Works"
- Show a numbered step flow (horizontal on desktop, vertical on mobile):
  1. Enter your topic or paste a product URL
  2. Our agents scrape, research, and strategise
  3. SEO Agent structures for Google ranking
  4. AEO Agent adds FAQ and direct-answer content
  5. GEO Agent enriches for AI citation
  6. Writer Agent assembles the final blog
  7. Guardrail validates quality — blog delivered
- Each step has an icon, step number, title, and one-line description
- Use a connecting line between steps on desktop

#### ComparisonTable.tsx

- Section title: "Why Brands Choose Us Over the Rest"
- Table with columns: Feature | This Platform | Jasper | Copy.ai | Surfer SEO
- Rows: SEO Optimisation, AEO Optimisation, GEO Optimisation, URL-to-Blog Pipeline, Multi-Agent System, Auto Fallback LLM, Brand-Scoped History
- Checkmarks (green) and X marks (red/grey) in each cell
- This platform column should be highlighted with a primary colour background

#### CTASection.tsx

- Dark background section at bottom of page
- Headline: "Start generating blogs that actually rank."
- Sub-text: "No credit card required. Join brands already using AI-powered content."
- Single "Get Started Free" button → `/signup`

### Navbar.tsx (for home page)

- Fixed top, blurred background on scroll
- Left: Logo (SVG or text logo)
- Right: "Log In" link + "Get Started" button
- Mobile: hamburger menu with same links

### Assemble in `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main>
      <Navbar />
      <HeroSection />
      <StrategySection />
      <HowItWorks />
      <ComparisonTable />
      <CTASection />
    </main>
  );
}
```

---

## STEP 6 — BUILD AUTH PAGES

### src/app/(auth)/signup/page.tsx

- Centered card layout on a dark/gradient background (same palette as home)
- Logo at top of card
- Form fields: Brand Name, Email, Password (with show/hide toggle)
- "Create Account" submit button — shows loading spinner while submitting
- Link below: "Already have an account? Log in"
- On success: store token, redirect to `/workspace`
- On error: show toast notification with error message
- Form validation (client-side): all fields required, email must be valid format, password minimum 8 characters

### src/app/(auth)/login/page.tsx

- Same visual style as signup
- Form fields: Email, Password
- "Log In" submit button with loading state
- Link below: "Don't have an account? Sign up"
- On success: store token, redirect to `/workspace`
- On error: toast with "Invalid email or password"

---

## STEP 7 — BUILD WORKSPACE LAYOUT

### src/app/workspace/layout.tsx

- This layout wraps all workspace pages
- On mount: check `isAuthenticated()` — if false, redirect immediately to `/login`
- Render `WorkspaceHeader` at top
- Render children below

### WorkspaceHeader.tsx

- Fixed top bar for workspace pages
- Left: Logo/brand name
- Center (or right): Navigation links — "Workspace" (active), "Blogs"
- Right: Brand name display + "Log Out" button
- "Blogs" link navigates to `/workspace/blogs`
- Logout: clears token, redirects to `/login`

---

## STEP 8 — BUILD WORKSPACE CHAT PAGE

### src/app/workspace/page.tsx

This is the main interface. It must feel like Gemini or Claude's chat interface.

**Layout:**

- Full screen height minus header
- Vertically: top area = empty/message area, bottom = input bar
- On first load (no blogs yet): show a centred welcome message: "What would you like to write about today?" with three suggestion chips below (e.g., "Write about our new product", "Generate a blog from a URL", "Write an SEO blog about [topic]")
- After submission: show `GeneratingState` component (spinner + animated text: "Researching keywords...", "Building SEO structure...", "Optimising for AEO...", "Optimising for GEO...", "Writing your blog...")
- After generation completes: show a success message with a button "View Blog" that navigates to `/workspace/blogs/[id]`

### ChatInput.tsx

- Sticky to bottom of workspace
- Textarea (auto-expanding, max 4 lines) — NOT a single-line input
- Send button (icon button, right side of textarea)
- URL detection runs silently on submit — user does not see any indication
- Placeholder text: "Enter a topic, question, or paste a product URL..."
- Press Enter to submit (Shift+Enter for new line)
- Disable input and button while generating

### GeneratingState.tsx

- Centered in the message area
- Animated logo or spinner
- Rotating status messages (changes every 2 seconds): "Analysing your request...", "Researching keywords...", "Building SEO strategy...", "Optimising for answer engines...", "Preparing for AI citation...", "Writing your blog..."
- These are purely cosmetic — they rotate on a timer regardless of actual agent progress

---

## STEP 9 — BUILD BLOG HISTORY PAGE

### src/app/workspace/blogs/page.tsx

**Layout:**

- Page title: "Your Generated Blogs"
- Subtitle: "Click any blog to read the full version"
- Grid: 3 columns on desktop, 2 on tablet, 1 on mobile
- Empty state: if no blogs, show a centred message "No blogs yet. Go generate your first one." with a button to workspace

### BlogCard.tsx

- Card dimensions: fixed height ~320px
- Top 55% of card: image (from `image_url`, fallback to a gradient placeholder with the blog title initials if no image)
- Bottom 45%: blog title (max 2 lines, truncate), date (formatted: "Jan 15, 2024"), word count badge ("1,450 words")
- Hover: slight scale up (1.02), shadow deepens
- Clicking the card navigates to `/workspace/blogs/[id]`
- Image uses Next.js `<Image />` component with `object-cover` and `fill` layout

---

## STEP 10 — BUILD BLOG DETAIL PAGE

### src/app/workspace/blogs/[id]/page.tsx

**Layout (top to bottom):**

1. Back button: "← Back to Blogs" (navigates to `/workspace/blogs`)
2. Full-width header image (height: 400px on desktop, 250px on mobile) — from `image_url`, fallback gradient
3. Below image: Blog title (H1, large, bold)
4. Meta row: Published date | Word count | Source URL link (if present, "Source →" external link)
5. Meta description displayed in a subtle card/callout: "Meta Description: [text]"
6. Target keywords displayed as pill badges
7. Horizontal divider
8. Full blog content rendered as Markdown using `react-markdown` with `remark-gfm`
9. Markdown rendering styles:
   - h1: hidden (already shown above)
   - h2: large, bold, with top margin
   - h3: medium, bold
   - p: comfortable line height (1.8), readable font size (17-18px)
   - ul/ol: proper list styling
   - strong: bold
   - blockquote: styled with left border accent

---

## STEP 11 — RESPONSIVE DESIGN RULES

- Mobile breakpoint: < 768px
- Tablet breakpoint: 768px – 1024px
- Desktop: > 1024px
- All pages must be fully functional on mobile
- Touch targets minimum 44px
- No horizontal scroll on any viewport
- Navbar collapses to hamburger on mobile
- Workspace input bar takes full width on mobile

---

## STEP 12 — TOAST NOTIFICATIONS

Use `sonner` for all toast notifications:

- Success: green — "Blog generated successfully!"
- Error: red — specific error message from API
- Info: neutral — "Logging you out..."

Import `<Toaster />` in root layout. Call `toast.success()`, `toast.error()` from components.

---

## STEP 13 — LOADING STATES

Every async action must have a loading state:

- Signup/Login buttons: show spinner, disable button, change text to "Creating account..." or "Logging in..."
- Blog generation: show `GeneratingState` component with rotating messages
- Blog list: show skeleton card placeholders (3 skeleton cards in grid)
- Blog detail: show skeleton for image + content while fetching

---

## STEP 14 — QUALITY CHECKLIST (DO BEFORE HANDOFF)

- [ ] All pages load without console errors
- [ ] All TypeScript types are strict (no `any`)
- [ ] All forms have validation
- [ ] All loading states implemented
- [ ] Token is cleared on 401 response
- [ ] Unauthenticated users cannot reach /workspace (redirect to login)
- [ ] Blogs list is empty-state handled
- [ ] Images all have fallbacks
- [ ] All links work
- [ ] Mobile layout tested at 375px width
- [ ] No hardcoded API URLs (use env var)
- [ ] No console.log statements in production code
