import google.generativeai as genai
from groq import Groq
import openai
from app.config import settings
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def call_llm(prompt: str, system_prompt: str = "", max_tokens: int = 1000) -> str:
    """
    Unified LLM caller with multi-model fallback for Gemini, Groq, and OpenAI.
    """
    # 1. Try Gemini with multiple model names (Flash, Pro, 1.0)
    for model_name in ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro']:
        try:
            return await _call_gemini(prompt, system_prompt, max_tokens, model_name)
        except Exception as e:
            # Only log if it's not a 404 (which we expect for some models)
            if "404" not in str(e):
                logger.error(f"Gemini ({model_name}) failed: {str(e)}")
            else:
                logger.warning(f"Gemini model {model_name} not available in this region/account.")

    # 2. Try Groq (Latest Llama)
    try:
        return await _call_groq(prompt, system_prompt, max_tokens)
    except Exception as e:
        logger.error(f"Groq failed: {str(e)}")

    # 3. Try OpenAI (GPT-4o mini)
    try:
        return await _call_openai(prompt, system_prompt, max_tokens)
    except Exception as e:
        logger.error(f"OpenAI failed: {str(e)}")
            
    raise RuntimeError("CRITICAL: All AI models failed. Please check your API keys and balance at their respective consoles.")

async def _call_gemini(prompt: str, system_prompt: str, max_tokens: int, model_name: str) -> str:
    genai.configure(api_key=settings.GEMINI_API_KEY)
    # The SDK adds 'models/' automatically if missing
    model = genai.GenerativeModel(model_name)
    
    full_prompt = f"{system_prompt}\n\nUSER REQUEST: {prompt}" if system_prompt else prompt
    response = model.generate_content(
        full_prompt,
        generation_config=genai.types.GenerationConfig(
            max_output_tokens=max_tokens,
            temperature=0.7
        )
    )
    return response.text

async def _call_groq(prompt: str, system_prompt: str, max_tokens: int) -> str:
    client = Groq(api_key=settings.GROQ_API_KEY)
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7
    )
    return response.choices[0].message.content

async def _call_openai(prompt: str, system_prompt: str, max_tokens: int) -> str:
    client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.7
    )
    return response.choices[0].message.content
