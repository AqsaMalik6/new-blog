# spec.md — Technical Specification
## AI Blog Generator SaaS Platform

---

## 1. TECH STACK (LOCKED — DO NOT CHANGE)

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | Next.js (App Router) | 14+ |
| Frontend Language | TypeScript | 5+ |
| Frontend Styling | Tailwind CSS | 3+ |
| Frontend UI Components | shadcn/ui | latest |
| Backend Framework | FastAPI | 0.110+ |
| Backend Language | Python | 3.11+ |
| Database | PostgreSQL | 15+ |
| ORM | SQLAlchemy (async) | 2.0+ |
| DB Migrations | Alembic | latest |
| Agent Framework | OpenAI Agents SDK | latest |
| Primary LLM | Google Gemini API (free tier) | gemini-1.5-flash |
| Fallback LLM | Groq API | llama3-70b-8192 |
| Authentication | JWT (python-jose) | latest |
| Password Hashing | bcrypt (passlib) | latest |
| URL Scraping | httpx + BeautifulSoup4 | latest |
| Image Handling | Pillow (optional for resize) | latest |
| CORS | FastAPI CORSMiddleware | built-in |
| Environment Config | python-dotenv | latest |

---

## 2. PROJECT FOLDER STRUCTURE

```
ai-blog-generator/
├── backend/
│   ├── main.py                        # FastAPI app entry point
│   ├── requirements.txt               # All Python dependencies
│   ├── .env                           # Environment variables (never commit)
│   ├── .env.example                   # Template for env vars
│   ├── alembic/                       # Database migrations
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial.py         # Initial schema migration
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py                  # Settings loader (reads .env)
│   │   ├── database.py                # Async SQLAlchemy engine + session
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                # Brand/User model
│   │   │   └── blog.py                # Blog post model
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                # Pydantic schemas for auth
│   │   │   └── blog.py                # Pydantic schemas for blog
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py                # /api/auth/* endpoints
│   │   │   └── blog.py                # /api/blog/* endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py        # JWT creation, verification, password hash
│   │   │   ├── scraper_service.py     # URL scraping logic
│   │   │   └── blog_service.py        # DB operations for blogs
│   │   └── agents/
│   │       ├── __init__.py
│   │       ├── orchestrator.py        # Master orchestrator agent
│   │       ├── seo_agent.py           # SEO strategy agent
│   │       ├── aeo_agent.py           # AEO strategy agent
│   │       ├── geo_agent.py           # GEO strategy agent
│   │       ├── writer_agent.py        # Blog writer agent
│   │       ├── guardrail.py           # Output validator
│   │       ├── tools/
│   │       │   ├── __init__.py
│   │       │   ├── scraper_tool.py    # URL scraper as agent tool
│   │       │   └── keyword_tool.py    # Keyword research tool
│   │       └── llm_client.py          # Gemini + Groq client with fallback
│
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── .env.local                     # NEXT_PUBLIC_API_URL only
│   ├── public/
│   │   └── logo.svg
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout with fonts + providers
│   │   │   ├── page.tsx               # Home/Marketing page (/)
│   │   │   ├── globals.css            # Tailwind base styles
│   │   │   ├── (auth)/
│   │   │   │   ├── signup/
│   │   │   │   │   └── page.tsx       # Signup page
│   │   │   │   └── login/
│   │   │   │       └── page.tsx       # Login page
│   │   │   └── workspace/
│   │   │       ├── layout.tsx         # Workspace layout (auth guard)
│   │   │       ├── page.tsx           # Main chat workspace
│   │   │       ├── blogs/
│   │   │       │   └── page.tsx       # Blog history cards
│   │   │       └── blogs/
│   │   │           └── [id]/
│   │   │               └── page.tsx   # Blog detail page
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn/ui components live here
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx         # Home page nav
│   │   │   │   └── WorkspaceHeader.tsx # Workspace top bar
│   │   │   ├── home/
│   │   │   │   ├── HeroSection.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── StrategySection.tsx # SEO/AEO/GEO explanation
│   │   │   │   ├── ComparisonTable.tsx
│   │   │   │   └── CTASection.tsx
│   │   │   ├── workspace/
│   │   │   │   ├── ChatInput.tsx      # Query input bar
│   │   │   │   ├── GeneratingState.tsx # Loading spinner during generation
│   │   │   │   └── BlogCard.tsx       # Card in history grid
│   │   │   └── blog/
│   │   │       └── BlogDetail.tsx     # Full blog renderer
│   │   ├── lib/
│   │   │   ├── api.ts                 # Axios/fetch wrapper for backend calls
│   │   │   └── auth.ts                # Token storage and auth helpers
│   │   ├── hooks/
│   │   │   ├── useAuth.ts             # Auth state hook
│   │   │   └── useBlogs.ts            # Blog fetch hooks
│   │   └── types/
│   │       ├── user.ts                # User/Brand TypeScript types
│   │       └── blog.ts                # Blog TypeScript types
```

