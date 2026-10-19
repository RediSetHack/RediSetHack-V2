# RediSetHack V2 — Page & Element Spec (for Figma AI prototype)

**Product:** RediSetHack is a gamified programming-learning platform. Learners travel a **map** (Region → Zone → Stage), read **Lessons**, take timed multiple-choice **Quests**, run code in the **Codelab**, earn **XP**, **Levels** and **Badges**, and compete on a **Leaderboard**.

**Visual language:** follow `UI/DESIGN.md` exactly (Retro Y2K, **Bubblegum** palette, Press Start 2P / VT323 / Nunito, 2px borders, hard-offset shadows, radius 0, no emoji, Lucide icons, sparkles/pixel hearts/clouds as decoration). This file defines **structure and content only**; never override the styling rules.

**Metaphor:** the whole app is an early-internet **OS desktop**. Every page is a *window* on the grid-paper canvas; the main nav is a *taskbar* (Start button + window buttons + clock).

---

## 0. Global rules for the prototype

| Topic | Rule |
|---|---|
| Frame sizes | Desktop 1440×900 (content max 1200px), Mobile 390×844. Design both for every page. |
| Palette | Bubblegum only. Do not mix palettes. |
| Auth | Clerk-hosted forms skinned to the Y2K window style. Two user states: **Signed-out** (only landing/sign-in/sign-up) and **Signed-in** (everything else). Admin role only adds the Admin section (§15). |
| Language | UI copy in English. Keep labels short; ALL CAPS only where DESIGN.md says (buttons, title bars). |
| XP | Always shown as `NNN XP` (VT323). Server-authoritative; UI never lets the user edit it. |
| Status vocabulary | Stage status: `Locked` · `Unlocked` · `Completed`. Quest outcome: `Passed` · `Not passed`. |
| Glossary | Use these exact words: Region, Zone, Stage, Lesson, Quest, Quest Session, Result, XP, Level, Badge, Character, Codelab, Event. Never say "Level" for a Stage; never say "Attempt". |
| Feedback states | Every data page needs **loading** (window with striped progress bar), **empty**, and **error** (Dialog with `AlertTriangle`, "Try again" button) variants. |
| Responsive | Desktop: floating windows may overlap slightly. Mobile: windows stack full-width, taskbar becomes a bottom bar with 5 icons. |

### Global persistent elements (App Shell — on every signed-in page)

1. **Taskbar** (bottom, 36px)
   - Start button (left): opens a menu window with the 5 nav entries + "Sign out".
   - Window buttons (center): **Map · Quests · Codelab · Leaderboard · Profile** — current page shown as pressed.
   - Clock (right): local time.
2. **Header strip** (top, inside the canvas)
   - Logo wordmark "REDISETHACK" (Press Start 2P) with a sparkle.
   - **Player chip**: avatar (Character image), display name, `LV 7`, XP progress bar to next Level, `1,240 XP`.
   - User menu: profile link, sign out.
3. **Event Banner** (dismissible window under the header)
   - Today's Event badge: `NORMAL DAY` or `BONUS DAY ×2 XP` (bonus = pink sparkle + marching-ants border).
   - Message: "Today's Event: ×2 XP — make it count!" / "Today's Event: a Normal day, no XP bonus."
   - Dismiss `X` button. Error variant: banner simply hidden.
4. **Decorative layer**: ≥2 animated sparkle stars, pixel clouds in corners, custom pixel cursor.

---

## 1. Landing / Home — `/`

**Purpose:** convince a signed-out visitor to sign up; for signed-in users, a "Continue" hub.

**Signed-out layout:** hero window on grid background + feature windows.

| Element | Details |
|---|---|
| Hero window | Title bar "WELCOME.EXE". H1 "Learn to code. Level up." 1–2 line sub-copy. Primary button **SIGN UP** → `/sign-up`; secondary **SIGN IN** → `/sign-in`. |
| Feature windows ×4 (staggered) | "Map" (progress through Regions), "Quests" (timed quizzes), "Codelab" (5 languages), "Badges & XP" (collect ×N badges). Each: Lucide icon + 1-line copy. |
| Language strip | Five desktop icons: Python, JavaScript, C++, C, Java. |
| Leaderboard teaser | Window "TOP LEARNERS" with 3 static rows (rank, name, XP). |
| Footer | © line, "×××" divider. |

