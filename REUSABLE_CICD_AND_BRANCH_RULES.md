# Reusable CI/CD Workflows & Branch Protection Rules Specification

This document provides a generalized, production-ready specification of the CI/CD architecture and branch protection rules extracted from this repository. It is designed to be fully modular, technology-agnostic where possible, and ready to be handed directly to an AI agent or platform engineer for implementation in any target repository.

> **RediSetHack V2 decisions (2026-09-09):** Production uses Heroku and Vercel; the AWS deployment examples below are reference material only. Use Clean Architecture with Single-Action Controllers, retain all legacy features, and use `@theheavenlyhacker` as the default reviewer. There is no existing data to migrate. See the [unfinished legacy features](docs/issue-1-2-review.md#unfinished-legacy-features), [review findings and open decisions](docs/issue-1-2-review.md), and [architecture decision](docs/adr/0001-clean-architecture-single-action-controllers.md) before adapting these templates.

> **Staging and review follow-up:** `develop` deploys to a separate staging API/database and Vercel preview frontend, isolated from production. The user will name a backup reviewer later for PRs authored by `@theheavenlyhacker`.

---

## 1. Executive Summary & Core Principles

The architecture follows modern GitOps, Trunk-Based / Promotion-Branching, and Shift-Left Security practices:

1. **Zero Long-Lived Cloud Credentials**: Authenticate to cloud providers (AWS, GCP, Azure) exclusively via **OpenID Connect (OIDC)** federated identity; no static access keys stored in repository secrets.
2. **Fail-Fast Gated Delivery**: Code progression follows a strict sequence:
   $$\text{Lint} \longrightarrow \text{Type-Check} \longrightarrow \text{Unit/Integration Tests} \longrightarrow \text{Build Compile} \longrightarrow \text{Vulnerability Scan} \longrightarrow \text{Pre-Deploy DB Migration} \longrightarrow \text{Service Rollout} \longrightarrow \text{Stabilization Wait} \longrightarrow \text{Automatic Rollback on Failure}$$
3. **Immutable Deployments & Artifacts**: Every container image or binary artifact is tagged with immutable references (`${{ github.sha }}` or semver tags). Never deploy dynamic tags like `latest` in staging or production.
4. **Isolated Ephemeral Schema Migrations**: Database migrations and data seeds run as ephemeral, one-off tasks against the target database *before* the service task definition/deployment is updated. If migrations fail, the service rollout is aborted immediately.
5. **Automated Rollback on Rollout Failure**: If a deployment fails to stabilize or pass health checks within the timeout window, the pipeline automatically triggers an instant rollback to the previous healthy task definition or release revision.
6. **Remote Caching & Dependency Isolation**: Monorepo task runners (e.g., Turborepo, Nx) utilize remote caching so CI checks and deploy verification gates share cached results across runs.

---

## 2. Branching Model & Branch Protection Rules

### 2.1 Branch Topology

```
                  ┌──────────────┐
                  │ main / prod  │  (Production environment, protected)
                  └──────▲───────┘
                         │ (Promoted via PR / Release Tag)
                  ┌──────┴───────┐
                  │   develop    │  (Staging / Integration trunk, protected)
                  └───▲──────▲───┘
                      │      │
         ┌────────────┘      └────────────┐
         │ (Feature PR)                   │ (Bugfix PR)
  ┌──────┴───────┐                 ┌──────┴───────┐
  │ feat/xyz-... │                 │ fix/abc-...  │
  └──────────────┘                 └──────────────┘
```

| Branch Pattern | Role | Deployment Target | Merge Strategy |
| :--- | :--- | :--- | :--- |
| `main` | Production release branch | Production Environment | Squash / Rebase PR only |
| `develop` | Integration & staging trunk | Staging / QA Environment | Squash / Rebase PR only |
| `feat/*`, `fix/*`, `chore/*`, `refactor/*` | Short-lived feature branches | Ephemeral / Local / PR preview | Merge into `develop` via PR |
| `release/v*`, `v*.*.*`, `punch-agent-v*` | Immutable release tags | Release Assets / Production Artifacts | Triggered on tag push or workflow dispatch |

---

### 2.2 Branch Protection Ruleset Specification

Configure branch protection rulesets (via GitHub UI, GitHub CLI, or Terraform) for both `main` and `develop` branches.

#### Rules Matrix

| Rule Policy | `main` (Production) | `develop` (Staging/Trunk) | Feature Branches |
| :--- | :--- | :--- | :--- |
| **Require Pull Request before merging** | **Yes** | **Yes** | No |
| **Required Approvals count** | 1–2 Approvals | 1 Approval | N/A |
| **Dismiss stale approvals when new commits are pushed** | **Enabled** | **Enabled** | N/A |
| **Require review from Code Owners** | **Enabled** | Optional / Enabled | N/A |
| **Require status checks to pass before merging** | **Strict** (Must be up-to-date) | **Strict** (Must be up-to-date) | N/A |
| **Required Status Checks list** | `verify`, `SonarQube / Quality Gate` | `verify`, `SonarQube / Quality Gate` | N/A |
| **Require conversation resolution before merging** | **Enabled** | **Enabled** | N/A |
| **Require signed commits** | Optional / Recommended | Optional | Optional |
| **Require linear history** | **Enabled** | **Enabled** | Optional |
| **Allow force pushes (`git push --force`)** | **Blocked** (Never allowed) | **Blocked** (Never allowed) | Allowed on owner's branch |
| **Allow branch deletions** | **Blocked** | **Blocked** | Allowed |
| **Allowed merge methods** | Squash & Merge, Rebase & Merge | Squash & Merge, Rebase & Merge | N/A |

---

### 2.3 Automated GitHub CLI Setup Script for Branch Protection

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="<ORGANIZATION>/<REPOSITORY>"

echo "Configuring branch protection for develop on $REPO..."
gh api --method PUT "repos/$REPO/branches/develop/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["verify", "SonarQube"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true
}
EOF

