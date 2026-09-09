# Codebase Exploration & Knowledge Graph (Graphify)

How agents and engineers should use Graphify for codebase exploration, architecture understanding, impact analysis, and symbol navigation.

## Core Rule: Prefer Graphify Query Over Grep

When `graphify-out/graph.json` exists, **always run `rtk graphify query "<question>"` before using `grep`, `fd`, or reading multiple files sequentially**.

Graphify maintains an indexed AST and semantic knowledge graph containing:

- **Central hubs (God nodes)**: Key architectural coordinators, shared modules, and foundational contracts
- **Community clusters**: Logical subsystems and Clean Architecture boundaries
- **Dependency connections**: Call graphs, imports, re-exports, and cross-file relationships
- **Exact source locations**: Direct `path:line` pointers to symbols, classes, functions, and definitions

Querying the knowledge graph uses zero additional LLM token budget for file traversal, returns concise, scoped subgraphs, and prevents flooding agent context with hundreds of lines of raw search or grep output.

## Full Command Reference for Agents

Always prefix shell commands with `rtk` to minimize token consumption.

### 1. Codebase Questions & Exploration

```bash
rtk graphify query "<question>"
```

- Performs a BFS traversal starting from matched seed nodes.
- Trace deep execution or call chains with `--dfs`:
  ```bash
  rtk graphify query "<question>" --dfs
  ```
- Constrain output token budget with `--budget <N>`:
  ```bash
  rtk graphify query "<question>" --budget 1500
  ```

### 2. Impact Analysis & Blast Radius (`affected`)

```bash
rtk graphify affected "<Symbol>"
```

- **Run before refactoring, renaming, or modifying symbols/entities**.
- Performs a reverse dependency traversal to list all consumers, callers, imports, re-exports, and tests impacted by the target symbol.
- Optional depth filter:
  ```bash
  rtk graphify affected "<Symbol>" --depth 3
  ```

### 3. Tracing Connections Between Components (`path`)

```bash
rtk graphify path "<Concept A>" "<Concept B>"
```

- Finds the shortest dependency / reference path between two concepts, modules, or symbols.

### 4. Explaining Concepts or Symbols (`explain`)

```bash
rtk graphify explain "<symbol or concept>"
```

- Retrieves a targeted explanation and immediate connected neighbors of the node.

### 5. Identifying Key Architectural Hubs (`god-nodes`)

```bash
rtk graphify god-nodes
```

- Lists the most connected nodes in the codebase (top architectural hubs and central coordinators).

### 6. Synchronizing the Graph After Edits (`update`)

```bash
rtk graphify update .
```

- Fast, deterministic AST-only incremental update (zero API key cost).
- Run this after implementing changes or modifying files so subsequent queries reflect updated code.

### 7. High-Level Architecture & Reports

- Read `graphify-out/GRAPH_REPORT.md` for high-level community cohesion, god nodes, and architectural patterns.
- If `graphify-out/wiki/index.md` exists, consult it for navigation rather than reading raw file trees.