**Signed-in variant ("Continue" hub):** greeting; **Continue where you left off** card (next unlocked Stage: Region › Zone › Stage title, XP reward, **CONTINUE** button); today's Event card; 3 stat tiles (Level, Total XP, Badges); quick links to Quests/Codelab.

---

## 2. Sign In — `/sign-in`

Single centered window "SIGN_IN.EXE" (Clerk, restyled).

| Field / element | Type | Notes |
|---|---|---|
| Continue with Google | button (secondary) | OAuth |
| Continue with GitHub | button (secondary) | OAuth |
| "or" divider | dashed rule | |
| Email address | text input, required | valid-email validation |
| Password | password input, required | show/hide toggle (Lucide `Eye`) |
| Sign in | primary button | loading "SIGNING IN…" |
| Forgot password? | link | Clerk reset flow |
| "No account? Sign up" | link | → `/sign-up` |
| Error dialog | alert | "Incorrect email or password." |

---

## 3. Sign Up — `/sign-up`

Single window "SIGN_UP.EXE".

| Field / element | Type | Notes |
|---|---|---|
| Continue with Google / GitHub | buttons | OAuth |
| Display name | text input | |
| Email address | text input, required | |
| Password | password input, required | strength meter = striped progress bar |
| Create account | primary button | |
| Email verification step | 6-box code input + **VERIFY** + "Resend code" (cooldown timer) | second state of the same window |
| "Have an account? Sign in" | link | |
| Error states | inline under field + dialog | email taken, weak password, wrong code |

---

## 4. Choose Character — `/sign-up/complete`

**Purpose:** after signup the user picks a **Character** (avatar). Also hosts the *unregistered user* fallback.

| Element | Details |
|---|---|
| Window "PICK_YOUR_CHARACTER.EXE" | Step indicator "STEP 2 OF 2" (progress bar). |
| Character grid (radio-card group) | Each card: Character image (checkerboard placeholder when missing), **name**, short **description**; selected = accent border + pixel heart. Min. 6 cards in the prototype. |
| Preview panel | Large avatar of hovered/selected Character + name. |
| **CONFIRM CHARACTER** | primary button, disabled until one is selected; loading "SAVING…" |
| Skip for now | ghost link (pick later in Profile) |
| Error state | "Character could not be saved. Try again." |
| **Unregistered-user card** (variant) | Dialog "We're still setting up your account", **RETRY SYNC** button, **SIGN OUT** link. |

---

## 5. Map — Regions — `/map`

| Element | Details |
|---|---|
| Window "MAP.EXE" | H1 "Choose a Region". |
| Region cards (grid, 2–3 across) | Region **name**, **description**, Zone count, % complete (striped progress bar), **ENTER** button. Checkerboard placeholder illustration. |
| Order | Fixed (no user sort). |
| States | Loading skeleton windows; Empty "No Regions yet."; Error dialog. |

## 6. Map — Zones — `/map/[regionId]`

| Element | Details |
|---|---|
| Breadcrumb in title bar | `MAP › {Region name}` (segments clickable). |
| Region header | Name, description. |
| Zone cards | Zone **name**, **description**, Stage count, `x / y` completed, progress bar, **ENTER**. |
| Back | ghost button "BACK TO MAP". |
| States | Loading / Empty "No Zones in this Region." / Error. |

## 7. Map — Stages — `/map/[regionId]/[zoneId]`

| Element | Details |
|---|---|
| Breadcrumb | `MAP › {Region} › {Zone}` |
| Stage path | Vertical "level-select" path of numbered nodes (or list rows). Each Stage: **number**, **title**, **XP reward** (`50 XP`), **status chip** (`Locked` = grey + Lucide `Lock`, not clickable; `Unlocked` = yellow; `Completed` = green + `Check`). |
| Rules callout | "Finish a Stage to unlock the next one." |
| Locked tooltip | "Locked — finish the previous Stage first." |
| Zone completion | When all done: window "ZONE CLEARED" + sparkles. |
| States | Loading / Empty / Error. |

## 8. Lesson — `/map/[regionId]/[zoneId]/[stageId]`

**Purpose:** read a Stage's lesson and mark it complete to earn XP once.

