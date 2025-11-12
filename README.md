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

- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Secret for NextAuth.js
- `NEXTAUTH_URL` - Application URL
- `SOLVER_API_URL` - Solver service URL
- `SOLVER_API_KEY` - API key for solver service

### Solver Service (solver/.env)

- `API_KEY` - API key for authentication
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARNING, ERROR)

## License

MIT
