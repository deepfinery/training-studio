---
id: deploy
title: Deploy & download
sidebar_label: Deploy
---

- Completed training jobs appear in **Deploy** with their artifacts.
- Actions:
  - **Download bundle**: grab the packaged model for offline serving or further inspection.
  - **Push to target**: send to your configured serving endpoint (e.g., container registry or inference service) if enabled.
- Each deployment is tracked with status and timestamp. You can re-download older versions to roll back.

**Post-deploy checks**
- Confirm the target endpoint is healthy before routing traffic.
- Use **Evaluation** to sanity-check the deployed model with your smoke set.
