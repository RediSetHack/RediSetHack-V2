# RediSetHack thesis completion specification

Status: draft for test-boundary and ticket review. Baseline: develop at 42fa69a, audited 2026-10-15. Scope: the pasted thesis concept and its 25 in-scope features, including repairs necessary to make the current learning journeys reliable.

## Problem Statement

Learners can select a Character, navigate learning material, answer Quests, run programs, and earn progression rewards, but the implementation does not yet deliver the thesis's story-based adaptive learning journey. There is no initial competency assessment, learner mastery model, learned activity recommender, specialized AI Companion, controlled CTF flow, Side Quest system, learning streak, or contribution graph. Community contribution and moderation are also absent.

Existing content creation and learning paths disagree about quiz question storage, Lesson block formats, and Badge criteria. Quest Sessions do not enforce their deadline on the server. Some reward writes can fail or race, locked content is exposed through another route, and hard deletion can remove accomplishment records. These gaps undermine both learner trust and the quality of the dataset needed for the thesis research.

The project needs a sequence of complete, reviewable changes that preserves the working foundation, supplies the missing learning capabilities, and produces defensible evaluation evidence for both machine-learning models and the fine-tuned companion.

## Solution

Deliver one coherent journey: register through Clerk, select a Character, complete a baseline assessment, enter a story-driven Novel, practice programming and secure development, attempt eligible Side Quests and controlled CTF challenges, and receive contextual graduated hints. Successful learning records reliable accomplishments, XP, Adventurer Rank, Badges, streaks, and contribution history. Demonstrated performance updates competency estimates and informs the next recommended activity.

Repair the existing author-to-learner journeys first. Introduce new capabilities as narrow vertical slices with their persistence, API contracts, applicable learner/contributor interface, and behavioral checks together. Prepare research data while the learning features are built. Community material becomes discoverable only after review. ML and AI success must be measured; a mock, heuristic fallback, or general-purpose chat connection alone does not fulfill the corresponding thesis requirement.

## User Stories

