# API Documentation

## Overview

The University Timetable Scheduler provides two solver implementations and their corresponding APIs:

1. **Local Solver** (Default, Recommended) - TypeScript Simulated Annealing solver running in the web application
2. **OR-Tools Solver Service** - Python FastAPI REST API with CP-SAT solver

The local solver is used by default for most timetable generation requests. The OR-Tools solver is available as an alternative for cases requiring proven optimal solutions or complex constraint analysis.

### APIs

1. **Web Application API** - Next.js Server Actions for timetable generation (uses local solver by default)
2. **Solver Service API** - Python FastAPI REST endpoints (optional, for OR-Tools solver)

## Solver Service API

Base URL: `http://localhost:8000` (development) or your deployed URL

### Authentication

All API endpoints (except `/` and `/api/v1/health`) require API key authentication.

**Header:**
```
X-API-Key: your-api-key-here
```

**Response Codes:**
- `401 Unauthorized` - Invalid or missing API key
- `422 Unprocessable Entity` - Validation error
- `400 Bad Request` - Invalid request data
- `500 Internal Server Error` - Server error

---

## Endpoints

### 1. Root Endpoint

Get service information.

**Request:**
```http
GET /
```

**Response:**
```json
{
  "message": "University Timetable Solver Service",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/api/v1/health"
}
```

---

### 2. Health Check

Check service health status.

**Request:**
```http
GET /api/v1/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "solver",
  "version": "1.0.0"
}
```

---

### 3. Generate Timetable

Generate an optimized timetable using constraint programming.

**Request:**
```http
POST /api/v1/generate
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**
```json
{
  "courses": [
    {
      "id": 1,
      "code": "CS101",
      "title": "Introduction to Computer Science",
      "duration": 90,
      "department": "Computer Science",
      "room_type": "LECTURE_HALL",
      "instructor_ids": [1],
      "group_ids": [1, 2]
    }
  ],
  "instructors": [
    {
      "id": 1,
      "name": "Dr. John Smith",
      "department": "Computer Science",
      "teaching_load": 20,
      "availability": {
        "MONDAY": ["09:00-12:00", "14:00-17:00"],
        "TUESDAY": ["09:00-17:00"],
        "WEDNESDAY": ["09:00-12:00"],
        "THURSDAY": ["09:00-17:00"],
        "FRIDAY": ["09:00-12:00"]
      },
      "preferences": {
        "preferredDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
        "preferredTimes": ["09:00-12:00"]
      }
    }
  ],
  "rooms": [
    {
      "id": 1,
      "name": "Room 101",
      "capacity": 50,
      "type": "LECTURE_HALL",
      "equipment": ["PROJECTOR", "WHITEBOARD"]
    }
  ],
  "groups": [
    {
      "id": 1,
      "name": "CS-2025-A",
      "size": 30,
      "course_ids": [1]
    }
  ],
  "constraints": {
    "hard": {
      "noRoomDoubleBooking": true,
      "noInstructorDoubleBooking": true,
      "roomCapacityCheck": true,
      "roomTypeMatch": true,
      "workingHoursOnly": true
    },
    "soft": {
      "instructorPreferencesWeight": 5,
      "compactSchedulesWeight": 7,
      "balancedDailyLoadWeight": 6,
      "preferredRoomsWeight": 3
    },
    "working_hours_start": "08:00",
    "working_hours_end": "18:00"
  },
  "time_limit_seconds": 300
}
```

**Response (Success):**
```json
{
  "success": true,
  "assignments": [
    {
      "course_id": 1,
      "instructor_id": 1,
      "room_id": 1,
      "group_id": 1,
      "day": "MONDAY",
      "start_time": "09:00",
      "end_time": "10:30"
    }
  ],
  "fitness_score": 12.5,
  "violations": [
    {
      "constraint_type": "instructor_day_preference",
      "severity": "soft",
      "description": "Instructor Dr. John Smith assigned on non-preferred day TUESDAY",
      "affected_assignments": [2]
    }
  ],
  "solve_time_seconds": 45.3,
  "message": "Optimal solution found"
}
```

**Response (Failure - Infeasible):**
```json
{
  "success": false,
  "assignments": [],
  "fitness_score": null,
  "violations": [],
  "solve_time_seconds": 120.5,
  "message": "No feasible solution: Not enough room-time slots (200) for 250 courses"
}
```

**Field Descriptions:**

- `success` (boolean): Whether a solution was found
- `assignments` (array): List of course assignments
  - `course_id` (integer): Course identifier
  - `instructor_id` (integer): Instructor identifier
  - `room_id` (integer): Room identifier
  - `group_id` (integer): Student group identifier
  - `day` (string): Day of week (MONDAY-SUNDAY)
  - `start_time` (string): Start time in HH:MM format
  - `end_time` (string): End time in HH:MM format
- `fitness_score` (float|null): Quality score (0-100, lower is better)
- `violations` (array): List of soft constraint violations
- `solve_time_seconds` (float): Time taken to solve
- `message` (string): Human-readable status message

---

### 4. Validate Timetable

Validate an existing timetable for constraint violations.

**Request:**
```http
POST /api/v1/validate
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**
```json
{
  "courses": [...],
  "instructors": [...],
  "rooms": [...],
  "groups": [...],
  "constraints": {...},
  "assignments": [
    {
      "course_id": 1,
      "instructor_id": 1,
      "room_id": 1,
      "group_id": 1,
      "day": "MONDAY",
      "start_time": "09:00",
      "end_time": "10:30"
    }
  ]
}
```

