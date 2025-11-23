---
id: evaluation
title: Evaluation
sidebar_label: Evaluation
---

**Run tests**
- Open **Evaluation**. Pick a completed training run (or a deployed model) to test.
- Add prompts/cases manually or load a saved set. Each case supports an expected answer or acceptance notes.
- Run the batch; the app records model responses and marks pass/fail when an expected answer exists.

**What you’ll see**
- Per-case outputs with timestamps and latency.
- Aggregate stats (pass rate, average score if numeric grading is enabled).
- Ability to mark edge cases, add reviewer comments, and re-run after changes.

**Best practices**
- Maintain a small “smoke” set for quick checks and a broader regression set for releases.
- Re-run evaluation after changing datasets, hyperparameters, or prompts.
