---
sidebar_position: 2
title: Launching Training Jobs
---

# Launching Training Jobs

1. Navigate to **Training** and choose a method (LoRA, QLoRA, full fine-tune, new transformer).
2. Attach an ingestion dataset (presigned upload or existing key).
3. Configure hyperparameters:
   - Sequence length, batch size, gradient accumulation.
   - Optimizer settings, ranks/alphas/dropout for adapter runs.
4. Optional: set output bucket/path overrides.

When you submit:

- Jobs show up immediately in **Job Monitor** with queued/running states.
- Logs stream in-line; download the full log set for audit trails.
- Evaluators can add scores or labels from the **History** tab once jobs finish.

To re-run a configuration, duplicate an entry from **History** and tweak just the hyperparameters or dataset reference.
