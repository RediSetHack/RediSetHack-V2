---
trigger: always_on
description: Consult the graphify knowledge graph at graphify-out/ for codebase and architecture questions.
---

# Graphify Knowledge Graph (Google Antigravity)

**Usage**: Fast, token-efficient architectural navigation, impact analysis, and symbol exploration.

## Rule

When `graphify-out/graph.json` exists in the repository:

1. **Prefer `rtk graphify query "<question>"` over `grep` or file search**: For questions about codebase architecture, symbol connections, module relationships, or finding references, always query Graphify first instead of running broad `grep` or reading multiple source files sequentially.
2. **Impact Analysis & Blast Radius**: Before refactoring, modifying, or renaming symbols, run `rtk graphify affected "<Symbol>"` to trace all dependent consumers, callers, imports, and tests.
3. **Trace Relationships**: Use `rtk graphify path "<Concept A>" "<Concept B>"` to find the shortest dependency path between components.
4. **Explain Concepts**: Use `rtk graphify explain "<concept>"` for focused explanations of a specific node or symbol.
5. **Architectural Hubs**: Use `rtk graphify god-nodes` to see the most connected architectural coordinators.
6. **Keep Current**: After modifying code files, run `rtk graphify update .` to keep the knowledge graph synchronized (AST-only, fast, zero token cost).
