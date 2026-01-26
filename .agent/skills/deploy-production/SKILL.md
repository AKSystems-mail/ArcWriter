---
name: deploy-production
description: Deploys the ArcWriter Frontend and Backend to Firebase Production. Use this when the user asks to 'deploy', 'go live', or 'update production'.
---

# Deploy Production

Follow these steps strictly to deploy the application.

## Step 1: Backend Deploy
1. Navigate to the `backend` directory.
2. Run: `firebase deploy --only functions`
3. **Verification:** Check output for 'Deploy complete'. If it fails due to missing secrets, ask the user to set them.

## Step 2: Frontend Deploy
1. Navigate to the `frontend` directory.
2. Run: `npm run build`
3. Navigate back to root.
4. Run: `firebase deploy --only hosting`

## Step 3: Post-Deploy Check
1. Output the live Hosting URL.
2. Remind the user to check the `/api/health` endpoint (if it exists) or try the Wizard.

Goal: Next time I say 'Deploy', you should automatically find and follow this protocol.
