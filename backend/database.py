import os
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

_client = None

def get_supabase_client() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise Exception("SUPABASE_URL and SUPABASE_KEY environment variables are not set in the .env file")
        _client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _client

def create_batch(total_images: int, user_id: str = None) -> dict:
    """Creates a new upload batch session."""
    client = get_supabase_client()
    data = {
        "total_images": total_images,
        "processed_images": 0,
        "status": "PROCESSING",
    }
    if user_id:
        data["user_id"] = user_id

    response = client.table("batches").insert(data).execute()
    if not response.data:
        raise Exception(f"Failed to create batch: {response}")
    return response.data[0]

def create_image_record(batch_id: str, filename: str, image_url: str = None) -> dict:
    """Creates a record for a single image file within a batch."""
    client = get_supabase_client()
    data = {
        "batch_id": batch_id,
        "filename": filename,
        "status": "PENDING",
    }
    if image_url:
        data["image_url"] = image_url

    response = client.table("extracted_images").insert(data).execute()
    if not response.data:
        raise Exception(f"Failed to create image record: {response}")
    return response.data[0]

def update_image_status(image_id: str, status: str, error_message: str = None) -> dict:
    """Updates the status and optional error message of an image extraction process."""
    client = get_supabase_client()
    data = {
        "status": status,
    }
    if status in ["COMPLETED", "FAILED"]:
        data["processed_at"] = datetime.now(timezone.utc).isoformat()
    if error_message:
        data["error_message"] = error_message

    response = client.table("extracted_images").update(data).eq("id", image_id).execute()
    if not response.data:
        raise Exception(f"Failed to update image status: {response}")
    return response.data[0]

def save_extracted_data(image_id: str, batch_id: str, data: dict, raw_json: str) -> dict:
    """Saves the Gemini extraction results and updates the image status to COMPLETED."""
    client = get_supabase_client()
    
    # 1. Insert structured extraction details
    extracted_data = {
        "image_id": image_id,
        "product_name": data.get("product_name"),
        "brand": data.get("brand"),
        "flavour": data.get("flavour"),
        "net_weight": data.get("net_weight"),
        "product_type": data.get("product_type"),
        "barcode": data.get("barcode"),
        "ingredients": data.get("ingredients"),
        "expiry_date": data.get("expiry_date"),
        "raw_json": raw_json
    }
    data_response = client.table("extracted_data").insert(extracted_data).execute()
    if not data_response.data:
        raise Exception(f"Failed to insert extracted data: {data_response}")

    # 2. Update image record to COMPLETED
    update_image_status(image_id, "COMPLETED")

    # 3. Increment processed images count in batch
    increment_batch_progress(batch_id)

    return data_response.data[0]

def increment_batch_progress(batch_id: str) -> dict:
    """Increments the count of processed images for a batch, updating batch status if done."""
    client = get_supabase_client()
    
    # Fetch current batch details
    batch_response = client.table("batches").select("*").eq("id", batch_id).execute()
    if not batch_response.data:
        raise Exception(f"Batch {batch_id} not found")
    
    batch = batch_response.data[0]
    new_processed = batch["processed_images"] + 1
    
    data = {
        "processed_images": new_processed
    }
    
    # If all images have been processed (or failed), update status to COMPLETED
    if new_processed >= batch["total_images"]:
        data["status"] = "COMPLETED"
        data["completed_at"] = datetime.now(timezone.utc).isoformat()
        
    response = client.table("batches").update(data).eq("id", batch_id).execute()
    return response.data[0]

def fail_image_process(image_id: str, batch_id: str, error_message: str) -> None:
    """Marks an image as FAILED and increments batch progress so processing doesn't stall."""
    update_image_status(image_id, "FAILED", error_message)
    increment_batch_progress(batch_id)

def get_batch_status(batch_id: str) -> dict:
    """Retrieves progress stats for a batch, including all individual image statuses."""
    client = get_supabase_client()
    
    # Fetch batch header
    batch_response = client.table("batches").select("*").eq("id", batch_id).execute()
    if not batch_response.data:
        raise Exception(f"Batch {batch_id} not found")
        
    # Fetch images list
    images_response = client.table("extracted_images").select("id, filename, status, error_message, processed_at").eq("batch_id", batch_id).execute()
    
    batch = batch_response.data[0]
    images = images_response.data or []
    
    # Count specific states
    completed_count = sum(1 for img in images if img["status"] == "COMPLETED")
    failed_count = sum(1 for img in images if img["status"] == "FAILED")
    
    return {
        "id": batch["id"],
        "status": batch["status"],
        "total_images": batch["total_images"],
        "processed_images": batch["processed_images"],
        "completed_images": completed_count,
        "failed_images": failed_count,
        "created_at": batch["created_at"],
        "completed_at": batch["completed_at"],
        "images": images
    }

def get_batch_records_for_export(batch_id: str) -> list:
    """Fetches all records for a batch along with their extracted data for spreadsheet export."""
    client = get_supabase_client()
    
    # Perform inner/left join using Supabase query format
    response = client.table("extracted_images").select(
        "filename, status, error_message, processed_at, extracted_data(product_name, brand, flavour, net_weight, product_type, barcode, ingredients, expiry_date)"
    ).eq("batch_id", batch_id).execute()
    
    return response.data or []

def get_batches_history() -> list:
    """Fetches all previous batches, sorted by creation date descending."""
    client = get_supabase_client()
    response = client.table("batches").select("*").order("created_at", desc=True).execute()
    return response.data or []