echo "Configuring branch protection for main on $REPO..."
gh api --method PUT "repos/$REPO/branches/main/protection" \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["verify", "SonarQube"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_linear_history": true
}
EOF

echo "Branch protection successfully configured."
```

---

## 3. Reusable CI/CD Workflow Architecture

The CI/CD pipeline consists of modular components:

```
.github/
├── actions/
│   └── setup-workspace/
│       └── action.yml                     # 1. Composite workspace bootstrapper
└── workflows/
    ├── ci.yml                             # 2. PR & Branch Verification
    ├── quality-gate.yml                   # 3. SonarQube & SAST static code analysis
    ├── reusable-service-deploy.yml        # 4. Reusable deployment workflow
    ├── reusable-ephemeral-task.yml        # 5. Reusable database seed / one-off task
    ├── release-asset.yml                  # 6. Binary compilation & GitHub release
    └── dependabot.yml                     # 7. Automated dependency maintenance
```

---

### 3.1 Composite Workspace Setup Action (`.github/actions/setup-workspace/action.yml`)

A single source of truth for bootstrapping language runtimes, package managers, lockfiles, and required build-time placeholder environment variables across all workflows.

```yaml
name: "Set up workspace"
description: "Universal workspace bootstrapper with runtime setup, package manager cache, frozen-lockfile install, and build-time env placeholders."

inputs:
  node-version:
    description: "Node.js version to setup"
    required: false
    default: "24"
  package-manager:
    description: "Package manager (pnpm, npm, yarn, bun)"
    required: false
    default: "pnpm"
  ignore-scripts:
    description: "Skip lifecycle scripts during install (true for static analysis jobs)"
    required: false
    default: "false"

runs:
  using: "composite"
  steps:
    - name: Setup Package Manager (pnpm)
      if: inputs.package-manager == 'pnpm'
      uses: pnpm/action-setup@v4

    - name: Setup Node.js Runtime
      uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: ${{ inputs.package-manager }}

    - name: Install Dependencies
      shell: bash
      run: |
        if [ "${{ inputs.ignore-scripts }}" = "true" ]; then
          ${{ inputs.package-manager }} install --frozen-lockfile --ignore-scripts
        else
          ${{ inputs.package-manager }} install --frozen-lockfile
        fi

    - name: Inject Build-Time Env Placeholders
      shell: bash
      run: |
        # Injects default dummy values for build-time validation schemas (e.g. @t3-oss/env-nextjs)
        # Prevents client builds from crashing during workspace-wide CI typecheck/build jobs.
        cat >> "$GITHUB_ENV" <<'EOF'
        NEXT_PUBLIC_API_URL=http://localhost:3000
        NEXT_PUBLIC_APP_URL=http://localhost:3000
        NEXT_PUBLIC_AUTH_PUBLISHABLE_KEY=pk_test_placeholder
        AUTH_SECRET_KEY=sk_test_placeholder
        SITE_URL=http://localhost:3000
        EOF