---

## 3. DATABASE SCHEMA

### Table: `users`
```sql
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    brand_name  VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT TRUE
);
```

### Table: `blogs`
```sql
CREATE TABLE blogs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    content         TEXT NOT NULL,
    meta_description VARCHAR(160),
    image_url       TEXT,
    source_url      TEXT,
    keyword_targets JSONB,
    word_count      INTEGER,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_blogs_brand_id ON blogs(brand_id);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
```

---

## 4. ENVIRONMENT VARIABLES

### backend/.env
```
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/ai_blog_db
SECRET_KEY=your-very-long-random-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
GEMINI_API_KEY=your-gemini-api-key-here
GROQ_API_KEY=your-groq-api-key-here
ALLOWED_ORIGINS=http://localhost:3000
```

### frontend/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 5. API ENDPOINTS (FULL LIST)

### Auth Endpoints — `/api/auth`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/auth/signup` | Register new brand | No |
| POST | `/api/auth/login` | Login, returns JWT token | No |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Blog Endpoints — `/api/blog`

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| POST | `/api/blog/generate` | Generate a new blog | Yes |
| GET | `/api/blog/list` | List all blogs for current brand | Yes |
| GET | `/api/blog/{blog_id}` | Get single blog by ID | Yes |
| DELETE | `/api/blog/{blog_id}` | Delete a blog | Yes |

---

## 6. REQUEST / RESPONSE SCHEMAS

### POST /api/auth/signup
**Request:**
```json
{
  "email": "brand@company.com",
  "password": "securepassword123",
  "brand_name": "Acme Corp"
}
```
**Response (201):**
```json
{
  "id": "uuid",
  "email": "brand@company.com",
  "brand_name": "Acme Corp",
  "access_token": "jwt.token.here",
  "token_type": "bearer"
}
```

### POST /api/auth/login
**Request:**
```json
{
  "email": "brand@company.com",
  "password": "securepassword123"
}
```
**Response (200):**
```json
{
  "access_token": "jwt.token.here",
  "token_type": "bearer",
  "user": {
    "id": "uuid",
    "email": "brand@company.com",
    "brand_name": "Acme Corp"
  }
}
```

