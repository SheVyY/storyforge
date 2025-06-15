# Branch Protection Configuration

## Recommended Settings for `main` Branch

Go to: https://github.com/SheVyY/storyforge/settings/branches

Click **"Add rule"** and configure:

### Branch Name Pattern
```
main
```

### Protection Rules
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: 1
  - ✅ Dismiss stale PR approvals when new commits are pushed
  - ✅ Require review from code owners (if CODEOWNERS file exists)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `quality`
    - `test`  
    - `e2e (chromium)`
    - `e2e (firefox)`
    - `e2e (webkit)`
    - `build`
    - `ci-success`

- ✅ **Require conversation resolution before merging**

- ✅ **Require signed commits** (optional but recommended)

- ✅ **Include administrators**

- ✅ **Allow force pushes** (unchecked)

- ✅ **Allow deletions** (unchecked)

## Deployment Protection

### Environments (Optional Advanced Setup)
1. Go to: https://github.com/SheVyY/storyforge/settings/environments
2. Create environment: `production`
3. Configure protection rules:
   - ✅ Required reviewers
   - ✅ Wait timer: 0 minutes
   - ✅ Deployment branches: Selected branches (`main`)

## Repository Settings

### General Settings
- ✅ **Allow merge commits**: Enabled
- ✅ **Allow squash merging**: Enabled (recommended default)
- ✅ **Allow rebase merging**: Enabled
- ✅ **Automatically delete head branches**: Enabled

### Security
- ✅ **Dependency graph**: Enabled
- ✅ **Dependabot alerts**: Enabled  
- ✅ **Dependabot security updates**: Enabled
- ✅ **CodeQL analysis**: Enabled (in Security tab)

## Workflow Protection

Our CI/CD setup now follows GitHub best practices:

```
Feature Branch → PR → CI Tests → Review → Merge → Deploy
      ↓           ↓       ↓        ↓       ↓       ↓
   Development   Tests   Quality  Human   Main   Production
                 Pass    Gates   Review  Branch    URL
```

### Two-Workflow Pattern
1. **CI Workflow**: Runs on all pushes and PRs
2. **Deploy Workflow**: Only runs after CI succeeds on main branch

This prevents:
- ❌ Double deployments
- ❌ Deploying broken code
- ❌ Race conditions
- ❌ Failed deployments blocking development

### Status Checks
Required checks ensure:
- ✅ Code quality (TypeScript, linting)
- ✅ Security (npm audit)
- ✅ All tests pass (unit, integration, E2E)
- ✅ Cross-browser compatibility
- ✅ Build succeeds
- ✅ Performance meets standards