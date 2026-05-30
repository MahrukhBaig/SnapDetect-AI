from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from vision import detect_product

# Initialize SlowAPI Rate Limiter using client's IP address
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(title="SnapDetect AI API")

# Connect the limiter state and register the exception handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS setup — allow connections from local Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {"status": "SnapDetect API is running"}

# Main endpoint — image receive and process with 10/minute rate limiting
@app.post("/detect")
@limiter.limit("10/minute")
async def detect(request: Request, file: UploadFile = File(...)):
    
    # File validation
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed"
        )
    
    # File size check — 5MB limit
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="File size must be under 5MB"
        )
    
    # Send image bytes to Gemini API
    result = detect_product(contents)
    
    # Return the full structured product details dict
    return result