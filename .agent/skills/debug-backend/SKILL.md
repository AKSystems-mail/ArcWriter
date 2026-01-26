---
name: debug-backend
description: Fetches recent error logs from Google Cloud Run to diagnose 500 Internal Server Errors. Use this when the user reports a crash or API error.
---

# Debug Backend

Use the `gcloud` CLI to fetch logs without leaving the IDE.

## Step 1: Fetch Logs
Run the following command to get the last 10 error logs from the backend function:

```bash
gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=10 --format="table(timestamp, textPayload)" --project=arc-studio-box
```

## Step 2: Analyze
1. Look for Python Tracebacks (e.g., KeyError, TypeError).
2. If the error is PERMISSION_DENIED, suggest IAM fixes.
3. If the error is 422, suggest checking the Pydantic model vs Frontend JSON.
