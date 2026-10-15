# Thesis completion ticket review

Status: draft; no spec issue or implementation tickets published yet. The scope and test boundaries are proposed for review under `to-spec` and `to-tickets`.

[Read the specification](thesis-completion.md). Local T01–T37 labels below are draft references only and do not renumber existing GitHub issues or historical T-series tickets. Published titles will use the `Thesis` prefix and native GitHub issue numbers for dependencies.

These 37 slices span the revised thesis scope and the existing API gaps. They include required API, persistence, contracts, and actual consumers together. Administration remains API-only; community authoring/review gains the minimal required interface. Research slices end in usable datasets/artifacts/reports. Existing Character selection, general account administration via Clerk, and OpenAPI issue #53 are reused rather than duplicated.

Proposed checks: existing HTTP tests with real PostgreSQL where persistence matters, existing web client/state tests plus focused UI smoke checks, and one additional dataset/artifact/report boundary for research. No new browser test runner is proposed.

Please review the scope of each slice, whether every blocking edge genuinely gates its start, any tickets to merge/split, and whether these test boundaries match expectations. Proposed product defaults in the spec (Novel mapping, numeric Adventurer Rank, artifact CTFs, meaningful-day policy, opt-in sharing, and learner-authorized instructor access) become implementation instructions only after approval.

## Proposed numbered breakdown

1. **[Make authored Quests playable](thesis-completion-tickets/01-make-authored-quests-playable.md)** — **Blocked by:** None. **Delivers:** An administrator creates or edits a Quest through the existing administration API and a learner can start, answer, and review those exact questions.

2. **[Make authored Lesson blocks render consistently](thesis-completion-tickets/02-make-authored-lesson-blocks-render-consistently.md)** — **Blocked by:** None. **Delivers:** An author supplies text, code, image, and exercise blocks through the content API and learners can read them and open exercise starter code in Codelab.

3. **[Make Badge definitions and repeat awards reliable](thesis-completion-tickets/03-make-badge-definitions-and-repeat-awards-reliable.md)** — **Blocked by:** None. **Delivers:** An administrator defines valid milestones and learners receive the intended Badge count even when qualifying activities finish together.

4. **[Persist authoritative Quest Sessions and historical Results](thesis-completion-tickets/04-persist-authoritative-quest-sessions-and-historical-results.md)** — **Blocked by:** T01. **Delivers:** Learners start a timed Quest, submit once, resume the recorded session where supported, and review the questions they actually answered.

5. **[Credit Quest XP atomically](thesis-completion-tickets/05-credit-quest-xp-atomically.md)** — **Blocked by:** T04. **Delivers:** A passing Quest grants its first-pass XP exactly once and a failed request can be retried without losing the award.

6. **[Enforce Stage eligibility on every learner route](thesis-completion-tickets/06-enforce-stage-eligibility-on-every-learner-route.md)** — **Blocked by:** None. **Delivers:** Locked Stage content and attached Quests stay inaccessible until the learner meets the existing predecessor rule, with consistent explanations.

7. **[Retire content without erasing learning evidence](thesis-completion-tickets/07-retire-content-without-erasing-learning-evidence.md)** — **Blocked by:** T01, T04. **Delivers:** An administrator retires used content while learners retain their historical Results, earned XP, and accomplishments.

8. **[Bound Codelab execution and expose useful failures](thesis-completion-tickets/08-bound-codelab-execution-and-expose-useful-failures.md)** — **Blocked by:** None. **Delivers:** Learners can run supported programs and receive bounded success, compilation, runtime, timeout, and unavailable-provider feedback.

9. **[Make onboarding identity synchronization trustworthy](thesis-completion-tickets/09-make-onboarding-identity-synchronization-trustworthy.md)** — **Blocked by:** None. **Delivers:** A newly registered learner reaches Character selection using verified identity data even when optional token claims are missing.

