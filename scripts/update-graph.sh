#!/usr/bin/env bash
# ==============================================================================
# scripts/update-graph.sh
# 
# Incrementally updates the Graphify knowledge graph and exports the latest
# notes and canvas into the local Obsidian vault.
#
# Usage:
#   ./scripts/update-graph.sh              # Run synchronously in foreground
#   ./scripts/update-graph.sh --background # Run detached in background (for git hooks)
# ==============================================================================

set -euo pipefail

# Ensure standard user bin paths are on PATH
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

GRAPHIFY_OUT="$REPO_ROOT/graphify-out"
LOG_FILE="$GRAPHIFY_OUT/update.log"
LOCK_FILE="$GRAPHIFY_OUT/.update.lock"

# Handle install-hooks flag
if [[ "${1:-}" == "--install-hooks" ]]; then
    HOOKS_DIR="$REPO_ROOT/.git/hooks"
    mkdir -p "$HOOKS_DIR"
    for hook in post-commit post-merge; do
        cat << 'EOF' > "$HOOKS_DIR/$hook"
#!/usr/bin/env bash
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
if [ -x "$REPO_ROOT/scripts/update-graph.sh" ]; then
    "$REPO_ROOT/scripts/update-graph.sh" --background
fi
EOF
        chmod +x "$HOOKS_DIR/$hook"
    done
    echo "[INFO] Git hooks installed in $HOOKS_DIR (post-commit, post-merge)."
    exit 0
fi

# Handle background execution flag
if [[ "${1:-}" == "--background" || "${1:-}" == "-b" ]]; then
    mkdir -p "$GRAPHIFY_OUT"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Triggering background graph update..." >> "$LOG_FILE"
    if command -v setsid >/dev/null 2>&1; then
        setsid -f "$SCRIPT_PATH" --run-worker >> "$LOG_FILE" 2>&1
    else
        nohup "$SCRIPT_PATH" --run-worker >> "$LOG_FILE" 2>&1 &
    fi
    exit 0
fi

# Ensure output directory exists
mkdir -p "$GRAPHIFY_OUT"

# ------------------------------------------------------------------------------
# Concurrency guard: avoid overlapping runs
# ------------------------------------------------------------------------------
exec 200>"$LOCK_FILE"
if ! flock -n 200; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARN] Another graphify update is currently running. Skipping."
    exit 0
fi

echo "----------------------------------------------------------------"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting graph update..."
echo "----------------------------------------------------------------"

# ------------------------------------------------------------------------------
# Resolve Graphify binary / python
# ------------------------------------------------------------------------------
if command -v graphify >/dev/null 2>&1; then
    GRAPHIFY_CMD="graphify"
elif [[ -x "$HOME/.local/bin/graphify" ]]; then
    GRAPHIFY_CMD="$HOME/.local/bin/graphify"
elif [[ -x "$HOME/.local/share/uv/tools/graphifyy/bin/graphify" ]]; then
    GRAPHIFY_CMD="$HOME/.local/share/uv/tools/graphifyy/bin/graphify"
else
    echo "[ERROR] 'graphify' command not found. Please ensure graphifyy is installed." >&2
    exit 1
fi

# ------------------------------------------------------------------------------
# Resolve Obsidian Vault directory
# ------------------------------------------------------------------------------
DEFAULT_VAULT="/home/jai/Documents/RediSetHack-Vault/redisethack"

ENV_VAULT=""
if [[ -f "$REPO_ROOT/.env.local" ]]; then
    ENV_VAULT=$(grep -E '^OBSIDIAN_VAULT_DIR=' "$REPO_ROOT/.env.local" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
elif [[ -f "$REPO_ROOT/.env" ]]; then
    ENV_VAULT=$(grep -E '^OBSIDIAN_VAULT_DIR=' "$REPO_ROOT/.env" | cut -d '=' -f2- | tr -d '"' | tr -d "'" || true)
fi

OBSIDIAN_DIR="${OBSIDIAN_VAULT_DIR:-${ENV_VAULT:-$DEFAULT_VAULT}}"

# ------------------------------------------------------------------------------
# Build / Update Knowledge Graph
# ------------------------------------------------------------------------------
if [[ ! -f "$GRAPHIFY_OUT/graph.json" ]]; then
    echo "[INFO] Cold start: graph.json not found. Running initial extraction..."
    "$GRAPHIFY_CMD" extract . --code-only
else
    echo "[INFO] Incremental update: refreshing code AST..."
    "$GRAPHIFY_CMD" update . || {
        echo "[WARN] Incremental update encountered an issue, running extract fallback..."
        "$GRAPHIFY_CMD" extract . --code-only
    }
fi

# ------------------------------------------------------------------------------
# Export to HTML Visualizer
# ------------------------------------------------------------------------------
echo "[INFO] Generating interactive HTML visualizer..."
"$GRAPHIFY_CMD" export html 2>/dev/null || true

# ------------------------------------------------------------------------------
# Export to Obsidian Vault
# ------------------------------------------------------------------------------
if [[ -n "$OBSIDIAN_DIR" && -d "$OBSIDIAN_DIR" ]]; then
    echo "[INFO] Exporting graph notes and canvas to Obsidian vault: $OBSIDIAN_DIR"
    "$GRAPHIFY_CMD" export obsidian --dir "$OBSIDIAN_DIR"
else
    echo "[WARN] Obsidian vault directory not found ($OBSIDIAN_DIR). Skipping vault export."
fi

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Graph update completed successfully."

# ------------------------------------------------------------------------------
# Desktop notification (optional on Linux)
# ------------------------------------------------------------------------------
if command -v notify-send >/dev/null 2>&1; then
    notify-send -a "Graphify" -i "text-x-generic" "Graphify & Obsidian Updated" "Knowledge graph and Obsidian vault synchronized." 2>/dev/null || true
fi
