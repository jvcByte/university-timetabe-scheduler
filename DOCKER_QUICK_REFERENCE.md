# Docker Quick Reference

Quick commands for managing the University Timetable Scheduler Docker deployment.

## Setup

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Generate secrets
openssl rand -base64 32  # Use for NEXTAUTH_SECRET
openssl rand -base64 32  # Use for SOLVER_API_KEY

# 3. Update .env with generated secrets

# 4. Build and start
docker-compose up -d

# 5. Initialize database
docker-compose exec web pnpm run db:push
docker-compose exec web pnpm run db:seed
```

## Common Commands

### Service Management

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# View status
docker-compose ps

# Remove everything
docker-compose down -v
```

### Logs

```bash
# View all logs
docker-compose logs -f

# View web logs
docker-compose logs -f web

# View solver logs
docker-compose logs -f solver

# Last 100 lines
docker-compose logs --tail=100
```

### Database

```bash
# Push schema
docker-compose exec web pnpm run db:push

# Run migrations
docker-compose exec web pnpm run db:migrate

# Seed data
docker-compose exec web pnpm run db:seed

# Generate Prisma client
docker-compose exec web pnpm run db:generate
```

### Rebuild

```bash
# Rebuild all
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Rebuild and restart
docker-compose up -d --build
```

### Shell Access

```bash
# Web container
docker-compose exec web sh

# Solver container
docker-compose exec solver sh
```

### Health Checks

```bash
# Web application
curl http://localhost:3000

# Solver service
curl http://localhost:8000/api/v1/health

# Solver API docs
open http://localhost:8000/docs
```

## Troubleshooting

### Reset Everything

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec web pnpm run db:push
docker-compose exec web pnpm run db:seed
```

### Check Environment Variables

```bash
docker-compose exec web env | grep SOLVER
docker-compose exec solver env | grep API_KEY
```

### View Resource Usage

```bash
docker stats $(docker-compose ps -q)
```

### Clean Docker System

```bash
# Remove unused containers, networks, images
docker system prune

# Remove everything including volumes
docker system prune -a --volumes
```

## URLs

- **Web App**: http://localhost:3000
- **Solver API Docs**: http://localhost:8000/docs
- **Solver Health**: http://localhost:8000/api/v1/health

## Default Credentials

After seeding:
- **Email**: admin@university.edu
- **Password**: admin123

**Change immediately in production!**