10. **[Honor Clerk account deletion locally](thesis-completion-tickets/10-honor-clerk-account-deletion-locally.md)** — **Blocked by:** None. **Delivers:** Deleting a Clerk account removes its active local presence and prevents stale provisioning events from resurrecting it.

11. **[Deliver the first resumable Novel and chapters](thesis-completion-tickets/11-deliver-the-first-resumable-novel-and-chapters.md)** — **Blocked by:** T02, T07. **Delivers:** Learners enter a designated story-based Region as a Novel, navigate its Zones as chapters, and resume their Stage encounters.

12. **[Tag activities with competencies and difficulty](thesis-completion-tickets/12-tag-activities-with-competencies-and-difficulty.md)** — **Blocked by:** None. **Delivers:** Authors describe which programming/security skills an activity evaluates and learners can see its learning objectives and difficulty.

13. **[Record trustworthy learning interactions](thesis-completion-tickets/13-record-trustworthy-learning-interactions.md)** — **Blocked by:** T05, T12. **Delivers:** An accepted Quest submission or reading completion produces one interpretable learning record and the learner can inspect recent activity.

14. **[Establish initial learner competency after onboarding](thesis-completion-tickets/14-establish-initial-learner-competency-after-onboarding.md)** — **Blocked by:** T09, T13. **Delivers:** After Character selection a learner completes a designated assessment and sees a saved baseline of assessed skills and gaps.

15. **[Grade one coding activity from Lesson to Result](thesis-completion-tickets/15-grade-one-coding-activity-from-lesson-to-result.md)** — **Blocked by:** T08, T13. **Delivers:** A learner opens a Python exercise from a Stage, submits code, receives test feedback, and records an assessed coding accomplishment.

16. **[Teach secure development inside the sample Novel](thesis-completion-tickets/16-teach-secure-development-inside-the-sample-novel.md)** — **Blocked by:** T11, T15. **Delivers:** Learners encounter a reviewed secure-programming lesson and repair a vulnerable program within the story.

17. **[Complete a controlled artifact-based CTF](thesis-completion-tickets/17-complete-a-controlled-artifact-based-ctf.md)** — **Blocked by:** T13. **Delivers:** Learners inspect an approved challenge artifact, submit a flag within explicit authorized boundaries, and receive a recorded accomplishment.

18. **[Complete optional Side Quests with prerequisites](thesis-completion-tickets/18-complete-optional-side-quests-with-prerequisites.md)** — **Blocked by:** T03, T06, T11, T13. **Delivers:** Learners discover an optional objective, understand its prerequisites, complete its designated activity, and receive one Side Quest accomplishment.

19. **[Show meaningful learning days, streaks, and contributions](thesis-completion-tickets/19-show-meaningful-learning-days-streaks-and-contributions.md)** — **Blocked by:** T13. **Delivers:** Learners see current/longest streaks and a calendar contribution history derived from qualifying persisted learning accomplishments.

20. **[Show and optionally share accomplishment profiles](thesis-completion-tickets/20-show-and-optionally-share-accomplishment-profiles.md)** — **Blocked by:** T11, T17, T18, T19. **Delivers:** Learners see Novel, Side Quest, CTF, XP, Adventurer Rank, Badge, and learning-day evidence together and can opt into a limited shareable profile.

21. **[Let approved contributors own and submit drafts](thesis-completion-tickets/21-let-approved-contributors-own-and-submit-drafts.md)** — **Blocked by:** T11. **Delivers:** An approved contributor creates and revises their own Novel material in a small authoring flow and submits a particular revision for review.

22. **[Review and publish a specific content revision](thesis-completion-tickets/22-review-and-publish-a-specific-content-revision.md)** — **Blocked by:** T21. **Delivers:** An administrator acting as moderator reviews a submission, records a decision, and publishes only the approved revision to learners.

