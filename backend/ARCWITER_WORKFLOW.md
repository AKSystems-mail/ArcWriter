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
    *   **Identified Cast (Visual DNA Mandate)**: Review AI-identified characters. Character descriptions now include age, build, and **explicit ethnic/racial background** to ensure visual consistency in posters and teasers.
*   **Step 4: Visual Soul (Vibe Selection)**:
    *   Select a visual aesthetic. Calibrates the **Gemini 3.1 Flash Image Preview** engine for posters and character anchors.
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
    *   **Official Poster Generation (Gemini 3.1)**: Generate movie posters with concise, one-sentence taglines and cast-accurate visuals.
    *   **Character Anchor Generation (Gemini 3.1)**: Generate 1:1 square headshots based on specific physical and ethnic descriptions.
    *   **Cinematic Teaser Generation (Veo 3.0 Standard)**: Initiate asynchronous generation of 8-second widescreen teasers with native synchronized audio.
    *   **Pitch Package Export**: Compile a multi-part PDF (Poster, Story Summary, Cast Dossiers, Full Script).
*   **Beat Sheet Form**: Review and refine the 15 narrative beats.
*   **Personnel Dossiers**: Detailed view and management of characters, including generated visual anchors.
*   **Upgrade Plan Button**: Easy access to the Billing page.

### 3. Script Editor (`/project/:projectId/editor`)
Your dedicated space for writing and refining the screenplay.
*   **Screenplay Formatting**: Automated formatting for all industry-standard block types.
*   **Intelligent Autocomplete**: Universe-aware character and location suggestions.
*   **Auto-Save & Time Machine**: Snapshots and milestones for full version control.
*   **Draft Assist (Magic Wand)**: AI-powered scene generation and context-aware dialogue suggestions.
*   **Story Insights Sidebar**: 
    *   **AI Critique**: Multi-persona feedback.
    *   **Gatekeeper Audit**: "READ/PASS" verdict for the first 10 pages.
    *   **Macro Audit**: High-level structural and logic scan.
*   **Source Material Drawer**: Instant reference to original pitch and Story DNA.
*   **Upgrade Plan Button**: Easy access to the Billing page.

---

## ACT III: The Deal - Billing & Management

### 1. Billing Page (`/billing`)
*   **Current Balance**: Displays available Studio Credits.
*   **Active Plan**: Explorer (Free), Writer's Room ($15/mo), or Studio Pass ($49 once).
*   **Smart Back Navigation**: Intelligently returns users to their previous workflow.

---

## Denouement: Seamless Experience

*   **Security Policies**: Configured for custom domain (`arcwriter.us`) compatibility.
*   **Instant Help**: Pre-cached screenplay-style manual for zero-latency lookups.
*   **Firebase Core**: Utilizes standard-compliant Firestore, Storage, and Function architectures.
