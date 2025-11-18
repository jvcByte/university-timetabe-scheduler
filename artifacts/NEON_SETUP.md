# Using Neon PostgreSQL with Vercel

Neon is a serverless PostgreSQL database that works perfectly with Vercel. It has a generous free tier and is very easy to set up.

## Why Neon?

- ✅ **Serverless PostgreSQL**: Auto-scaling, pay-per-use
- ✅ **Free Tier**: 512MB storage, 3GB data transfer/month
- ✅ **Fast**: Instant database creation
- ✅ **Vercel Integration**: One-click setup
- ✅ **Branching**: Database branches for development

## Step 1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub (recommended for Vercel integration)
3. Create a new project: `timetable-scheduler`

## Step 2: Get Connection String

After creating your project, you'll see the connection string:

```
postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

Copy this - you'll need it for Vercel.

## Step 3: Update Prisma Schema

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// Rest of your models remain the same
// Just change datasource provider from "sqlite" to "postgresql"
```

## Step 4: Update Database Connection

The `lib/db.ts` file doesn't need changes - it will work automatically with PostgreSQL.

## Step 5: Update Environment Variables

### Local Development (`.env`)

For local development, you can use either:

**Option A: Use Neon for local dev too (recommended)**
```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
SOLVER_API_URL="http://localhost:8000"
SOLVER_API_KEY="your-api-key"
```

**Option B: Use local PostgreSQL**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/timetable"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
SOLVER_API_URL="http://localhost:8000"
SOLVER_API_KEY="your-api-key"
```

### Vercel (Production)

Add these environment variables in Vercel Dashboard:

```env
DATABASE_URL="postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="https://your-app.vercel.app"
SOLVER_API_URL="https://your-solver-service-url"
SOLVER_API_KEY="your-solver-api-key"
```

## Step 6: Push Schema to Neon

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

## Step 7: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "Switch to Neon PostgreSQL"
git push

# Vercel will automatically redeploy
```

## Step 8: Seed Production Database

### Option A: Via API Endpoint (Recommended)

1. Deploy to Vercel
2. Login as admin
3. Visit: `https://your-app.vercel.app/api/admin/seed`

### Option B: Via Prisma CLI

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-neon-connection-string"

# Run seed
npx prisma db seed
```

### Option C: Via Neon SQL Editor

1. Go to Neon Dashboard → SQL Editor
2. Run seed SQL manually:

```sql
-- Create admin user
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'admin-id-here',
  'admin@university.edu',
  'System Administrator',
  '$2a$10$...',  -- bcrypt hash of 'admin123'
  'ADMIN',
  NOW(),
  NOW()
);

-- Add more seed data as needed
```

## Schema Changes from SQLite to PostgreSQL

The main changes needed in your Prisma schema:

### Before (SQLite):
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  // ...
}
```

### After (PostgreSQL):
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  // ... (same, no changes needed)
}
```

Most of your schema will work as-is! PostgreSQL is more feature-rich than SQLite.

## Troubleshooting

### Connection Error

**Error**: `Can't reach database server`

**Solutions**:
1. Check connection string is correct
2. Ensure `?sslmode=require` is at the end
3. Verify Neon project is active (not suspended)
4. Check IP allowlist (Neon free tier allows all IPs)

### Migration Issues

**Error**: `Migration failed`

**Solution**:
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or push schema without migration
npx prisma db push --accept-data-loss
```

### Seed Fails

**Error**: `Unique constraint failed`

**Solution**:
Data already exists. Either:
1. Clear database first
2. Update seed script to use `upsert` instead of `create`

### Login Still Fails

**Check**:
1. Database is seeded with admin user
2. `NEXTAUTH_SECRET` is set in Vercel
3. `NEXTAUTH_URL` matches your Vercel URL
4. Check Vercel logs: `vercel logs --follow`

## Neon Features

### Database Branching

Create a branch for development:

```bash
# In Neon Dashboard
1. Go to Branches
2. Click "Create Branch"
3. Name it "development"
4. Use branch connection string for local dev
```

### Connection Pooling

Neon provides connection pooling automatically. For better performance, use the pooled connection string:

```
postgresql://username:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

### Monitoring

- Go to Neon Dashboard → Monitoring
- View query performance
- Check connection usage
- Monitor storage

## Cost Comparison

### Neon Free Tier
- **Storage**: 512MB
- **Compute**: Always available
- **Data Transfer**: 3GB/month
- **Branches**: 10
- **Best for**: Small to medium apps

### Neon Pro ($19/month)
- **Storage**: 10GB
- **Compute**: Auto-scaling
- **Data Transfer**: 50GB/month
- **Branches**: Unlimited
- **Best for**: Production apps

## Benefits of Neon

1. **Serverless**: Auto-scaling, no server management
2. **Fast**: Instant database creation
3. **Branching**: Test changes safely
4. **PostgreSQL**: Full PostgreSQL features
5. **Free Tier**: Generous limits for small apps

## Alternative: Vercel Postgres

If you want even tighter Vercel integration:

1. Go to Vercel Dashboard → Storage → Create Database
2. Select "Postgres"
3. Vercel will automatically set environment variables
4. Use `POSTGRES_PRISMA_URL` in your schema

## Next Steps

1. ✅ Create Neon account and project
2. ✅ Update Prisma schema to PostgreSQL
3. ✅ Set DATABASE_URL in Vercel
4. ✅ Push schema: `npx prisma db push`
5. ✅ Seed database
6. ✅ Test login on Vercel

Your app will now work perfectly on Vercel with Neon PostgreSQL! 🚀

## Quick Commands

```bash
# Update schema
npx prisma db push

# View database
npx prisma studio

# Generate client
npx prisma generate

# Seed database
npx prisma db seed

# Reset database (WARNING: deletes data)
npx prisma migrate reset
```