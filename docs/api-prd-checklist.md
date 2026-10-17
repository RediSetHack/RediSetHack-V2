# API checklist against the thesis PRD

Reviewed: 2026-10-15. Source baseline: `develop` at `42fa69a4ae9be52c38b59d9cc30a3c90421ee9ab`.

The API implements a gamified learning foundation: Clerk authentication, character identity, a learning catalog, lesson completion, quiz scoring, XP levels, badges, profiles, and a leaderboard. The thesis-specific adaptive learning, AI Companion, cybersecurity activities, and community publishing workflows still need implementation. Several existing modules also have integration gaps that prevent treating their complete user journeys as finished.

## How to use this checklist

The requirements baseline is the project concept and Chapters 1–2 pasted by the maintainer in the audit conversation, particularly the 25 features in §1.5.1. This document records that baseline through the matrix and acceptance tasks below; it does not replace the PRD.

- **Completed** / `[x]`: the stated backend capability is implemented in source. This is not a claim that it was exercised against live services.
- **Partial**: useful implementation exists, but the full PRD behavior or integration is incomplete.
- **Missing**: no implementation of the required behavior was found in the reviewed API and supporting schema. Reusable primitives may exist.
- **Unverified**: source inspection cannot establish the deployment or quality claim.
- `[ ]` identifies remaining work. Optional enhancements and unresolved PRD decisions are explicitly labeled.

Read all **235 tracked files under `apps/api`**, including **37 test files** and **44 HTTP controller files**. This includes all eight feature modules, application wiring, repositories, DTOs, presenters, fixtures, tests, Dockerfile, README, and configuration. Also inspected the database schema, all three SQL migrations, database setup/seed, relevant shared contracts, CI workflows, domain glossary, and all four ADRs. Graphify was queried before source traversal. Generated output, dependencies, frontend behavior, production data, and live service configuration are outside this audit.

No application code was changed and no application tests were run for this documentation audit. Existing test code is evidence of intended coverage, not a passing test result.

## PRD feature matrix

