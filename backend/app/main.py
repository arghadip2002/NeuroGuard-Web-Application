# backend/app/main.py (for Hugging Face Spaces)
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
import os
import shutil
from pathlib import Path
import time
from .inference import InferenceEngine

# Initialize FastAPI app
app = FastAPI(
    title="MRI Brain Tumor Detection API",
    description="Deep Learning API for brain tumor classification from MRI scans",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure paths
BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
MODEL_PATH = BASE_DIR / "models" / "model_Full.pth"
STATIC_DIR = BASE_DIR / "static"

# Ensure directories exist
UPLOAD_DIR.mkdir(exist_ok=True)

# Initialize inference engine
inference_engine = None

@app.on_event("startup")
async def startup_event():
    """Initialize model on startup"""
    global inference_engine
    
    print(f"📁 Static directory: {STATIC_DIR}")
    print(f"📁 Static exists: {STATIC_DIR.exists()}")
    if STATIC_DIR.exists():
        print(f"📁 Static contents: {list(STATIC_DIR.iterdir())}")
    
    if not MODEL_PATH.exists():
        print(f"⚠️ Model file not found at {MODEL_PATH}")
        print("Please place your model_Full.pth in the backend/models/ directory")
    else:
        try:
            inference_engine = InferenceEngine(str(MODEL_PATH))
            print("✅ Inference engine initialized successfully")
        except Exception as e:
            print(f"❌ Failed to initialize inference engine: {e}")


# Mount static files for assets (CSS, JS, etc.)
if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")


@app.get("/", response_class=HTMLResponse)
async def root():
    """Serve the frontend HTML"""
    html_file = STATIC_DIR / "index.html"
    
    if html_file.exists():
        return FileResponse(html_file)
    
    # Fallback API info if no frontend
    return HTMLResponse(content="""
    <!DOCTYPE html>
    <html>
    <head>
        <title>MRI Brain Tumor Detection API</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            }
            h1 { margin-top: 0; font-size: 2.5em; }
            .status { 
                background: rgba(34, 197, 94, 0.2);
                padding: 15px;
                border-radius: 10px;
                margin: 20px 0;
            }
            .link {
                display: inline-block;
                background: white;
                color: #667eea;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 8px;
                margin: 10px 10px 10px 0;
                font-weight: bold;
                transition: transform 0.2s;
            }
            .link:hover {
                transform: translateY(-2px);
            }
            .endpoint {
                background: rgba(255, 255, 255, 0.1);
                padding: 10px;
                border-radius: 5px;
                margin: 10px 0;
                font-family: 'Courier New', monospace;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🧠 MRI Brain Tumor Detection API</h1>
            <div class="status">
                <strong>Status:</strong> ✅ Online<br>
                <strong>Model:</strong> """ + ("✅ Loaded" if inference_engine else "❌ Not Loaded") + """
            </div>
            
            <h2>📚 API Documentation</h2>
            <a href="/docs" class="link">📖 Interactive API Docs</a>
            <a href="/redoc" class="link">📋 ReDoc Documentation</a>
            
            <h2>🔌 Endpoints</h2>
            <div class="endpoint">POST /api/predict - Upload MRI image for prediction</div>
            <div class="endpoint">GET /health - Health check endpoint</div>
            
            <h2>🚀 Usage</h2>
            <p>Send a POST request to <code>/api/predict</code> with an MRI image file:</p>
            <pre style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; overflow-x: auto;">
curl -X POST "https://arghadip2002-mri-app.hf.space/api/predict" \\
  -F "mriImage=@your_mri_image.jpg"
            </pre>
        </div>
    </body>
    </html>
    """)


@app.post("/api/predict")
async def predict(mriImage: UploadFile = File(...)):
    """
    Predict brain tumor type from MRI image
    
    Args:
        mriImage: Uploaded MRI scan image file
        
    Returns:
        JSON with prediction results
    """
    
    # Check if model is loaded
    if inference_engine is None:
        raise HTTPException(
            status_code=503,
            detail="Model not loaded. Please check server logs."
        )
    
    # Validate file type
    allowed_extensions = {'.jpg', '.jpeg', '.png'}
    file_ext = Path(mriImage.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save uploaded file temporarily
    timestamp = int(time.time() * 1000)
    temp_filename = f"{timestamp}_{mriImage.filename}"
    temp_filepath = UPLOAD_DIR / temp_filename
    
    try:
        # Save file
        with temp_filepath.open("wb") as buffer:
            shutil.copyfileobj(mriImage.file, buffer)
        
        # Run inference
        result = inference_engine.predict(str(temp_filepath))
        
        # Clean up temporary file
        if temp_filepath.exists():
            temp_filepath.unlink()
        
        if not result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Inference failed: {result.get('error', 'Unknown error')}"
            )
        
        return JSONResponse(content={
            "predicted_class": result["predicted_class"],
            "confidence": result["confidence"],
            "all_probabilities": result["all_probabilities"]
        })
        
    except HTTPException:
        # Re-raise HTTP exceptions
        if temp_filepath.exists():
            temp_filepath.unlink()
        raise
        
    except Exception as e:
        # Clean up on error
        if temp_filepath.exists():
            temp_filepath.unlink()
        
        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": inference_engine is not None,
        "model_path": str(MODEL_PATH),
        "model_exists": MODEL_PATH.exists(),
        "static_dir_exists": STATIC_DIR.exists()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)