| Element | Details |
|---|---|
| Breadcrumb | `MAP › Region › Zone › Stage` |
| Title window | Stage title (H1), XP chip, status chip. |
| **Lesson blocks** | Rendered in order, each in a window (types below). |
| Locked state | Info dialog "This Stage is locked — finish the Stage before it to unlock the Lesson." + **BACK TO ZONE**. |
| **Mark-complete panel** (bottom) | **MARK AS COMPLETE** (becomes disabled "COMPLETED" when done); loading "SAVING…". |
| Completion dialog | "STAGE COMPLETE!" · `+50 XP` (`×2` if bonus Event) · animated XP bar · "Next Stage unlocked: {title}" · **NEXT STAGE**, **BACK TO ZONE**. |
| Already-completed notice | "Already completed — reading it again awards no XP." |
| Error | inline alert + retry. |

**Lesson block types**
1. **Text** — heading/paragraph content.
2. **Code** — read-only code window: language label in title bar, monospace content, **COPY** button.
3. **Exercise** — prompt text + starter code window + **OPEN IN CODELAB** button (passes language + code).
4. **Unsupported** — fallback dialog "This content type isn't supported yet."

---

## 9. Quests — List — `/quests`

| Element | Details |
|---|---|
| Window "QUESTS.EXE" | H1 "Quests". Intro: "Timed quizzes. Pass to earn XP — first pass only." |
| Quest cards | **Title**, **description**, **time limit** (`01:00`, Lucide `Clock`), **passing score** (`70%`), **XP reward** (`100 XP`), best-Result chip (`Passed 90%` / `Not passed` / `Not taken`), **START** button. |
| Filter row (optional) | Tabs: All · Not taken · Passed. Search input "Search quests…". |
| **Start confirmation dialog** | "Start {title}?" "You have {mm:ss}. The timer starts immediately and submits automatically at zero." Buttons **CANCEL** (secondary), **START QUEST** (primary). |
| States | Loading / Empty "No Quests available." / Error. |

## 10. Quest Session — `/quests/[questId]/session`

**Purpose:** take a timed multiple-choice quiz. Correct answers are never shown here.

| Element | Details |
|---|---|
| Header bar | Quest **title**, "Question 3 of 10 · 2 answered", **countdown** `Time remaining: 00:42` (danger red `#FF3D6B` and pulsing at ≤10s). |
| Progress | Segmented question tracker (answered = filled, current = outlined). |
| **Question window** | Prompt text; **radio-option cards** (A/B/C/D) — single select; selected = accent border. |
| Navigation | **PREVIOUS** · **NEXT** (disabled at ends); optional question-number jump chips. |
| **SUBMIT QUEST** | primary; confirm dialog if unanswered: "You have {n} unanswered. Submit anyway?" |
| Time-up state | Dialog "TIME'S UP — submitting your answers…" (auto-submit). |
| Submit error | alert "Failed to submit. Your answers are still here — try again." + **RETRY**. |
| **Submission result window** (replaces question view) | "QUEST PASSED!" / "QUEST NOT PASSED"; `Score: 80%`; XP card (`+100 XP awarded` or `No XP awarded` + note "XP is only awarded the first time you pass a Quest"); **Badges earned** list (`Quest Master ×2`); buttons **REVIEW YOUR ANSWERS**, **RETAKE QUEST**, **BACK TO QUESTS**. |

## 11. Quest Result Review — `/quests/results/[resultId]`

| Element | Details |
|---|---|
| Summary window | Quest title, score %, `Passed`/`Not passed`, passing score, XP awarded, submitted date/time. |
| Per-question review list | Each question: prompt, all options, **your answer** marked, **correct answer** marked (Lucide check / x), correct/incorrect chip. |
| Actions | **RETAKE QUEST**, **BACK TO QUESTS**. |
| States | Loading / Not found dialog "Result not found" / Error. |

---

## 12. Codelab — `/codelab`

**Purpose:** code playground, five languages, optional stdin.

| Element | Details |
|---|---|
| Window "CODELAB.EXE" | H1 "Codelab". |
| **Language select** | Dropdown: Python, JavaScript, C++, C, Java. Switching swaps in that language's "Hello, world!" starter **only if** the code is untouched. |
| **Code editor** | Large monospace textarea (min 256px high), line-number gutter, label "Code". Can be prefilled from a Lesson Exercise. |
| **Standard input** | Smaller monospace textarea, label "Standard input (optional — for programs that read input)". |
| **RUN** | primary; "RUNNING…" with marching progress bar; disabled while running. |
| **Reset** | secondary; restores starter code (confirm dialog). |
| **Output window** | Header: `Ran in 42ms` or `Program exited with code 1`. Body: stdout (monospace); stderr in danger color. Empty: "Program produced no output." |
| Error states | Alert "Code execution failed. Your code is still here — try again."; session-expired dialog. |