| # | In-scope PRD feature | Status | Evidence and remaining work |
| --- | --- | --- | --- |
| 1 | User Account Management | Partial | Clerk session verification, provisioning, signed lifecycle webhooks, terminal local account deletion, own-user lookup, and admin/user guards exist. Administrative user/role operations and Clerk-managed signup/reset/verification configuration remain unverified. Local deletion behavior is defined in [ADR 0006](adr/0006-clerk-account-deletion.md). See [auth module][auth] and [webhook][webhook]. |
| 2 | Character Selection and Player Identity | Completed, core API | Public character catalog, validated selection, persisted character ID, and character in profile exist. Five archetypes are seeded. Class-themed narrative/cosmetics are optional in the PRD and are not implemented. See [selection][character], [seed][seed], and [profile][profile]. |
| 3 | Initial Learner Assessment | Missing | Existing Quests are general quizzes. No onboarding assessment designation, assessment assignment, competency mapping, baseline calculation, or assessment-completed state exists. See [quiz flow][quiz] and [schema][catalog]. |
| 4 | Novel-Based Learning System | Partial | Region → Zone → Stage catalog and structured lessons exist. No agreed Novel/chapter mapping, story progression model, or integrated set of coding/security/CTF activities. Lesson formats disagree across authoring and consumption; see G2. [Catalog][catalog], [content module][content], [lesson reader][lesson]. |
| 5 | Interactive Programming Environment | Partial | Authenticated execution adapter supports C, C++, Python, JavaScript, and Java with stdin/stdout/stderr/exit code. No graded coding submission, test cases, stored attempts, activity binding, or competency feedback. Live execution provider availability is unverified. [Codelab][runner]. |
| 6 | Secure Programming Education | Missing | Generic lessons can hold secure-coding prose, but no reviewed curriculum, security objectives, vulnerability scenarios, or secure-code assessment flow was found. [Lesson types][lesson-types], [seed][seed]. |
| 7 | Capture the Flag Challenges | Missing | No CTF challenge/instance model, flag validation, scoped lab lifecycle, attempt history, completion, or rewards integration. General code execution does not implement CTFs. [Registered modules][modules], [schema][catalog]. |
| 8 | Side Quest System | Missing | Current Quest means a multiple-choice quiz. No distinct optional Side Quest behavior, eligibility rules, class-themed association, or acceptance/completion lifecycle. Existing quiz/reward code can be reused. [Glossary][glossary], [Quest entity][quest-entity]. |
| 9 | Experience Points | Partial | Stage completion awards XP transactionally; quiz first-pass claims prevent repeat XP; daily bonuses exist. Quiz claim and balance update are separate writes and can lose an award on failure (G5). New activity types have no reward integration. [Stage persistence][progress-db], [quiz submission][quiz]. |
| 10 | Adventurer Rank | Partial | Numeric Level is calculated from XP and returned by profiles, leaderboard, and Stage completion. Decide whether Level satisfies Adventurer Rank or needs a different rule/name; rank-based eligibility is absent. [Level calculation][level], [stage access][access]. |
| 11 | Learner Mastery System | Missing | No competency taxonomy, skill-to-activity mapping, per-skill estimates, mastery history, or mastery API. XP and completion flags are not competency estimates. [Profile entity][profile-entity], [schema][catalog]. |
| 12 | Badge and Achievement System | Partial | Data-driven cumulative, activity, and Zone completion awards; repeat counts; catalog and earned-badge APIs exist. Authoring criteria mismatch (G3), concurrent duplicate awards (G6), and no triggers for future CTF/mastery/streak activities remain. Badges can represent achievements without adding a second subsystem. [Evaluator][badges], [criteria][badge-types]. |
| 13 | Learning Streak System | Missing | No per-user qualifying-day aggregation, current/longest streak calculation, or streak API. Daily Event is a global XP modifier, not a learner streak. [Daily Event][daily], [progression schema][progress-schema]. |
| 14 | GitHub-Inspired Learning Contribution Graph | Missing | Some accomplishment timestamps exist, but no unified qualifying activity rules, per-day counts, date-range API, or contribution history. [Progression schema][progress-schema], [Result schema][catalog]. |
| 15 | ML Model 1 — Learner Mastery Model | Missing | No model inference integration, feature pipeline, model versions, training/evaluation artifacts, or prediction persistence in the audited scope. [Modules][modules], [API dependencies][api-package]. |
| 16 | ML Model 2 — Adaptive Activity Recommendation Model | Missing | No trained recommender integration, eligible candidate selection, recommendation endpoint, recommendation history, or adaptive difficulty. Sequential Stage unlocking is a fixed rule. [Stage access][access], [modules][modules]. |
| 17 | Fine-Tuned LLM AI Companion Agent | Missing | No companion endpoint, model adapter, conversation state, specialized training artifacts, or evaluation integration. Fine-tuning can live outside NestJS, but no serving connection exists here. [Modules][modules], [API dependencies][api-package]. |
| 18 | Retrieval-Augmented AI Companion | Missing | No approved-resource ingestion, indexing/embeddings, retrieval, source citations, or retrieval authorization. [Modules][modules], [schema][catalog]. |
| 19 | Agent Tools | Missing | Existing REST use cases are potential building blocks; no companion tool registry, constrained execution, learner-scoped tool authorization, or tool audit exists. [Modules][modules]. |
| 20 | Graduated AI Hint System | Missing | No hint levels, escalation policy, persisted hint usage, solution-disclosure policy, or hint endpoint. [Modules][modules], [Result fields][catalog]. |
| 21 | Context-Aware AI Personalization | Missing | No context assembly combining learner mastery, current activity, execution results, recent history, and recommendations. [Modules][modules], [profile][profile]. |
| 22 | Learner Interaction Logging | Partial | Quiz responses/scores/pass status/submission timestamps, Stage completion timestamps, and badge timestamps are stored. No common event stream, elapsed learning time, code/error history, hint usage, difficulty, skill IDs, or model provenance. [Result schema][catalog], [progression schema][progress-schema], [runner][runner]. |
| 23 | Community Discovery | Partial | Catalog browsing and authenticated leaderboard exist. No interest/skill/difficulty discovery, moderated community catalog, or public accomplishment profile; current profile is self-only. [Content module][content], [profile controller][profile-route], [leaderboard][leaderboard]. |
| 24 | Content Creation | Partial | Admin CRUD exists for Regions, Zones, Stages, Quests, badges, and characters. No creator/instructor ownership, drafts, community submission, or publication state. Quiz and lesson authoring do not fully connect to learning consumption (G1–G2). [Content module][content], [admin repository][content-db]. |
| 25 | Content Moderation | Missing | Admin-only editing is access control; there is no submission/review queue, approve/reject/revise workflow, reviewer decisions, or approved-only publication filter. [Admin guard composition][admin-only], [catalog schema][catalog]. |

