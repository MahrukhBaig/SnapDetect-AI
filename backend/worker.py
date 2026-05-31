import os
import time
import logging
import json
import shutil
from typing import List
from database import (
    update_image_status,
    save_extracted_data,
    fail_image_process,
    update_batch_status
)
from vision import detect_product

# Set up logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("worker")

TEMP_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "temp_uploads")

def call_gemini_with_retry(image_bytes: bytes, max_retries: int = 3, initial_delay: float = 2.0) -> dict:
    """Calls the Gemini API to detect product packaging details, retrying with exponential backoff if it fails."""
    delay = initial_delay
    last_exception = None
    
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Calling Gemini API (Attempt {attempt}/{max_retries})...")
            result = detect_product(image_bytes)
            return result
        except Exception as e:
            last_exception = e
            logger.warning(f"Attempt {attempt} failed: {str(e)}")
            if attempt < max_retries:
                logger.info(f"Retrying in {delay} seconds...")
                time.sleep(delay)
                delay *= 2.0  # Double the wait time (exponential backoff)
                
    raise last_exception

def process_image(image_id: str, batch_id: str, file_path: str):
    """Processes a single image: updates state, reads file, calls Gemini, and saves results."""
    try:
        # 1. Update status to PROCESSING
        update_image_status(image_id, "PROCESSING")
        
        # 2. Read image bytes
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Image file not found on disk at {file_path}")
            
        with open(file_path, "rb") as f:
            image_bytes = f.read()
            
        # 3. Request Gemini extraction (with retries)
        extracted_data = call_gemini_with_retry(image_bytes)
        
        # 4. Save results to Database
        raw_json_str = json.dumps(extracted_data)
        save_extracted_data(image_id, batch_id, extracted_data, raw_json_str)
        logger.info(f"Successfully processed image {image_id} ({file_path})")
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to process image {image_id}: {error_msg}")
        # Mark as FAILED and increment progress so the batch can still complete
        fail_image_process(image_id, batch_id, error_msg)

def process_batch_async(batch_id: str, images_info: List[dict]):
    """
    Background worker loop that processes all images in a batch.
    
    images_info is a list of dicts: [{"id": "image_uuid", "file_path": "local_temp_path"}]
    """
    logger.info(f"Starting background processing for batch: {batch_id}")
    
    try:
        for img in images_info:
            image_id = img["id"]
            file_path = img["file_path"]
            
            logger.info(f"Processing image {image_id} from batch {batch_id}")
            process_image(image_id, batch_id, file_path)
            
            # Add a small throttle delay (1s) to be polite to the API rate limits
            time.sleep(1.0)
            
    except Exception as e:
        logger.error(f"Critical error in batch {batch_id} loop: {str(e)}")
        # Fail the entire batch if the main loop breaks
        update_batch_status(batch_id, "FAILED")
    finally:
        # Cleanup temporary files for this batch
        batch_temp_dir = os.path.join(TEMP_UPLOAD_DIR, batch_id)
        if os.path.exists(batch_temp_dir):
            try:
                shutil.rmtree(batch_temp_dir)
                logger.info(f"Cleaned up temporary upload directory for batch {batch_id}")
            except Exception as e:
                logger.error(f"Failed to delete temp dir {batch_temp_dir}: {str(e)}")
