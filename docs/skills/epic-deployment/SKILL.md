---
name: epic-deployment
description: Guide on deployment with Fly.io, multi-region setup, and CI/CD for Epic Stack
categories:
  - deployment
  - fly-io
  - ci-cd
  - docker
---

# Epic Stack: Deployment

## When to use this skill

Use this skill when you need to:
- Configure deployment on Fly.io
- Setup multi-region deployment
- Configure CI/CD with GitHub Actions
- Manage secrets in production
- Configure healthchecks
- Work with LiteFS and volumes
- Local deployment with Docker

## Patterns and conventions

### Fly.io Configuration

Epic Stack uses Fly.io for hosting with configuration in `fly.toml`.

**Basic configuration:**
```toml
# fly.toml
app = "your-app-name"
primary_region = "sjc"
kill_signal = "SIGINT"
kill_timeout = 5

[build]
dockerfile = "/other/Dockerfile"
ignorefile = "/other/Dockerfile.dockerignore"

[mounts]
source = "data"
destination = "/data"
```

### Primary Region

**Configure primary region:**
```toml
primary_region = "sjc" # Change according to your location
```

**Important:** The primary region must be the same for:
- `primary_region` en `fly.toml`
- Region del volume `data`
- `PRIMARY_REGION` en variables de entorno

### LiteFS Configuration

**Configuration in `other/litefs.yml`:**
```yaml
fuse:
  dir: '${LITEFS_DIR}'

data:
  dir: '/data/litefs'

proxy:
  addr: ':${INTERNAL_PORT}'
  target: 'localhost:${PORT}'
  db: '${DATABASE_FILENAME}'

lease:
  type: 'consul'
  candidate: ${FLY_REGION == PRIMARY_REGION}
  promote: true
  advertise-url: 'http://${HOSTNAME}.vm.${FLY_APP_NAME}.internal:20202'
  consul:
    url: '${FLY_CONSUL_URL}'
    key: 'epic-stack-litefs_20250222/${FLY_APP_NAME}'

exec:
  - cmd: npx prisma migrate deploy
    if-candidate: true
  - cmd: sqlite3 $DATABASE_PATH "PRAGMA journal_mode = WAL;"
    if-candidate: true
  - cmd: sqlite3 $CACHE_DATABASE_PATH "PRAGMA journal_mode = WAL;"
    if-candidate: true
  - cmd: npx prisma generate --sql
  - cmd: npm start
```

### Healthchecks

**Configuration in `fly.toml`:**
```toml
[[services.http_checks]]
interval = "10s"
grace_period = "5s"
method = "get"
path = "/resources/healthcheck"
protocol = "http"
timeout = "2s"
tls_skip_verify = false
```

**Healthcheck implementation:**
```typescript
// app/routes/resources/healthcheck.tsx
export async function loader({ request }: Route.LoaderArgs) {
	const host = request.headers.get('X-Forwarded-Host') ?? request.headers.get('host')

	try {
		await Promise.all([
			prisma.user.count(), // Verify DB
			fetch(`${new URL(request.url).protocol}${host}`, {
				method: 'HEAD',
				headers: { 'X-Healthcheck': 'true' },
			}),
		])
		return new Response('OK')
	} catch (error) {
		console.log('healthcheck ❌', { error })
		return new Response('ERROR', { status: 500 })
	}
}
```

### Environment Variables

**Secrets in Fly.io:**
```bash
# Generate secrets
fly secrets set SESSION_SECRET=$(openssl rand -hex 32) --app [YOUR_APP_NAME]
fly secrets set HONEYPOT_SECRET=$(openssl rand -hex 32) --app [YOUR_APP_NAME]

# List secrets
fly secrets list --app [YOUR_APP_NAME]

# Delete secret
fly secrets unset SECRET_NAME --app [YOUR_APP_NAME]
```

**Common secrets:**
- `SESSION_SECRET` - Secret for signing session cookies
- `HONEYPOT_SECRET` - Secret for honeypot fields
- `DATABASE_URL` - Automatically configured by LiteFS
- `CACHE_DATABASE_PATH` - Automatically configured
- `RESEND_API_KEY` - For sending emails (optional)
- `TIGRIS_*` - For image storage (automatic)
- `SENTRY_DSN` - For error monitoring (optional)

### Volumes

