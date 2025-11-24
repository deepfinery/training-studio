---
id: training
title: Training jobs
sidebar_label: Training
---

**Create a job**
1) Go to **Training** → **New job**.  
2) Choose a dataset (any ingestion with status `Ready`).  
3) Select model type (LoRA/QLoRA/full fine-tune) and base model.  
4) Configure hyperparameters:
   - **Rank / alpha** (for LoRA/QLoRA)
   - **Batch size / grad accumulation**
   - **Learning rate / warmup / scheduler**
   - **Epochs / max steps**
   - **Eval steps** and **checkpointing cadence**
5) Optional toggles: mixed precision, gradient checkpointing, max seq length.
6) Click **Launch**.

**Monitoring**
- Job status transitions: `Queued` → `Preparing` → `Training` → `Validating` → `Packaging` → `Completed` (or `Failed/Canceled`).
- Live logs and metrics (loss, eval scores) appear in the job panel.  
- You can cancel a running job from the monitor view.

**Artifacts**
- On completion, the job produces:
  - **Model artifacts** stored in the model S3 bucket.
  - **Logs/metrics** for traceability.
  - **Packaged bundle** listed in **Deploy** for download or push.
