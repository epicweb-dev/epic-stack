# Per-PR Staging Environments

Date: 2025-12-24

Status: accepted

## Context

The Epic Stack previously used a single shared staging environment deployed from the `dev` branch. This approach created several challenges for teams working with multiple pull requests:

- **Staging bottleneck**: Only one PR could be properly tested in the staging environment at a time, making parallel development difficult.
- **Unclear test failures**: When QA testing failed, it was hard to determine if the failure was from the specific PR being tested or from other changes that had been deployed to the shared staging environment.
- **Serial workflow**: Teams couldn't perform parallel quality assurance, forcing them to coordinate who could use staging at any given time.
- **Extra setup complexity**: During initial deployment, users had to create and configure a separate staging app with its own database, secrets, and resources.

Fly.io provides native support for PR preview environments through their `fly-pr-review-apps` GitHub Action, which can automatically create, update, and destroy ephemeral applications for each pull request.

This pattern is common in modern deployment workflows (Vercel, Netlify, Render, etc.) and provides isolated environments for testing changes before they reach production.

## Decision

We've decided to replace the single shared staging environment with per-PR staging environments using Fly.io's PR review apps feature. Each pull request now:

- Gets its own isolated Fly.io application (e.g., `app-name-pr-123`)
- Automatically provisions all necessary resources (SQLite volume, Tigris object storage, Consul for LiteFS)
- Generates and stores secrets (SESSION_SECRET, HONEYPOT_SECRET)
- Seeds the database with test data for immediate usability
- Provides a direct URL to the deployed app in the GitHub PR interface
- Automatically cleans up all resources when the PR is closed

Staging environment secrets are now managed as GitHub environment secrets and passed to Fly in Github Actions.

The `dev` branch and its associated staging app have been removed from the deployment workflow. Production deployments continue to run only on pushes to the `main` branch.

## Consequences

**Positive:**

- **Isolated testing**: Each PR has its own complete environment, making it clear which changes caused any issues
- **Simplified onboarding**: New users only need to set up one production app, not both production and staging
- **Better reviews**: Reviewers (including non-technical stakeholders) can click a link to see and interact with changes before merging
- **Automatic cleanup**: Resources are freed when PRs close, reducing infrastructure costs
- **Realistic testing**: Each PR tests the actual deployment process, catching deployment-specific issues early

**Negative:**

- **Increased resource usage during development**: Each open PR consumes Fly.io resources (though they're automatically cleaned up)

