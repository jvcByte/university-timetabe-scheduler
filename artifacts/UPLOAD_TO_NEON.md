# Quick Guide: Upload Schema to Neon Manually

## Step-by-Step Instructions

### 1. Go to Neon Console
Visit: [console.neon.tech](https://console.neon.tech)

### 2. Open SQL Editor
- Click on your project: `timetable-scheduler`
- Click "SQL Editor" in the left sidebar

### 3. Upload Schema
- Click "New Query"
- Open the file: `neon-schema.sql`
- Copy ALL content
- Paste into SQL Editor
- Click "Run" (or press Ctrl+Enter)

### 4. Seed Database
- Click "New Query" again
- Open the file: `neon-seed.sql`
- Copy ALL content
- Paste into SQL Editor
- Click "Run"

### 5. Verify
You should see output showing:
- Admin user created
- 3 Departments created
- 3 Rooms created
- 1 Constraint config created

### 6. Update Vercel
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Update `DATABASE_URL` with your Neon connection string
- Redeploy

### 7. Test Login
Visit your Vercel URL:
- Email: `admin@university.edu`
- Password: `admin123`

## Files to Use
- `neon-schema.sql` - Database structure
- `neon-seed.sql` - Initial data (admin user, etc.)

## Done!
Your app should now work on Vercel! 🎉
