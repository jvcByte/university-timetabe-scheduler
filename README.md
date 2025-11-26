# University Timetable Scheduler

Automated lecture timetable scheduling system using Next.js 16 and Python FastAPI with OR-Tools constraint solver.

## Features

- **Academic Data Management**: Manage courses, instructors, rooms, and student groups
- **Automated Scheduling**: Generate optimized timetables using two solver options:
  - **Local Solver** (Default): Fast Simulated Annealing algorithm (10-60 seconds)
  - **OR-Tools Solver** (Optional): Constraint Programming for proven optimal solutions
- **Manual Editing**: Fine-tune generated schedules with drag-and-drop interface
- **Role-Based Access**: Admin, Faculty, and Student roles with appropriate permissions
- **Import/Export**: CSV and Excel support for bulk data operations
- **Analytics Dashboard**: View scheduling metrics and system statistics

## Technology Stack

### Web Application
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM with PostgreSQL (Neon)
- NextAuth.js v5 for authentication
- TanStack Query for data fetching

### Solver Service
- Python 3.11+
- FastAPI
- Google OR-Tools (CP-SAT solver)
- Pydantic for validation

## Prerequisites

- Node.js 18+ and pnpm
- Python 3.11+
- PostgreSQL database (Neon recommended for production)
- Docker and Docker Compose (optional, for containerized deployment)

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your database URL

# 3. Initialize database
pnpm run db:push
pnpm run db:seed

# 4. Start development server
pnpm run dev
```

Visit http://localhost:3000 and login with:
- **Admin:** admin@university.edu / admin123

## Documentation

### User Documentation
- **[User Guide](docs/USER_GUIDE.md)** - Complete guide for administrators, faculty, and students
- **[Neon Import Guide](NEON_IMPORT_INSTRUCTIONS.md)** - Migrate SQLite data to PostgreSQL
- **[Import Summary](IMPORT_SUMMARY.md)** - Quick reference for data migration
- **[Ready to Import](READY_TO_IMPORT.md)** - Final checklist before importing

### Technical Documentation
- **[Architecture](docs/ARCHITECTURE.md)** - System architecture and design patterns
- **[API Documentation](docs/API_DOCUMENTATION.md)** - REST API reference for solver service
- **[Solver Algorithm](docs/SOLVER_ALGORITHM.md)** - Constraint programming algorithm details
- **[E2E Tests](e2e/README.md)** - End-to-end testing documentation
- **[Solver Tests](solver/tests/README.md)** - Solver service testing documentation

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

Generate Prisma client and push schema to database:

```bash
pnpm run db:generate
pnpm run db:push
```

Seed the database with sample data:

```bash
pnpm run db:seed
```

**Default Login Credentials:**
- Admin: `admin@university.edu` / `admin123`
- Faculty: `john.smith@university.edu` / `faculty123`

⚠️ Change these passwords after first login!

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
├── app/                           # Next.js app directory
│   ├── (auth)/                   # Authentication routes
│   ├── admin/                    # Admin dashboard
│   ├── faculty/                  # Faculty dashboard
│   ├── student/                  # Student dashboard
│   ├── api/                      # API routes
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── dashboard-header.tsx     # Dashboard navigation
│   ├── data-table.tsx           # Reusable data table
│   └── ...                      # Feature components
├── lib/                         # Utility functions
│   ├── db.ts                    # Prisma client
│   ├── auth.ts                  # NextAuth configuration
│   ├── utils.ts                 # Helper functions
│   └── validations/             # Zod schemas
├── prisma/                      # Database
│   ├── schema.prisma            # Prisma schema (PostgreSQL)
│   ├── seed.ts                  # Database seeding
│   └── dev.db                   # SQLite (local dev only)
├── scripts/                     # Utility scripts
│   ├── export-sqlite-data.ts    # Export SQLite to JSON
│   ├── generate-sql-import.ts   # Generate PostgreSQL SQL
│   ├── import-to-neon.ts        # Direct Prisma import
│   └── copy-sql.sh              # Copy SQL to clipboard
├── solver/                      # Python solver service
│   ├── app/
│   │   ├── main.py             # FastAPI application
│   │   ├── config.py           # Configuration
│   │   ├── models/             # Pydantic models
│   │   └── solver/             # OR-Tools solver
│   ├── requirements.txt
│   └── Dockerfile
├── tests/                       # Test files
│   ├── unit/                   # Unit tests
│   └── e2e/                    # Playwright tests
├── docker-compose.yml           # Docker Compose configuration
├── Dockerfile                   # Web app Dockerfile
├── package.json                 # Node.js dependencies
├── NEON_IMPORT_INSTRUCTIONS.md  # Database migration guide
└── README.md                    # This file
```

## Available Scripts

### Web Application

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `pnpm run test` - Run unit tests
- `pnpm run test:e2e` - Run end-to-end tests

### Database Management

- `pnpm run db:generate` - Generate Prisma client
- `pnpm run db:push` - Push schema to database
- `pnpm run db:migrate` - Run database migrations
- `pnpm run db:seed` - Seed database with sample data
- `pnpm run db:export` - Export SQLite data to JSON
- `pnpm run db:generate-sql` - Generate SQL import script for PostgreSQL
- `pnpm run db:migrate-to-neon` - Export and generate SQL for Neon migration