1. As a learner, I want registration and sign-in through Clerk, so that my identity and credentials are managed consistently.
2. As a learner, I want my verified account details synchronized reliably, so that onboarding works when token claims are incomplete.
3. As a learner, I want to select and later change a Character from the real catalog, so that my persistent identity reflects my preference.
4. As a learner, I want fundamental educational content to remain available regardless of Character, so that class choice does not restrict learning.
5. As a learner, I want my account deletion reflected in local records and future research exports, so that my data does not remain active after I leave.
6. As an administrator, I want account and role administration to stay in Clerk's Dashboard, so that there is one identity authority.
7. As a learner, I want an initial assessment after Character selection, so that my starting competencies can be established.
8. As a learner, I want to see my baseline strengths, gaps, and unassessed skills, so that I understand where to begin.
9. As a learner, I want to browse Novels and their chapters, so that learning feels like a coherent story journey.
10. As a learner, I want my current story position and completion to persist, so that I can resume at my own pace.
11. As a learner, I want Lesson text, code, images, and exercises to match what the author supplied, so that learning content is usable.
12. As an author, I want a Quest I create to be playable immediately through the learner flow, so that I can verify my assessment.
13. As a learner, I want locked activities to explain their prerequisites, so that I know what to complete next.
14. As a learner, I want those prerequisites enforced on every read/start/submit path, so that progression is consistent.
15. As a learner, I want a Quest Session with a server-enforced deadline, so that assessment timing is trustworthy.
16. As a learner, I want retries of a submission request to return the same recorded outcome, so that network errors do not create duplicate Results.
17. As a learner, I want Result review to show the questions I actually answered, so that later content edits do not rewrite my history.
18. As a learner, I want invalid question references rejected clearly, so that mistakes do not corrupt my assessment record.
19. As a learner, I want to run supported languages with standard input and useful diagnostics, so that I can practice and debug.
20. As a learner, I want bounded execution and clear provider failure messages, so that a failed program or unavailable service does not leave me waiting indefinitely.
21. As a learner, I want graded coding activities connected to the current learning unit, so that successful execution can demonstrate a specific competency.
22. As a learner, I want feedback from visible and hidden test cases without exposing answer material, so that I can improve my solution.
23. As a learner, I want secure-development examples alongside programming concepts, so that secure habits develop from the start.
24. As a learner, I want a secure-code repair exercise and explanation of its vulnerability, so that I can connect code changes to security outcomes.
25. As a learner, I want controlled CTF challenges with explicit authorized boundaries, so that I can practice cybersecurity safely.
26. As a learner, I want flag submissions to produce a private validated result, so that challenge answers cannot be retrieved from public metadata.
27. As a learner, I want optional Side Quests, so that I can practice without blocking the main story unnecessarily.
28. As a learner, I want Side Quest eligibility based on relevant rank, competencies, Badges, and prior completion, so that available challenges suit my progress.
29. As a learner, I want XP credited exactly once even when requests fail or race, so that I can trust my balance.
30. As a learner, I want my Adventurer Rank derived from the agreed progression rule, so that progression has a consistent meaning.
31. As a learner, I want valid configurable Badges and accurate repeat counts, so that achievements recognize actual milestones.
32. As a learner, I want retired content to preserve earned accomplishments, so that author maintenance does not erase my progress.
33. As a learner, I want current and longest streaks based on meaningful learning days, so that regular practice is visible.
34. As a learner, I want a contribution graph of qualifying accomplishments, so that I can see my learning history.
35. As a learner, I want retries and replays handled consistently in activity counts, so that my history is meaningful.
36. As a learner, I want a profile containing my learning accomplishments and mastery, so that I can understand my development.
37. As a learner, I want explicit control over sharing an accomplishment summary, so that I can demonstrate progress without exposing private learning data.
38. As a learner, I want per-skill mastery estimates based on demonstrated performance, so that XP is not mistaken for competency.
39. As a learner, I want missing or stale model estimates labeled honestly, so that I understand their limits.
40. As a learner, I want recommendations filtered by eligibility and learning gaps, so that suggested activities are useful and accessible.
41. As a learner, I want recommendations to reflect recent performance and suitable difficulty, so that my next activity remains appropriate.
42. As a learner, I want a safe usable fallback when model inference is unavailable, so that I can continue learning.
43. As a researcher, I want validated interaction records with attempt identity, timing, correctness, errors, hints, difficulty, and content versions, so that model inputs are interpretable.
44. As a researcher, I want reproducible privacy-aware datasets with protected access and leakage-resistant splits, so that reported model results are credible.
45. As a researcher, I want evaluated and versioned mastery and recommendation artifacts, so that both thesis models can be reproduced and compared with baselines.
46. As a learner, I want a RediSetHack-specific companion, so that help fits the platform's programming, debugging, security, and story context.
47. As a learner, I want the companion to start with small hints and escalate gradually, so that assistance supports my own problem solving.
48. As a learner, I want hint history to persist across conversations for the same activity attempt, so that repeated requests do not silently bypass the hint strategy.
49. As a learner, I want grounded explanations with approved resource references, so that I can inspect and trust the teaching material.
50. As a learner, I want the companion to use my mastery, current activity, recent results, and recommendations, so that advice is personalized.
51. As a learner, I want companion tools restricted to my authorized learning context, so that a conversation cannot access another learner's data or change rewards.
52. As a researcher, I want fine-tuning and integrated companion evaluations against a held-out rubric, so that specialization and tutoring behavior are evidenced.
53. As a contributor, I want to create and revise my own draft Novel material, so that I can contribute educational content.
54. As a contributor, I want to submit material for review and see reasons for requested revisions, so that I can improve it.
55. As a moderator, I want to approve, reject, or request revisions on a specific version, so that learners see reviewed material.
56. As a learner, I want discovery to include only approved material and useful interest/skill/difficulty filters, so that I can find suitable learning experiences.
57. As an authorized instructor, I want learner-approved access to progress, competency, and learning gaps, so that I can provide guidance without classroom management.
58. As a learner using a keyboard or screen reader, I want new learning, hint, and contribution interactions to be operable and understandable, so that I can use the platform accessibly.
59. As an operator, I want readiness information, bounded upstream calls, usable failure logs, and verified restoration, so that the thesis deployment can be supported reliably.
60. As a maintainer, I want acceptance checks for real authoring-to-learning journeys, so that passing isolated mocks cannot hide broken integrations.

