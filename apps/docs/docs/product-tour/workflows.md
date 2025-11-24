---
sidebar_position: 2
title: Workflow Highlights
---

# Guided Workflow Highlights

Training Studio ships pre-baked workflows so new teams can move from raw documents to deployable adapters with minimal setup.

## Ingestion Flow

- Drag-and-drop uploads or point to S3/GCS buckets.
- Automatic MIME detection, checksum verification, and tagging.
- Presigned URLs let non-admins send large PDFs directly to your storage.

## Refinement + Ontologies

- The Agentic Teacher parses source files into ontologies.
- Editors can merge/delete nodes, add human notes, and export the graph.

## Synthetic Data

- Prompt templates convert ontology edges into AML dialogues.
- Preview the generated dataset before it hits S3.

## Training + Deployment

- Choose base models, LoRA/QLoRA vs. full FT, and hyperparameters.
- After a run succeeds, publish artifacts to EKS, download a vLLM bundle, or push adapters back into S3.

Bookmark this tour if you need a quick reminder of what each screen is responsible for.