23. **[Discover approved learning content by interests and skills](thesis-completion-tickets/23-discover-approved-learning-content-by-interests-and-skills.md)** — **Blocked by:** T06, T12, T22. **Delivers:** Learners browse and filter approved Novels and activities by topic, competency, and difficulty while seeing eligibility reasons.

24. **[Export a privacy-aware reproducible learner dataset](thesis-completion-tickets/24-export-a-privacy-aware-reproducible-learner-dataset.md)** — **Blocked by:** T10, T13. **Delivers:** An authorized researcher exports a validated versioned dataset from accepted interactions and receives a reproducible quality/split report.

25. **[Train and evaluate the first Learner Mastery Model](thesis-completion-tickets/25-train-and-evaluate-the-first-learner-mastery-model.md)** — **Blocked by:** T24. **Delivers:** Researchers can reproduce a trained competency/performance estimator and compare its held-out predictions with a documented baseline.

26. **[Update and display mastery from the trained model](thesis-completion-tickets/26-update-and-display-mastery-from-the-trained-model.md)** — **Blocked by:** T14, T18, T25. **Delivers:** A learner completes an assessment/activity, receives a versioned per-skill mastery estimate, and sees eligible skill-gated learning choices.

27. **[Offer eligible baseline recommendations and record outcomes](thesis-completion-tickets/27-offer-eligible-baseline-recommendations-and-record-outcomes.md)** — **Blocked by:** T06, T13, T22. **Delivers:** Learners can choose a next eligible activity from a transparent baseline list and the platform records recommendation exposure and outcomes.

28. **[Train and evaluate the activity recommender](thesis-completion-tickets/28-train-and-evaluate-the-activity-recommender.md)** — **Blocked by:** T24, T27. **Delivers:** Researchers reproduce a learned recommendation artifact and report held-out ranking results against the logged baseline.

29. **[Serve adaptive recommendations using mastery and the learned model](thesis-completion-tickets/29-serve-adaptive-recommendations-using-mastery-and-the-learned-model.md)** — **Blocked by:** T26, T28. **Delivers:** Learners receive learned next-activity recommendations that reflect mastery, recent performance, prerequisites, and suitable difficulty.

30. **[Prepare approved companion training and evaluation material](thesis-completion-tickets/30-prepare-approved-companion-training-and-evaluation-material.md)** — **Blocked by:** T16, T22. **Delivers:** Researchers can inspect a reviewed tutoring corpus and held-out rubric covering RediSetHack narration, programming, debugging, security, and graduated hints.

31. **[Adapt and evaluate the companion model](thesis-completion-tickets/31-adapt-and-evaluate-the-companion-model.md)** — **Blocked by:** T30. **Delivers:** Researchers can reproduce a RediSetHack-adapted model artifact and inspect its held-out tutoring comparison with the base model.

32. **[Deliver activity-scoped companion conversations and graduated hints](thesis-completion-tickets/32-deliver-activity-scoped-companion-conversations-and-graduated-hints.md)** — **Blocked by:** T13, T31. **Delivers:** Learners ask the adapted companion for help on their current activity and receive progressively detailed hints with persistent attempt-scoped history.

33. **[Ground companion hints in approved resources](thesis-completion-tickets/33-ground-companion-hints-in-approved-resources.md)** — **Blocked by:** T22, T32. **Delivers:** The companion answers with relevant approved educational passages and inspectable source references for the current activity.

34. **[Personalize the companion through constrained learner tools](thesis-completion-tickets/34-personalize-the-companion-through-constrained-learner-tools.md)** — **Blocked by:** T29, T32. **Delivers:** The companion can explain the learner's recent results, mastery, and eligible recommendations using controlled read-only platform tools.

35. **[Evaluate the integrated companion learning journey](thesis-completion-tickets/35-evaluate-the-integrated-companion-learning-journey.md)** — **Blocked by:** T33, T34. **Delivers:** Researchers and maintainers can demonstrate whether the served companion follows the approved tutoring rubric across actual learning scenarios.