## Implementation Decisions

### Established decisions retained

- Preserve Clean Architecture and single-action controllers, Clerk authentication, data-driven repeatable Badges, and shared Zod response contracts as defined by the existing four ADRs. Keep the established API prefix and current frontend Server Component/Server Action pattern.
- Keep the domain meanings of Region, Zone, Stage, Lesson, Quest, Quest Session, Result, XP Award, Level, Badge, Character, Codelab, and Event. A Quest is a multiple-choice quiz; a new Side Quest is an optional learning objective and may use existing activity types.
- Preserve the existing decision that Clerk's Dashboard handles administrator account/role management. Do not add a second management UI or credential store. New content permissions are server-enforced capabilities derived from trusted identity claims.
- Keep existing admin catalog CRUD API-only. The community-contribution and moderation flows are explicit additions from the revised thesis scope, not a replacement admin dashboard. The existing OpenAPI issue #53 remains the owner of broad documentation improvements.
- Reuse existing learner screens and web client conventions. Update only consumers required for each new or repaired journey; do not rebuild the frontend.
- Prefer a local prefactor inside its vertical slice. If a future mechanical schema/contract migration cannot land compatibly, use expand, consumer migration, and contract removal in separate green changes. No speculative repository-wide rename is part of this spec.

### Proposed release defaults for this review

These resolve ambiguities in the pasted PRD for a small complete release; they are proposals, not previously approved product decisions.

- Represent a Novel through an explicitly designated Region, chapters through its Zones, and learning encounters through Stages with attached activities. Keep existing identifiers, routes, and progress records. Add story metadata and a documented glossary mapping; ordinary legacy catalog entries need not become Novels automatically.
- Present existing numeric Level as Adventurer Rank, preserving its XP formula. Add eligibility rules where required rather than a second ranking system.
- Use Asia/Manila days for streaks and contributions, matching the existing daily Event. Count first qualifying completions and accepted successful activities; transport retries never count twice. Reading completion is recorded separately from assessed success and never treated as proof of mastery. Make the exact qualifying-event list explicit in the engagement slice.
- Begin controlled CTFs with reviewed artifact-based challenges and server-side flag checks. No externally targeted or unrestricted lab is needed. The first assessed coding and secure-code exercises may use Python while the general Codelab retains its existing supported languages.
- Keep contributor drafts private to their owner and authorized reviewers. Admins act as moderators initially; approved contributor permission comes from trusted metadata. Changes to approved content require a new reviewed revision.
- Keep profile sharing private by default, with an opt-in accomplishment summary that excludes email, raw submissions, conversations, and research identifiers. Instructor access requires a recorded learner permission and can be revoked; it does not create classes or assignments.
- Do not invent thesis model performance thresholds. Research tickets first record datasets, baselines, metrics, and an evaluation protocol; reports expose results and sample limitations. A functioning pipeline is distinct from evidence of improved learning or model performance.

### Repairs and data integrity