---

## 13. Leaderboard — `/leaderboard`

| Element | Details |
|---|---|
| Window "LEADERBOARD.EXE" | H1 "Leaderboard". |
| **Podium** (page 1 only) | Ranks 1–3 as three cards (1st centered/tallest): pixel trophy icon (no emoji), avatar, name (or "Anonymous"), `LV n`, XP. |
| **Ranking table** | Columns **Rank · Name · Level · XP**. Current user's row highlighted (accent fill) with `(you)`. |
| **Pagination** | **PREVIOUS** · `Page 2 of 9` · **NEXT** (disabled at ends). |
| Your-rank pin | Sticky mini card "YOUR RANK #42 · 1,240 XP". |
| States | Loading / Empty "No one has earned XP yet." / Error dialog. |

---

## 14. Profile — `/profile`

| Element | Details |
|---|---|
| **Character summary window** | Large avatar (or initial placeholder), Character **name**, `Level 7 • 1,240 XP`, XP-to-next-Level bar. |
| **Stat tiles** | Stages completed, Quests passed, Badges, Rank. |
| **Badges section** | Grid (2/3/4 cols): badge image (or initial), **name**, description tooltip, **`Earned ×3`**. Empty: "No Badges earned yet — complete Quests and Codelab challenges to start earning them." |
| **Change Character section** | Same Character radio-card grid as §4, **SAVE CHARACTER**, success toast "Character updated.", error alert. |
| **Account window** | Name and email (read-only), **MANAGE ACCOUNT**, **SIGN OUT** (danger). |
| Error | "Your profile could not be loaded. Please try again later." |

---

## 15. Admin Console (role = admin) — `/admin/*`

*Backend create/get/update/delete endpoints exist for every resource below; there is no web UI yet. Style as a "Control Panel" desktop. Admin = Clerk `publicMetadata.role = "admin"`. Prototype 2 + 6×3 = **20 pages**: Access Denied, Dashboard, and for each resource a **List**, a **New** form and an **Edit** form.*

### 15.0 Admin shell (wraps every `/admin/*` page)

| Element | Details |
|---|---|
| Admin sidebar window "CONTROL_PANEL.EXE" | Desktop-icon list: Dashboard, Regions, Zones, Stages, Quests, Badges, Characters; current = pressed. Mobile: collapses to a top dropdown. |
| Breadcrumb in title bar | `ADMIN › Quests › Edit "Intro Quiz"` |
| "Back to app" link | ghost button → `/map` |
| Admin tag | Pink "ADMIN" chip next to the player chip in the header. |

### 15.1 Access Denied — `/admin` (non-admin state)

Dialog "ACCESS DENIED" with `ShieldAlert` icon: "You need an admin account to open the Control Panel." Buttons **BACK TO MAP**, **SIGN OUT**.

### 15.2 Admin Dashboard — `/admin`

| Element | Details |
|---|---|
| Stat tiles ×6 | Counts of Regions, Zones, Stages, Quests, Badge definitions, Characters; each tile links to its list. |
| Quick actions | **NEW REGION**, **NEW STAGE**, **NEW QUEST**, **NEW BADGE** buttons. |
| Content tree window | Collapsible Region › Zone › Stage › Quest outline, each node with an Edit link. |
| Today's Event card | Read-only: `NORMAL DAY` / `BONUS ×2 XP` (events are auto-generated, not editable). |
| States | Loading / Error. |

### 15.3 List page template (used by all six resources)

Route `/admin/{resource}`. Window title = resource name.

| Element | Details |
|---|---|
| Toolbar | Search input "Search {resource}…", resource-specific filter select (see table), **NEW {RESOURCE}** primary button. |
| Data table | Columns per table below; sortable headers (arrow icon); row checkbox optional. |
| Row actions | **EDIT** (→ edit page) and **DELETE** (danger, opens confirm dialog). |
| Pager | PREVIOUS · `Page 1 of 3` · NEXT. |
| Delete confirm dialog | `AlertTriangle` "Delete {name}? This cannot be undone." Cascade warning where relevant. Buttons **CANCEL**, **DELETE** (danger). |
| Toast | "{Name} deleted." / error "Could not delete. Try again." |
| States | Loading skeleton / Empty "No {resource} yet — create the first one." with **NEW** button / Error dialog. |

