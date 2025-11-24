---
sidebar_position: 1
title: Platform Overview
---

# Training Studio Overview

DeepFinery Training Studio combines ingestion, ontology generation, synthetic data creation, and fine-tuning operations in one workspace. Use the dashboard to:

- Upload policy manuals, regulatory PDFs, or structured CSVs that seed ontologies.
- Launch distillation workflows that map documents into reusable rule graphs.
- Configure LoRA/QLoRA/full FT jobs with guardrails for ranks, alphas, schedulers, and adapters.
- Track job health (credits, GPU usage, SLAs) and pull audit logs for compliance teams.

The UI is divided into four columns:

1. **Navigation rail** – switch between Dashboard, Data, Training, Deploy, Credits, and Settings.
2. **Pipeline canvas** – summarize ingestion ➝ refinement ➝ training ➝ deployment steps.
3. **Job monitor** – live status for running experiments with streaming logs.
4. **History panel** – unified feed of completed jobs, uploads, and evaluation packages.

Every tenant is isolated by Cognito + DocumentDB credentials so you can safely invite compliance, quants, and ML engineers into the same workspace.