```

---

### 3.2 Continuous Integration Workflow (`.github/workflows/ci.yml`)

Runs parallelized quality checks with remote cache support and concurrency cancellation on redundant pushes.

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, reopened]
  push:
    branches: [develop, main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  verify:
    name: Verify (Lint, Typecheck, Test, Build)
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Workspace
        uses: ./.github/actions/setup-workspace

      # Fail-fast pipeline: Lints first, Typechecks second, Unit Tests third, Compiles build last
      - name: Execute Workspace Verification
        run: pnpm turbo lint check-types test build
```

---

### 3.3 Static Code Analysis & Quality Gate (`.github/workflows/quality-gate.yml`)

Generates coverage and runs SAST / SonarQube analysis with shallow clone disabled.

```yaml
name: Quality Gate

on:
  push:
    branches: [develop, main]
  pull_request:
    types: [opened, synchronize, reopened]

concurrency:
  group: quality-gate-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  sonarqube:
    name: SonarQube Quality Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Full Git History
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Deep clone required for blame and accurate analysis

      - name: Setup Workspace (Lightweight)
        uses: ./.github/actions/setup-workspace
        with:
          ignore-scripts: "true"

      - name: Generate Test Coverage Reports
        run: pnpm turbo test:cov

      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@v8.1.0
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

---

### 3.4 Reusable Container Service Deploy Pipeline (`.github/workflows/reusable-service-deploy.yml`)

A parameterized `workflow_call` engine that orchestrates:
1. Workspace Verification Gate (scoped to app and dependencies).
2. OIDC Cloud Authentication.
3. Container Image Build & Push (tagged with commit SHA).
4. **Vulnerability Scan Gate** (blocks rollout if Critical or High CVEs exist).
5. **Task Definition / Service Descriptor Revision**.
6. **Isolated Ephemeral DB Migration Task** (aborts rollout on failure).
7. Optional **Idempotent Reference Data Seed Task**.
8. **Rolling Service Update & Stabilization Wait**.
9. **Automated Rollback** to previous task definition if rollout fails.

```yaml
name: Reusable Service Deploy

on:
  workflow_call:
    inputs:
      app-name:
        description: "Application name (e.g. hris-backend, admin-backend)"
        required: true
        type: string
      dockerfile-path:
        description: "Path to Dockerfile"
        required: true
        type: string
      workspace-filter:
        description: "Turborepo/Nx workspace filter (e.g. @org/hris-backend...)"
        required: true
        type: string
      ecr-repository:
        description: "ECR / Container Registry Repository Name"
        required: true
        type: string
      ecs-cluster:
        description: "Target ECS Cluster Name"
        required: true
        type: string
      ecs-service:
        description: "Target ECS Service Name"
        required: true
        type: string
      ecs-task-family:
        description: "ECS Task Definition Family Name"
        required: true
        type: string
      ecs-security-group-id:
        description: "Security Group ID for one-off tasks"
        required: true
        type: string
      migration-command:
        description: "Command to execute for pre-deploy database migration"
        required: false
        default: ""
        type: string
      seed-command:
        description: "Command to execute for idempotent reference data seed"
        required: false
        default: ""
        type: string
      environment-name:
        description: "GitHub environment for secrets/vars (e.g. staging, production)"
        required: false
        default: "staging"
        type: string

permissions:
  id-token: write # Mandatory for OIDC authentication
  contents: read

