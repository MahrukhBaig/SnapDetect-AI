import os
import shutil
import io
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from vision import detect_product
from database import create_batch, create_image_record, get_batch_status, get_batches_history
from worker import process_batch_async, TEMP_UPLOAD_DIR
from excel_generator import generate_excel_for_batch

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
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/")
def read_root():
    return {"status": "SnapDetect API is running"}

# Main endpoint — single image receive and process with 10/minute rate limiting
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
    return result

# Create Batch Endpoint — uploads multiple files and begins async background processing
@app.post("/batches")
async def create_upload_batch(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...)
):
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")
        
    # Limit to 100 images per batch for safety
    if len(files) > 100:
        raise HTTPException(status_code=400, detail="Cannot upload more than 100 images at once")

    # Validate file formats
    for file in files:
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} is not a valid image format"
            )
            
    # 1. Register the batch in database
    try:
        batch = create_batch(total_images=len(files))
        batch_id = batch["id"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    # 2. Save uploaded files locally and register them in DB
    batch_temp_dir = os.path.join(TEMP_UPLOAD_DIR, batch_id)
    os.makedirs(batch_temp_dir, exist_ok=True)
    
    images_info = []
    
    try:
        for file in files:
            file_path = os.path.join(batch_temp_dir, file.filename)
            
            # Write file in chunks to avoid memory spikes with large files
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
                
            image_record = create_image_record(batch_id=batch_id, filename=file.filename)
            images_info.append({
                "id": image_record["id"],
                "file_path": file_path
            })
            
    except Exception as e:
        # Cleanup temp directory if any write operations fail
        if os.path.exists(batch_temp_dir):
            shutil.rmtree(batch_temp_dir)
        raise HTTPException(status_code=500, detail=f"Failed to store uploads: {str(e)}")

    # 3. Schedule background worker to process Gemini calls
    background_tasks.add_task(process_batch_async, batch_id, images_info)
    
    return {
        "batch_id": batch_id,
        "total_images": len(files),
        "status": "PROCESSING"
    }

# Get Batch Status Endpoint
@app.get("/batches/{batch_id}/status")
def get_status(batch_id: str):
    try:
        return get_batch_status(batch_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

# Get Upload History Endpoint
@app.get("/batches")
def get_history():
    try:
        return get_batches_history()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Export Batch to Excel Endpoint
@app.get("/batches/{batch_id}/export")
def export_batch(batch_id: str):
    try:
        excel_data = generate_excel_for_batch(batch_id)
        return StreamingResponse(
            io.BytesIO(excel_data),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=snapdetect_batch_{batch_id}.xlsx"
            }
        )
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")