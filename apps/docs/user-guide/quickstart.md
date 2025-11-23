---
id: quickstart
title: Quickstart (end user)
sidebar_label: Quickstart
---

1) **Sign in** via Cognito hosted UI at your custom domain (e.g., `auth.studio.deepfinery.com`).  
2) **Upload your source rules/docs** in **Data**. Drag-and-drop PDFs, text files, or rule exports; they land in the data bucket and are versioned.  
3) **Review ingested items** in **History**. Each upload shows parse status; wait for `Ready` before training.  
4) **Create a training job** in **Training**: pick the ingested dataset, choose the model family, and set training parameters (ranks, alphas, batch/grad settings).  
5) **Launch** and watch progress in **Jobs/Monitor**. You’ll see phases (prepare → train → validate → package).  
6) **Evaluate** in **Evaluation**: run test prompts, inspect responses, and record pass/fail or scores.  
7) **Deploy or download** from **Deploy**: grab the packaged artifact or push to your serving target.  
8) **Track activity** in **History**: uploads, training jobs, evaluations, deployments are all listed with timestamps and status.
