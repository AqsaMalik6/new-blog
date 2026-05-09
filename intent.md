# intent.md — AI Blog Generator SaaS Platform
## Master Project Intent Document

---

## 1. PROJECT OVERVIEW

**Project Name:** AI Blog Generator SaaS Platform  
**Type:** Multi-tenant B2B SaaS web application  
**Purpose:** Allow brands to sign up, log in, and generate fully SEO, AEO, and GEO optimised blog posts using a multi-agent AI pipeline. When a brand pastes a product/website URL, the system silently scrapes it and generates a professional blog tailored to rank on Google and appear in AI-generated answers.

---

## 2. THE PROBLEM THIS SOLVES

Brands struggle to produce blog content that:
- Ranks on Google (SEO — Search Engine Optimisation)
- Gets featured in direct answer boxes and voice search (AEO — Answer Engine Optimisation)
- Gets cited by AI tools like ChatGPT, Gemini, and Perplexity (GEO — Generative Engine Optimisation)

Existing tools like Jasper, Copy.ai, and Surfer SEO address one or two of these dimensions. None addresses all three simultaneously with a structured agent pipeline. This platform does all three in one generation run.

---

## 3. WHO WILL USE THIS

- **Primary users:** Brand marketing teams, content managers, e-commerce businesses, digital agencies
- **Usage pattern:** A brand signs up, enters a topic or pastes a product/website URL, and receives a complete, publish-ready blog post
- **Volume:** Dozens of brand clients at launch, scaling to hundreds
- **Access model:** Web-based SaaS — signup required, workspace locked behind authentication

---

## 4. CORE USER JOURNEY (Step by Step)

### Step 1 — Discovery
User lands on the Home/Marketing page and reads about the platform: what it does, how the agent pipeline works, what SEO/AEO/GEO means, and why this is better than competitors.

### Step 2 — Signup
Brand creates an account with email, password, and brand/company name. JWT token issued on success.

### Step 3 — Login
Returning brand logs in. JWT token stored in HTTP-only cookie. Redirected to Workspace.

### Step 4 — Workspace (Main Interface)
- User sees a Gemini-style chat interface
- User types a topic query OR pastes a product/website URL
- If URL is detected: backend silently scrapes the URL (title, price, description, image) in the background without showing a loading state to the user
- Agent pipeline runs: Orchestrator → URL Scraper Tool → Keyword Tool → SEO Agent → AEO Agent → GEO Agent → Blog Writer Agent → Guardrail Validator
- Finished blog is saved to PostgreSQL under the brand's account
- Blog appears instantly in the blog history panel

### Step 5 — Blog History
- User clicks "Blogs" in the workspace header
- Sees a grid of blog cards, each with: relevant AI-generated or scraped image, blog title, date, short excerpt
- Clicking a card opens the full blog detail page

### Step 6 — Blog Detail Page
- Full professional blog displayed with header image at top
- Blog is structured with: H1 title, intro paragraph, H2/H3 subheadings, FAQ section (for AEO), entity-rich conclusion (for GEO), meta description shown at bottom
- Blog is copy-paste ready for the brand to publish on their website

---

## 5. WHAT THE PLATFORM MUST DO — FEATURE LIST

### Authentication
- [ ] Signup with email + password + brand name
- [ ] Login with email + password
- [ ] JWT-based session management
- [ ] Protected routes (workspace only accessible when logged in)
- [ ] Logout

### Home/Marketing Page
- [ ] Hero section explaining the platform
- [ ] Section: What is SEO/AEO/GEO and why all three matter
- [ ] Section: How the agent pipeline works (visual flow)
- [ ] Section: Competitor comparison table (this platform vs Jasper, Copy.ai, Surfer SEO)
- [ ] Section: Pricing or CTA to signup
- [ ] Professional, modern UI — not generic

### Workspace
- [ ] Gemini-style text input at bottom of screen
- [ ] Send button triggers blog generation
- [ ] URL auto-detection in input
- [ ] Silent URL scraping when URL is detected (no visible loading for scrape step)
- [ ] Single loading indicator for full generation (spinner or progress bar)
- [ ] Blog history accessible from workspace header "Blogs" button
- [ ] Responsive layout

