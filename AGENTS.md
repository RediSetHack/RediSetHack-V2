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

### Codebase exploration & knowledge graph (Graphify)

This repository maintains a knowledge graph at `graphify-out/` detailing symbols, god nodes, community clusters, and cross-file relationships. See `docs/agents/graphify.md`.

**Rules for Agents:**

- **Prefer Graph Query over Grep**: For questions about codebase architecture, symbol connections, module relationships, or finding references, **always run `rtk graphify query "<question>"` first** when `graphify-out/graph.json` exists instead of running broad `grep` or reading multiple source files sequentially.
- **Impact Analysis & Blast Radius**: Before refactoring or altering symbols, run `rtk graphify affected "<Symbol>"` to trace all incoming dependencies, callers, imports, and tests.
- **Trace Relationships**: Use `rtk graphify path "<Concept A>" "<Concept B>"` to find the shortest dependency path between components.
- **Explain Concepts**: Use `rtk graphify explain "<concept>"` for focused explanations of a specific node or symbol.
- **Architectural Hubs**: Run `rtk graphify god-nodes` to identify central hubs and shared components.
- **High-Level Navigation**: If `graphify-out/wiki/index.md` exists, consult it for navigation rather than reading raw file trees.
- **Architecture Review**: Consult `graphify-out/GRAPH_REPORT.md` for high-level community overviews and god nodes.
- **Keep Graph Current**: After modifying code files, run `rtk graphify update .` to keep the knowledge graph synchronized (AST-only, fast, zero token cost).

---

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:

- For codebase questions, first run `rtk graphify query "<question>"` when graphify-out/graph.json exists. Use `rtk graphify path "<A>" "<B>"` for relationships, `rtk graphify explain "<concept>"` for focused concepts, and `rtk graphify affected "<symbol>"` for impact analysis. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `rtk graphify update .` to keep the graph current (AST-only, no API cost).
