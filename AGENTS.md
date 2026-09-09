# RediSetHack V2

This repository is a **Thesis Project**.

## Team & Roles

- **Fullstack Developer & DevOps** (Maintainer & Lead): Oversees fullstack architecture, system integration, DevOps/CI/CD, and final PR merges.
- **Backend Developer**: Responsible for the NestJS backend (`apps/api`), database schemas & migrations (`packages/db`), and API endpoints.
- **Frontend Developer**: Responsible for the Next.js frontend (`apps/web`), UI components (`packages/ui`), and styling.

---

## Mandatory Development Workflow Rules

Every time a team member or agent implements a feature, bugfix, or change:
1. **Branch Out**: Create a dedicated short-lived branch branching off `develop` (e.g. `feat/<feature-name>`, `fix/<issue-name>`). Never commit or push directly to `develop` or `main`.
2. **Create a Git Worktree**: Always create and work inside an isolated `git worktree` for the branch:
   ```bash
   git worktree add ../RediSetHack-<branch-name> -b <branch-name> develop
   ```
3. **Open a Pull Request**: Push the branch and open a PR targeting `develop` for review and automated CI checks before merging.

---

## Agent skills

### Issue tracker

GitHub issues via `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context (`CONTEXT.md` and `docs/adr/` at repo root). See `docs/agents/domain.md`.

