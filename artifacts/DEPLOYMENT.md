# Deployment Guide

This guide provides detailed instructions for deploying the University Timetable Scheduler using Docker.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Building Images](#building-images)
- [Running Services](#running-services)
- [Database Management](#database-management)
- [Monitoring and Logs](#monitoring-and-logs)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)

## Prerequisites

### Required Software

- Docker Engine 20.10+ or Docker Desktop
- Docker Compose 2.0+
- Git (for cloning the repository)

### System Requirements

- **Minimum**: 2 CPU cores, 4GB RAM, 10GB disk space
- **Recommended**: 4 CPU cores, 8GB RAM, 20GB disk space

### Verify Installation

```bash
docker --version
docker-compose --version
```

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd university-timetable-scheduler
```

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Generate secure secrets:

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate SOLVER_API_KEY
openssl rand -base64 32
```

Update `.env` with the generated values:

```env
# Database
DATABASE_URL="file:/app/data/dev.db"

# NextAuth
NEXTAUTH_SECRET="<generated-secret>"
NEXTAUTH_URL="http://localhost:3000"

# Solver Service
SOLVER_API_URL="http://solver:8000"
SOLVER_API_KEY="<generated-api-key>"

# Logging
LOG_LEVEL="INFO"
```

### 3. Build and Start Services

```bash
docker-compose up -d
```

This command will:
- Build the web application Docker image
- Build the solver service Docker image
- Create a persistent volume for the SQLite database
- Start both services in detached mode

### 4. Initialize the Database

```bash
# Push the database schema
docker-compose exec web pnpm run db:push

# Seed with sample data (optional)
docker-compose exec web pnpm run db:seed
```

### 5. Access the Application

- **Web Application**: http://localhost:3000
- **Solver API Documentation**: http://localhost:8000/docs
- **Solver Health Check**: http://localhost:8000/api/v1/health

### 6. Default Login Credentials

After seeding, you can log in with:

- **Email**: admin@university.edu
- **Password**: admin123

**Important**: Change the default password immediately in production!

## Configuration

### Environment Variables

#### Web Application

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | SQLite database path | `file:/app/data/dev.db` | Yes |
| `NEXTAUTH_SECRET` | NextAuth.js secret key | - | Yes |
| `NEXTAUTH_URL` | Application base URL | `http://localhost:3000` | Yes |
| `SOLVER_API_URL` | Solver service URL | `http://solver:8000` | Yes |
| `SOLVER_API_KEY` | API key for solver | - | Yes |

#### Solver Service

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `API_KEY` | Authentication key | - | Yes |
| `LOG_LEVEL` | Logging verbosity | `INFO` | No |

### Port Configuration

To change the exposed ports, edit `docker-compose.yml`:

```yaml
services:
  web:
    ports:
      - "8080:3000"  # Change 8080 to your desired port
  
  solver:
    ports:
      - "9000:8000"  # Change 9000 to your desired port
```

Remember to update `NEXTAUTH_URL` accordingly.

## Building Images

### Build All Images

```bash
docker-compose build
```

### Build Specific Service

```bash
# Build web application only
docker-compose build web

# Build solver service only
docker-compose build solver
```

### Build with No Cache

```bash
docker-compose build --no-cache
```

### View Built Images

```bash
docker images | grep university-timetable-scheduler
```

## Running Services

### Start Services

```bash
# Start in detached mode
docker-compose up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d web
```

### Stop Services

```bash
# Stop all services
docker-compose stop

# Stop specific service
docker-compose stop web
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart web
```

### Remove Services

```bash
# Stop and remove containers
docker-compose down

# Stop, remove containers, and delete volumes
docker-compose down -v
```

## Database Management

### Access Database

```bash
# Access SQLite database
docker-compose exec web sh
cd /app/data
sqlite3 dev.db
```

### Run Migrations

```bash
# Generate Prisma client
docker-compose exec web pnpm run db:generate

# Push schema changes
docker-compose exec web pnpm run db:push

# Run migrations
docker-compose exec web pnpm run db:migrate
```

### Backup Database

```bash
# Create backup
docker-compose exec web sh -c "cp /app/data/dev.db /app/data/backup-$(date +%Y%m%d-%H%M%S).db"

# Copy backup to host
docker cp $(docker-compose ps -q web):/app/data/backup-*.db ./backups/
```

### Restore Database

```bash
# Copy backup to container
docker cp ./backups/backup.db $(docker-compose ps -q web):/app/data/dev.db

# Restart web service
docker-compose restart web
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove volume
docker volume rm university-timetable-scheduler_sqlite-data

# Start services
docker-compose up -d

# Initialize database
docker-compose exec web pnpm run db:push
docker-compose exec web pnpm run db:seed
```

## Monitoring and Logs

### View Logs

```bash
# View all logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f

# View logs for specific service
docker-compose logs web
docker-compose logs solver

# View last 100 lines
docker-compose logs --tail=100

# View logs with timestamps
docker-compose logs -t
```

### Check Service Status

```bash
# List running containers
docker-compose ps

# View resource usage
docker stats $(docker-compose ps -q)
```

### Health Checks

```bash
# Check web application
curl http://localhost:3000

# Check solver service
curl http://localhost:8000/api/v1/health

# Expected response from solver health check:
# {"status": "healthy", "version": "1.0.0"}
```

### Execute Commands in Containers

```bash
# Access web container shell
docker-compose exec web sh

# Access solver container shell
docker-compose exec solver sh

# Run one-off command
docker-compose exec web pnpm run lint
```

## Troubleshooting

### Common Issues

#### Issue: Port Already in Use

**Error**: `Bind for 0.0.0.0:3000 failed: port is already allocated`

**Solution**:
```bash
# Find process using the port
lsof -i :3000  # On macOS/Linux
netstat -ano | findstr :3000  # On Windows

# Kill the process or change the port in docker-compose.yml
```

#### Issue: Database Connection Error

**Error**: `Can't reach database server`

**Solution**:
```bash
# Check if volume exists
docker volume ls | grep sqlite-data

# Recreate volume
docker-compose down -v
docker-compose up -d
docker-compose exec web pnpm run db:push
```

#### Issue: Solver Service Returns 401

**Error**: `Unauthorized: Invalid API key`

**Solution**:
```bash
# Verify environment variables match
docker-compose exec web env | grep SOLVER_API_KEY
docker-compose exec solver env | grep API_KEY

# Update .env file and restart
docker-compose down
docker-compose up -d
```

#### Issue: Out of Memory

**Error**: Container crashes or becomes unresponsive

**Solution**:
```bash
# Check memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
# Or add resource limits to docker-compose.yml
```

#### Issue: Build Fails

**Error**: Various build errors

**Solution**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Docker disk space
docker system df
```

### Debug Mode

Enable debug logging:

```bash
# Update .env
LOG_LEVEL=DEBUG

# Restart services
docker-compose restart
```

### Network Issues

```bash
# Test connectivity between services
docker-compose exec web ping solver

# Inspect network
docker network inspect university-timetable-scheduler_default

# Recreate network
docker-compose down
docker-compose up -d
```

## Production Deployment

### Security Checklist

- [ ] Generate strong, unique secrets for `NEXTAUTH_SECRET` and `SOLVER_API_KEY`
- [ ] Change default admin password
- [ ] Use HTTPS with valid SSL certificates
- [ ] Restrict database file permissions
- [ ] Enable firewall rules
- [ ] Set up regular backups
- [ ] Configure log rotation
- [ ] Use environment-specific `.env` files
- [ ] Review and update CORS settings
- [ ] Implement rate limiting

### PostgreSQL Migration

For production, consider using PostgreSQL instead of SQLite:

1. **Update Prisma schema** (`prisma/schema.prisma`):
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Update docker-compose.yml**:
   ```yaml
   services:
     db:
       image: postgres:15-alpine
       environment:
         POSTGRES_USER: timetable
         POSTGRES_PASSWORD: ${DB_PASSWORD}
         POSTGRES_DB: timetable
       volumes:
         - postgres-data:/var/lib/postgresql/data
     
     web:
       environment:
         - DATABASE_URL=postgresql://timetable:${DB_PASSWORD}@db:5432/timetable
       depends_on:
         - db
         - solver
   
   volumes:
     postgres-data:
   ```

3. **Run migrations**:
   ```bash
   docker-compose exec web pnpm run db:migrate
   ```

### Reverse Proxy Setup

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name timetable.university.edu;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Monitoring

Set up monitoring with Prometheus and Grafana:

```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    depends_on:
      - prometheus
```

### Backup Strategy

Automated backup script:

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
CONTAINER=$(docker-compose ps -q web)

# Create backup
docker exec $CONTAINER sh -c "cp /app/data/dev.db /app/data/backup-$TIMESTAMP.db"

# Copy to host
docker cp $CONTAINER:/app/data/backup-$TIMESTAMP.db $BACKUP_DIR/

# Keep only last 7 days
find $BACKUP_DIR -name "backup-*.db" -mtime +7 -delete

echo "Backup completed: backup-$TIMESTAMP.db"
```

Schedule with cron:

```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup.sh
```

### Scaling

For high availability, consider:

- Load balancing multiple web instances
- Separate database server
- Redis for session storage
- Message queue for async tasks
- Container orchestration (Kubernetes, Docker Swarm)

## Support

For issues and questions:

- Check the [main README](README.md)
- Review [troubleshooting section](#troubleshooting)
- Check application logs
- Open an issue on GitHub

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Prisma Documentation](https://www.prisma.io/docs/)
