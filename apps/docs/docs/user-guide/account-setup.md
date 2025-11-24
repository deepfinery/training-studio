---
sidebar_position: 1
title: Workspace & Account Setup
---

# Workspace & Account Setup

Before you log in:

1. Provision Cognito resources and copy the pool ID, client ID, redirect URI, and Google IdP (if applicable).
2. Populate `apps/frontend/.env` and `apps/backend/.env` with the values exported by your infra repo.
3. Run `docker compose up --build` to start backend, frontend, and docs containers.

## Creating Accounts

- Visit `/register`, supply your corporate email, and confirm via email OTP.
- Admins can toggle `ALLOW_DEV_AUTH=true` in the backend only for local testing.
- Invite teammates from the Users page; each user receives Cognito invitations.

## Managing Profiles

- The **Profile** screen lets you update name, role, company, and phone metadata.
- Use the security card to rotate passwords or revoke issued tokens.

Once each user has accepted their invite, they can explore Training Studio’s dashboards.