At this coarse feature level: **1 completed core API, 9 partial, and 15 missing**. These counts are not a completion percentage or an effort estimate: character selection and an ML model differ substantially in scope. The completed subfeatures below make the existing work more visible.

## Completed backend checklist

- [x] Verify Clerk session tokens and map authenticated identity; use token claims with a user-lookup fallback. [Authentication service][clerk].
- [x] Provision/synchronize local users and retrieve the current user's account. [Auth module][auth].
- [x] Verify webhook signatures; reject a webhook when its signing secret is absent. Handle user creation/update events. [Webhook][webhook].
- [x] Enforce admin/user access boundaries for all 24 admin CRUD actions. [Admin guards][admin-only], [existing HTTP tests][content-tests].
- [x] List character choices, validate selection, and persist/display the selected identity. [Selection][character], [profile][profile].
- [x] Browse Regions and Zones; list Stages with completed/available/locked status. [Content module][content].
- [x] Read an unlocked Stage's lesson and enforce predecessor completion on the dedicated lesson/completion endpoints. G7 limits the read restriction. [Access rules][access].
- [x] Record Stage completion once and update XP in the same database transaction. [Stage persistence][progress-db].
- [x] Score multiple-choice answers, persist each submission, withhold answer keys in the start response, and restrict Result review to its owner. This assumes questions exist in the learner repository's tables; G1 blocks normal authoring. [Quiz submission][quiz], [Result review][review].
- [x] Prevent passing retakes from claiming XP repeatedly using a unique user/Quest award marker; G5 remains a failure-recovery gap. [Quest repository][quest-db].
- [x] Calculate numeric Level from XP and return character/XP/Level/badge summaries in the user's profile. [Profile][profile], [level][level].
- [x] Return a paginated leaderboard ordered by XP, with a limit capped at 100. [Leaderboard][leaderboard].
- [x] Evaluate existing badge triggers and expose repeat award counts/timestamps; G3 and G6 remain. [Badge evaluator][badges].
- [x] Create one global daily event per Asia/Manila calendar day and apply its XP multiplier. [Daily Event][daily].
- [x] Validate supported execution languages and payload lengths, then forward code to the configured execution provider. [Runner][runner], [execution DTO][execute-dto].
- [x] Provide NestJS modules, Drizzle/PostgreSQL persistence, SQL migrations, development Swagger, a non-root API container, and configured lint/typecheck/test/build CI jobs. These are source/configuration capabilities, not deployment verification. [Bootstrap][bootstrap], [Dockerfile][docker], [CI][ci].

## Existing integration and correctness gaps

These are source-traced findings, not runtime reproductions. Resolve them before presenting the affected flows as finished. Each task includes the smallest useful acceptance check.

