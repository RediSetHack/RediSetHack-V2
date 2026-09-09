#!/usr/bin/env bash
set -euo pipefail

REPO="${1:-RediSetHack/RediSetHack-V2}"

echo "Configuring branch protection ruleset for develop and main on $REPO..."

# Look for existing ruleset named develop-and-main-protection or id 22509048
EXISTING_RULESET_ID=$(gh api "repos/$REPO/rulesets" --jq '.[] | select(.name == "develop-and-main-protection" or .id == 22509048) | .id' | head -n 1 || true)

PAYLOAD=$(cat <<'EOF'
{
  "name": "develop-and-main-protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "exclude": [],
      "include": [
        "refs/heads/develop",
        "refs/heads/main"
      ]
    }
  },
  "rules": [
    {
      "type": "deletion"
    },
    {
      "type": "non_fast_forward"
    },
    {
      "type": "required_linear_history"
    },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": [
          "squash",
          "rebase"
        ]
      }
    },
    {
      "type": "code_scanning",
      "parameters": {
        "code_scanning_tools": [
          {
            "tool": "CodeQL",
            "security_alerts_threshold": "high_or_higher",
            "alerts_threshold": "errors"
          }
        ]
      }
    },
    {
      "type": "code_quality",
      "parameters": {
        "severity": "errors"
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          {
            "context": "verify"
          },
          {
            "context": "sonarqube",
            "integration_id": 12526
          }
        ]
      }
    }
  ],
  "bypass_actors": [
    {
      "actor_id": 141633312,
      "actor_type": "User",
      "bypass_mode": "always"
    }
  ]
}
EOF
)

if [ -n "$EXISTING_RULESET_ID" ]; then
  echo "Updating existing ruleset $EXISTING_RULESET_ID..."
  gh api --method PUT "repos/$REPO/rulesets/$EXISTING_RULESET_ID" --input - <<< "$PAYLOAD"
else
  echo "Creating new ruleset..."
  gh api --method POST "repos/$REPO/rulesets" --input - <<< "$PAYLOAD"
fi

echo "Branch protection ruleset successfully configured for develop and main."
