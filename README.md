# University Timetable Scheduler

Automated lecture timetable scheduling system using Next.js 16 and Python FastAPI with OR-Tools constraint solver.

## Features

- **Academic Data Management**: Manage courses, instructors, rooms, and student groups
- **Automated Scheduling**: Generate optimized timetables using constraint programming
- **Manual Editing**: Fine-tune generated schedules with drag-and-drop interface
- **Role-Based Access**: Admin, Faculty, and Student roles with appropriate permissions
- **Import/Export**: CSV and Excel support for bulk data operations
- **Analytics Dashboard**: View scheduling metrics and system statistics

## Technology Stack

### Web Application
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM with SQLite
- NextAuth.js for authentication

### Solver Service
- Python 3.11+
- FastAPI
- Google OR-Tools (CP-SAT solver)
- Pydantic for validation

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- Docker and Docker Compose (for containerized deployment)

## Getting Started

### Local Development

#### 1. Install Web Application Dependencies

```bash
pnpm install
```

#### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update the values in `.env` as needed.

#### 3. Initialize Database

Generate Prisma client and create the database:

```bash
pnpm run db:generate
pnpm run db:push
```

#### 4. Install Solver Service Dependencies

```bash
cd solver
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

#### 5. Run Development Servers

In one terminal, start the Next.js development server:

```bash
pnpm run dev
```

In another terminal, start the solver service:

```bash
cd solver
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

The web application will be available at http://localhost:3000 and the solver service at http://localhost:8000.

### Docker Deployment

#### 1. Set Up Environment Variables

Create a `.env` file in the root directory with your configuration:

```bash
SOLVER_API_KEY=your-secure-api-key
NEXTAUTH_SECRET=your-secure-secret
NEXTAUTH_URL=http://localhost:3000
LOG_LEVEL=INFO
```

#### 2. Build and Run with Docker Compose

```bash
docker-compose up -d
```

This will start both the web application and solver service.

#### 3. Access the Application

- Web Application: http://localhost:3000
- Solver Service API Docs: http://localhost:8000/docs

#### 4. Stop the Services

```bash
docker-compose down
```

To remove volumes as well:

```bash
docker-compose down -v
```

## Project Structure

```
.
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
├── lib/                   # Utility functions
│   ├── db.ts             # Prisma client
│   ├── env.ts            # Environment validation
│   └── utils.ts          # Helper functions
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
├── solver/               # Python solver service
│   ├── app/
│   │   ├── main.py      # FastAPI application
│   │   ├── config.py    # Configuration
│   │   └── models/      # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile           # Web app Dockerfile
└── package.json         # Node.js dependencies
```

## Available Scripts

### Web Application

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run db:generate` - Generate Prisma client
- `pnpm run db:push` - Push schema to database
- `pnpm run db:migrate` - Run database migrations

### Solver Service

- `uvicorn app.main:app --reload` - Start development server
- `uvicorn app.main:app --host 0.0.0.0 --port 8000` - Start production server

## Environment Variables

### Web Application (.env)

- `DATABASE_URL` - Database connection string (default: `file:./dev.db` for SQLite)
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (e.g., `http://localhost:3000`)
- `SOLVER_API_URL` - Solver service URL (e.g., `http://localhost:8000` or `http://solver:8000` in Docker)
- `SOLVER_API_KEY` - API key for solver service authentication

### Solver Service (solver/.env)

- `API_KEY` - API key for authentication (must match `SOLVER_API_KEY` in web app)
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARNING, ERROR)

## Docker Deployment Details

### Multi-Stage Build Optimization

The web application Dockerfile uses a multi-stage build process to minimize the final image size:

1. **deps stage**: Installs Node.js dependencies
2. **builder stage**: Generates Prisma client and builds Next.js application
3. **runner stage**: Creates minimal production image with only necessary files

### Volume Persistence

The Docker Compose configuration creates a named volume `sqlite-data` to persist the SQLite database across container restarts. The database file is stored at `/app/data/dev.db` inside the container.

### Networking

Both services are connected via Docker's default bridge network. The web application communicates with the solver service using the service name `solver` as the hostname (e.g., `http://solver:8000`).

### Health Checks

To verify the services are running correctly:

```bash
# Check web application
curl http://localhost:3000

# Check solver service health
curl http://localhost:8000/api/v1/health

# Check solver service API documentation
open http://localhost:8000/docs
```

## Troubleshooting

### Docker Issues

**Problem**: Container fails to start with database errors

**Solution**: Ensure the database volume has proper permissions and the database is initialized:

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec web pnpm run db:push
```

**Problem**: Solver service returns 401 Unauthorized

**Solution**: Verify that `SOLVER_API_KEY` in the web app matches `API_KEY` in the solver service:

```bash
# Check environment variables
docker-compose exec web env | grep SOLVER_API_KEY
docker-compose exec solver env | grep API_KEY
```

**Problem**: Web application cannot connect to solver service

**Solution**: Ensure both services are running and can communicate:

```bash
# Check service status
docker-compose ps

# Check logs
docker-compose logs web
docker-compose logs solver

# Test connectivity from web container
docker-compose exec web wget -O- http://solver:8000/api/v1/health
```

### Database Issues

**Problem**: Database is locked or corrupted

**Solution**: Stop all services and reset the database:

```bash
docker-compose down
docker volume rm university-timetable-scheduler_sqlite-data
docker-compose up -d
docker-compose exec web pnpm run db:push
docker-compose exec web pnpm run db:seed
```

**Problem**: Prisma client is out of sync

**Solution**: Regenerate the Prisma client:

```bash
docker-compose exec web pnpm run db:generate
docker-compose restart web
```

### Performance Issues

**Problem**: Timetable generation is slow or times out

**Solution**: Adjust solver timeout and worker settings in the solver service configuration, or reduce the problem size by limiting the number of courses/constraints.

**Problem**: High memory usage

**Solution**: Limit Docker container resources in `docker-compose.yml`:

```yaml
services:
  web:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 1G
  solver:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 2G
```

### Development vs Production

For production deployment:

1. **Generate secure secrets**:
   ```bash
   openssl rand -base64 32  # For NEXTAUTH_SECRET
   openssl rand -base64 32  # For SOLVER_API_KEY
   ```

2. **Update environment variables** in `.env` file with production values

3. **Use PostgreSQL** instead of SQLite for better performance:
   - Update `DATABASE_URL` in `.env`
   - Update Prisma schema datasource to `postgresql`
   - Run migrations: `pnpm run db:migrate`

4. **Enable HTTPS** using a reverse proxy (nginx, Traefik, or Caddy)

5. **Set up monitoring** and logging for production workloads

## License

MIT
