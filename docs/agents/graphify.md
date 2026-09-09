# Codebase Exploration & Knowledge Graph (Graphify)

How agents and engineers should use Graphify for codebase exploration, architecture understanding, and symbol navigation.

## Core Rule: Prefer Graphify Query Over Grep

When `graphify-out/graph.json` exists, **always run `rtk graphify query "<question>"` before using `grep`, `fd`, or reading multiple files sequentially**.

Graphify maintains an indexed AST and semantic knowledge graph containing:

- **Central hubs (God nodes)**: Key architectural coordinators and domain modules
- **Community clusters**: Logical subsystems and module boundaries
- **Dependency connections**: Call graphs, imports, and cross-file relationships
- **Exact source locations**: Direct `path:line` pointers to symbols and definitions

Querying the knowledge graph uses zero additional LLM token budget for file traversal, returns concise, scoped subgraphs, and prevents flooding agent context with hundreds of lines of raw search or grep output.

## Essential Graphify Commands

Always prefix shell commands with `rtk` to minimize token consumption.

### 1. Codebase Questions & Exploration

```bash
rtk graphify query "<question>"
```

- Performs a BFS traversal starting from matched seed nodes.
- Use `--dfs` to trace deep specific execution or dependency paths:
  ```bash
  rtk graphify query "<question>" --dfs
  ```
- Use `--budget <N>` to constrain output token budget (e.g. `--budget 1500`).

### 2. Tracing Connections Between Components

```bash
rtk graphify path "<Concept A>" "<Concept B>"
```

- Finds the shortest dependency / reference path between two concepts, modules, or symbols.

### 3. Explaining Concepts or Symbols

```bash
rtk graphify explain "<symbol or concept>"
```

- Retrieves a targeted explanation and immediate connected neighbors of the node.

### 4. Updating the Graph After Edits

```bash
rtk graphify update .
```

- Fast, AST-only incremental update (zero API key cost).
- Run this after implementing changes or modifying files so subsequent queries reflect updated code.

### 5. High-Level Architecture & Reports

- Read `graphify-out/GRAPH_REPORT.md` for high-level community cohesion, god nodes, and architectural patterns.
- If `graphify-out/wiki/index.md` exists, consult it for navigation rather than reading raw file trees.
