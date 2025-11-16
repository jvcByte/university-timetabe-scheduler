# Vercel Build Fix

## Issue
Build fails on Vercel with error:
```
Module not found: Can't resolve '.prisma/client/default'
```

## Root Cause
The Prisma client needs to be generated before the Next.js build runs. Vercel's build process wasn't generating the Prisma client automatically.

## Solution Applied

Updated `package.json` scripts:

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate"
  }
}
```

### Why This Works

1. **`postinstall` script**: Runs automatically after `npm install` or `pnpm install`, ensuring Prisma client is generated when dependencies are installed
2. **`build` script**: Explicitly generates Prisma client before building Next.js, providing a safety net

## Verification

Test the build locally:
```bash
# Clean install
rm -rf node_modules .next
pnpm install

# Build
pnpm build
```

## Additional Vercel Configuration

If issues persist, check:

1. **Environment Variables**: Ensure `DATABASE_URL` is set in Vercel
2. **Build Command**: Vercel should use `pnpm build` (default)
3. **Install Command**: Vercel should use `pnpm install` (default)
4. **Node Version**: Ensure Node 18+ is being used

## Vercel Dashboard Settings

In your Vercel project settings:
- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` (or leave empty for default)
- **Install Command**: `pnpm install` (or leave empty for default)
- **Output Directory**: `.next` (default)

## Cache Issues

If the build still fails after applying the fix:

1. Go to Vercel Dashboard → Your Project → Settings → General
2. Scroll to "Build & Development Settings"
3. Click "Clear Build Cache"
4. Redeploy

## Dependencies Check

Ensure these are correctly placed in `package.json`:

```json
{
  "dependencies": {
    "@prisma/client": "^6.1.0",
    // ... other dependencies
  },
  "devDependencies": {
    "prisma": "^6.1.0",
    // ... other dev dependencies
  }
}
```

## Success Indicators

Build should show:
```
✔ Generated Prisma Client
✓ Compiled successfully
```

The build is successful when you see the route table at the end of the build output.