**Response (Valid):**
```json
{
  "is_valid": true,
  "conflicts": []
}
```

**Response (Invalid):**
```json
{
  "is_valid": false,
  "conflicts": [
    {
      "constraint_type": "room_conflict",
      "severity": "hard",
      "description": "Room 101 double-booked on MONDAY at 09:00",
      "affected_assignments": [1, 3]
    },
    {
      "constraint_type": "instructor_conflict",
      "severity": "hard",
      "description": "Instructor Dr. John Smith double-booked on MONDAY at 09:00",
      "affected_assignments": [1, 5]
    }
  ]
}
```

---

## Data Models

### CourseInput

```typescript
{
  id: number;
  code: string;
  title: string;
  duration: number;          // in minutes
  department: string;
  room_type?: string;        // optional: "LECTURE_HALL", "LAB", "SEMINAR", etc.
  instructor_ids: number[];
  group_ids: number[];
}
```

### InstructorInput

```typescript
{
  id: number;
  name: string;
  department: string;
  teaching_load: number;     // max hours per week
  availability: {
    [day: string]: string[]; // e.g., {"MONDAY": ["09:00-12:00", "14:00-17:00"]}
  };
  preferences?: {
    preferredDays?: string[];
    preferredTimes?: string[];
  };
}
```

### RoomInput

```typescript
{
  id: number;
  name: string;
  capacity: number;
  type: string;              // "LECTURE_HALL", "LAB", "SEMINAR", "AUDITORIUM"
  equipment?: string[];      // optional: ["PROJECTOR", "WHITEBOARD", "COMPUTERS"]
}
```

### StudentGroupInput

```typescript
{
  id: number;
  name: string;
  size: number;
  course_ids: number[];
}
```

### ConstraintConfigInput

```typescript
{
  hard: {
    noRoomDoubleBooking: boolean;
    noInstructorDoubleBooking: boolean;
    roomCapacityCheck: boolean;
    roomTypeMatch: boolean;
    workingHoursOnly: boolean;
  };
  soft: {
    instructorPreferencesWeight: number;  // 0-10
    compactSchedulesWeight: number;       // 0-10
    balancedDailyLoadWeight: number;      // 0-10
    preferredRoomsWeight: number;         // 0-10
  };
  working_hours_start: string;  // "HH:MM"
  working_hours_end: string;    // "HH:MM"
}
```

---

## Error Handling

