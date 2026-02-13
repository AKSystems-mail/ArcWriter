# GEMINI.md

This document provides a comprehensive overview of the "ArcWriter" project, detailing its purpose, technologies, architecture, and instructions for building and running the application.

## Project Overview

**ArcWriter** (formerly Arc) is an AI-powered SaaS platform designed to assist screenwriters throughout the film development lifecycle. It aims to guide writers from brainstorming to generating media assets and ultimately pitching their movies.

**Key Features:**
*   **Dual-Mode Onboarding**: Explorer (for Pantsers) and Architect (for Plotters).
*   **"Universe" Architecture**: A RAG-powered Project Bible that maintains continuity across multiple scripts (sequels/prequels). It scans all projects in a universe to flag lore violations.
*   **Game Theory Logic Engine**: Mathematical stress-testing of plot holes, now upgraded with a 10-point Literary Device Audit (Chekhov's Gun, Save the Cat, etc.).
*   **Asset Pipeline**: Generative studio for creating characters, posters, and teasers using Vertex AI Imagen 3 (with fallback to ImageGeneration@002).
*   **Smart Script Editor**: Professional screenplay editor with auto-formatting, keyboard shortcuts (1-5), and "Draft Assist" that reads previous pages for tone/continuity matching.

**Main Technologies:**
*   **Frontend**: React, Vite, React Router DOM, Tailwind CSS, Firebase SDK.
*   **Backend**: FastAPI (Python), Uvicorn, Google Cloud Storage, Google Cloud AI Platform (Vertex AI), Google Gemini 1.5 Pro (Deep Analysis) & 2.5 Flash (Fast Tasks).
*   **Database**: Firestore (for script content auto-save and Universe metadata).

**Architecture:**
The application follows a client-server architecture with a React-based frontend interacting with a FastAPI backend. Data persistence is handled via Firestore for real-time script content and user metadata. The backend utilizes Google Cloud services for AI capabilities (Gemini 1.5 Pro, Vertex AI) and asset storage.

## Building and Running

### Prerequisites

*   Node.js and npm (for frontend)
*   Python 3.8+ and pip (for backend)
*   Google Cloud Project with Firebase enabled
*   Google Cloud service account key with permissions for Firestore, Cloud Storage, and Vertex AI.

### Frontend

The frontend is a React application built with Vite.

**1. Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

**2. Install dependencies:**
    ```bash
    npm install
    ```

**3. Run the development server:**
    ```bash
    npm run dev
    ```
    This will typically start the application on `http://localhost:5173`.

**4. Build for production:**
    ```bash
    npm run build
    ```
    This will generate optimized static assets in the `dist` directory.

### Backend

The backend is a FastAPI application written in Python.

**1. Navigate to the backend directory:**
    ```bash
    cd backend
    ```

**2. Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

**3. Environment Variables:**
    The backend requires several environment variables for configuration. Create a `.env` file in the `backend` directory based on `backend/.env.example` and fill in the appropriate values:

    ```ini
    # .env (example)
    FIREBASE_PROJECT_ID=your-firebase-project-id
    GEMINI_API_KEY=your_gemini_api_key_here
    NANO_BANANA_KEY=your_nano_banana_key_here # Placeholder for future use
    GOOGLE_VEO_KEY=your_google_veo_key_here # Placeholder for future use

    # Firebase Storage Bucket (Optional, infers from FIREBASE_PROJECT_ID if not set)
    # FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket

    # Google Cloud Project and Region for Vertex AI (Used in AssetStudio.py)
    # GOOGLE_CLOUD_PROJECT=your-gcp-project-id
    # GOOGLE_CLOUD_LOCATION=your-gcp-region

    FLASK_ENV=development
    PORT=5000
    ```

    **Important:** For Google Cloud services (Firestore, Cloud Storage, Vertex AI), you need to set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable in your backend environment. This variable should point to the JSON key file of your Google Cloud service account.

    ```bash
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
    ```

**4. Run the development server:**
    ```bash
    uvicorn main:app --host 0.0.0.0 --port 5000
    ```
    This will start the FastAPI server, typically accessible on `http://localhost:5000`.

## Development Conventions

*   **Frontend Framework:** React is used for building the user interface.
*   **Styling:** Tailwind CSS is employed for utility-first CSS styling.
*   **Routing:** React Router DOM manages client-side navigation.
*   **Backend Framework:** FastAPI provides the API endpoints for backend services.
*   **Content Management:** A hierarchical content management system is implemented using Firestore "Universes" and "Projects." Each project contains a `project_bible.md` stored in the database.
*   **Data Persistence:** Script content auto-save functionality leverages Firebase Firestore for real-time updates and persistence.
*   **AI Integration:** Google Gemini 1.5 Pro (Analysis) and 2.5 Flash (Generation) are integrated for various AI-powered features, including critique generation and asset creation.
