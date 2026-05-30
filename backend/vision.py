import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel

load_dotenv()

# Define Pydantic model for structured Gemini responses
class ProductDetails(BaseModel):
    product_name: str
    brand: str
    flavour: str
    net_weight: str
    product_type: str

def get_gemini_client():
    # The SDK automatically reads GEMINI_API_KEY from environment variables,
    # but we check explicitly to give a developer-friendly error.
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise Exception("GEMINI_API_KEY not found in .env file")
    return genai.Client()

def detect_product(image_bytes: bytes) -> dict:
    """
    Sends the image bytes to Gemini 2.5 Flash model and requests
    structured JSON output conforming to the ProductDetails schema.
    """
    try:
        client = get_gemini_client()
        
        # Prepare the image as part of contents
        image_part = types.Part.from_bytes(
            data=image_bytes,
            mime_type="image/jpeg",
        )
        
        prompt = (
            "Analyze this product packaging image. Extract the following details:\n"
            "1. product_name: The standard title of the product (e.g., 'Coca-Cola Zero Sugar', 'Lays Classic Salted').\n"
            "2. brand: The brand name (e.g., 'Coca-Cola', 'Lays', 'Oreo'). If not detected, return 'Not detected'.\n"
            "3. flavour: The flavour of the product if specified (e.g., 'Masala', 'Chocolate', 'Original'). If not detected, return 'Not detected'.\n"
            "4. net_weight: The net content weight or volume (e.g., '50g', '1.5L', '250ml'). If not detected, return 'Not detected'.\n"
            "5. product_type: The general category (e.g., 'Chips', 'Soda', 'Biscuits', 'Shampoo'). If not detected, return 'Not detected'."
        )

        # Generate content with structured JSON configuration
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[image_part, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ProductDetails,
            ),
        )
        
        # Since response_schema is defined, response.text is guaranteed to be a valid JSON string matching the schema.
        import json
        return json.loads(response.text)
        
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")