jobs:
  verify:
    name: Scoped Verification Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Workspace
        uses: ./.github/actions/setup-workspace

      - name: Verify Scoped Target & Dependencies
        run: pnpm turbo lint check-types test build --filter='${{ inputs.workspace-filter }}'

  deploy:
    name: Build, Scan, Migrate & Rollout
    needs: verify
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment-name }}
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Authenticate to AWS via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}

      - name: Login to Amazon ECR
        uses: aws-actions/amazon-ecr-login@v2
        id: ecr

      - name: Build and Push Container Image
        id: build
        env:
          REGISTRY: ${{ steps.ecr.outputs.registry }}
          REPOSITORY: ${{ inputs.ecr-repository }}
          IMAGE_TAG: "${{ inputs.environment-name }}-${{ github.sha }}"
        run: |
          IMAGE="$REGISTRY/$REPOSITORY:$IMAGE_TAG"
          docker build -f ${{ inputs.dockerfile-path }} -t "$IMAGE" .
          docker push "$IMAGE"
          echo "image=$IMAGE" >> "$GITHUB_OUTPUT"
          echo "image_tag=$IMAGE_TAG" >> "$GITHUB_OUTPUT"

      - name: Gate on Container Vulnerability Scan
        env:
          REPOSITORY: ${{ inputs.ecr-repository }}
          IMAGE_TAG: ${{ steps.build.outputs.image_tag }}
        run: |
          echo "Polling vulnerability scan for $REPOSITORY:$IMAGE_TAG..."
          STATUS="PENDING"
          for i in $(seq 1 30); do
            STATUS=$(aws ecr describe-image-scan-findings \
              --repository-name "$REPOSITORY" --image-id imageTag="$IMAGE_TAG" \
              --query 'imageScanStatus.status' --output text 2>/dev/null || echo "PENDING")
            echo "Scan status: $STATUS (attempt $i/30)"
            if [ "$STATUS" = "COMPLETE" ] || [ "$STATUS" = "FAILED" ]; then
              break
            fi
            sleep 10
          done

          if [ "$STATUS" != "COMPLETE" ]; then
            echo "::error::ECR scan did not complete in time (status: $STATUS) — aborting deploy."
            exit 1
          fi

          COUNTS=$(aws ecr describe-image-scan-findings \
            --repository-name "$REPOSITORY" --image-id imageTag="$IMAGE_TAG" \
            --query 'imageScanFindings.findingSeverityCounts' --output json)
          
          if [ -z "$COUNTS" ] || [ "$COUNTS" = "null" ]; then COUNTS="{}"; fi
          CRITICAL=$(echo "$COUNTS" | jq -r '.CRITICAL // 0')
          HIGH=$(echo "$COUNTS" | jq -r '.HIGH // 0')

          echo "Vulnerability scan findings: CRITICAL=$CRITICAL, HIGH=$HIGH"
          if [ "$CRITICAL" != "0" ] || [ "$HIGH" != "0" ]; then
            echo "::error::Found $CRITICAL critical and $HIGH high severity vulnerabilities in $REPOSITORY:$IMAGE_TAG — aborting deploy."
            exit 1
          fi

      - name: Register New Task Definition Revision
        id: register
        env:
          IMAGE: ${{ steps.build.outputs.image }}
        run: |
          aws ecs describe-task-definition \
            --task-definition "${{ inputs.ecs-task-family }}" \
            --query 'taskDefinition' > current-task-def.json

          PREVIOUS_ARN=$(jq -r '.taskDefinitionArn' current-task-def.json)
          echo "previous_task_def_arn=$PREVIOUS_ARN" >> "$GITHUB_OUTPUT"

          jq --arg IMAGE "$IMAGE" \
            '.containerDefinitions[0].image = $IMAGE
             | del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)' \
            current-task-def.json > new-task-def.json

          NEW_ARN=$(aws ecs register-task-definition \
            --cli-input-json file://new-task-def.json \
            --query 'taskDefinition.taskDefinitionArn' --output text)
          echo "task_def_arn=$NEW_ARN" >> "$GITHUB_OUTPUT"

      - name: Execute Pre-Rollout Database Migration Task
        if: inputs.migration-command != ''
        env:
          TASK_DEF_ARN: ${{ steps.register.outputs.task_def_arn }}
        run: |
          echo "Launching isolated database migration task..."
          RUN_OUTPUT=$(aws ecs run-task \
            --cluster "${{ inputs.ecs-cluster }}" \
            --task-definition "$TASK_DEF_ARN" \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${{ vars.ECS_SUBNET_IDS }}],securityGroups=[${{ inputs.ecs-security-group-id }}],assignPublicIp=ENABLED}" \
            --overrides "{\"containerOverrides\":[{\"name\":\"app\",\"command\":[\"sh\",\"-c\",\"${{ inputs.migration-command }}\"]}]}")

          TASK_ARN=$(echo "$RUN_OUTPUT" | jq -r '.tasks[0].taskArn')
          aws ecs wait tasks-stopped --cluster "${{ inputs.ecs-cluster }}" --tasks "$TASK_ARN"

          EXIT_CODE=$(aws ecs describe-tasks --cluster "${{ inputs.ecs-cluster }}" --tasks "$TASK_ARN" \
            --query 'tasks[0].containers[0].exitCode' --output text)

          if [ "$EXIT_CODE" != "0" ]; then
            echo "::error::Migration task failed with exit code $EXIT_CODE — aborting rollout."
            exit 1
          fi

      - name: Execute Reference Data Seed Task
        if: inputs.seed-command != ''
        env:
          TASK_DEF_ARN: ${{ steps.register.outputs.task_def_arn }}
        run: |
          echo "Launching reference seed task..."
          RUN_OUTPUT=$(aws ecs run-task \
            --cluster "${{ inputs.ecs-cluster }}" \
            --task-definition "$TASK_DEF_ARN" \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${{ vars.ECS_SUBNET_IDS }}],securityGroups=[${{ inputs.ecs-security-group-id }}],assignPublicIp=ENABLED}" \
            --overrides "{\"containerOverrides\":[{\"name\":\"app\",\"command\":[\"sh\",\"-c\",\"${{ inputs.seed-command }}\"]}]}")

          TASK_ARN=$(echo "$RUN_OUTPUT" | jq -r '.tasks[0].taskArn')
          aws ecs wait tasks-stopped --cluster "${{ inputs.ecs-cluster }}" --tasks "$TASK_ARN"

          EXIT_CODE=$(aws ecs describe-tasks --cluster "${{ inputs.ecs-cluster }}" --tasks "$TASK_ARN" \
            --query 'tasks[0].containers[0].exitCode' --output text)

          if [ "$EXIT_CODE" != "0" ]; then
            echo "::error::Reference seed task failed with exit code $EXIT_CODE — aborting rollout."
            exit 1
          fi

      - name: Deploy Task Definition to Service & Wait for Stability
        id: deploy
        env:
          TASK_DEF_ARN: ${{ steps.register.outputs.task_def_arn }}
        run: |
          aws ecs update-service \
            --cluster "${{ inputs.ecs-cluster }}" \
            --service "${{ inputs.ecs-service }}" \
            --task-definition "$TASK_DEF_ARN" \
            --force-new-deployment

          aws ecs wait services-stable \
            --cluster "${{ inputs.ecs-cluster }}" \
            --services "${{ inputs.ecs-service }}"

      - name: Automated Rollback on Deployment Failure
        if: failure() && steps.deploy.outcome == 'failure'
        env:
          PREVIOUS_TASK_DEF_ARN: ${{ steps.register.outputs.previous_task_def_arn }}
        run: |
          echo "::warning::Rollout failed to stabilize — initiating instant rollback to $PREVIOUS_TASK_DEF_ARN"
          aws ecs update-service \
            --cluster "${{ inputs.ecs-cluster }}" \
            --service "${{ inputs.ecs-service }}" \
            --task-definition "$PREVIOUS_TASK_DEF_ARN" \
            --force-new-deployment

          aws ecs wait services-stable \
            --cluster "${{ inputs.ecs-cluster }}" \
            --services "${{ inputs.ecs-service }}"