**Create volume:**
```bash
fly volumes create data --region sjc --size 1 --app [YOUR_APP_NAME]
```

**List volumes:**
```bash
fly volumes list --app [YOUR_APP_NAME]
```

**Expand volume:**
```bash
fly volumes extend <volume-id> --size 10 --app [YOUR_APP_NAME]
```

### Multi-Region Deployment

**Deploy to multiple regions:**
```bash
# Deploy in primary region (more instances)
fly scale count 2 --region sjc --app [YOUR_APP_NAME]

# Deploy in secondary regions (read-only)
fly scale count 1 --region ams --app [YOUR_APP_NAME]
fly scale count 1 --region syd --app [YOUR_APP_NAME]
```

**Verify instances:**
```bash
fly status --app [YOUR_APP_NAME]
# The ROLE column will show "primary" or "replica"
```

### Consul Setup

**Attach Consul:**
```bash
fly consul attach --app [YOUR_APP_NAME]
```

**Consul manages:**
- Which instance is primary
- Automatic failover
- Data replication

### GitHub Actions CI/CD

**Basic workflow:**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, dev]

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

**Complete configuration:**
- Deploy to `production` from `main` branch
- Deploy to `staging` from `dev` branch
- Tests before deploy (optional)

### Deployable Commits

Following Epic Web principles:

**Deployable commits** - Every commit to the main branch should be deployable. This means:
- The code should be in a working state
- Tests should pass
- The application should build successfully
- No "WIP" or "TODO" commits that break the build

**Example - Deployable commit workflow:**
```bash
# ✅ Good - Each commit is deployable
git commit -m "Add user profile page"
# This commit is complete, tested, and deployable

git commit -m "Fix login redirect bug"
# This commit fixes a bug and is deployable

# ❌ Avoid - Non-deployable commits
git commit -m "WIP: working on feature"
# This commit might not work, not deployable

git commit -m "Add feature (tests failing)"
# This commit breaks the build, not deployable
```

**Benefits:**
- Easy rollback - any commit can be deployed
- Continuous deployment - deploy any time
- Clear history - each commit represents a working state
- Faster recovery - can deploy any previous commit

### Small and Short Lived Merge Requests

Following Epic Web principles:

**Small and short lived merge requests** - Keep PRs small and merge them quickly. Large PRs are hard to review, risky to merge, and slow down the team.

**Guidelines:**
- **Small PRs** - Focus on one feature or fix per PR
- **Short-lived** - Merge within a day or two, not weeks
- **Reviewable** - PRs should be reviewable in 30 minutes or less
- **Independent** - Each PR should be independently deployable

**Example - Small, focused PR:**
```bash
# ✅ Good - Small, focused PR
# PR: "Add email validation to signup form"
# - Only changes signup validation
# - Includes tests
# - Can be reviewed quickly
# - Can be merged and deployed independently

# ❌ Avoid - Large, complex PR
# PR: "Refactor authentication system and add 2FA and OAuth"
# - Too many changes at once
# - Hard to review
# - Risky to merge
# - Takes days to review
```

**Benefits:**
- Faster reviews - easier to understand and review
- Lower risk - smaller changes are less risky
- Faster feedback - get feedback sooner
- Easier rollback - smaller changes are easier to revert
- Better collaboration - team can work in parallel on different small PRs

**When PRs get too large:**
- Split into multiple smaller PRs
- Use feature flags to merge incrementally
- Break down into logical pieces

### Tigris Object Storage

**Create storage:**
```bash
fly storage create --app [YOUR_APP_NAME]
```

**This creates:**
- Tigris bucket
- Automatic environment variables:
  - `TIGRIS_ENDPOINT`
  - `TIGRIS_ACCESS_KEY_ID`
  - `TIGRIS_SECRET_ACCESS_KEY`
  - `TIGRIS_BUCKET_NAME`

### Database Migrations

**Automatic migrations:**
Migrations are automatically applied on deploy via `litefs.yml`:

```yaml
exec:
  - cmd: npx prisma migrate deploy
    if-candidate: true
```

**Note:** Only the primary instance runs migrations (`if-candidate: true`).

### Database Backups

**Create backup:**
```bash
# SSH to instance
fly ssh console --app [YOUR_APP_NAME]

# Create backup
mkdir /backups
litefs export -name sqlite.db /backups/backup-$(date +%Y-%m-%d).db
exit

# Download backup
fly ssh sftp get /backups/backup-2024-01-01.db --app [YOUR_APP_NAME]
```