- Make normalized Quest questions/options the canonical play/scoring source and migrate existing authored JSON without dropping content. Keep HTTP consumers compatible while IDs and stored references migrate. Preserve the exact assessed content in each Result.
- Use compatible Lesson blocks across authoring, shared contracts, and rendering. Support current text/code/exercise behavior and preserve existing image material through an explicit renderable format; malformed known blocks must fail validation.
- Validate each Badge trigger's exact required target/fields. Prevent duplicate milestone awards under concurrency and allow safe recovery of an evaluation missed after a committed activity.
- Persist Quest Sessions with owner, content snapshot/version, start time, deadline, and terminal state. Submitting the same session twice yields its original outcome; starting a retake creates a new session. Define expiry behavior without trusting a client clock; any automatic expiry submission must use server-persisted answers.
- Persist Result creation and first-pass XP credit consistently. A failed balance update must not consume the claim permanently. Keep Stage completion's transactional behavior and preserve legitimate repeated Badge milestones.
- Apply prerequisites to metadata visibility, restricted content bodies, starts, submissions, and recommendation/tool eligibility. Learner-facing lock reasons are derived from server policy.
- Archive content with learning history; preserve Result snapshots, completion evidence, XP, and Badge history. Remove active discoverability without cascading away research or learner records. Personal-data deletion follows its separate identity/privacy policy.
- Validate execution-provider responses and enforce timeout, concurrency/quota, and sandbox boundaries appropriate to the deployed provider. Never equate request latency with learner time-on-task.

### New learning, research, and AI capabilities

- Extend content with competency and difficulty metadata and supply a real reviewed sample story. Introduce the initial assessment, graded code submissions, controlled CTF completions, and optional Side Quest eligibility/completion as separately demonstrable paths.
- Start interaction capture with accepted Quest submissions and reading completions, then extend it within coding, CTF, Side Quest, recommendation, and hint slices. Use stable event IDs, authenticated learner identity, content/attempt versions, server timestamps, and defined completion/assistance semantics. Do not accept client-supplied scores or XP as facts.
- Add restricted dataset export with pseudonymous identifiers, retention/exclusion rules, validation reports, and reproducible learner/time-separated evaluation splits. Treat code, conversations, and identifiers as potentially sensitive; sanitized fixtures are development evidence only.
- Train and evaluate two distinct models: a mastery/performance estimator and an activity recommender. Keep training/evaluation outside request handling and serve versioned artifacts through existing application boundaries. A simple documented model is acceptable; neither a rules-only recommender nor XP-derived mastery satisfies the ML requirement.
- Introduce a deterministic eligible-activity baseline before the trained recommender, visibly identify fallback recommendations, and record impressions, selections, and outcomes for evaluation. Model-serving tickets include the learner-visible results rather than shipping an unused inference endpoint.
- Adapt an existing LLM with an approved task-specific dataset; select the model/license/compute budget in the research preparation slice. LoRA is a permissible method, not a requirement. Do not promise a successful training result before the run and evaluation exist.
- Implement graduated tutoring around authenticated activity context with durable hint state. The fine-tuned model must obey the same server-side access/tool boundaries as any other model. Keep answer keys and hidden tests outside learner/tool context.
- Retrieve approved educational passages with versioned source references and revoke retrieval access when content approval changes. Store only the conversation/tool/hint information required by the defined retention and research policy.
- Start companion tools with read-only learner-scoped mastery, recommendations, eligible activities, current approved content, and the learner's recorded execution results. No tool can write XP, mark activity completion, grant roles, or initiate arbitrary external execution.
- Expose basic achievement profiles, meaningful-day aggregation, approved content discovery, and learner-authorized instructor analytics. Preserve exclusion of traditional LMS behavior.

## Testing Decisions

Proposed for approval before publication:

1. **Primary boundary: public HTTP behavior using the existing Nest/Vitest/Supertest setup.** Exercise authoring, learner reads, session/submission behavior, rewards, permissions, and response contracts. Use disposable real PostgreSQL for migration, persistence, concurrency, rollback, deletion, and cross-module author-to-learner checks. Keep external Clerk, execution, and model providers deterministic at their ports. This changes the backing fixtures for relevant scenarios, not the public seam or runner.
2. **Reuse the web client's existing boundary.** Test returned view data, request contracts, Lesson normalization, Quest countdown behavior, and user-visible errors through the existing Vitest client/state tests. Perform focused browser smoke and keyboard/screen-reader checks for the actual screens. Do not introduce a new browser/component runner just to restate contract tests.
3. **One additional boundary for research: dataset/artifact/report inputs and outputs.** A repeatable training or evaluation command consumes a versioned dataset and emits an artifact plus a report. Check leakage exclusions, reproducibility, version compatibility, and metrics on held-out data. Deterministic inference fixtures verify serving contracts; measured held-out runs establish quality. Do not assert exact generated prose or claim clinical/educational effectiveness from a unit test.
4. Good tests assert an observable outcome: an authored quiz is answerable, unauthorized access is denied, an expired session cannot gain credit, a retried completion awards once, an archived lesson's Result remains reviewable, or a recommendation excludes an ineligible activity. Avoid assertions about internal SQL builders, helper call order, decorators, or component markup.
5. Extend prior art from content CRUD/browsing, Quest start/submit/review, Stage completion, auth/profile integration, provider adapter, and web API-client/Lesson/Quest-state tests. Verify response schemas inside those scenarios as ADR-0004 requires.
6. Add the relevant database-backed acceptance scenarios to CI with isolated test data. Validate only the changed slice plus affected contracts/consumers; run the separate e2e checks where they cover the change. Cross-cutting checks belong to their feature slices rather than a late standalone testing phase.
7. Companion acceptance includes graduated hints, cross-learner isolation, answer leakage, prompt injection through retrieved content, denied tool actions, retrieval approval revocation, provider failures, and bounded context. Model/retrieval evaluation is separate from evidence that these controls work.
8. Operational validation uses a disposable staging deployment for the actual configured origins, identity flows, provider behavior, readiness, and backup restoration. Report measured results and unresolved limits; do not claim 99.9% uptime or geographic failover from source code.

## Out of Scope

Traditional LMS functionality, formal classes, attendance, gradebooks, institutional grading, scheduled instruction, live tutoring/video conferencing, unrestricted penetration testing, attacks on external targets, highly advanced offensive labs, foundation-model training/pretraining, unbounded autonomous tutoring, production-scale reinforcement learning, Git-style version control, real-time collaborative editing, unrestricted public publishing, native mobile apps, offline operation, production-scale infrastructure, and advanced social networking.

Also excluded: a replacement admin dashboard, duplicate Clerk account administration, a frontend redesign, optional Character cosmetics/class-themed narratives, a separate achievement subsystem without distinct requirements, and a second implementation of the already tracked OpenAPI work. No paid model training, provisioning, or deployment is authorized merely by preparing or approving these planning documents.

## Further Notes

- The source audit is in PR #115. Its feature counts are not effort estimates or proof of live behavior. This spec replaces ambiguous audit suggestions with explicit preserved decisions and proposed defaults.
- Existing spec #52 explicitly delegates account administration to Clerk and excludes generic admin screens. This spec retains those decisions while adding only the contributor/moderation and sharing flows required by the revised concept. Existing issues remain unchanged.
- The classroom language in Chapter 2 conflicts with the explicit out-of-scope list. The proposed release retains content creation and learner-authorized guidance analytics while excluding assignments/classes.
- Performance, concurrency, supported browser/device, accessibility, uptime, and recovery targets must be recorded in the deployment acceptance slice before measurements. They are not invented here. Production-scale availability promises need separate scope agreement.
- Research tasks can produce executable scaffolding and honest reports before sufficient real learner data exists, but the evaluated thesis models cannot be declared complete using synthetic fixtures alone. Record data/compute/approved-material prerequisites on the affected tickets.
- Coverage of the 25 PRD features and audit gaps G1–G11 is recorded in the companion ticket review. Each new issue will reference the published spec and list actual blockers using native GitHub relationships where available.
- Each implementation uses a short-lived branch from develop, an isolated worktree, and a PR back to develop. This specification does not request implementation during the planning session.