### Validation Errors (422)

```json
{
  "detail": "Validation error",
  "errors": [
    {
      "loc": ["body", "courses", 0, "duration"],
      "msg": "ensure this value is greater than 0",
      "type": "value_error.number.not_gt"
    }
  ]
}
```

### Value Errors (400)

```json
{
  "detail": "Invalid time format: expected HH:MM"
}
```

### Server Errors (500)

```json
{
  "detail": "Internal server error"
}
```

---

## Interactive Documentation

The Solver Service provides interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

These interfaces allow you to:
- View all endpoints and their parameters
- Test API calls directly from the browser
- Download OpenAPI specification

---

## Rate Limiting

Currently, no rate limiting is implemented. For production deployments, consider adding rate limiting middleware.

---

## Best Practices

### 1. Time Limits

- Default time limit: 300 seconds (5 minutes)
- Minimum: 10 seconds
- Maximum: 600 seconds (10 minutes)
- Adjust based on problem size

### 2. Problem Size

The solver can handle:
- Up to 2000+ course events
- Typical solve time: 30-120 seconds for 100-300 courses
- Larger problems may require longer time limits

### 3. Constraint Configuration

- Start with all hard constraints enabled
- Adjust soft constraint weights based on priorities
- Higher weights (7-10) = higher priority
- Lower weights (1-3) = lower priority

### 4. Handling Infeasibility

If the solver returns `success: false`:
1. Check the error message for specific issues
2. Common causes:
   - Insufficient rooms or time slots
   - Overly restrictive instructor availability
   - Room capacity constraints
   - Room type mismatches
3. Solutions:
   - Add more rooms
   - Extend working hours
   - Relax instructor availability
   - Increase time limit

### 5. Retry Logic

Implement exponential backoff for failed requests:
```javascript
async function generateWithRetry(payload, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch('/api/v1/generate', {
        method: 'POST',
        headers: {
          'X-API-Key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
}
```

---

## Web Application Server Actions

The Next.js application uses Server Actions for mutations. These are not REST endpoints but server-side functions called from React components.

### Example Server Actions

```typescript
// actions/timetables.ts

export async function generateTimetable(data: GenerationInput): Promise<ActionResult> {
  // Fetch data from database
  // Call solver API
  // Store results
  // Return success/error
}

export async function updateAssignment(id: number, data: AssignmentUpdate): Promise<ActionResult> {
  // Validate changes
  // Update database
  // Revalidate cache
  // Return success/error
}

export async function publishTimetable(id: number): Promise<ActionResult> {
  // Update status to PUBLISHED
  // Set publishedAt timestamp
  // Revalidate pages
  // Return success/error
}
```

Server Actions are called directly from React components:
```typescript
import { generateTimetable } from '@/actions/timetables';

async function handleGenerate() {
  const result = await generateTimetable(formData);
  if (result.success) {
    // Handle success
  } else {
    // Handle error
  }
}
```

---

## Security Considerations

### API Key Management

- Store API keys in environment variables
- Never commit API keys to version control
- Rotate keys regularly
- Use different keys for different environments

### CORS Configuration

For production, configure CORS to allow only trusted origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-domain.com"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["X-API-Key", "Content-Type"],
)
```

### HTTPS

Always use HTTPS in production to protect API keys and data in transit.

---

## Monitoring and Logging

The Solver Service logs all requests and responses:

```
2025-11-26 10:30:15 - INFO - Request: POST /api/v1/generate
2025-11-26 10:30:15 - INFO - Received generation request: 150 courses, 50 instructors, 30 rooms, 20 groups
2025-11-26 10:31:00 - INFO - Optimization completed: success=True, assignments=150, fitness=15.3, time=45.2s
2025-11-26 10:31:00 - INFO - Response: POST /api/v1/generate Status: 200 Duration: 45.234s
```

Configure log level via environment variable:
```bash
LOG_LEVEL=INFO  # DEBUG, INFO, WARNING, ERROR
```
