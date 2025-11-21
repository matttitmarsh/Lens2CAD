# Deployment Guide for Lens2CAD

Since Lens2CAD consists of a **Next.js Frontend** and a **Python/FastAPI Backend** (with heavy dependencies like OpenCV), it cannot be hosted entirely on static hosting platforms like GitHub Pages.

We recommend a split deployment strategy using free-tier compatible services:
- **Frontend**: [Vercel](https://vercel.com) (Creators of Next.js, free for hobby projects).
- **Backend**: [Render](https://render.com) (Supports Docker/Python, has a free tier).

## 1. Backend Deployment (Render)

The backend handles image processing and needs a container environment.

1.  Push your code to a GitHub repository.
2.  Sign up for [Render](https://render.com).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  Select the `backend` directory as the **Root Directory** (if asked, otherwise you might need to configure the build context).
    *   *Note: Since this is a monorepo (frontend and backend in one), you might need to specify the build context.*
    *   **Better Approach for Monorepo on Render**:
        *   Name: `lens2cad-backend`
        *   Runtime: **Docker**
        *   Root Directory: `backend`
6.  **Environment Variables**:
    *   Add `ALLOWED_ORIGINS`: `https://your-vercel-frontend-url.vercel.app` (You can add `*` initially until you have the frontend URL).
    *   Add `BASE_URL`: The URL Render gives you (e.g., `https://lens2cad-backend.onrender.com`).
7.  Click **Create Web Service**.
8.  Wait for the build to finish. Copy the service URL (e.g., `https://lens2cad-backend.onrender.com`).

## 2. Frontend Deployment (Vercel)

The frontend is a standard Next.js application.

1.  Sign up for [Vercel](https://vercel.com).
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repository.
4.  **Framework Preset**: Next.js (should be auto-detected).
5.  **Root Directory**: Click "Edit" and select `frontend`.
6.  **Environment Variables**:
    *   Name: `NEXT_PUBLIC_API_URL`
    *   Value: The Backend URL from Render (e.g., `https://lens2cad-backend.onrender.com`).
        *   *Important*: Do not add a trailing slash.
7.  Click **Deploy**.

## 3. Final Configuration

Once both are deployed:
1.  Go back to Render Dashboard -> Environment.
2.  Update `ALLOWED_ORIGINS` to match your actual Vercel URL (e.g., `https://lens2cad.vercel.app`) to secure your API.
3.  Your app is now live!

## 4. Data Privacy & Auto-Cleanup
To manage disk space and ensure user privacy:
- The backend includes an **auto-cleanup task** that runs every hour.
- It automatically deletes any processed files (images, SVGs, DXFs) that are older than **1 hour**.
- This means the app is stateless and doesn't permanently store user data.

## Local Development
You don't need to change anything to run locally.
- Backend defaults to `http://localhost:8000`.
- Frontend defaults to looking for the backend at `http://localhost:8000`.
