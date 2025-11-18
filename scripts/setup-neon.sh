#!/bin/bash

# Neon PostgreSQL Setup Script for Vercel Deployment
# This script helps you set up Neon database for your Vercel deployment

set -e

echo "🚀 Neon PostgreSQL Setup for Vercel"
echo "===================================="
echo ""

echo "📋 Prerequisites:"
echo "1. Create a Neon account at https://neon.tech"
echo "2. Create a new project named 'timetable-scheduler'"
echo "3. Copy your connection string"
echo ""

read -p "Have you created your Neon project? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please create a Neon project first at https://neon.tech"
    echo "Then run this script again."
    exit 1
fi

echo ""
echo "🔗 Enter your Neon connection string:"
echo "(Format: postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require)"
read -r DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Connection string cannot be empty"
    exit 1
fi

echo ""
echo "✅ Connection string received"
echo ""

# Update .env file
echo "📝 Updating .env file..."
if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup
    echo "   Backed up existing .env to .env.backup"
fi

# Update or add DATABASE_URL
if grep -q "^DATABASE_URL=" .env 2>/dev/null; then
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
else
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
fi

echo "   Updated .env with Neon connection string"
echo ""

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpx prisma generate
echo ""

# Push schema
echo "📤 Pushing database schema to Neon..."
pnpx prisma db push --accept-data-loss
echo ""

echo "✅ Schema pushed successfully!"
echo ""

# Seed database
echo "🌱 Would you like to seed the database? (y/n)"
read -r SEED_RESPONSE

if [ "$SEED_RESPONSE" = "y" ] || [ "$SEED_RESPONSE" = "Y" ]; then
    echo "Seeding database..."
    pnpx prisma db seed
    echo "✅ Database seeded!"
    echo ""
    echo "Default admin credentials:"
    echo "  Email: admin@university.edu"
    echo "  Password: admin123"
    echo ""
    echo "⚠️  IMPORTANT: Change the admin password after first login!"
fi

echo ""
echo "📋 Environment Variables for Vercel:"
echo "===================================="
echo ""
echo "Add these to your Vercel project settings:"
echo "(Settings → Environment Variables)"
echo ""
echo "DATABASE_URL=$DATABASE_URL"
echo ""
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
echo ""
echo "NEXTAUTH_URL=https://your-app.vercel.app"
echo "(Replace with your actual Vercel URL)"
echo ""
echo "SOLVER_API_URL=https://your-solver-service-url"
echo "(Your deployed solver service URL)"
echo ""
echo "SOLVER_API_KEY=$(openssl rand -base64 32)"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Add the environment variables to Vercel (shown above)"
echo "2. Commit and push your changes:"
echo "   git add ."
echo "   git commit -m 'Switch to Neon PostgreSQL'"
echo "   git push"
echo "3. Vercel will automatically redeploy"
echo "4. Test login at your Vercel URL"
echo ""
echo "To view your database:"
echo "  pnpx prisma studio"
echo ""
echo "To manage your database:"
echo "  Visit https://console.neon.tech"
echo ""