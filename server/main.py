import os
import sys
import json
import shutil
from pathlib import Path

# Add parent directory to path to import model & dataset modules
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from model.bio_ocr_pipeline import BioOCRPipeline
from model.medical_coder import MedicalCoderEngine
from model.evaluate import BioOCREvaluator
from model.train_model import BioOCRModelTrainer
from dataset.dataset_manifest_builder import build_dataset_manifest

from fastapi import FastAPI, File, UploadFile, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Biomedical OCR & Medical Coding API",
    description="Bio OCR text recognition, biomedical fuzzy lexicon correction, and ICD-10-CM / CPT medical coding engine trained on 1,000 document images.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount raw images directory for serving static document images
PRIMARY_IMAGE_DIR = os.path.join(BASE_DIR, "image-20260922T200405Z-1-001", "image")
FALLBACK_IMAGE_DIR = os.path.join(BASE_DIR, "dataset", "raw_images")
UPLOADS_DIR = os.path.join(BASE_DIR, "server", "uploads")

IMAGE_SERVE_DIR = PRIMARY_IMAGE_DIR if os.path.exists(PRIMARY_IMAGE_DIR) else FALLBACK_IMAGE_DIR
os.makedirs(IMAGE_SERVE_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/static/images", StaticFiles(directory=IMAGE_SERVE_DIR), name="raw_images")
app.mount("/static/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

ocr_pipeline = BioOCRPipeline()
medical_coder = MedicalCoderEngine()
evaluator = BioOCREvaluator()
trainer = BioOCRModelTrainer()

@app.get("/")
def root():
    return {
        "status": "ONLINE",
        "system": "Biomedical OCR & Automated ICD-10 Medical Coding System",
        "version": "1.0.0",
        "dataset_size": trainer.dataset_size,
        "dataset_path": PRIMARY_IMAGE_DIR,
        "endpoints": [
            "/api/ocr/scan",
            "/api/dataset/samples",
            "/api/dataset/generate",
            "/api/model/evaluate",
            "/api/model/train",
            "/api/icd10/lookup"
        ]
    }

@app.get("/api/dataset/samples")
def get_dataset_samples(page: int = Query(1, ge=1), limit: int = Query(50, ge=5, le=1000)):
    """Returns indexed biomedical documents and annotations from dataset manifest."""
    manifest_path = os.path.join(BASE_DIR, "dataset", "annotations", "dataset_manifest.json")
    if not os.path.exists(manifest_path):
        build_dataset_manifest()
        
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    # Calculate pagination
    total_docs = len(manifest)
    start_idx = (page - 1) * limit
    end_idx = min(start_idx + limit, total_docs)
    sliced_docs = manifest[start_idx:end_idx]

    # Format image URLs
    for doc in sliced_docs:
        doc["image_url"] = f"/static/images/{doc['image_file']}"

    return {
        "total_documents": total_docs,
        "page": page,
        "limit": limit,
        "total_pages": (total_docs + limit - 1) // limit,
        "documents": sliced_docs
    }

@app.post("/api/dataset/generate")
def trigger_dataset_generation():
    """Triggers indexing of the 1,000 biomedical OCR document images."""
    manifest_path = build_dataset_manifest()
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)
    return {
        "message": f"Successfully indexed {len(manifest)} medical document samples.",
        "total_samples": len(manifest)
    }

@app.post("/api/ocr/scan")
async def scan_medical_document(file: UploadFile = File(None), doc_id: str = Query(None)):
    """
    Runs Bio OCR pipeline, text bounding box detection, medical lexicon correction, 
    and ICD-10-CM / CPT medical coding analysis on uploaded prescription or dataset image.
    """
    image_path = None

    if file:
        file_path = os.path.join(UPLOADS_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        image_path = file_path
    elif doc_id:
        manifest_path = os.path.join(BASE_DIR, "dataset", "annotations", "dataset_manifest.json")
        if os.path.exists(manifest_path):
            with open(manifest_path, "r", encoding="utf-8") as f:
                manifest = json.load(f)
            for d in manifest:
                if d.get("doc_id") == doc_id or d.get("image_file") == doc_id:
                    image_path = os.path.join(IMAGE_SERVE_DIR, d["image_file"])
                    break

    if not image_path or not os.path.exists(image_path):
        manifest_path = os.path.join(BASE_DIR, "dataset", "annotations", "dataset_manifest.json")
        if not os.path.exists(manifest_path):
            build_dataset_manifest()
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
        image_path = os.path.join(IMAGE_SERVE_DIR, manifest[0]["image_file"])

    # 1. Bio OCR extraction
    ocr_result = ocr_pipeline.extract_text_and_boxes(image_path)
    
    # 2. Medical Coding Mapping
    coding_analysis = medical_coder.process_ocr_document(ocr_result)

    return {
        "status": "SUCCESS",
        "image_file": os.path.basename(image_path),
        "image_url": f"/static/images/{os.path.basename(image_path)}" if "image-20260922T200405Z" in image_path or "raw_images" in image_path else f"/static/uploads/{os.path.basename(image_path)}",
        "ocr_result": ocr_result,
        "medical_coding": coding_analysis
    }

@app.get("/api/model/evaluate")
def get_evaluation_benchmark():
    """Returns CER, WER, F1-Score, and ICD-10 coding precision benchmark results for 1,000 images."""
    results = evaluator.run_benchmark()
    return results

@app.post("/api/model/train")
def trigger_model_training(epochs: int = Query(10, ge=3, le=30)):
    """Triggers PyTorch CRNN model training loop over 1,000 document images and returns checkpoint metrics."""
    checkpoint_data = trainer.run_training(epochs)
    return checkpoint_data

@app.get("/api/icd10/lookup")
def search_icd10_codes(query: str = Query("")):
    """Searches ICD-10 database for matching codes and descriptions."""
    matches = medical_coder.match_icd10_codes(query)
    return {
        "query": query,
        "total_matches": len(matches),
        "results": matches
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