```

---

### 3.5 Caller Workflow Example (`.github/workflows/deploy-service-staging.yml`)

How individual services invoke the reusable deployment pipeline with path filters and concurrency management:

```yaml
name: Deploy Service — Staging

on:
  push:
    branches: [develop]
    paths:
      - "apps/service-name/**"
      - "packages/**"
      - "pnpm-lock.yaml"
      - ".github/workflows/deploy-service-staging.yml"
      - ".github/workflows/reusable-service-deploy.yml"
      - ".github/actions/setup-workspace/**"
  workflow_dispatch:

permissions:
  id-token: write
  contents: read

concurrency:
  group: service-staging-deploy
  cancel-in-progress: false # Never cancel mid-migration

jobs:
  deploy:
    uses: ./.github/workflows/reusable-service-deploy.yml
    with:
      app-name: "service-name"
      dockerfile-path: "apps/service-name/Dockerfile"
      workspace-filter: "@org/service-name..."
      ecr-repository: ${{ vars.SERVICE_ECR_REPOSITORY }}
      ecs-cluster: ${{ vars.ECS_CLUSTER }}
      ecs-service: ${{ vars.SERVICE_ECS_SERVICE }}
      ecs-task-family: ${{ vars.SERVICE_ECS_TASK_FAMILY }}
      ecs-security-group-id: ${{ vars.SERVICE_ECS_SECURITY_GROUP_ID }}
      migration-command: "cd apps/service-name && pnpm run db:migrate"
      seed-command: "cd apps/service-name && pnpm run db:seed"
      environment-name: "staging"
    secrets: inherit