**Restore backup:**
```bash
# Upload backup
fly ssh sftp shell --app [YOUR_APP_NAME]
put backup-2024-01-01.db
# Ctrl+C to exit

# SSH and restore
fly ssh console --app [YOUR_APP_NAME]
litefs import -name sqlite.db /backup-2024-01-01.db
exit
```

### Deployment Local

**Deploy con Fly CLI:**
```bash
fly deploy
```

**Deploy con Docker:**
```bash
# Build
docker build -t epic-stack . -f other/Dockerfile \
  --build-arg COMMIT_SHA=$(git rev-parse --short HEAD)

# Run
docker run -d \
  -p 8081:8081 \
  -e SESSION_SECRET='secret' \
  -e HONEYPOT_SECRET='secret' \
  -e FLY='false' \
  -v ~/litefs:/litefs \
  epic-stack
```

### Zero-Downtime Deploys

**Strategy:**
- Deploy to multiple instances
- Automatic blue-green deployment
- Healthchecks verify app is ready
- Auto-rollback if healthcheck fails

**Configuration:**
```toml
[experimental]
auto_rollback = true
```

### Monitoring

**View logs:**
```bash
fly logs --app [YOUR_APP_NAME]
```

**View metrics:**
```bash
fly dashboard --app [YOUR_APP_NAME]
# Or visit: https://fly.io/apps/[YOUR_APP_NAME]/monitoring
```

**Sentry (opcional):**
```bash
fly secrets set SENTRY_DSN=your-sentry-dsn --app [YOUR_APP_NAME]
```

## Common examples

### Example 1: Complete initial setup

```bash
# 1. Create apps
fly apps create my-app
fly apps create my-app-staging

# 2. Configure secrets
fly secrets set \
  SESSION_SECRET=$(openssl rand -hex 32) \
  HONEYPOT_SECRET=$(openssl rand -hex 32) \
  --app my-app

fly secrets set \
  SESSION_SECRET=$(openssl rand -hex 32) \
  HONEYPOT_SECRET=$(openssl rand -hex 32) \
  ALLOW_INDEXING=false \
  --app my-app-staging

# 3. Create volumes
fly volumes create data --region sjc --size 1 --app my-app
fly volumes create data --region sjc --size 1 --app my-app-staging

# 4. Attach Consul
fly consul attach --app my-app
fly consul attach --app my-app-staging

# 5. Create storage
fly storage create --app my-app
fly storage create --app my-app-staging

# 6. Deploy
fly deploy --app my-app
```

### Example 2: Multi-region setup

```bash
# First region (primary) - 2 instances
fly scale count 2 --region sjc --app my-app

# Secondary regions - 1 instance each
fly scale count 1 --region ams --app my-app
fly scale count 1 --region syd --app my-app

# Verify
fly status --app my-app
```

### Example 3: GitHub Actions workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, dev]

jobs:
  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only --app my-app
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}

  deploy-staging:
    if: github.ref == 'refs/heads/dev'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only --app my-app-staging
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Example 4: Deploy with migrations

```bash
# Create migration
npx prisma migrate dev --name add_field

# Commit and push
git add .
git commit -m "Add field"
git push origin main

# GitHub Actions automatically runs:
# 1. Build
# 2. Deploy
# 3. litefs.yml runs: npx prisma migrate deploy (only on primary)
```

## Common mistakes to avoid

- ❌ **Non-deployable commits**: Every commit to main should be deployable - no WIP or broken commits
- ❌ **Large, long-lived PRs**: Keep PRs small and merge quickly - large PRs are hard to review and risky
- ❌ **Inconsistent primary region**: Make sure `primary_region` in `fly.toml` matches the volume region
- ❌ **Secrets not configured**: Configure all secrets before first deploy
- ❌ **Volume not created**: Create the `data` volume before deploy
- ❌ **Consul not attached**: Attach Consul before first deploy
- ❌ **Migrations on replicas**: Only the primary instance should run migrations
- ❌ **Not using healthchecks**: Healthchecks are critical for zero-downtime deploys
- ❌ **Deploy breaking changes without strategy**: Use "widen then narrow" for migrations
- ❌ **Secrets in code**: Never commit secrets, use `fly secrets`
- ❌ **Not making backups**: Make regular database backups
- ❌ **FLY_API_TOKEN exposed**: Never commit the token, only in GitHub Secrets

