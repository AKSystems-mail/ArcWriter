# Feature Blueprint: Manuscript Adaptation Mode (Hidden V1.2 Feature)

**Objective:** Build a premium, user-triggered feature ($39) that allows authors to adapt a full novel into a "Cinematic Blueprint" (Beat Sheet, Character Bible, and a Dialogue-Free Scriptment). 

**Constraint:** This feature must be fully functional in the codebase but HIDDEN from the user interface via a feature flag (`ENABLE_ADAPTATION_MODE = false`) until post-V1 launch.

---

## Phase 1: Frontend - The User Choice & Paywall
**File:** `frontend/src/pages/OnboardingWizard.jsx`

1. **Add Feature Flag:**
   - At the top of the file: `const ENABLE_ADAPTATION_MODE = false;`

2. **Update the Upload UI (Step 2):**
   - Change the single "Upload PDF" button into a dropdown or three distinct buttons:
     1. "Import Screenplay"
     2. "Import Notes"
     3. "Adapt Manuscript ($39)" (Only render if `ENABLE_ADAPTATION_MODE` is true).

3. **Create the Upsell Modal:**
   - **Trigger:** User clicks "Adapt Manuscript".
   - **UI:** A premium modal.
     - *Title:* "Generate a Cinematic Blueprint"
     - *Copy:* "Adapting a novel is about translation, not just formatting. For a one-time fee of $39, ArcWriter's Studio Engine will read your entire manuscript and generate your Beat Sheet, Character Bible, and a complete Scene-by-Scene Scriptment. We build the sets and block the action; you just drop in and write the dialogue."
     - *Button:* "Proceed to Checkout - $39" (Calls Stripe endpoint).

## Phase 2: Backend - Stripe Integration
**File:** `backend/app/routers/stripe_payments.py`

1. **Create endpoint: `POST /api/stripe/create-adaptation-checkout`**
   - **Payload:** `user_id`
   - **Logic:** Create a Stripe Checkout Session for a One-Time Payment of $39.00 USD.
   - **Metadata:** Attach `{"type": "manuscript_adaptation", "user_id": user_id}`.
   - **Success URL:** Redirect back to the app to a new route: `/upload-manuscript?session_id={CHECKOUT_SESSION_ID}`.

2. **Update Stripe Webhook:**
   - Listen for `checkout.session.completed`.
   - If `metadata.type == "manuscript_adaptation"`, update the user's Firestore document: set `has_adaptation_credit = True`.

## Phase 3: Frontend - The Dedicated Upload Screen
**File:** `frontend/src/pages/ManuscriptUpload.jsx` (New Component)

1. **Route:** `/upload-manuscript`
2. **Verification:** On load, check if the user has `has_adaptation_credit == true`. If not, redirect to dashboard.
3. **UI:** "Payment Successful! Upload your manuscript PDF (up to 500 pages)."
4. **Action:** On file drop, show a Loading Screen: *"Ingesting Manuscript... Translating to Cinematic Format... (This may take up to 60 seconds)."*
5. **API Call:** Send the PDF to a new backend endpoint `/api/projects/process_adaptation`.

## Phase 4: Backend - The Adaptation Engine
**File:** `backend/app/routers/onboarding.py` & `backend/app/services/logic_engine.py`

1. **Create endpoint: `POST /api/projects/process_adaptation`**
   - **Validation:** Verify user has `has_adaptation_credit`. Deduct the credit.
   - **Parsing:** Extract text from the PDF using `pdfplumber`.

2. **Create method: `logic_engine.adapt_manuscript(manuscript_text)`**
   - **System Instruction:** "You are an expert Hollywood Screenwriter adapting a novel into a Cinematic Blueprint. 1. Identify the core cinematic spine. 2. Combine minor characters to save screen time. 3. Condense the plot into a tight 15-point Save the Cat Beat Sheet."
   - **Execution:** Call `self.llm.generate_json` using **Gemini 2.5**.

3. **Create method: `logic_engine.generate_scriptment(adaptation_data, manuscript_text)`**
   - **System Instruction:** "You are an expert screenwriter creating a 'Scriptment' (a structural draft without dialogue) from a novel. Break the story down into 40 to 60 cinematic scenes based on the provided Beat Sheet. For each scene, provide ONLY the Scene Heading (Slugline) and a 2-3 sentence Action Line summarizing the visual events. DO NOT WRITE DIALOGUE."
   - **Output Format:** Return a JSON list of blocks: `[{"type": "Scene Heading", "text": "INT. LOCATION - DAY"}, {"type": "Action", "text": "Visual summary..."}]`.

4. **Finalize:** Save the generated Beat Sheet, Characters, and Scriptment blocks to a new Firestore Project, and return the `project_id` to the frontend so it can redirect to the Editor.