| ID | Remaining checklist item | Evidence and effect | Completion check |
| --- | --- | --- | --- |
| G1 | [ ] Connect admin-authored quiz questions to learner sessions and scoring. | Admin repository writes `quests.questionsJson`, using string question/option IDs. Learner repository reads `quest_questions` / `quest_options`, using numeric IDs. No synchronization/backfill exists in the reviewed migrations. A quiz created through admin CRUD can start with zero learner questions. [Writer][content-db], [reader][quest-db], [migration][migration2]. | Create a quiz through the admin API against PostgreSQL, start it as a learner, submit its actual question IDs, and review the expected score. Repeat after an edit. |
| G2 | [ ] Use one compatible lesson block format across authoring and reading. | Admin accepts `text`, `code` with a `code` field, and `image`; learner types expect `text`, `code` with `content`, and `exercise`. Reading only casts arrays; it does not convert formats. The permissive unknown-block contract can conceal this mismatch. [Authoring types][content-types], [validator][validators], [learner types][lesson-types], [contract][lesson-contract]. | Author every supported block through admin CRUD and read it with the expected learner contract; author an exercise successfully. |
| G3 | [ ] Align badge authoring validation with evaluator criteria. | Admin requires positive `threshold` and any nonempty `target` for every trigger. Category evaluator requires `zoneId` and a `zone_completion` target in its domain type. The intended category shape without `threshold` is rejected; a threshold-only category is accepted without its required Zone. [Validator][validators], [badge types][badge-types], [evaluator][badges]. | Create each valid criterion through HTTP and award it from real progress; reject unknown targets and malformed category criteria. |
| G4 | [ ] Persist Quest Sessions and enforce their lifecycle. | `expiresAt` is computed but never stored. Submission requires neither a started session nor an unexpired deadline; each repeat request creates a new Result. Actual elapsed time cannot be recovered. [Start][start], [submit][quiz]. | Reject unstarted/expired/replayed submissions as defined by policy; store server start/submission times and accepted attempt identity. |
| G5 | [ ] Make quiz XP claims and balance updates atomic. | Result creation, claim insertion, event lookup, and XP update are separate operations. Failure after a successful claim leaves the claim consumed without crediting XP, so a retry cannot restore the award. Stage completion already demonstrates a transaction. [Quiz][quiz], [Quest repository][quest-db], [Stage transaction][progress-db]. | Inject a failure between claim and credit, retry, and verify one correct award with no lost or duplicate XP. |
| G6 | [ ] Prevent concurrent duplicate badge awards. | Evaluation reads existing award count then inserts awards without a lock or unique milestone key. Concurrent completion/submission can over-award; the code explicitly documents this. Badge errors are logged after activity completion with no explicit retry queue. [Evaluator][badges], [badge schema][badge-schema]. | Concurrent qualifying activities produce exactly the intended milestone count; define a way to recover missed evaluations. |
| G7 | [ ] Apply prerequisite policy consistently to exposed content and quizzes. | Stage listing returns `lessonContent` even when status is `locked`, bypassing the dedicated lesson endpoint's read restriction. Quest start/submit only check existence and never check parent Stage access, rank, skills, badges, or prior challenges. [Stage presenter][stage-presenter], [access][access], [start][start], [submit][quiz]. | An ineligible learner cannot retrieve restricted lesson bodies or start/submit restricted activities through another route. |
| G8 | [ ] Define meaningful completion evidence before feeding mastery/streak/contribution data. | An unlocked Stage can be completed by a POST with no evidence of reading, solving an exercise, or passing a quiz. This may be acceptable for a reading-only lesson, but must not be treated as demonstrated competency. [Completion use case][complete]. | Reading completion and evaluated activity success have distinct semantics; only agreed qualifying events affect mastery and engagement metrics. |
| G9 | [ ] Harden assessment inputs and preserve what was assessed. | Admin permits zero questions and passing scores above 100. Submission accepts duplicate/foreign response IDs; scoring uses the last answer per question and ignores unrelated IDs. Review loads current questions rather than a saved question version. These distort future interaction datasets. [Quest DTO][create-quest-dto], [submission DTO][submit-dto], [scoring][quiz], [review][review]. | Validate meaningful question sets and score range, reject inconsistent response references, and keep past Results interpretable after content edits. |
| G10 | [ ] Protect learning evidence when content is removed. | Admin delete calls hard-delete rows. Catalog foreign keys cascade to child content, Results, XP claim markers, and Stage progress; deleting a badge definition removes its awards. Existing total XP is not recalculated by these deletes. [Admin persistence][content-db], [catalog][catalog], [progression][progress-schema], [badge schema][badge-schema]. | Agree on archive/deletion rules; deleting or retiring content must preserve the required accomplishment/research history and keep XP consistent. |
| G11 | [ ] Make execution failures bounded and useful to learners. | Provider fetch has no explicit timeout or app-selected resource limits; no rate limiter is registered. A compile-only failure with no `run` object becomes a generic error instead of structured diagnostics. The returned timing measures request latency up to response headers, not learner completion time. [Piston adapter][runner]. | Check a configured provider for successful runs, compile-only failures, runtime failures, timeouts, and abuse limits; return useful errors and clearly defined timing. |

