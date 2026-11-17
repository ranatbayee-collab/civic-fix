"""
AI CivicFix - Python FastAPI Object Detection & Verification Service
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

from detector import CivicDetector
from verifier import ResolutionVerifier

app = FastAPI(
    title="AI CivicFix - Computer Vision & Verification Service",
    description="FastAPI service running YOLOv8 and visual verification for civic infrastructure",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = CivicDetector()
verifier = ResolutionVerifier()

class PredictRequest(BaseModel):
    image_url: Optional[str] = None
    description: Optional[str] = ""
    category_hint: Optional[str] = None

class VerifyRequest(BaseModel):
    before_image_url: str
    after_image_url: str
    category: str

@app.get("/")
def root():
    return {
        "service": "AI CivicFix Python AI Service",
        "status": "ONLINE",
        "supported_categories": [
            "pothole", "garbage", "streetlight", "water_leak", "drainage", "fallen_tree", "traffic_signal"
        ]
    }

@app.get("/health")
def health():
    return {"status": "HEALTHY", "model_loaded": True}

@app.post("/predict")
def predict_civic_problem(req: PredictRequest):
    try:
        result = detector.predict(
            image_input=req.image_url,
            description=req.description,
            category_hint=req.category_hint
        )
        return result
    except Exception as e:
        raise HTTPException(status_status=500, detail=str(e))

@app.post("/verify-resolution")
def verify_resolution(req: VerifyRequest):
    try:
        result = verifier.verify(
            before_url=req.before_image_url,
            after_url=req.after_image_url,
            category=req.category
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
