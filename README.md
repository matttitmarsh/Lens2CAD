# Lens2CAD

Transform phone photos of physical objects into millimeter-accurate CAD files.

<p align="center">
  <img src="frontend/app/icon.svg" alt="Lens2CAD Logo" width="120"/>
</p>

## Overview

Lens2CAD uses computer vision and ArUco marker detection to convert photos taken on a reference sheet into precise SVG and DXF files for laser cutting, CNC machining, and CAD design.

**Key Features:**
- 📸 Photo-to-CAD conversion with perspective correction
- 📐 Millimeter-accurate scaling using ArUco markers
- 🎯 AI-powered background removal
- ⚡ Real-time processing
- 📦 Export to SVG & DXF formats
- 🔄 Auto-cleanup (1-hour file retention)

## Tech Stack

**Frontend:** Next.js 16, React, TypeScript, Tailwind CSS  
**Backend:** Python, FastAPI, OpenCV, rembg  
**Deployment:** Vercel (frontend) + Render (backend)

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for detailed instructions on deploying to Vercel and Render.

## How It Works

1. Print the reference sheet (A4) with ArUco markers
2. Place your object on the sheet
3. Take a photo from directly above
4. Upload to Lens2CAD
5. Download accurate SVG/DXF files

## Documentation

Visit `/documentation` in the app for best practices on photography, lighting, and achieving the most accurate results.

## License

**CC BY-NC 4.0** - Free for personal and educational use.  
Commercial use requires a separate license. [Contact for commercial licensing](mailto:matt.titmarsh@gmail.com).

See [LICENSE](LICENSE) for full terms.
