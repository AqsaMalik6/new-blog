from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, blog

app = FastAPI(title="AI Blog Generator API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(blog.router)

@app.get("/")
async def root():
    return {
        "message": "AI Blog Generator API is running",
        "docs": "/docs",
        "health": "/health",
        "debug": "/debug-keys"
    }

@app.get("/debug-keys")
async def debug_keys():
    def mask(key: str):
        if not key or len(key) < 8: return "MISSING"
        return f"{key[:4]}...{key[-4:]}"
    
    return {
        "gemini": mask(settings.GEMINI_API_KEY),
        "groq": mask(settings.GROQ_API_KEY),
        "openai": mask(settings.OPENAI_API_KEY)
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
