from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from core.vision import ShapeScanner
import os
import uuid
import shutil
import time
import asyncio
from contextlib import asynccontextmanager

# Mount output directory
OUTPUT_DIR = "output"
os.makedirs(OUTPUT_DIR, exist_ok=True)

CLEANUP_INTERVAL = 3600 # Run cleanup every hour
FILE_MAX_AGE = 3600 # Delete files older than 1 hour

async def cleanup_old_files():
    while True:
        try:
            now = time.time()
            if os.path.exists(OUTPUT_DIR):
                for item in os.listdir(OUTPUT_DIR):
                    item_path = os.path.join(OUTPUT_DIR, item)
                    # We only care about directories created for requests
                    if os.path.isdir(item_path):
                        # Check modification time
                        if now - os.path.getmtime(item_path) > FILE_MAX_AGE:
                            try:
                                shutil.rmtree(item_path)
                                print(f"Cleaned up old request: {item}")
                            except Exception as e:
                                print(f"Failed to delete {item}: {e}")
        except Exception as e:
            print(f"Error during cleanup: {e}")
        
        await asyncio.sleep(CLEANUP_INTERVAL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the cleanup task
    task = asyncio.create_task(cleanup_old_files())
    yield
    # Shutdown: Cancel the task
    task.cancel()

app = FastAPI(title="Lens2CAD API", lifespan=lifespan)

# Get configuration from environment variables
# Robustly parse allowed origins: split by comma, strip whitespace, and remove trailing slashes
raw_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
ALLOWED_ORIGINS = [origin.strip().rstrip("/") for origin in raw_origins if origin.strip()]
print(f"Allowed Origins: {ALLOWED_ORIGINS}")

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

# Regex to allow any Vercel deployment (e.g., https://lens2cad-*.vercel.app)
# This is safer than allowing all origins but flexible enough for previews
VERCEL_REGEX = r"https://.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_origin_regex=VERCEL_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount output directory

app.mount("/output", StaticFiles(directory=OUTPUT_DIR), name="output")
app.mount("/static", StaticFiles(directory="."), name="static")

scanner = ShapeScanner()

@app.get("/")
async def root():
    """Root endpoint - redirects to health check"""
    return {"status": "ok", "message": "Lens2CAD API", "health_endpoint": "/health"}

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Lens2CAD Backend"}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        # Create a unique directory for this request to avoid collisions
        request_id = str(uuid.uuid4())
        request_dir = os.path.join(OUTPUT_DIR, request_id)
        os.makedirs(request_dir, exist_ok=True)
        
        result = scanner.process_image(contents, request_dir)
        
        if "error" in result:
            # Cleanup if error
            # shutil.rmtree(request_dir)
            raise HTTPException(status_code=400, detail=result["error"])
            
        # Construct URLs
        # The static mount is at /output, so we need to include the request_id
        svg_filename = os.path.basename(result['svg_path'])
        dxf_filename = os.path.basename(result['dxf_path'])
        
        result["svg_url"] = f"{BASE_URL}/output/{request_id}/{svg_filename}"
        result["dxf_url"] = f"{BASE_URL}/output/{request_id}/{dxf_filename}"
        
        return result
    except Exception as e:
        import traceback
        print(f"Error processing image: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
