# Neon Quick Start - Fix Vercel Login

## 🎯 Goal
Fix the "An unexpected error occurred during login" on Vercel by switching from SQLite to Neon PostgreSQL.

## ⚡ Quick Steps (10 minutes)

### 1. Create Neon Database (2 min)
1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub
3. Click "Create Project"
4. Name: `timetable-scheduler`
5. Copy the connection string shown

### 2. Run Setup Script (3 min)
```bash
./scripts/setup-neon.sh
```

When prompted, paste your Neon connection string.

The script will:
- ✅ Update your `.env` file
- ✅ Generate Prisma client
- ✅ Push database schema
- ✅ Seed the database
- ✅ Show environment variables for Vercel

### 3. Add to Vercel (2 min)
Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these (copy from script output):
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app
SOLVER_API_URL=...
SOLVER_API_KEY=...
```

### 4. Deploy (3 min)
```bash
git add .
git commit -m "Switch to Neon PostgreSQL"
git push
```

Vercel will automatically redeploy.

### 5. Test Login ✅
Visit your Vercel URL and login with:
- **Email**: `admin@university.edu`
- **Password**: `admin123`

## 📝 What Changed?

### Prisma Schema
```diff
datasource db {
-  provider = "sqlite"
+  provider = "postgresql"
   url      = env("DATABASE_URL")
}
```

### Environment Variables
```diff
- DATABASE_URL="file:./dev.db"
+ DATABASE_URL="postgresql://...@ep-xxx.neon.tech/dbname?sslmode=require"
```

That's it! Everything else stays the same.

## 🔧 Troubleshooting

### "Connection refused"
- Check DATABASE_URL is correct in Vercel
- Ensure it ends with `?sslmode=require`

### "User not found"
- Database wasn't seeded
- Run: `npx prisma db seed`

### "NEXTAUTH_SECRET is not set"
- Add NEXTAUTH_SECRET to Vercel environment variables
- Generate with: `openssl rand -base64 32`

### Still not working?
Check Vercel logs:
```bash
vercel logs your-project --follow
```

## 📚 Full Documentation

- **Complete Guide**: `NEON_SETUP.md`
- **Quick Fix**: `QUICK_FIX_VERCEL_LOGIN.md`
- **Troubleshooting**: Check Vercel logs

## 💡 Why Neon?

- **Free Tier**: 512MB storage, perfect for getting started
- **Serverless**: Auto-scaling, no server management
- **Fast**: Instant database creation
- **PostgreSQL**: Full PostgreSQL features
- **Branching**: Create dev/staging branches

## 🎉 Success!

Once deployed, your app will:
- ✅ Work on Vercel
- ✅ Have persistent data
- ✅ Support all features
- ✅ Scale automatically

## 📞 Need Help?

1. Check `NEON_SETUP.md` for detailed instructions
2. Check Vercel logs for specific errors
3. Verify all environment variables are set
4. Test database connection with `npx prisma studio`

---

**Time to complete**: ~10 minutes
**Difficulty**: Easy
**Cost**: Free (Neon free tier)