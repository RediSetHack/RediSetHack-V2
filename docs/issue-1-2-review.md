# Issues #1 and #2: design review

Reviewed on 2026-09-08; decisions updated on 2026-09-09. Sources: [architecture issue](https://github.com/RediSetHack/RediSetHack-V2/issues/1), [CI/CD issue](https://github.com/RediSetHack/RediSetHack-V2/issues/2), [provided specification](../REUSABLE_CICD_AND_BRANCH_RULES.md), and repository source. Confirmed decisions and unresolved questions are separated below.

## Confirmed scope

The user requires all legacy features in V2 and explicitly requests an inventory of unfinished features. That inventory is below; documenting an unfinished feature does not establish its completion requirements or authorize adding an admin UI.

There is no existing data to migrate. No legacy data import, identifier mapping, or account/progress migration is required. V2 still needs its initial schema and learning/reference content.

The selected architecture is **Clean Architecture with Single-Action Controllers**; see [ADR 0001](adr/0001-clean-architecture-single-action-controllers.md).

The supplied CI/CD specification establishes feature PRs into `develop`, promotion to `main` for production, PR verification, and SonarQube checks. The user specifies **Heroku and Vercel** for production, overriding the generic document's AWS ECR/ECS/Fargate examples. Working deployment mapping: NestJS API on Heroku and Next.js web on Vercel. Staging resources, deployment authentication, migration execution, and rollback must be adapted to those platforms; the AWS-specific examples are reference material, not an implementation requirement.

The user confirmed that **`develop` deploys to separate staging**: a staging API and database, with a Vercel preview frontend. Staging data and configuration are isolated from production. Actual app/project identifiers and provisioning remain implementation inputs.

Issue #2 requires local worktrees and a default reviewer. The confirmed reviewer is **@theheavenlyhacker** (the corrected spelling), with the issue's one-approval requirement. The user will name another reviewer later for PRs they author; the identity is explicitly deferred. Mandatory code-owner approval remains unresolved. GitHub does not allow authors to approve their own PRs. [GitHub review rules](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/approving-a-pull-request-with-required-reviews)

The user's recollection of SonarQube is supported by a **SonarQube Cloud check suite** on the current `develop` commit. The integration exists; its analysis and quality gate are not yet verified as successful. Reuse and finish verification of this integration before adding a separate scanning setup.

## Legacy feature inventory

Inspected statically; these are code paths, not claims that every flow currently works end to end.

| Area | Existing implementation |
| --- | --- |
| Accounts | Signup with Character selection, email/password login, user/admin roles, email verification, password reset, profile display, logout |
| Learning | Region → Zone → Stage browsing, stage availability, 15 lesson content components, embedded C++ editing/execution, completion and next-stage navigation |
| Quests | Quiz browsing, acceptance, multiple-choice answers, countdown/submission, score/pass Result, answer review |
| Progression | Stage/Quest XP, Levels, milestone Badges, achievement dialogs, leaderboard |
| Events | Normal tips and Bonus XP events; current code regenerates the event on each request |
| Codelab | C++ editor, examples, standard input, output/error display, external Glot.io execution |
| Administration | API CRUD for users, Characters, Regions, Zones, Stages, Badges, Quests; no admin UI |
| Email | Verification/reset mail via Nodemailer/Gmail |

Sources: [legacy API](../LEGACY/redisetcode-api/src/), [legacy UI](../LEGACY/redisetcode-react/src/pages/). Established vocabulary is recorded in [CONTEXT.md](../CONTEXT.md).

## Unfinished legacy features

| Feature | What is unfinished | Evidence |
| --- | --- | --- |
| Profile editing | Edit route has an empty form; profile Edit button is commented out. | [EditProfile.jsx](../LEGACY/redisetcode-react/src/pages/Profile/EditProfile.jsx), [Profile.jsx](../LEGACY/redisetcode-react/src/pages/Profile/Profile.jsx) |
| Pomodoro | Advertised on the homepage; no working timer implementation was found. | [Home.jsx](../LEGACY/redisetcode-react/src/pages/Home/Home.jsx) |
| Hidden Quests | Unreachable placeholder modal; event generation only produces Normal and Bonus events. | [Map.jsx](../LEGACY/redisetcode-react/src/pages/Map/Map.jsx), [event.controller.js](../LEGACY/redisetcode-api/src/events/event.controller.js) |
| Pro membership | Basic/pro flags and incomplete UI exist, but no purchase/subscription flow or server entitlement enforcement was found. | [legacy models](../LEGACY/redisetcode-api/src/), [legacy pages](../LEGACY/redisetcode-react/src/pages/) |
| Stage sorting | Name/Stage controls have no handlers. | [Stage.jsx](../LEGACY/redisetcode-react/src/pages/Stage/Stage.jsx) |
| Daily events | Same-day reuse logic is commented out; requests can generate different events on the same day. | [event.controller.js](../LEGACY/redisetcode-api/src/events/event.controller.js) |

Administration is **API-only**, with working CRUD code paths but no admin UI. This is a capability boundary, not evidence of a partially built admin interface.

Existing defects must not become parity requirements: client-controlled bonus rewards, repeat reward awards, answers exposed during active quizzes, and missing server enforcement of quiz timing/progression eligibility. Authentication and code-execution boundaries also require correction.

## Accepted architecture

Use Clean Architecture: Domain holds business rules; Application contains use cases and the interfaces they require; Infrastructure implements persistence and external integrations; Presentation exposes the HTTP API. Dependencies point inward, keeping Domain and Application independent of NestJS HTTP handling and database implementations.

Apply the Single-Action Controller pattern as one HTTP action per controller class, delegating to its application use case. HTTP validation and response mapping remain at the presentation boundary; reward, progression, and assessment rules belong inward. Shared authentication/authorization handling should not be copied into each controller. This is a project convention implemented with NestJS controllers. [NestJS routing](https://docs.nestjs.com/controllers)

Stage completion and Quest submission both change rewards. Their shared rules and transaction boundaries are now defined below. The existing database package can implement persistence behind application interfaces; no legacy-data migration is required. Separate deployment of domain modules and CQRS have not been requested.

## Confirmed behavioral rules

These decisions correct legacy defects and establish V2's authoritative behavior. Legacy code references are included to show what each rule replaces.

### Quest retries

Unlimited retakes permitted; XP awarded on **first passing attempt only**. The server tracks whether a user has already earned XP for a given Quest and rejects duplicate awards regardless of client behavior. Legacy awarded XP on every submission without checking for prior attempts ([`quests.controller.js:120–180`](../LEGACY/redisetcode-api/src/quests/quests.controller.js)).

### Stage unlocking

Server-enforced sequential progression. A Stage's lesson content and completion endpoint are rejected unless its predecessor is completed. Stage 1 is always available. Legacy only gated the listing status; direct API access bypassed it ([`stages.controller.js:74–118`](../LEGACY/redisetcode-api/src/stages/stages.controller.js)).

### XP authority

All XP calculations are **server-authoritative**. The server determines base amounts, bonus multipliers, and event modifiers. No client input (cookies, request parameters) influences XP amounts. Legacy let the client set event type via a browser cookie that doubled XP ([`Map.jsx`](../LEGACY/redisetcode-react/src/pages/Map/Map.jsx), [`Lesson.jsx`](../LEGACY/redisetcode-react/src/pages/Lesson/Lesson.jsx)).

### Daily events

One event per calendar day (Philippine Standard Time). Generated on first request, cached, and returned identically for all subsequent requests that day. The event type (Normal or Bonus) affects server-side XP multipliers. Legacy regenerated a random event on every request with caching commented out ([`event.controller.js:38–48`](../LEGACY/redisetcode-api/src/events/event.controller.js)).

### Codelab — multi-language

V2 supports **C++, C, Python, JavaScript, and Java**. Code execution requires authentication (legacy exposed it as a public unauthenticated endpoint). Provider selection (Glot.io, Piston, Judge0, etc.) is deferred to implementation; the provider must support all five languages. Additional languages can be enabled later by configuration.

### Badge multiplicity

Badges can be earned **multiple times**, following a GitHub-style achievement model (e.g. "Pull Shark ×3"). Each award is a separate record with a count or timestamp, not a unique-or-nothing flag. Different badges use **different trigger types**: cumulative milestones (e.g. "Complete 5 stages"), category milestones (e.g. "Complete all stages in a Zone"), and activity-based milestones (e.g. "Pass 10 Quests"). Badge criteria — trigger type, threshold, and target — are defined as data, not hardcoded. Legacy hardcoded badge IDs to five specific stages and pushed without duplicate checking ([`stages.controller.js:141–166`](../LEGACY/redisetcode-api/src/stages/stages.controller.js)). See [ADR 0003](adr/0003-badge-multiplicity.md).

### Authentication — Clerk

Use **Clerk** as the authentication provider with **Google and GitHub social login** enabled alongside email/password. Clerk handles signup, login, email verification, password reset, and session management. Admin vs user roles are managed via Clerk's `publicMetadata` — no separate roles table. This replaces the legacy self-managed JWT/bcrypt implementation. See [ADR 0002](adr/0002-clerk-authentication.md).

### Lesson content format

Lessons are stored as **structured JSON** — content blocks (text, code, exercise) in the database, rendered by generic UI components. This replaces the legacy approach of 15 hardcoded JSX components with inline content. Structured JSON supports admin CRUD, multiple programming languages in code blocks, and content changes without code deployment.

## CI/CD review findings

These findings review the generic source document. ECS/container-specific findings (4–5 and parts of 7) explain why its examples cannot be copied unchanged; they do not add AWS scope to the confirmed Heroku/Vercel target.

1. **Required check names disagree.** Specification §2.2 requires `verify` and `SonarQube / Quality Gate`; §2.3 requires `verify` and `SonarQube`; workflow display names are `Verify (Lint, Typecheck, Test, Build)` and `SonarQube Quality Gate`. The live ruleset instead requires `sonarqube` from a specific integration. Select checks from actual emitted runs and align their producer identities before enforcing them.
2. **Verification is not wired to this repository.** `turbo.json` has no `test` or `test:cov` tasks, and both apps lack `check-types` scripts. API e2e tests have a separate command. The multi-task Turbo command does not impose the promised lint → types → tests → build sequence; use explicit steps or dependencies. [Turbo task ordering](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
3. **Scanning does not establish a passing quality gate.** §3.3 uploads analysis but specifies neither a gate wait/check nor project configuration and coverage ingestion. Configure the project, source/test scope, LCOV report generation/import, and an actual blocking gate. Self-hosted Sonar also needs its host URL. [Sonar action configuration](https://github.com/SonarSource/sonarqube-scan-action), [gate enforcement](https://docs.sonarsource.com/sonarqube-server/10.0/analyzing-source-code/ci-integration/overview)
4. **The rollback baseline can be wrong.** §3.4 saves the latest task-definition family revision, which may never have been deployed successfully. Capture the service's deployed revision before registering the replacement. The script changes only the service revision; it cannot undo preceding database migrations. Migrations must remain compatible with the previous application version. [AWS task-definition lookup semantics](https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_DescribeTaskDefinition.html)
5. **Container selection is inconsistent.** Image mutation and exit-code checks use container index zero; migration/seed overrides use the name `app`. Select the same named container throughout, including the standalone task runner.
6. **Delivery checks are incomplete.** The deploy workflow depends only on its local verification job, not the Sonar workflow. Its staging caller has path filters that omit shared verification configuration such as `turbo.json`. Stabilization alone should not be treated as proof of application-level correctness. Wire gates to the deployed revision and define an application smoke check.
7. **Migration examples need adaptation.** This repository defines `db:migrate` in `@repo/db`, not in an app, and has no seed command. One-off tasks need the built migration tooling and files available in their image. The template's arbitrary command interpolation also needs safe argument/JSON construction.
8. **Policy prose and setup differ.** The setup script omits required conversation resolution; `main` approvals are 1–2 in the table but one in the script. Code-owner review on `develop` is optional. It creates classic branch protection while the repository already has a ruleset; reconcile both instead of accumulating conflicting policies. The document does not address the existing CodeQL/code-quality requirements.
9. **Public PRs need a usable analysis path.** The workflow expects secrets on every PR; fork PRs do not receive normal Actions secrets, and Dependabot uses separate secrets. Define a supported analysis path without exposing credentials to untrusted PR code. [GitHub security guidance](https://docs.github.com/en/actions/reference/security/secure-use), [Dependabot secrets](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-on-actions)

Other template corrections: put Dependabot at `.github/dependabot.yml` (the tree contradicts §3.8); pin Actions if SHA pinning is intended; replace the placeholder binary-release build with an applicable artifact flow. A commit-derived image tag still needs registry immutability or digest-based deployment to prevent replacement. Environment-specific rebuilds are not promotion of the same tested artifact.

## Observed GitHub state

At review time, the only remote branch was `develop`. Active ruleset [`main`](https://github.com/RediSetHack/RediSetHack-V2/rules/22509048) targets the default branch, with one approval, force-push blocking, CodeQL, code quality, and the `sonarqube` status check. It has no bypass actors, stale-review dismissal, mandatory code-owner approval, or conversation-resolution requirement.

No workflows, CODEOWNERS, or Sonar configuration are committed. Repository Actions secret names, variable names, and environment names returned empty lists. Organization-level configuration and external cloud resources were not established by these queries.

On 2026-09-09, the check-runs endpoint was empty, but the separate check-suites endpoint showed [suite 90662392342](https://api.github.com/repos/RediSetHack/RediSetHack-V2/check-suites/90662392342), produced by `sonarqubecloud`, on commit `202f97026533dfa040070f3d98eb268b11fefe5c`. Its app ID `12526` matches the integration required by the active ruleset. Its status was `queued`, with no conclusion. This confirms GitHub integration activity, not a completed scan or passing quality gate; absence of an Actions workflow does not mean SonarQube is unconnected.

## Pending — revisit after rewrite

These are explicitly deferred until the core rewrite is complete.

- **Unfinished feature scope:** Decide which of the documented unfinished features (profile editing, Pomodoro, Hidden Quests, Pro membership, stage sorting) to complete. Defer until the working legacy features are rewritten and functional.
- **Admin UI:** Legacy has API-only admin CRUD. Whether to build a management UI for Regions, Zones, Stages, Quests, and Badges is deferred until a UI exists and content management needs become concrete.

## Implementation inputs — no design decision required

These are known gaps that need concrete values or verification during implementation, not user design choices.

- Identify the existing SonarQube Cloud project and verify a passing analysis/quality gate, or determine what setup remains.
- The user will supply the backup reviewer later; resolve mandatory code-owner approval and the specification's optional review settings before enforcing them.
- Supply app/project identifiers and provision the confirmed separate staging API/database and Vercel preview target.
- Adapt deployment authentication, migration execution, smoke checks, and rollback to Heroku/Vercel; retain existing security gates unless a replacement is agreed.
- Select the code execution provider (must support C++, C, Python, JavaScript, Java).

Only documentation has changed during this review. No application implementation, GitHub settings, or deployment configuration has been changed.
