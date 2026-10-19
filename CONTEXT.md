# RediSetHack

RediSetHack is a programming learning platform with lessons, quizzes, code practice, and progression rewards. This glossary retains the established legacy vocabulary for V2.

## Language

**Region**:
A top-level grouping in the learning catalog containing Zones. A Region with a story introduction is designated as a **Novel**; existing Regions without one remain ordinary catalog groupings.

**Novel**:
A story-driven journey represented by a designated Region. Its story introduction provides context; a learner resumes at the first available Stage using the existing Stage Completion records.

**Zone**:
A subdivision of a Region containing Stages. Within a Novel, a Zone is a **chapter**.

**Stage**:
A numbered learning unit within a Zone, with lesson content and an XP reward for completion.
_Avoid_: Level when referring to a learning unit.

**Stage Completion**:
The record that a user has finished a Stage, which awards XP once and unlocks the successor Stage.
_Avoid_: Progress when referring to a single Stage.

**Lesson**:
The learning content presented for a Stage.

**Quest**:
A multiple-choice quiz with a time allowance, passing score, and XP reward.
_Avoid_: Stage when referring to an assessment.

**Side Quest**:
An optional learning objective that designates an existing assessed activity (a CTF challenge or coding activity) and is gated by prerequisite clauses (Level/Adventurer Rank, earned Badge, Novel completion, prior activity completion). Completing it records one accomplishment, XP once, and one learning event; it never blocks the main story. Skill-gated clauses deny until mastery estimates exist.
_Avoid_: Quest when referring to an optional objective (a Quest is the multiple-choice quiz).

**Quest Session**:
A learner-owned, timed attempt at a Quest, persisted with a snapshot of the questions assessed (correct answers withheld while active) and a server-set deadline. It ends exactly once, submitted or expired, and starting again after that is a retake. A submission after the deadline earns no credit.
_Avoid_: Attempt, run, active quest.

**Learning Day**:
An Asia/Manila calendar day with at least one qualifying accomplishment (completed Reading, or a passed/solved assessed activity). Logins, page views, replays, failed attempts and expired Quests never qualify. See ADR 0008.

**Learning Streak**:
Consecutive Learning Days. The current streak stays alive through a day that has not ended yet; the longest streak spans the learner's whole history.

**Contribution Graph**:
The profile's calendar of daily qualifying-accomplishment counts (reading and assessed shown separately), always with text counts and summaries alongside colour.

**Result**:
The recorded responses, score, and pass outcome of a user's Quest submission.

**XP**:
A user's accumulated experience points from learning activities, which determine their Level.
_Avoid_: Score when referring to progression rewards.

**XP Award**:
The per-user, per-Quest marker that XP has already been granted for passing, which makes retakes reward-free.
_Avoid_: Reward, score.

**Level**:
A user's progression rank determined by accumulated XP.
_Avoid_: Stage when referring to a user's rank.

**Badge**:
A named achievement that can be earned multiple times, with each award tracked separately (e.g. "×3"). Criteria are defined as data, not hardcoded.
_Avoid_: Trophy, medal

**Character**:
An avatar identity selected by a user during signup.

**Codelab**:
The code practice workspace where users edit and run programs in multiple languages and inspect their output.

**Event**:
A daily modifier (Normal or Bonus) generated once per calendar day that affects server-side XP multipliers.
_Avoid_: Notification, alert