## Remaining PRD acceptance checklist

### Accounts, onboarding, and story learning

- [x] Resolve Novel/chapter/encounter as Region/Zone/Stage, preserving existing URLs and progress; see [ADR 0007](adr/0007-novel-catalog-mapping.md).
- [ ] Add an initial assessment tied to named competencies, persist the baseline and completion state, and connect it to onboarding.
- [x] Add story introductions, seed one two-chapter Novel, and display chapter completion/resume from existing Stage Completion records. Broader assessed coding/security activities remain separate thesis work.
- [ ] Provide a usable programming-and-security learning path with reviewed teaching materials. The committed seed currently creates characters only; test fixtures are not a curriculum.
- [ ] Support graded coding activities with activity IDs, expected behavior/test cases, submissions, attempts, and feedback.
- [ ] Add secure-programming scenarios and assessments that teach and evaluate specific security objectives alongside programming.
- [ ] Add controlled CTF challenges, authorized environment boundaries, secure flag checking, attempt records, completion, and rewards.
- [ ] Add optional Side Quests and enforce the PRD's applicable prerequisites: rank, skills, badges, Novel completion, and previous challenges. Class-themed variants remain optional.
- [ ] Decide whether existing numeric Level is the Adventurer Rank. Reuse its implementation if it satisfies the agreed rule; avoid adding a parallel rank system without a requirement.
- [ ] Complete remaining account lifecycle requirements: the agreed administrative user/role operations. Local handling of Clerk account deletion is implemented per [ADR 0006](adr/0006-clerk-account-deletion.md). Verify the managed signup, login, email verification, password reset, and session configuration.

### Interaction data, mastery, and both ML models

- [ ] Define the competency taxonomy and connect every evaluated activity/question to skills and difficulty.
- [ ] Capture validated learner interaction events across assessments, coding, quizzes, CTFs, and hints with stable learner/activity/attempt identifiers and server timestamps.
- [ ] Record attempts, correctness, completion time, error categories, hint use, difficulty, and content/model versions using consistent definitions.
- [ ] Preserve longitudinal histories and distinguish first exposure, retries, hint-assisted success, and independent success when preparing model inputs.
- [ ] Create privacy-aware extraction, anonymization/pseudonymization, validation, and preprocessing for the research dataset. Restrict access and define retention/deletion behavior.
- [ ] Produce reproducible training/validation/test splits that avoid learner/time leakage, with recorded dataset versions. Training can be a separate service or offline pipeline.
- [ ] Train and evaluate the Learner Mastery Model against a documented baseline and chosen competency/performance metrics; persist model version and inference outputs.
- [ ] Expose per-skill mastery and history through a learner API and update it from accepted interaction events.
- [ ] Train and evaluate the Adaptive Activity Recommendation Model; filter candidates by prerequisites, progress, skill gaps, and availability.
- [ ] Expose recommendations and their useful rationale; record recommendation outcomes and define fallback behavior when inference is unavailable.
- [ ] Integrate difficulty adjustment if retained from §2.1, with a defined policy and measurable acceptance criteria.

### AI Companion

- [ ] Prepare an approved RediSetHack tutoring dataset and adapt an existing LLM; LoRA is an optional technique, while task-specific fine-tuning is part of the stated scope.
- [ ] Record the chosen base model, adaptation version, training/evaluation procedure, and evidence that the companion follows RediSetHack's learning approach.
- [ ] Add authenticated companion conversations and inference integration with bounded requests and failure handling.
- [ ] Retrieve approved educational material with source references and content visibility checks; index/reindex content as approval changes.
- [ ] Assemble learner-scoped context: current activity/story, mastery, recent attempts, execution results, eligible quests, and model recommendations.
- [ ] Define graduated hints and persist hint level/history; use prior attempts and mastery to control escalation without immediately disclosing complete solutions.
- [ ] Expose only approved platform tools and enforce learner authorization, argument validation, and action boundaries independently of the model's text.
- [ ] Evaluate contextual correctness, secure-programming advice, hint escalation, answer leakage, retrieval grounding, and tool misuse against representative scenarios.