### Solver Service

- `uvicorn app.main:app --reload` - Start development server
- `uvicorn app.main:app --host 0.0.0.0 --port 8000` - Start production server

## Environment Variables

### Web Application (.env)

- `DATABASE_URL` - PostgreSQL connection string (e.g., `postgresql://user:password@host:5432/dbname`)
  - For Neon: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`
  - For local dev with SQLite: `file:./prisma/dev.db`
- `NEXTAUTH_SECRET` - Secret for NextAuth.js (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL (e.g., `http://localhost:3000`)
- `SOLVER_API_URL` - Solver service URL (e.g., `http://localhost:8000` or `http://solver:8000` in Docker)
- `SOLVER_API_KEY` - API key for solver service authentication

### Solver Service (solver/.env)

- `API_KEY` - API key for authentication (must match `SOLVER_API_KEY` in web app)
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARNING, ERROR)

## Database Migration

### Migrating from SQLite to PostgreSQL (Neon)

If you have existing data in SQLite and want to migrate to PostgreSQL:

#### 1. Export Data from SQLite

```bash
pnpm run db:export
```

This creates JSON files in the `data-export/` directory with all your data.

#### 2. Generate SQL Import Script

```bash
pnpm run db:generate-sql
```

This creates `neon-import.sql` with all INSERT statements ready for PostgreSQL.

#### 3. Import to Neon

**Option A - Using Neon SQL Editor (Recommended):**
1. Go to https://console.neon.tech
2. Open SQL Editor
3. Copy contents of `neon-import.sql`
4. Paste and run

**Option B - Using psql:**
```bash
psql "your-neon-connection-string" -f neon-import.sql
```

#### 4. Update Environment Variables

Update your `.env` file with the Neon connection string:

```bash
DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

#### Quick Migration Command

To export and generate SQL in one step:

```bash
pnpm run db:migrate-to-neon
```

See [NEON_IMPORT_INSTRUCTIONS.md](NEON_IMPORT_INSTRUCTIONS.md) for detailed instructions.

## Production Deployment

### Deploying to Vercel

1. **Set up Neon Database**
   - Create account at https://neon.tech
   - Create new project
   - Copy connection string

2. **Configure Environment Variables in Vercel**
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_SECRET=<generate-with-openssl>
   NEXTAUTH_URL=https://your-app.vercel.app
   SOLVER_API_URL=https://your-solver-service-url
   SOLVER_API_KEY=<generate-with-openssl>
   ```

3. **Deploy Solver Service**
   - Deploy to Railway, Render, or similar
   - Set `API_KEY` environment variable
   - Note the deployed URL

4. **Push Database Schema**
   ```bash
   pnpm prisma db push
   ```

5. **Import Data** (if migrating)
   - Follow the Database Migration steps above
   - Or run seed: `pnpm run db:seed`

6. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

### Environment Setup for Production

Generate secure secrets:

```bash
# For NEXTAUTH_SECRET
openssl rand -base64 32

# For SOLVER_API_KEY
openssl rand -base64 32
```

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

**Problem**: Cannot connect to Neon database

**Solution**: Verify connection string and network access:

```bash
# Test connection
psql "your-neon-connection-string" -c "SELECT 1"

# Check environment variable
echo $DATABASE_URL
```

**Problem**: Prisma client is out of sync

**Solution**: Regenerate the Prisma client:

```bash
pnpm run db:generate

# In Docker:
docker-compose exec web pnpm run db:generate
docker-compose restart web
```

**Problem**: Migration fails with timestamp errors

**Solution**: The migration scripts handle timestamp conversion automatically. If you encounter issues:

```bash
# Re-export and regenerate SQL
pnpm run db:migrate-to-neon

# Check the generated SQL file
head -20 neon-import.sql
```

**Problem**: Data import shows fewer records than expected

**Solution**: Some records may be skipped due to unique constraints. Check the verification output at the end of the SQL script execution.

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

### Sample Data

The application includes comprehensive seed data:
- 21 Departments (Computer Science, Mathematics, Engineering, etc.)
- 69 Users (Admin, Faculty, Students)
- 66 Instructors with availability schedules
- 89 Rooms with different types and capacities
- 108 Student Groups
- 300 Courses
- Pre-configured constraint settings

Run `pnpm run db:seed` to populate your database with this sample data.

### Testing

```bash
# Run unit tests
pnpm run test

# Run unit tests in watch mode
pnpm run test:watch

# Run end-to-end tests
pnpm run test:e2e

# Run e2e tests with UI
pnpm run test:e2e:ui
```

### Key Features Implemented

- **Dashboard Analytics**: Real-time statistics and metrics
- **Course Management**: CRUD operations with CSV/Excel import
- **Instructor Management**: Availability scheduling and preferences
- **Room Management**: Capacity and equipment tracking
- **Student Groups**: Program and semester organization
- **Timetable Generation**: AI-powered constraint-based scheduling
- **Manual Editing**: Drag-and-drop interface for fine-tuning
- **Conflict Detection**: Real-time validation of scheduling conflicts
- **Export Options**: PDF and Excel export of timetables
- **Role-Based Access Control**: Admin, Faculty, and Student views

## License

MIT
