# Deployment & Incident Response

## Environments

| Environment | URL | Supabase | Branch | Auto-deploy |
|-------------|-----|----------|--------|-------------|
| **Production** | apothecare.ai | Production project | `main` | Yes (Vercel) |
| **Preview** | `*.vercel.app` | Production (read-only safe) | PR branches | Yes (Vercel) |
| **Staging** | TBD | Staging project | `main` | TBD |
| **Local** | localhost:3000 | Local / dev project | any | Manual |

## CI Pipeline

Every PR and push to `main` runs GitHub Actions (`.github/workflows/ci.yml`):

1. **Type check** — `tsc --noEmit`
2. **Lint** — `next lint`
3. **Unit tests** — `vitest run`
4. **Build** — `next build` (only after 1-3 pass)

Merging to `main` requires all checks to pass.

## Deploy Process

1. Open PR against `main`
2. CI runs automatically — wait for green
3. Vercel creates a preview deployment on the PR
4. Review the preview URL
5. Merge to `main` — Vercel auto-deploys to production

## Rollback Procedure

### Application Rollback (Vercel)

**Time to rollback: ~30 seconds**

1. Go to [Vercel Dashboard](https://vercel.com) → Project → Deployments
2. Find the last known-good deployment
3. Click the three-dot menu → **Promote to Production**
4. Verify the site is working

This is instant — Vercel keeps all previous builds. No rebuild required.

### Database Rollback

Migrations are **forward-only and idempotent** (`IF NOT EXISTS`). If a migration causes issues:

1. **Do NOT** run `DROP TABLE` or `DROP COLUMN` in production without a plan
2. Write a **new migration** that reverses the change (e.g., `ALTER TABLE ... DROP COLUMN IF EXISTS ...`)
3. Apply via `psql $DATABASE_URL -f supabase/migrations/XXX_rollback.sql`
4. Deploy the application rollback first, then the migration rollback

### Environment Variable Changes

1. Update in Vercel Dashboard → Settings → Environment Variables
2. Trigger a redeploy (Vercel → Deployments → latest → Redeploy)
3. Verify via the admin health endpoint: `GET /api/admin/health`

## Incident Response Checklist

### Severity 1: Site is down

- [ ] Check Vercel status page: https://www.vercel-status.com/
- [ ] Check Supabase status: https://status.supabase.com/
- [ ] Roll back to last good deployment (see Rollback above)
- [ ] Check Vercel function logs for errors
- [ ] If DB-related: check Supabase dashboard for connection pool exhaustion

### Severity 2: Feature broken, site up

- [ ] Identify the breaking commit via `git log --oneline`
- [ ] Check CI — did tests pass? If yes, add a test for the regression
- [ ] Fix forward with a hotfix PR, or rollback if complex

### Severity 3: Performance degradation

- [ ] Check Vercel Analytics for slow routes
- [ ] Check Supabase dashboard for slow queries
- [ ] Review recent migrations for missing indexes

## Database Migrations

Migrations live in `supabase/migrations/` and are numbered sequentially (001-042+).

**To apply a new migration:**
```bash
# Local
psql $DATABASE_URL -f supabase/migrations/XXX_description.sql

# Production (via Supabase Dashboard)
# SQL Editor → paste migration → Run
```

**Safety rules:**
- All migrations use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`
- Never `DROP` without a plan and backup
- Test migrations against staging before production
- Keep migrations small and focused (one concern per file)

## Secrets

All secrets are stored in Vercel Environment Variables. Never commit secrets to git.

**Required for production:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (must be `https://apothecare.ai`)

**Required for billing:**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_PRO`

**Rotation cadence:** Rotate API keys quarterly. Update in Vercel dashboard and redeploy.

## Health Check

`GET /api/admin/health` — Requires admin email auth. Returns:
- Supabase connectivity status
- API key presence (not values)
- Environment configuration

---

## AWS Migration (Planned)

This document currently covers Vercel + Supabase. An AWS migration is planned — when it happens, update this doc to cover:

- **Compute**: ECS/Fargate or App Runner deployment + rollback
- **Database**: RDS/Aurora connection pooling, migration runner, backup/restore
- **Auth**: Cognito or Supabase Auth retention
- **CDN**: CloudFront invalidation on deploy
- **CI/CD**: GitHub Actions → ECR push → ECS service update
- **Staging**: Dedicated staging environment on AWS

The CI pipeline, Stripe webhooks, Sentry, and database migrations are cloud-agnostic and will carry over.