### Blog Generation (AI Agent Pipeline)
- [ ] Orchestrator agent routes the request
- [ ] URL Scraper Tool: fetches title, price, description, image from URL silently
- [ ] Keyword Research Tool: generates SEO keyword targets
- [ ] SEO Agent: structures the blog for Google ranking (title tag, meta, headings, keyword density, internal link placeholders)
- [ ] AEO Agent: adds FAQ schema section, direct-answer paragraphs, featured snippet bait
- [ ] GEO Agent: adds entity-rich language, source-authority signals, citation-friendly phrasing
- [ ] Blog Writer Agent: assembles the final full blog from all agent outputs
- [ ] Guardrail Validator: checks tone, length (minimum 1200 words), no hallucinated facts, SEO score passes threshold
- [ ] Gemini API (free tier) as primary LLM
- [ ] Groq API as automatic fallback when Gemini quota is exceeded
- [ ] All agent handoffs managed via OpenAI Agents SDK

### Blog Storage & Display
- [ ] Blogs saved to PostgreSQL with: id, brand_id, title, content, meta_description, image_url, created_at, keyword_targets, source_url (if URL was given)
- [ ] Blog history page: card grid with image, title, date, excerpt
- [ ] Blog detail page: full blog with header image, structured content
- [ ] Blogs scoped per brand (a brand can only see their own blogs)

---

## 6. WHAT THE PLATFORM MUST NOT DO

- Must NOT show raw scraped data to the user — scraping is silent and internal only
- Must NOT generate blogs under 1200 words — guardrail enforces this
- Must NOT allow one brand to see another brand's blogs
- Must NOT store API keys in frontend code — all LLM calls happen server-side only
- Must NOT break if Gemini quota is hit — Groq fallback is automatic and seamless
- Must NOT use placeholder/lorem ipsum in any UI — all copy must be real and meaningful
- Must NOT hallucinate product details — if URL scraping fails, agent must state it cannot verify details and generate from what is available

---

## 7. WHY THIS IS DIFFERENT FROM COMPETITORS

| Feature | This Platform | Jasper | Copy.ai | Surfer SEO |
|---|---|---|---|---|
| SEO Optimisation | ✅ Full | ✅ Partial | ✅ Partial | ✅ Full |
| AEO Optimisation | ✅ Full | ❌ | ❌ | ❌ |
| GEO Optimisation | ✅ Full | ❌ | ❌ | ❌ |
| URL → Blog Pipeline | ✅ Silent scrape | ❌ | ❌ | ❌ |
| Multi-Agent Pipeline | ✅ Yes | ❌ | ❌ | ❌ |
| Fallback LLM | ✅ Groq | ❌ | ❌ | ❌ |
| Brand-scoped history | ✅ Yes | ✅ Yes | ✅ Yes | ❌ |

---

## 8. SUCCESS CRITERIA

The project is complete and working when:
1. A brand can sign up, log in, and access the workspace
2. The brand can type a topic and receive a complete blog post (minimum 1200 words, SEO+AEO+GEO structured)
3. The brand can paste a product URL and receive a blog post that matches the product's details (title, price, description, image used)
4. All generated blogs are saved and visible in the brand's blog history
5. Each blog card opens a full detail page with header image
6. The Gemini → Groq fallback works automatically without user-visible errors
7. The home page clearly communicates the platform's value with professional UI
8. No brand can access another brand's data

---

## 9. CONSTRAINTS & NON-NEGOTIABLES

- **LLM calls must be server-side only** — no API keys in browser
- **Gemini free tier first, Groq fallback second** — this is cost strategy, not optional
- **OpenAI Agents SDK** is the agent framework — do not substitute with LangChain or LlamaIndex
- **PostgreSQL** is the only database — no SQLite, no MongoDB
- **Next.js (App Router)** for frontend — not Pages Router
- **FastAPI** for backend — not Django, not Flask
- **JWT authentication** — not session cookies, not OAuth (for v1)
- **Guardrails are mandatory** — no blog ships without passing the validator

---

## 10. HANDOFF NOTES FOR ANTIGRAVITY

- Read `spec.md` for the complete technical specification of every file, endpoint, and data model
- Read `skill-frontend.md` for all UI/UX rules, component patterns, and page-by-page build instructions
- Read `skill-backend.md` for FastAPI structure, database schema, auth logic, and all API endpoints
- Read `skill-agent.md` for the exact agent pipeline, tool definitions, prompt templates, guardrail logic, and Gemini/Groq fallback implementation
- Build in this order: **Backend → Agent Pipeline → Frontend**
- Do not skip the guardrail validator — it is not optional
- Every file in spec.md must exist in the final codebase