```

---

### 3.6 Reusable Ephemeral Task / On-Demand Seed Workflow (`.github/workflows/reusable-ephemeral-task.yml`)

Used for manual database seeding, backfills, one-off maintenance, and operator bootstrapping without deploying code.

```yaml
name: Reusable Ephemeral Task Runner

on:
  workflow_call:
    inputs:
      ecs-cluster:
        required: true
        type: string
      ecs-task-family:
        required: true
        type: string
      ecs-security-group-id:
        required: true
        type: string
      container-name:
        required: true
        type: string
      command:
        required: true
        type: string
      log-group:
        required: true
        type: string

permissions:
  id-token: write
  contents: read

jobs:
  run-task:
    runs-on: ubuntu-latest
    steps:
      - name: Authenticate via OIDC
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
          aws-region: ${{ vars.AWS_REGION }}

      - name: Execute One-Off Task
        run: |
          RUN_OUTPUT=$(aws ecs run-task \
            --cluster "${{ inputs.ecs-cluster }}" \
            --task-definition "${{ inputs.ecs-task-family }}" \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[${{ vars.ECS_SUBNET_IDS }}],securityGroups=[${{ inputs.ecs-security-group-id }}],assignPublicIp=ENABLED}" \
            --overrides "{\"containerOverrides\":[{\"name\":\"${{ inputs.container-name }}\",\"command\":[\"sh\",\"-c\",\"${{ inputs.command }}\"]}]}")

          TASK_ARN=$(echo "$RUN_OUTPUT" | jq -r '.tasks[0].taskArn')
          echo "Task launched: $TASK_ARN"
          aws ecs wait tasks-stopped --cluster "${{ inputs.ecs-cluster }}" --tasks "$TASK_ARN"

          EXIT_CODE=$(aws ecs describe-tasks --cluster "${{ inputs.ecs-cluster }}" --tasks "$TASK_ARN" \
            --query 'tasks[0].containers[0].exitCode' --output text)

          echo "::group::Task execution logs"
          aws logs get-log-events --log-group-name "${{ inputs.log-group }}" \
            --log-stream-name "${{ inputs.container-name }}/${{ inputs.container-name }}/$(basename "$TASK_ARN")" \
            --query 'events[].message' --output text || true
          echo "::endgroup::"

          if [ "$EXIT_CODE" != "0" ]; then
            echo "::error::Ephemeral task failed with exit code $EXIT_CODE"
            exit 1
          fi
```

---

### 3.7 Release & Binary Asset Workflow (`.github/workflows/release-asset.yml`)

Builds standalone executables/binaries, bundles assets, and publishes official GitHub Releases upon version tag pushes (`v*.*.*`) or manual trigger.

```yaml
name: Release Asset Publisher

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:
    inputs:
      version:
        description: "Release version semver (e.g. 1.0.0)"
        required: true

permissions:
  contents: write # Required for GitHub Releases creation