### Engagement, discovery, and publishing

- [ ] Define qualifying activity and calendar-day rules, then add current/longest streaks and a learner streak API.
- [ ] Aggregate qualifying accomplishments by day for a date-range contribution graph API; prevent retries or replayed events from inflating counts unintentionally.
- [ ] Extend the profile with the agreed evidence of Novel/Side Quest/CTF completion, mastery, streaks, and history; define what other learners can see.
- [ ] Support discovery by relevant interests, skills, difficulty, and eligible learning content. A basic search/filter capability is sufficient; advanced social networking remains excluded.
- [ ] Add content ownership and the agreed contributor/instructor permissions. Reuse the current admin editing foundation.
- [ ] Add draft → submitted → approved/rejected/revision-needed behavior and store reviewer decisions; expose only approved content through learner discovery.
- [ ] Add the retained instructor analytics: authorized access to learner progress, competency, and learning gaps. Resolve the classroom/assignment conflict below before implementing those workflows.

## Data requirements: present versus missing

| PRD data | Current storage or behavior | Status / remaining work |
| --- | --- | --- |
| Learner account and identity | `users`, `characters`; Clerk ID is the user key; `deleted_users` retains deleted Clerk IDs | Local deletion and cascading removal of learner records are implemented per [ADR 0006](adr/0006-clerk-account-deletion.md); research identifiers and retention policy remain absent. |
| Scores, answers, prior quiz performance | `results.score`, `passed`, `responsesJson`, `submittedAt` | Partial; persist session identity, assessed content version, and input integrity. |
| Attempt count | Multiple Result rows can be counted per user/Quest | Derivable for quizzes only; no general attempt model or summary API. |
| Completion time | Stage completion/submission timestamps only | Missing elapsed activity time; no stored Quest start time. |
| Programming errors and code submissions | Returned transiently by Codelab | Missing persistence, activity/learner linkage for research, and error categories. |
| Hint usage, difficulty, competencies | No corresponding activity/history fields | Missing. |
| CTF performance | No CTF records | Missing. |
| Learning accomplishments | Stage progress, quiz Results, badge awards, total XP | Partial; lacks unified history, streak/contribution aggregation, and Novel/Side Quest/CTF completion. |
| Authored materials | Catalog JSONB and normalized quiz tables coexist | Partial; G1–G3 must be resolved; no owner/moderation/version model. |
| Model and AI artifacts | None in audited API/schema | Missing serving integration, dataset/model lineage, inference records, conversations, retrieval/hint/tool history. |
| Cloud storage, 99.9% uptime, geo failover | PostgreSQL client/configuration and migrations exist | Unverified deployment promises; no proof of these service levels from API source. |

Evidence: [identity schema](../packages/db/src/schema/identity.ts), [catalog schema][catalog], [progression schema][progress-schema], [badges schema][badge-schema], [execution adapter][runner].

## Non-functional requirements

| Area | Implemented foundation | Remaining checks or requirements |
| --- | --- | --- |
| Authentication and access control | Clerk verification; admin guard; own-Result check; signed webhooks | Verify deployment claims/keys; add creator/moderator permissions where agreed; apply activity eligibility consistently (G7). |
| Validation and integrity | Global whitelist/transform validation, DTO constraints, foreign keys, selected unique indexes, transactional Stage XP | Resolve G1–G10. `POST /v1/api/user/sync` accepts only an optional `name`; email comes from a Clerk-verified address, and the route returns 503 when no verified email is available. |
| Execution protection | Language allowlist and code/stdin length limits | Verify sandbox isolation/network/resource restrictions at the configured provider; add bounded requests and quotas. The adapter alone cannot prove execution isolation. |
| Privacy and encryption | Authenticated personal endpoints; no email in leaderboard response; local account deletion per [ADR 0006](adr/0006-clerk-account-deletion.md) | Dataset minimization, anonymization, and research-data retention policy remain absent. TLS and encryption at rest depend on deployment and are unverified. |
| Performance and scaling | Some indexes, a 10-connection PostgreSQL pool per client, leaderboard pagination | Define response-time/concurrency targets and measure them. Other catalog/Quest listings are unpaginated; badge evaluation makes queries per definition. No load-test or horizontal-scaling evidence was found in the reviewed configuration. |
| Reliability | Unique award/completion markers; transactional Stage updates; badge errors do not fail already-committed completions | Quiz XP atomicity, badge concurrency/recovery, provider timeout handling, readiness/health checks, operational monitoring, and backup/restore evidence remain. No health endpoint is registered. |
| Web deployment/compatibility | REST API, shared response contracts, development Swagger | CORS is hardcoded to `http://localhost:3000`; configure the actual web origin. Browser/device compatibility and accessibility require a frontend audit. |
| Build and verification | Unit/HTTP tests, separate e2e config, lint/typecheck/build scripts, CI and conditional SonarQube configuration | Existing HTTP tests predominantly substitute repositories and providers. Main CI invokes `test`, whose pattern excludes the separate `*.e2e-spec.ts` suite; no explicit `test:e2e` job is present. No PostgreSQL-backed author→learn acceptance test verifies G1–G3. |

