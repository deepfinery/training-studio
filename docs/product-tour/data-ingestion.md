---
id: data-ingestion
title: Data Ingestion
sidebar_label: Data ingestion
---

- Upload PDFs, text files, or rule documents from the dashboard. Files are stored in your `S3_DATA_BUCKET`.  
- Each upload is linked to your organization/workspace (multi-tenant aware).  
- After upload, the ingestion pipeline parses content and prepares it for refinement. Progress appears in the History/Jobs panel.  
- You can re-upload newer versions; the latest version is used in downstream training runs.  
- For large batches, prefer network-stable connections. Typical limits follow S3 object limits; the UI may enforce size caps for safety.
