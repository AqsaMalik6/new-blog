import httpx
from bs4 import BeautifulSoup
from typing import Optional
from dataclasses import dataclass

@dataclass
class ScrapedData:
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[str] = None
    image_url: Optional[str] = None
    raw_text: Optional[str] = None
    success: bool = False
    error: Optional[str] = None

async def scrape_url(url: str) -> ScrapedData:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
    except Exception as e:
        return ScrapedData(success=False, error=str(e))

    soup = BeautifulSoup(response.text, "html.parser")

    # Extract title
    title = None
    og_title = soup.find("meta", property="og:title")
    if og_title:
        title = og_title.get("content")
    elif soup.title:
        title = soup.title.string

    # Extract description
    description = None
    og_desc = soup.find("meta", property="og:description")
    if og_desc:
        description = og_desc.get("content")
    else:
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            description = meta_desc.get("content")

    # Extract price (common e-commerce patterns)
    price = None
    price_selectors = [
        soup.find("span", class_=lambda c: c and "price" in c.lower()),
        soup.find("div", class_=lambda c: c and "price" in c.lower()),
        soup.find(itemprop="price"),
    ]
    for el in price_selectors:
        if el and el.get_text(strip=True):
            price = el.get_text(strip=True)
            break

    # Extract image — try multiple strategies in order
    image_url = None

    # Strategy 1: og:image meta tag
    og_image = soup.find("meta", property="og:image")
    if og_image and og_image.get("content"):
        image_url = og_image.get("content")

    # Strategy 2: twitter:image meta tag
    if not image_url:
        tw_image = soup.find("meta", attrs={"name": "twitter:image"})
        if tw_image and tw_image.get("content"):
            image_url = tw_image.get("content")

    # Strategy 3: First large <img> tag in the page body (skip icons/logos)
    if not image_url:
        all_imgs = soup.find_all("img", src=True)
        for img in all_imgs:
            src = img.get("src", "")
            # Skip tiny icons, SVGs, base64, tracking pixels
            if any(skip in src for skip in ["icon", "logo", "svg", "pixel", "data:image", "1x1"]):
                continue
            # Must look like a real product image URL
            if src.startswith("http") and any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
                image_url = src
                break

    # Strategy 4: Shopify product image pattern (works for Sapphire and most Shopify stores)
    if not image_url:
        shopify_img = soup.find("img", class_=lambda c: c and any(
            kw in str(c).lower() for kw in ["product", "featured", "main", "hero"]
        ))
        if shopify_img and shopify_img.get("src"):
            src = shopify_img.get("src")
            if src.startswith("//"):
                src = "https:" + src
            image_url = src

    # Strategy 5: JSON-LD structured data (most reliable for e-commerce)
    if not image_url:
        import json
        json_ld_tags = soup.find_all("script", type="application/ld+json")
        for tag in json_ld_tags:
            try:
                data = json.loads(tag.string or "")
                # Handle both single object and list
                if isinstance(data, list):
                    data = data[0]
                if isinstance(data, dict):
                    img = data.get("image")
                    if isinstance(img, list) and img:
                        image_url = img[0] if isinstance(img[0], str) else img[0].get("url")
                    elif isinstance(img, str):
                        image_url = img
                    elif isinstance(img, dict):
                        image_url = img.get("url")
                if image_url:
                    break
            except Exception:
                continue

    # Fix protocol-relative URLs
    if image_url and image_url.startswith("//"):
        image_url = "https:" + image_url

    # Extract raw text for context (first 2000 chars of body text)
    body_text = soup.get_text(separator=" ", strip=True)[:2000]

    return ScrapedData(
        title=title,
        description=description,
        price=price,
        image_url=image_url,
        raw_text=body_text,
        success=True
    )
