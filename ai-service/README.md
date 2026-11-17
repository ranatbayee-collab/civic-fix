# AI CivicFix — AI Computer Vision Service

This microservice provides object detection and post-repair resolution verification for civic problems using YOLOv8 and computer vision models.

## Detected Categories
1. 🕳️ **Pothole**: Road asphalt craters & depressions
2. 🗑️ **Garbage**: Illegal refuse dump & overflowing bins
3. 💡 **Streetlight**: Damaged poles & unlit luminaires
4. 💧 **Water Leak**: Pipeline breaches & localized flooding
5. 🚰 **Drainage**: Choked gutters & overflowing stormwater culverts
6. 🌳 **Fallen Tree**: Blocked carriageways & fallen timber
7. 🚦 **Traffic Signal**: Malfunctioning or damaged intersection lights

## Setup & Running

```bash
cd ai-service

# Create virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server on port 8000
uvicorn main:app --reload --port 8000
```

## API Endpoints
- `POST /predict`: Input `{ image_url, description, category_hint }` → Returns category, confidence, bounding boxes, severity.
- `POST /verify-resolution`: Input `{ before_image_url, after_image_url, category }` → Returns resolution confidence % and verification clearance.
- `GET /health`: Health check status.