**Form page template** (New `/admin/{resource}/new`, Edit `/admin/{resource}/[id]`): one window with the fields below, **SAVE** (primary, "SAVING…" while busy), **CANCEL** (secondary → list), inline validation under each field, required fields marked `*`, success toast then redirect to list, error alert on failure. Edit page also shows created date and a **DELETE** (danger) button at the bottom with the confirm dialog. Edit load states: Loading / Not found "{Resource} not found" / Error.

### 15.4 Regions — `/admin/regions`, `/new`, `/[id]`

- **List columns:** Name · Slug · Sort order · Zones # · Actions. **Filter:** none.
- **Form fields:** Name* (text) · Slug* (text, auto-filled from name, unique, lowercase-kebab) · Description (textarea) · Sort order (number, default 0).
- **Delete warning:** "Deleting a Region also deletes its Zones, Stages and Quests."

### 15.5 Zones — `/admin/zones`, `/new`, `/[id]`

- **List columns:** Name · Region · Slug · Sort order · Stages # · Actions. **Filter:** Region select.
- **Form fields:** Region* (select) · Name* · Slug* (unique within the Region) · Description (textarea) · Sort order (number).
- **Delete warning:** cascades to Stages and Quests.

### 15.6 Stages — `/admin/stages`, `/new`, `/[id]`

- **List columns:** Title · Zone (Region › Zone) · XP reward · Sort order · Has Quest (yes/no chip) · Actions. **Filter:** Region select → Zone select.
- **Form fields:** Zone* (select) · Title* · Slug* (unique within the Zone) · XP reward* (number ≥ 0) · Sort order (number) · **Lesson content builder** (below).
- **Lesson content builder:** ordered, reorderable list of block windows. **ADD BLOCK** menu offers:
  - *Text* — Content* (textarea).
  - *Code* — Language* (select: Python, JavaScript, C++, C, Java) · Code* (monospace textarea).
  - *Exercise* — Prompt* (textarea) · Language* (select) · Starter code (monospace textarea).
  Each block: drag handle / **UP** / **DOWN**, **DELETE** (Lucide `Trash2`). **PREVIEW LESSON** button opens the learner view in a dialog. Empty state: "No blocks yet — add the first one."
- **Delete warning:** cascades to the Stage's Quests; learner progress rows for it are removed.

### 15.7 Quests — `/admin/quests`, `/new`, `/[id]`

- **List columns:** Title · Stage (Zone › Stage) · Questions # · Time limit · Passing % · XP reward · Actions. **Filter:** Region → Zone → Stage selects.
- **Form fields:** Stage* (select) · Title* · Description (textarea) · Time limit in seconds* (number, default 60; helper shows `mm:ss`) · Passing score %* (number 0–100, default 70) · XP reward* (number ≥ 0) · **Question builder** (below).
- **Question builder:** ordered, reorderable question cards. Each card: Prompt* (textarea) · 2–6 Option rows (text input + **radio "Correct answer" marker** + delete) · **ADD OPTION** · move up/down · delete question. **ADD QUESTION** button below. Counter "Question 2 of 5". Validation: at least 1 question, exactly one correct option per question, no empty option text. **PREVIEW QUEST** button opens a read-only session dialog.
- **Delete warning:** "Existing learner Results for this Quest are deleted too."

### 15.8 Badge definitions — `/admin/badges`, `/new`, `/[id]`

- **List columns:** Image · Name · Slug · Criteria summary (e.g. "5 stage completions") · Actions. **Filter:** Trigger select.
- **Form fields:** Name* · Slug* (unique) · Description (textarea) · Image URL (text, live preview tile with checkerboard fallback) · **Criteria builder** (below).
- **Criteria builder** (criteria are data, not code; badges can be earned multiple times): Trigger* (select: Cumulative / Zone or category completion / Activity milestone) · Target* (select: stage completions, quests passed, zone completion, codelab runs…) · Threshold* (number ≥ 1) · live sentence "Awarded each time a learner reaches **5 stage completions**." · optional **raw JSON** toggle showing the criteria object.
- **Delete warning:** "Badges already earned by learners are removed."

### 15.9 Characters — `/admin/characters`, `/new`, `/[id]`