jobs:
  publish-release:
    runs-on: ubuntu-latest # Or windows-latest / macos-latest depending on target
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Resolve Version Identifier
        id: ver
        shell: bash
        run: |
          if [ -n "${{ github.event.inputs.version }}" ]; then
            V="${{ github.event.inputs.version }}"
          else
            V="${GITHUB_REF_NAME#v}"
          fi
          echo "version=$V" >> "$GITHUB_OUTPUT"
          echo "tag=v$V" >> "$GITHUB_OUTPUT"

      - name: Build & Package Artifacts
        shell: bash
        run: |
          mkdir -p dist
          # Execute build / compile command here
          tar -czvf "dist/release-artifact-${{ steps.ver.outputs.version }}.tar.gz" -C build .

      - name: Publish GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ steps.ver.outputs.tag }}
          name: Release ${{ steps.ver.outputs.version }}
          files: dist/*
          draft: false
          prerelease: false
          generate_release_notes: true
```

---

### 3.8 Automated Dependency Maintenance (`.github/dependabot.yml`)

Monitors both workspace dependencies and SHA-pinned GitHub Actions on a weekly cadence.

```yaml
version: 2
updates:
  # Monorepo root package ecosystem
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10

  # GitHub Actions SHA pins maintenance
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## 4. Required Repository Variables & Secrets Matrix

To make target repositories compatible with these reusable workflows, configure the following variables and secrets:

### 4.1 Global Secrets & Variables

| Name | Type | Scope | Description |
| :--- | :--- | :--- | :--- |
| `TURBO_TOKEN` | Secret | Repository | Turborepo Remote Caching API access token |
| `TURBO_TEAM` | Variable | Repository | Turborepo Remote Caching team or tenant slug |
| `SONAR_TOKEN` | Secret | Repository | SonarCloud / SonarQube authentication token |
| `AWS_DEPLOY_ROLE_ARN` | Variable | Environment/Repo | IAM Role ARN configured for GitHub OIDC assume-role |
| `AWS_REGION` | Variable | Environment/Repo | AWS Region (e.g. `ap-southeast-1`, `us-east-1`) |
| `ECS_CLUSTER` | Variable | Environment/Repo | Target ECS Cluster Name |
| `ECS_SUBNET_IDS` | Variable | Environment/Repo | Comma-separated VPC Subnet IDs for Fargate tasks |

### 4.2 Per-Service Variables (Prefixed per app)

| Name | Type | Description |
| :--- | :--- | :--- |
| `<APP>_ECR_REPOSITORY` | Variable | ECR Repository name for the specific service |
| `<APP>_ECS_SERVICE` | Variable | ECS Service name for the specific service |
| `<APP>_ECS_TASK_FAMILY` | Variable | ECS Task Definition family name |
| `<APP>_ECS_SECURITY_GROUP_ID` | Variable | Security group ID allowing DB egress for tasks |

---

## 5. AI Agent Implementation Prompt & Checklist

When copying this specification to an AI agent for execution in a new repository, use the following prompt:

```markdown
You are an expert DevOps and Platform Engineer. Your task is to implement the standardized branch protection rules and reusable CI/CD architecture defined in REUSABLE_CICD_AND_BRANCH_RULES.md.

Follow these implementation steps:
1. Initialize `.github/actions/setup-workspace/action.yml` using the composite template, configuring the target language/runtime and dependency caching.
2. Configure `.github/workflows/ci.yml` for pull request verification with fail-fast ordering (`lint` -> `check-types` -> `test` -> `build`) and concurrency cancellation.
3. Configure `.github/workflows/quality-gate.yml` with deep clone (`fetch-depth: 0`) and test coverage ingestion for SonarQube / SAST.
4. Implement `.github/workflows/reusable-service-deploy.yml` with:
   - AWS/Cloud OIDC federated authentication (zero long-lived credentials).
   - Immutable image tagging via commit SHA (`${{ github.sha }}`).
   - Container vulnerability scanning gate (blocking deploy if CRITICAL/HIGH CVEs exist).
   - Task definition / deployment manifest JSON mutation.
   - Isolated pre-rollout database migration as a one-off ephemeral task (aborting rollout on failure).
   - Rolling update with service stabilization wait.
   - Automated instant rollback on stabilization failure.
5. Create application/service caller workflows in `.github/workflows/` using path triggers and passing service-specific variables.
6. Create `.github/dependabot.yml` tracking workspace dependencies and GitHub Actions commit-SHA pins.
7. Execute the GitHub CLI branch protection script to apply protection rules to `develop` and `main` branches.
```
