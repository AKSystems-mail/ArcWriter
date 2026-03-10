# ArcWriter Studio Workflow & Features Guide

This document outlines the current workflow and key features available in the ArcWriter Studio, version 2.5.4.

---

## ACT 0: The Genesis (Optional: Public Lead Generation)

ArcWriter offers a public-facing tool to quickly analyze a logline or concept, providing a teaser of its capabilities.

### Features:
*   **Concept Analysis**: Input a logline or short pitch.
*   **Teaser Beat Sheet**: Receive a condensed (e.g., first 3 beats) structural analysis.

---

## ACT I: The Pitch - Onboarding & Project Initialization

This act guides new and returning users into the ArcWriter Studio, helping them set up their projects and cinematic universes.

### 1. Landing Page (`/`)
The entry point to the studio.
*   **Dynamic Entry Buttons**: "BEGIN ANALYSIS" / "RESUME ANALYSIS" or "GET STARTED" / "ENTER STUDIO" based on user login status.
*   **View Plans**: Easy access to the billing page from the hero section.
*   **Screenwriter's Guide**: Downloadable PDF manual.

### 2. Login / Authentication (`/login`)
Secure access to the studio.
*   **Google Sign-In**: Quick authentication via Google.
*   **Email/Password Authentication**: Standard email and password login/signup.
*   **Account Recovery**: Password reset functionality.
*   **Dynamic Redirection**: After successful login, users are routed through the Traffic Controller.

### 3. Traffic Controller (`/app`)
The intelligent gatekeeper that directs users based on their project history.
*   **User Status Check**: Determines if the user has existing projects in their account.
*   **Routing**:
    *   **New User (No Projects)**: Directed to the Onboarding Wizard (`/wizard`).
    *   **Returning User (Has Projects)**: Directed to the Dashboard (`/dashboard`).

### 4. Onboarding Wizard (`/wizard`)
A step-by-step guide to setting up a new project.

*   **Step 1: Choose Your Workflow (Mode Selection)**:
    *   **The Discovery (Explorer Mode)**: "Mood First." Redirects directly to the **Script Editor** after initialization. The backend automatically generates the **Opening Image** scene based on the Story DNA to provide immediate creative momentum.
    *   **The Blueprint (Architect Mode)**: "Structure First." Redirects to the **Beat Sheet** page. Users refine the 15 narrative beats before proceeding to the editor.
*   **Step 2: Story DNA (Pitch Notes / Manuscript Import)**:
    *   **Cinematic Universe Selection**: Link to an existing universe or create a new one.
    *   **Narrative Brief**: Input a logline/pitch for AI analysis.
    *   **Import Manuscript**: Upload a PDF screenplay for reverse engineering.
        *   **Screenplay Mode**: If toggled, the system preserves the original block types (Dialogue, Action, etc.).
        *   **Logic Priority**: If a manuscript is imported, the system redirects to the **Script Editor** regardless of the selected Mode (Discovery/Blueprint).