- **List columns:** Avatar · Name · Slug · Players using it # · Actions. **Filter:** none.
- **Form fields:** Name* · Slug* (unique) · Description (textarea) · Image URL (text, live avatar preview with checkerboard fallback).
- **Delete warning:** "Players using this Character will be left with no Character selected."

---

## 16. Shared components (build once, reuse)

Window · Dialog/Alert · Button (primary/danger/secondary) · Input · Textarea · Select · Radio-card · Checkbox · Progress bar (striped, animated) · Segmented tracker · Status chip · XP chip · Badge tile · Character card · Quest card · Stage node · Table · Pager · Breadcrumb (title-bar) · Taskbar · Event banner · Toast · Desktop icon · Empty state · Skeleton window · Sparkle / cloud / heart decorations.

---

## 17. Prototype flows to wire (priority order)

1. **Onboarding:** Landing → Sign Up → Verify code → Choose Character → Map.
2. **Learn:** Map → Region → Zone → Stage (unlocked) → Lesson → Mark complete → Completion dialog → next Stage now unlocked.
3. **Locked path:** Zone list → tap locked Stage → tooltip / blocked state.
4. **Quest:** Quests list → Start dialog → Session (answer, navigate, submit) → Result window → Review answers → Retake.
5. **Quest timeout:** Session at 00:10 (red, pulsing) → Time's-up dialog → Result.
6. **Codelab:** Lesson Exercise → Open in Codelab → Run → Output (plus error-output variant).
7. **Compete:** Leaderboard page 1 (podium) → page 2.
8. **Profile:** Profile → Change Character → saved toast.
9. **Admin (optional):** Admin Dashboard → Quests list → New Quest → question builder → Save → back in list with toast.
10. **Admin delete:** any list → Delete → confirm dialog → toast.
11. **Admin guard:** signed-in learner opens `/admin` → Access Denied dialog.

## 18. Page index

| # | Page | Route | Auth |
|---|---|---|---|
| 1 | Landing / Home | `/` | public; hub when signed in |
| 2 | Sign In | `/sign-in` | public |
| 3 | Sign Up | `/sign-up` | public |
| 4 | Choose Character | `/sign-up/complete` | signed in |
| 5 | Map — Regions | `/map` | signed in |
| 6 | Map — Zones | `/map/[regionId]` | signed in |
| 7 | Map — Stages | `/map/[regionId]/[zoneId]` | signed in |
| 8 | Lesson | `/map/[regionId]/[zoneId]/[stageId]` | signed in |
| 9 | Quests list | `/quests` | signed in |
| 10 | Quest Session (+ inline result) | `/quests/[questId]/session` | signed in |
| 11 | Result Review | `/quests/results/[resultId]` | signed in |
| 12 | Codelab | `/codelab` | signed in |
| 13 | Leaderboard | `/leaderboard` | signed in |
| 14 | Profile | `/profile` | signed in |
| 15 | Admin — Access Denied | `/admin` (non-admin) | signed in |
| 16 | Admin — Dashboard | `/admin` | admin |
| 17 | Admin — Regions list | `/admin/regions` | admin |
| 18 | Admin — New Region | `/admin/regions/new` | admin |
| 19 | Admin — Edit Region | `/admin/regions/[id]` | admin |
| 20 | Admin — Zones list | `/admin/zones` | admin |
| 21 | Admin — New Zone | `/admin/zones/new` | admin |
| 22 | Admin — Edit Zone | `/admin/zones/[id]` | admin |
| 23 | Admin — Stages list | `/admin/stages` | admin |
| 24 | Admin — New Stage | `/admin/stages/new` | admin |
| 25 | Admin — Edit Stage | `/admin/stages/[id]` | admin |
| 26 | Admin — Quests list | `/admin/quests` | admin |
| 27 | Admin — New Quest | `/admin/quests/new` | admin |
| 28 | Admin — Edit Quest | `/admin/quests/[id]` | admin |
| 29 | Admin — Badge definitions list | `/admin/badges` | admin |
| 30 | Admin — New Badge definition | `/admin/badges/new` | admin |
| 31 | Admin — Edit Badge definition | `/admin/badges/[id]` | admin |
| 32 | Admin — Characters list | `/admin/characters` | admin |
| 33 | Admin — New Character | `/admin/characters/new` | admin |
| 34 | Admin — Edit Character | `/admin/characters/[id]` | admin |
