# Clerk as authentication provider

Use Clerk for all authentication in V2: signup, login, email verification, password reset, and session management. The legacy system used self-managed JWT with bcrypt password hashing, a custom email verification flow via Nodemailer/Gmail, and manual token lifecycle handling. Clerk replaces all of this with a managed service that handles the security-critical surface and integrates with both NestJS (backend SDK) and Next.js (frontend components). The trade-off is vendor lock-in and a recurring cost, accepted because maintaining a secure, compliant auth implementation is ongoing work that distracts from the platform's learning features. Auth.js and Supabase Auth were alternatives; Clerk was chosen for its first-party React/Next.js components and NestJS compatibility.

## User Identification & Persistence Model

1. **Primary Key (`users.id`)**:
   - The PostgreSQL primary key is the immutable Clerk User ID (e.g. `user_2...`), matching the JWT `sub` claim.
   - Using the Clerk ID as PK avoids cascade updates when a user changes their primary email address.
   - User email is stored in `users.email` and must be non-empty upon user creation. Synthetic placeholder emails (e.g. `@users.local`) are prohibited.

2. **Session Token Template (Clerk Dashboard)**:
   - By default, Clerk session tokens only carry standard JWT claims (`sub`, `iss`, `iat`, `exp`, `sid`).
   - To enable offline, zero-network JWT verification on protected API routes, configure custom claims in the Clerk Dashboard under **Configure > JWT Templates > Session Token**:
     ```json
     {
       "email": "{{user.primary_email_address}}",
       "name": "{{user.full_name}}"
     }
     ```
   - The backend `ClerkAuthService` inspects these claims (`email` / `primary_email_address` / `email_address` and `name` / `full_name` / `firstName`). If present in the JWT, no backend roundtrip to Clerk's User API is required. If absent, it gracefully falls back to fetching via the Clerk Backend SDK.

3. **Provisioning & Synchronization Strategy**:
   - **Hybrid Provisioning**:
     1. **Post-signup sync route (`/sign-up/complete` -> `POST /v1/api/user/sync`)**: Upon completing signup, the frontend immediately calls the API to create the user in the PostgreSQL database with their actual email and name. This eliminates onboarding latency and works seamlessly in local development without requiring public webhook tunnels.
     2. **Webhooks (`POST /v1/api/clerk/webhook`)**: In production, Clerk webhooks (`user.created`, `user.updated`) provide an asynchronous backstop for email changes or external updates.
   - **Database Invariant**:
     - Creating a new user record requires a valid email address; attempting to create a user without an email throws an `InvalidUserEmailError` (HTTP 400).
     - Updating an existing user record with empty token claims preserves the user's previously stored email address.