*   **Step 3: The Blueprint (Verification & Refinement)**:
    *   **Asset Title**: Edit the project title.
    *   **Distilled Logline**: Review and refine the AI-generated logline.
    *   **Structural Framework**: Select or confirm the narrative structure (e.g., Hero's Journey, Save the Cat).
    *   **Identified Cast**: Review and edit AI-identified characters. Even in Explorer mode, this step ensures the "continuity engine" has a baseline for its generations.
*   **Step 4: Visual Soul (Vibe Selection)**:
    *   Select a visual aesthetic. Calibrates both the Image Engine (Posters/Teasers) and the Tonal Engine (AI Critique style).
*   **Step 5: Diagnostic Lens (AI Analysis Persona)**:
    *   Choose the AI's feedback persona. This influences the "Logic Score" and "Macro Audit" priorities.
*   **Project Finalization**: After completing the wizard, the project is created, initial assets (poster) are generated, and the user is redirected to the Beat Sheet or Editor.

---

## ACT II: The Studio - Core Workflow

This act covers the main tools and interfaces for developing and refining the narrative.

### 1. Dashboard (`/dashboard`)
Your central hub for managing all projects.
*   **Project Listing**: View all active and archived projects.
*   **Real-time Updates**: Projects automatically appear/update without manual refresh.
*   **Active/Archived Toggle**: Switch between current projects and those on "The Cutting Room Floor".
*   **Project Actions**: Edit title, archive (Inciting Incident), restore (Redemption), permanent delete (Point of No Return).
*   **Upgrade Plan Button**: Easy access to the Billing page.
*   **Script Editor Access**: Directly open the script editor for a project.
*   **Blueprint Access**: Directly open the Blueprint page for a project.

### 2. Blueprint Page (`/project/:projectId/beat-sheet`)
The structural and visual overview of your project.
*   **Header Navigation**: Quick access to Dashboard and Script Editor.
*   **Visuals Assets Studio**: (Component within Blueprint)
    *   **Official Poster Generation**: Generate and regenerate high-fidelity movie posters with concise taglines.
    *   **Character Anchor Generation**: Generate and select cinematic headshots for key characters (4 variants).
    *   **Cinematic Teaser Generation**: Initiate asynchronous generation of 8-second motion teasers (Veo 3.0 Fast) with native synchronized audio.
    *   **Pitch Package Export**: Compile a multi-part PDF (Poster, Story Summary, Cast Dossiers, Full Script) for pitching.
*   **Beat Sheet Form**: Review and refine the 15 narrative beats (e.g., Save the Cat, Hero's Journey).
*   **Personnel Dossiers**: Detailed view and management of characters, including generated visual anchors.
*   **Upgrade Plan Button**: Easy access to the Billing page.

### 3. Script Editor (`/project/:projectId/editor`)
Your dedicated space for writing and refining the screenplay.
*   **Screenplay Formatting**: Automated formatting for Scene Headings, Action, Character, Dialogue, Parentheticals.
*   **Block-based Editing**: Edit script in discrete blocks with auto-resizing.
*   **Intelligent Autocomplete**: Suggestions for character names and locations from the Universe.
*   **Auto-Save & Version Control**: Automatic saving with Time Machine (snapshots/milestones) for version history.
*   **Draft Assist (Magic Wand)**:
    *   **Auto-Draft Scene**: AI generates a full scene based on context.
    *   **Suggest Dialogue**: AI provides 3 distinct dialogue options (Direct, Subtextual, Conflict-heavy) for the current context.
*   **Story Insights Sidebar**: (Component within Editor)
    *   **AI Critique**: Receive feedback from different personas (Producer, Auteur, Architect).
    *   **Gatekeeper Audit (Hook Scan)**: Analyzes the first 10 pages for hook velocity and passes a "READ" or "PASS" verdict.
    *   **Macro Audit**: Deep structural analysis of the entire script for plot holes, character arcs, and blueprint alignment. Includes a "Resolution Scanner" for story stability.
*   **Source Material Drawer**: Access your initial pitch, synopsis, or imported manuscript for reference.
*   **Upgrade Plan Button**: Easy access to the Billing page.

---

## ACT III: The Deal - Billing & Management

Managing your ArcWriter Studio subscription and credits.

### 1. Billing Page (`/billing`)
Overview of plans, credits, and subscription.
*   **Current Balance**: Displays available Studio Credits.
*   **Active Plan**: Shows current subscription tier (e.g., Explorer, Writer's Room, Studio Pass).
*   **Production Tiers**: Compare and select different plans (Explorer, Writer's Room, Studio Pass).
*   **Annual/Monthly Toggle**: Option for discounted annual plans.
*   **Beta Code Redemption**: For authorized testers.
*   **Smart Back Navigation**: Returns to the previous page or defaults to the Dashboard.

---

## Denouement: Seamless Experience

*   **Cross-Origin-Opener-Policy (COOP) Issue**: Noted browser warning, does not impact core functionality.
*   **Firebase Storage**: Securely handles all asset uploads.
*   **Firestore Data**: All project data stored in Firestore, with real-time sync where applicable.
*   **Backend API**: FastAPI backend provides robust, secure, and performant AI services.