36. **[Show learner-authorized guidance analytics](thesis-completion-tickets/36-show-learner-authorized-guidance-analytics.md)** — **Blocked by:** T26. **Delivers:** A learner grants an instructor access to a bounded progress and competency summary, and the instructor can identify gaps until permission is revoked.

37. **[Verify a supportable thesis deployment](thesis-completion-tickets/37-verify-a-supportable-thesis-deployment.md)** — **Blocked by:** None. **Delivers:** Operators can deploy the existing application with correct origins and configuration, inspect readiness, and restore its data in a disposable environment.

## PRD coverage

| PRD feature | Draft slices |
| --- | --- |
| User Account Management | T09–T10; existing Clerk Dashboard retained |
| Character Selection and Player Identity | Existing capability retained; T09, T11, T20 preserve it |
| Initial Learner Assessment | T12–T14 |
| Novel-Based Learning System | T02, T07, T11, T16 |
| Interactive Programming Environment | T08, T15 |
| Secure Programming Education | T16 |
| Capture the Flag Challenges | T17 |
| Side Quest System | T18; competency gates supplied by T26 |
| Experience Points | T05; new activity slices reuse exactly-once credit patterns |
| Adventurer Rank | T18, T20 reuse existing Level formula |
| Learner Mastery System | T12–T14, T25–T26 |
| Badge and Achievement System | T03, T20; existing Badge model retained |
| Learning Streak System | T19 |
| Learning Contribution Graph | T19 |
| ML Model 1 | T24–T26 |
| ML Model 2 | T24, T27–T29 |
| Fine-Tuned LLM AI Companion Agent | T30–T32, T35 |
| Retrieval-Augmented AI Companion | T33, T35 |
| Agent Tools | T34–T35 |
| Graduated AI Hint System | T30, T32, T35 |
| Context-Aware AI Personalization | T34–T35 |
| Learner Interaction Logging | T13; extended within T15, T17–T19, T27, T32 |
| Community Discovery | T20, T23 |
| Content Creation | T01–T02, T11–T12, T21 |
| Content Moderation | T22 |

## Audit-gap coverage

| Gap | Draft slices |
| --- | --- |
| G1 Quiz storage disagreement | T01 |
| G2 Lesson format disagreement | T02 |
| G3 Badge criteria disagreement | T03 |
| G4 Unenforced sessions | T04 |
| G5 Non-atomic quiz XP | T05 |
| G6 Concurrent Badge awards | T03 |
| G7 Inconsistent prerequisite enforcement | T06, T18, T26–T29 |
| G8 Completion versus demonstrated competency | T13–T15, T19 |
| G9 Assessment integrity and version history | T01, T04 |
| G10 Destructive content deletion | T07 |
| G11 Unbounded execution/failure handling | T08 |

## Publication and sequencing

- Publish the reviewed spec as one `ready-for-agent` issue and the implementation slices as individual `ready-for-agent` issues, replacing draft references with actual issue numbers.
- Publish in the order above; every listed blocker has a lower draft number. Use native GitHub blocking relationships where supported and preserve explicit blocking references in the bodies.
- Keep parent issues unchanged. The new spec is referenced in each child body; a parent checklist rewrite or native parent mutation is unnecessary.
- Existing OpenAPI issue #53 remains independent and is not duplicated or used as an artificial blocker. Each implementation updates the documentation of its own changed interface.
- Initial code frontier: T01, T02, T03, T06, T08, T09, T10, T12. T37 can begin configuration/readiness work immediately; its staging validation also requires available infrastructure.
- Research slices T24, T25, T28, T30, T31, and T35 list external dataset/material/model/compute prerequisites. Issue dependencies do not imply that those resources already exist, authorize spending, or guarantee statistical results.
- No feature implementation is part of this planning change. Each implementation still requires its own develop-based worktree and PR.