### POST /api/blog/generate
**Request:**
```json
{
  "query": "Write a blog about our new running shoes",
  "source_url": "https://example.com/product/running-shoes"
}
```
Note: `source_url` is optional. If omitted, agent generates from query alone.

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Blog Post Title Here",
  "content": "Full markdown blog content here...",
  "meta_description": "160 char meta description",
  "image_url": "https://scraped-or-generated-image-url",
  "source_url": "https://example.com/product/running-shoes",
  "keyword_targets": ["running shoes", "best running shoes 2024"],
  "word_count": 1450,
  "created_at": "2024-01-15T10:30:00Z"
}
```

### GET /api/blog/list
**Response (200):**
```json
{
  "blogs": [
    {
      "id": "uuid",
      "title": "Blog Title",
      "meta_description": "Short excerpt...",
      "image_url": "https://...",
      "word_count": 1450,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 12
}
```

### GET /api/blog/{blog_id}
**Response (200):**
```json
{
  "id": "uuid",
  "brand_id": "uuid",
  "title": "Full Blog Title",
  "content": "Full markdown content...",
  "meta_description": "160 chars",
  "image_url": "https://...",
  "source_url": "https://...",
  "keyword_targets": ["keyword1", "keyword2"],
  "word_count": 1450,
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

## 7. AUTHENTICATION FLOW

1. User submits signup/login form on frontend
2. Frontend calls `/api/auth/signup` or `/api/auth/login`
3. Backend returns JWT access token
4. Frontend stores token in `localStorage` under key `"blog_gen_token"`
5. Every subsequent API call includes header: `Authorization: Bearer <token>`
6. Backend verifies JWT on every protected endpoint using FastAPI dependency injection
7. If token invalid or expired → return 401 → frontend redirects to `/login`

---

## 8. URL DETECTION LOGIC (FRONTEND)

In `ChatInput.tsx`, before submitting:
```typescript
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;

const detectURL = (text: string): string | null => {
  const matches = text.match(URL_REGEX);
  return matches ? matches[0] : null;
};
```
If URL is found in query, it is passed as `source_url` in the generate request. The user never sees a separate "URL detected" message — it is handled silently.

---

## 9. BLOG CONTENT FORMAT

All generated blogs must follow this structure (in Markdown):

```markdown
# [SEO-optimised H1 Title]

**Meta Description:** [160-character meta description — shown on blog detail page]

**Target Keywords:** [comma-separated list]

---

## Introduction
[2-3 paragraph introduction. Must include primary keyword naturally in first 100 words.]

## [H2 Section — Main Topic]
[Detailed section — 200-300 words]

## [H2 Section — Supporting Point]
[Detailed section — 200-300 words]

## [H2 Section — Supporting Point]
[Detailed section — 200-300 words]

## [H2 Section — How to / Steps / Use Cases]
[Detailed section — 200-300 words]

## Frequently Asked Questions

**Q: [Question directly from search intent]?**
A: [Direct, concise answer — 2-3 sentences max. This is the AEO featured snippet target.]

**Q: [Question 2]?**
A: [Answer 2]

**Q: [Question 3]?**
A: [Answer 3]

**Q: [Question 4]?**
A: [Answer 4]

## Conclusion
[Summary paragraph. Entity-rich. Cites the brand/product by name. Includes a call-to-action.]

---
*This article was written to help [brand/product name] rank on Google and appear in AI-generated answers.*
```

**Minimum word count enforced by guardrail: 1200 words**

---

## 10. GUARDRAIL VALIDATION RULES

The guardrail runs after the Blog Writer Agent produces output. It checks:

1. **Word count** ≥ 1200 words → if fails, send back to Writer Agent with instruction to expand
2. **H1 present** — exactly one H1 tag in the content
3. **FAQ section present** — must contain "Frequently Asked Questions" heading
4. **Primary keyword in first 100 words** — checks first paragraph
5. **Meta description length** — between 120 and 160 characters
6. **No placeholder text** — content must not contain "lorem ipsum", "[INSERT", "TODO", "PLACEHOLDER"
7. **Conclusion present** — must contain a "Conclusion" or "Summary" heading

If any check fails: the guardrail returns a structured error with which checks failed, and the orchestrator re-runs the Writer Agent with corrective instructions (maximum 2 retries).

---

## 11. DEPENDENCIES LIST

### backend/requirements.txt
```
fastapi==0.110.0
uvicorn[standard]==0.27.0
sqlalchemy[asyncio]==2.0.25
asyncpg==0.29.0
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
httpx==0.26.0
beautifulsoup4==4.12.3
openai==1.12.0
google-generativeai==0.4.0
groq==0.4.1
python-dotenv==1.0.0
pydantic==2.6.0
pydantic-settings==2.1.0
Pillow==10.2.0
```

### frontend/package.json dependencies
```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3",
    "axios": "^1.6.0",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "lucide-react": "latest",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "sonner": "^1.0.0"
  }
}
```

---

## 12. BUILD & RUN INSTRUCTIONS

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in real values
alembic upgrade head            # Run database migrations
uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local   # Set NEXT_PUBLIC_API_URL
npm run dev                         # Runs on http://localhost:3000
```

### PostgreSQL Setup
```bash
createdb ai_blog_db
# Or via psql:
psql -U postgres -c "CREATE DATABASE ai_blog_db;"
```

---

## 13. ERROR HANDLING STANDARDS

| Scenario | HTTP Code | Response |
|---|---|---|
| Invalid credentials | 401 | `{"detail": "Invalid email or password"}` |
| Token expired | 401 | `{"detail": "Token expired. Please log in again."}` |
| Blog not found | 404 | `{"detail": "Blog not found"}` |
| Blog belongs to another user | 403 | `{"detail": "Access denied"}` |
| URL scraping failed | 200 (blog still generated) | Agent notes scraping failed in blog intro |
| Gemini quota exceeded | Transparent | Auto-switch to Groq, no error shown to user |
| Guardrail failed after 2 retries | 500 | `{"detail": "Blog generation failed quality check. Please try again."}` |
| Validation error (bad input) | 422 | FastAPI default validation error |

---

## 14. SECURITY REQUIREMENTS

- All passwords hashed with bcrypt (cost factor 12)
- JWT secret must be minimum 32 characters random string
- CORS restricted to frontend origin only (set in config.py)
- All LLM API keys stored in backend `.env` only — never in frontend
- SQL injection prevented by SQLAlchemy ORM (no raw queries)
- All blog endpoints verify brand_id matches JWT user_id before returning data
- Input query sanitised before passing to agents (strip HTML tags)