Evidence: [bootstrap][bootstrap], [database setup](../apps/api/src/database/database.module.ts), [database client](../packages/db/src/index.ts), [API package][api-package], [test configuration](../apps/api/vitest.config.ts), [e2e configuration](../apps/api/vitest.config.e2e.ts), [CI][ci], [quality gate](../.github/workflows/quality-gate.yml).

## PRD decisions to settle

- [ ] **Novels versus the existing glossary:** `CONTEXT.md` defines Region, Zone, Stage, and Quest; the PRD uses Novel, chapter, assessment, and Side Quest. Agree on a mapping or a domain change. This audit does not silently rename those concepts.
- [ ] **Self-paced learning versus classroom journeys:** §1.5.2 excludes conventional LMS/classroom management, while stakeholder descriptions and Chapter 2 mention classes, assigning lessons, and instructor intervention. Retain content creation and agreed analytics; explicitly decide which assignment/class features are excluded.
- [ ] **Contributor scope:** community contributions are described as eventual, yet Content Creation and Content Moderation are in scope. Decide who can submit and who reviews in the thesis release.
- [ ] **Rank semantics:** decide whether numeric Level is sufficient as Adventurer Rank; the PRD does not specify named tiers or thresholds.
- [ ] **Achievements:** existing Badge multiplicity follows ADR-0003. Do not create a separate achievement system unless distinct behavior is required.
- [ ] **Optional character behavior:** cosmetics, class-themed narration, and class-specific Side Quests are optional. Fundamental educational access must stay independent of character choice.
- [ ] **Measurable quality targets:** define “fast,” expected learner/data volumes, supported browsers/devices, and accessibility criteria. Clarify whether 99.9% uptime/geo failover are thesis acceptance requirements given the exclusion of production-scale infrastructure.
- [ ] **Research acceptance:** specify datasets, baselines, metrics, evaluation procedure, and success criteria for both ML models and the fine-tuned companion. Existing scores and XP alone cannot demonstrate adaptive learning effectiveness.

SDG alignment and improved engagement/employability are project outcomes to evaluate through research; they cannot be checked off from API code inspection.

## Suggested implementation order

1. **Repair the existing learning loop:** G1–G3, then G4–G10; verify real authoring → learning → scoring → rewards with PostgreSQL. Address G11 before relying on code execution for assessed work.
2. **Agree on the domain and collect useful data:** Novel mapping, competencies, initial assessment, accepted activity/attempt events, and research privacy rules. Start collecting valid interaction data early enough to train and evaluate models.
3. **Complete learning activities and engagement:** reviewed programming/security content, graded code activities, controlled CTFs, Side Quests/prerequisites, streaks, contribution history, and profile evidence.
4. **Integrate both evaluated ML models:** mastery persistence/API and eligible activity recommendations with failure fallbacks.
5. **Deliver the evaluated AI Companion:** model adaptation, approved-resource retrieval, context assembly, controlled tools, and graduated hints. Dataset preparation can proceed alongside earlier steps.
6. **Finish the community release:** creator ownership, submission/moderation, approved content discovery, retained instructor analytics, and deployment quality checks.

