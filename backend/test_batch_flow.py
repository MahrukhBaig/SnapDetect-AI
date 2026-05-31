import requests
import time
import os

BASE_URL = "http://localhost:8000"

def run_test():
    # 1. Create two small mock text files renamed as JPEGs for testing formats
    print("Creating mock image files for test...")
    file1_path = "test_item1.jpg"
    file2_path = "test_item2.jpg"
    
    with open(file1_path, "wb") as f:
        f.write(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\x08")
    with open(file2_path, "wb") as f:
        f.write(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\x08")

    try:
        # 2. Check health endpoint first
        print("Checking server health...")
        health = requests.get(f"{BASE_URL}/").json()
        print(f"Health check response: {health}")
        
        # 3. Post files to /batches
        print("Uploading batch...")
        
        # Open file descriptors inside a context manager or close them manually to avoid permission blocks on deletion
        f1 = open(file1_path, "rb")
        f2 = open(file2_path, "rb")
        
        files = [
            ("files", (os.path.basename(file1_path), f1, "image/jpeg")),
            ("files", (os.path.basename(file2_path), f2, "image/jpeg"))
        ]
        
        response = requests.post(f"{BASE_URL}/batches", files=files)
        
        # Close file handles immediately after sending request
        f1.close()
        f2.close()
        
        if response.status_code != 200:
            print(f"Upload failed: {response.status_code} - {response.text}")
            return
            
        data = response.json()
        batch_id = data["batch_id"]
        print(f"Batch successfully created! ID: {batch_id}")
        
        # 4. Poll status
        print("Polling batch progress...")
        for _ in range(15):
            status_resp = requests.get(f"{BASE_URL}/batches/{batch_id}/status").json()
            print(f"Batch status: {status_resp['status']} | Processed: {status_resp['processed_images']}/{status_resp['total_images']}")
            
            if status_resp['status'] in ["COMPLETED", "FAILED"]:
                print("Processing finished!")
                print(f"Final batch details: {status_resp}")
                
                # 5. Download Excel Export
                print("Testing Excel export...")
                export_resp = requests.get(f"{BASE_URL}/batches/{batch_id}/export")
                if export_resp.status_code == 200:
                    excel_filename = f"test_export_{batch_id}.xlsx"
                    with open(excel_filename, "wb") as f:
                        f.write(export_resp.content)
                    print(f"Excel report successfully exported to {excel_filename}!")
                    
                    # Verify it exists and is non-empty
                    if os.path.exists(excel_filename) and os.path.getsize(excel_filename) > 0:
                        print("Excel file validation SUCCESS: File exists and is non-empty.")
                        os.remove(excel_filename)
                    else:
                        print("Excel file validation FAILED: File is empty or missing.")
                else:
                    print(f"Excel export failed: {export_resp.status_code} - {export_resp.text}")
                break
            time.sleep(2)
            
    except Exception as e:
        print(f"Request failed: {str(e)}")
    finally:
        # Cleanup local test files
        print("Cleaning up mock files...")
        if os.path.exists(file1_path):
            os.remove(file1_path)
        if os.path.exists(file2_path):
            os.remove(file2_path)

if __name__ == "__main__":
    run_test()
