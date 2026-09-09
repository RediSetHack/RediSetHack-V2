# Branch Protection Rules: `develop` and `main`

This document details the branch protection configuration applied to the `develop` (staging/integration) and `main` (production) branches of **RediSetHack-V2**.

Protection is enforced via GitHub repository ruleset `develop-and-main-protection` ([ruleset settings](https://github.com/RediSetHack/RediSetHack-V2/rules/22509048)) and can be applied/reconciled programmatically using [`scripts/setup-branch-protection.sh`](../scripts/setup-branch-protection.sh).

---

## 1. Protected Branches

- **`develop`**: Primary trunk for development and staging deployment. Feature and bugfix PRs merge into `develop`.
- **`main`**: Production release branch. Merges happen via promotion PRs from `develop` or release tags.

---

## 2. Enforced Rules Summary

| Rule Category                   | Setting                                               | Details                                                                                                                                                                                                       |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pull Request Requirement**    | Enabled                                               | Direct pushes to `develop` and `main` are blocked. All changes must be proposed via pull requests.                                                                                                            |
| **Required Approvals**          | 1 approval                                            | At least 1 approving review is required before merging.                                                                                                                                                       |
| **Dismiss Stale Approvals**     | Enabled                                               | Approvals are automatically dismissed when new commits are pushed to the PR branch.                                                                                                                           |
| **Conversation Resolution**     | Enabled                                               | All PR conversation comments and threads must be resolved before merging.                                                                                                                                     |
| **Strict Status Checks**        | Strict (`strict_required_status_checks_policy: true`) | Branches must be fully up-to-date with base before merging, and all required checks must pass.                                                                                                                |
| **Required Status Checks**      | `verify`, `sonarqube`                                 | - `verify`: Fail-fast CI workflow (`lint` &rarr; `check-types` &rarr; `test` &rarr; `build`).<br>- `sonarqube`: SonarQube Cloud static code analysis and quality gate check (GitHub App integration `12526`). |
| **Code Scanning & Quality**     | CodeQL (`high_or_higher`), Code Quality (`errors`)    | Automated static vulnerability and code scanning checks.                                                                                                                                                      |
| **Force Push Restriction**      | Blocked (`non_fast_forward`)                          | Force pushes (`git push --force`) are completely prohibited.                                                                                                                                                  |
| **Branch Deletion Restriction** | Blocked (`deletion`)                                  | Neither `develop` nor `main` can be deleted.                                                                                                                                                                  |
| **Linear History**              | Enabled (`required_linear_history`)                   | Linear Git history is enforced.                                                                                                                                                                               |
| **Allowed Merge Methods**       | Squash & Merge, Rebase & Merge                        | Merge commits are disabled to ensure a clean, linear git history.                                                                                                                                             |
| **Bypass Permissions**          | Maintainer & Lead (`@theheavenlyhacker`)              | Authorized to bypass rules for automated/emergency hotfixes and self-authored PRs.                                                                                                                            |

---

## 3. CI/CD Integration Details

### Required Status Check: `verify`

Defined in [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).
Executes the fail-fast quality pipeline on every PR and trunk push:

1. Workspace bootstrapping via [`.github/actions/setup-workspace/action.yml`](../.github/actions/setup-workspace/action.yml)
2. `pnpm turbo lint`
3. `pnpm turbo check-types`
4. `pnpm turbo test`
5. `pnpm turbo build`

### Required Status Check: `sonarqube`

Defined in [`.github/workflows/quality-gate.yml`](../.github/workflows/quality-gate.yml) and configured in [`sonar-project.properties`](../sonar-project.properties).
Executes test coverage reporting (`pnpm turbo test:cov`) and SonarQube analysis against the SonarQube Cloud GitHub integration (App ID `12526`).

---

## 4. Automation & Re-application

To re-apply or update this ruleset via the GitHub CLI:

```bash
./scripts/setup-branch-protection.sh
```