## References

- [Epic Stack Deployment Docs](../epic-stack/docs/deployment.md)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- [Fly.io Documentation](https://fly.io/docs)
- [LiteFS Documentation](https://fly.io/docs/litefs/)
- [Fly.io CLI Reference](https://fly.io/docs/flyctl/)
- `fly.toml` - Fly.io configuration
- `other/litefs.yml` - LiteFS configuration
- `other/Dockerfile` - Deployment Dockerfile
- `.github/workflows/deploy.yml` - CI/CD workflow

### Preview Deployments (Inspired by Vercel Deploy Claimable)

Epic Stack can implement preview deployments similar to Vercel's deploy claimable pattern.

**✅ Good - Preview deployments for pull requests:**
```yaml
# .github/workflows/preview-deploy.yml
name: Preview Deploy

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Deploy preview
        run: |
          # Create or reuse preview app
          PREVIEW_APP="my-app-pr-${{ github.event.pull_request.number }}"
          flyctl apps list | grep "$PREVIEW_APP" || flyctl apps create "$PREVIEW_APP"
          
          # Deploy to preview app
          flyctl deploy --app "$PREVIEW_APP" --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
      - name: Comment preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview deployment: https://$PREVIEW_APP.fly.dev`
            })
```

**✅ Good - Auto-cleanup preview deployments:**
```yaml
# .github/workflows/cleanup-preview.yml
name: Cleanup Preview

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - name: Destroy preview app
        run: |
          PREVIEW_APP="my-app-pr-${{ github.event.pull_request.number }}"
          flyctl apps destroy "$PREVIEW_APP" --yes
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Environment Detection

**✅ Good - Detect deployment environment:**
```typescript
// app/utils/env.server.ts
export function getDeploymentEnv(): 'production' | 'staging' | 'preview' | 'development' {
	if (process.env.NODE_ENV === 'development') {
		return 'development'
	}

	// Preview deployments
	if (process.env.FLY_APP_NAME?.includes('pr-')) {
		return 'preview'
	}

	// Staging environment
	if (process.env.FLY_APP_NAME?.includes('staging')) {
		return 'staging'
	}

	// Production
	return 'production'
}
```

**✅ Good - Environment-specific configuration:**
```typescript
const env = getDeploymentEnv()

export const config = {
	production: env === 'production',
	staging: env === 'staging',
	preview: env === 'preview',
	development: env === 'development',
	
	// Preview deployments might have limited features
	features: {
		analytics: env === 'production',
		sentry: env !== 'development',
		indexing: env === 'production',
	},
}
```

### Build Artifact Exclusion

**✅ Good - Optimize Docker builds:**
```dockerfile
# other/Dockerfile
# Multi-stage build for smaller image size
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

# Build application
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Copy only what's needed
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public
COPY --from=builder /app/server ./server
COPY --from=builder /app/other ./other
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Exclude unnecessary files
# node_modules/.cache, .git, etc. are already excluded via .dockerignore

CMD ["npm", "start"]
```

**✅ Good - Docker ignore file:**
```dockerignore
# .dockerignore (in other/)
node_modules
.git
.env
.env.*
!.env.example
*.log
.DS_Store
coverage
.vscode
.idea
*.swp
*.swo
*~
.cache
dist
build
```

### Deployment Status and Monitoring

**✅ Good - Deployment status tracking:**
```typescript
// app/routes/admin/deployment-status.tsx
export async function loader({ request }: Route.LoaderArgs) {
	const deploymentInfo = {
		appName: process.env.FLY_APP_NAME,
		region: process.env.FLY_REGION,
		environment: getDeploymentEnv(),
		commitSha: process.env.COMMIT_SHA,
		deployedAt: process.env.DEPLOYED_AT,
	}

	return { deploymentInfo }
}
```

### Rollback Strategies

**✅ Good - Quick rollback with Fly.io:**
```bash
# List recent releases
fly releases list --app my-app

# Rollback to previous release
fly releases rollback --app my-app
```

**✅ Good - Automated rollback on failure:**
```toml
# fly.toml
[experimental]
  auto_rollback = true
  min_machines_running = 1
```
