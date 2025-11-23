---
id: auth
title: Sign-in & Accounts
sidebar_label: Authentication
---

- The app uses Amazon Cognito hosted UI at your custom domain (e.g., `https://auth.studio.deepfinery.com`).  
- Sign-in options: email/password accounts in the User Pool, and any configured IdPs (e.g., Google).  
- Redirects: after login you return to `/sso/callback`; after logout you return to `/logout` then to the login page.  
- Session handling: tokens are stored client-side and attached as `Authorization: Bearer <token>` to API calls.  
- If dev bypass is enabled (`ALLOW_DEV_AUTH=true` in backend), routes are unprotected; disable this in production.
