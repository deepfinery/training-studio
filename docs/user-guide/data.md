---
id: data
title: Data & ingestion
sidebar_label: Data
---

**Uploading**
- Drop PDFs, DOCX/RTF, or plaintext rule files in **Data**. Give each upload a label; optional tags help filter later.
- Files are versioned: re-uploading replaces the active version but keeps history.
- Status shows: `Pending` → `Parsing` → `Ready` (or `Failed` with error details).

**Best practices**
- Prefer text-first sources when possible; high-fidelity PDFs work best.
- Keep related files together under a shared tag (e.g., `product=A`, `locale=US`).
- Large batches: upload during stable connectivity; the UI enforces size caps to keep uploads reliable.

**After ingestion**
- The pipeline tokenizes and normalizes text for downstream training.
- You can select any `Ready` dataset when configuring a training job.