No additional feature is implied by this ordering. Traditional LMS functionality, unrestricted security labs, foundation-model pretraining, autonomous unbounded tutoring, Git-style version control, real-time collaborative editing, unrestricted publishing, native apps, offline operation, production-scale infrastructure, and advanced social networking remain out of scope.

[auth]: ../apps/api/src/modules/auth/auth.module.ts
[webhook]: ../apps/api/src/modules/auth/presentation/controllers/clerk-webhook.controller.ts
[character]: ../apps/api/src/modules/auth/application/select-character.use-case.ts
[seed]: ../packages/db/src/seed.ts
[profile]: ../apps/api/src/modules/profile/application/get-profile.use-case.ts
[profile-entity]: ../apps/api/src/modules/profile/domain/entities/user-profile.entity.ts
[profile-route]: ../apps/api/src/modules/profile/presentation/controllers/get-profile.controller.ts
[clerk]: ../apps/api/src/modules/auth/infrastructure/clerk-auth.service.ts
[catalog]: ../packages/db/src/schema/catalog.ts
[content]: ../apps/api/src/modules/content/content.module.ts
[content-db]: ../apps/api/src/modules/content/infrastructure/drizzle-repositories.ts
[content-types]: ../apps/api/src/modules/content/domain/entities.ts
[content-tests]: ../apps/api/src/modules/content/content.integration.spec.ts
[validators]: ../apps/api/src/modules/content/presentation/validators.ts
[lesson]: ../apps/api/src/modules/progress/application/get-stage-lesson.use-case.ts
[lesson-types]: ../apps/api/src/modules/progress/domain/entities/lesson.entity.ts
[lesson-contract]: ../packages/contracts/src/progress/lesson.schema.ts
[runner]: ../apps/api/src/modules/codelab/infrastructure/piston-code-execution.service.ts
[execute-dto]: ../apps/api/src/modules/codelab/presentation/dto/execute-code-request.dto.ts
[modules]: ../apps/api/src/modules/features.module.ts
[glossary]: ../CONTEXT.md
[quest-entity]: ../apps/api/src/modules/quest/domain/entities/quest.entity.ts
[progress-db]: ../apps/api/src/modules/progress/infrastructure/drizzle-progress.repository.ts
[progress-schema]: ../packages/db/src/schema/progression.ts
[quiz]: ../apps/api/src/modules/quest/application/submit-quest.use-case.ts
[start]: ../apps/api/src/modules/quest/application/start-quest.use-case.ts
[review]: ../apps/api/src/modules/quest/application/view-quest-result.use-case.ts
[quest-db]: ../apps/api/src/modules/quest/infrastructure/drizzle-quest.repository.ts
[level]: ../apps/api/src/modules/profile/domain/level-calculator.ts
[access]: ../apps/api/src/modules/progress/application/stage-access.ts
[badges]: ../apps/api/src/modules/badge/application/evaluate-badges.use-case.ts
[badge-types]: ../apps/api/src/modules/badge/domain/entities/badge.entity.ts
[badge-schema]: ../packages/db/src/schema/badges.ts
[daily]: ../apps/api/src/modules/daily-event/application/get-today-event.use-case.ts
[api-package]: ../apps/api/package.json
[leaderboard]: ../apps/api/src/modules/profile/presentation/controllers/get-leaderboard.controller.ts
[admin-only]: ../apps/api/src/modules/content/presentation/controllers/admin-crud.shared.ts
[bootstrap]: ../apps/api/src/main.ts
[docker]: ../apps/api/Dockerfile
[ci]: ../.github/workflows/ci.yml
[migration2]: ../packages/db/drizzle/0002_striped_joshua_kane.sql
[stage-presenter]: ../apps/api/src/modules/content/presentation/presenters/stage.presenter.ts
[complete]: ../apps/api/src/modules/progress/application/mark-stage-complete.use-case.ts
[create-quest-dto]: ../apps/api/src/modules/content/presentation/dto/create-quest.dto.ts
[submit-dto]: ../apps/api/src/modules/quest/presentation/dto/submit-quest-request.dto.ts
