# Requirements Document

## Introduction

The University Lecture Timetable Scheduler is a full-stack web application that enables university administrators to manage academic data and automatically generate optimized lecture timetables. The system uses Next.js 16 with SQLite for the web application and a Python FastAPI microservice with OR-Tools for constraint-based optimization. The solution addresses the complex problem of scheduling courses, instructors, rooms, and student groups while respecting hard constraints (no conflicts) and optimizing soft constraints (preferences).

## Glossary

- **WebApp**: The Next.js 16 application serving the user interface and managing data persistence via SQLite
- **SolverService**: The Python FastAPI microservice that performs timetable optimization using OR-Tools
- **Administrator**: A user with full system access to manage data and generate timetables
- **Faculty**: An instructor user who can view schedules and set availability preferences
- **Student**: A user who can view published timetables for their group
- **HardConstraint**: A scheduling rule that must never be violated (e.g., no double-booking)
- **SoftConstraint**: A scheduling preference that should be optimized but may be violated (e.g., instructor time preferences)
- **Assignment**: A scheduled lecture event linking course, instructor, room, student group, and time slot
- **Timetable**: A complete schedule for a semester containing multiple assignments
- **TimeSlot**: A specific day and time period when a lecture can be scheduled

## Requirements

### Requirement 1: Academic Data Management

**User Story:** As an Administrator, I want to manage courses, instructors, rooms, and student groups, so that I have accurate data for timetable generation.

#### Acceptance Criteria

1. WHEN an Administrator creates a course, THE WebApp SHALL store the course code, title, duration, credits, and department in the database
2. WHEN an Administrator creates an instructor, THE WebApp SHALL store the name, availability, department, teaching load, and preferences in the database
3. WHEN an Administrator creates a room, THE WebApp SHALL store the name, capacity, type, and equipment in the database
4. WHEN an Administrator creates a student group, THE WebApp SHALL store the program, year, size, and required courses in the database
5. WHEN an Administrator requests to export data, THE WebApp SHALL generate a CSV or Excel file containing the selected entity data
6. WHEN an Administrator uploads a CSV or Excel file, THE WebApp SHALL validate and import the data into the database
7. IF imported data contains validation errors, THEN THE WebApp SHALL display error messages with row numbers and field details
8. THE WebApp SHALL provide CRUD operations for all academic entities through the user interface

### Requirement 2: User Authentication and Authorization

**User Story:** As a system user, I want secure role-based access, so that I can only perform actions appropriate to my role.

#### Acceptance Criteria

1. WHEN a user attempts to log in, THE WebApp SHALL authenticate credentials using NextAuth.js with JWT tokens
2. THE WebApp SHALL support three user roles: Administrator, Faculty, and Student
3. WHEN an Administrator accesses data management features, THE WebApp SHALL grant full access
4. WHEN a Faculty user accesses the system, THE WebApp SHALL allow viewing schedules and updating personal availability preferences
5. WHEN a Student user accesses the system, THE WebApp SHALL allow viewing published timetables for their assigned group
6. IF a user attempts to access unauthorized resources, THEN THE WebApp SHALL return a 403 Forbidden response
7. THE WebApp SHALL protect all API routes with role-based middleware

### Requirement 3: Constraint Configuration

**User Story:** As an Administrator, I want to define hard and soft constraints for scheduling, so that generated timetables meet institutional requirements and preferences.

#### Acceptance Criteria

1. THE WebApp SHALL enforce hard constraints that prevent room double-booking
2. THE WebApp SHALL enforce hard constraints that prevent instructor double-booking
3. THE WebApp SHALL enforce hard constraints that ensure room capacity is greater than or equal to student group size
4. THE WebApp SHALL enforce hard constraints that assign specialized courses to appropriate room types
5. THE WebApp SHALL enforce hard constraints that schedule all events within defined working hours
6. WHEN an Administrator configures soft constraints, THE WebApp SHALL accept weight values for instructor time preferences
7. WHEN an Administrator configures soft constraints, THE WebApp SHALL accept weight values for compact student schedules
8. WHEN an Administrator configures soft constraints, THE WebApp SHALL accept weight values for balanced daily load
9. WHEN an Administrator configures soft constraints, THE WebApp SHALL accept weight values for preferred room assignments
10. THE WebApp SHALL store constraint configurations and pass them to the SolverService during optimization

### Requirement 4: Automated Timetable Generation

**User Story:** As an Administrator, I want to automatically generate optimized timetables, so that I can quickly create conflict-free schedules that respect preferences.

#### Acceptance Criteria

1. WHEN an Administrator initiates timetable generation, THE WebApp SHALL send a JSON payload containing courses, rooms, instructors, student groups, and constraints to the SolverService
2. WHEN the SolverService receives a generation request, THE SolverService SHALL apply hard constraints using constraint programming
3. WHEN the SolverService applies optimization, THE SolverService SHALL minimize the weighted sum of soft constraint violations
4. WHEN the SolverService completes optimization, THE SolverService SHALL return a JSON response containing assignments, fitness score, and violation details
5. WHEN the WebApp receives solver results, THE WebApp SHALL store the timetable and assignments in the database
6. WHILE timetable generation is in progress, THE WebApp SHALL display progress updates to the Administrator
7. IF the SolverService cannot find a feasible solution, THEN THE WebApp SHALL display conflict details and suggest constraint adjustments
8. THE SolverService SHALL handle scheduling problems with at least 2000 course events

### Requirement 5: Timetable Validation

**User Story:** As an Administrator, I want to validate timetables for conflicts, so that I can ensure schedule quality before publishing.

#### Acceptance Criteria

1. WHEN an Administrator requests timetable validation, THE WebApp SHALL send the timetable data to the SolverService validation endpoint
2. WHEN the SolverService validates a timetable, THE SolverService SHALL check all hard constraints
3. WHEN the SolverService detects constraint violations, THE SolverService SHALL return a list of conflicts with affected assignments
4. WHEN the WebApp receives validation results, THE WebApp SHALL display conflicts with color-coded indicators
5. IF a timetable has no hard constraint violations, THEN THE WebApp SHALL mark it as valid
6. THE WebApp SHALL calculate and display soft constraint violation metrics for validated timetables

### Requirement 6: Manual Timetable Editing

**User Story:** As an Administrator, I want to manually adjust generated timetables, so that I can make fine-tuning changes based on special circumstances.

#### Acceptance Criteria

1. WHEN an Administrator views a timetable, THE WebApp SHALL display assignments in a weekly calendar view
2. WHEN an Administrator drags an assignment to a new time slot, THE WebApp SHALL update the assignment in the database
3. WHEN an Administrator modifies an assignment, THE WebApp SHALL validate the change against hard constraints
4. IF a manual edit creates a conflict, THEN THE WebApp SHALL prevent the change and display a conflict warning
5. WHEN an Administrator filters the view by room, THE WebApp SHALL display only assignments for the selected room
6. WHEN an Administrator filters the view by instructor, THE WebApp SHALL display only assignments for the selected instructor
7. WHEN an Administrator filters the view by student group, THE WebApp SHALL display only assignments for the selected group
8. THE WebApp SHALL highlight conflicting assignments with distinct color coding

### Requirement 7: Timetable Publishing and Export

**User Story:** As an Administrator, I want to publish and export timetables, so that students and faculty can access their schedules.

#### Acceptance Criteria

1. WHEN an Administrator publishes a timetable, THE WebApp SHALL update the timetable status to "published"
2. WHEN a timetable is published, THE WebApp SHALL make it visible to Faculty and Student users
3. WHEN an Administrator requests PDF export, THE WebApp SHALL generate a formatted PDF document of the timetable
4. WHEN an Administrator requests Excel export, THE WebApp SHALL generate an Excel spreadsheet with assignment data
5. WHEN a Faculty user views a published timetable, THE WebApp SHALL display their assigned teaching schedule
6. WHEN a Student user views a published timetable, THE WebApp SHALL display their group's class schedule
7. THE WebApp SHALL support exporting filtered views (by room, instructor, or group)

### Requirement 8: Faculty Availability Management

**User Story:** As a Faculty member, I want to set my availability preferences, so that the system considers my constraints during scheduling.

#### Acceptance Criteria

1. WHEN a Faculty user accesses availability settings, THE WebApp SHALL display a weekly time grid
2. WHEN a Faculty user marks time slots as unavailable, THE WebApp SHALL store the availability data in the database
3. WHEN a Faculty user sets preferred time slots, THE WebApp SHALL store the preferences with associated weights
4. WHEN an Administrator generates a timetable, THE WebApp SHALL include faculty availability as hard constraints
5. WHEN an Administrator generates a timetable, THE WebApp SHALL include faculty preferences as soft constraints
6. THE WebApp SHALL allow Faculty users to update availability at any time

### Requirement 9: Dashboard and Analytics

**User Story:** As an Administrator, I want to view system analytics and metrics, so that I can monitor scheduling quality and system usage.

#### Acceptance Criteria

1. WHEN an Administrator accesses the dashboard, THE WebApp SHALL display the total number of courses, instructors, rooms, and student groups
2. WHEN an Administrator views timetable metrics, THE WebApp SHALL display the fitness score and soft constraint violation breakdown
3. WHEN an Administrator views analytics, THE WebApp SHALL display room utilization rates using charts
4. WHEN an Administrator views analytics, THE WebApp SHALL display instructor teaching load distribution using charts
5. THE WebApp SHALL display the status of all timetables (draft, published, archived)
6. THE WebApp SHALL display recent system activity and generation history

### Requirement 10: System Integration and Communication

**User Story:** As a system operator, I want secure communication between the WebApp and SolverService, so that the system maintains data integrity and security.

#### Acceptance Criteria

1. WHEN the WebApp communicates with the SolverService, THE WebApp SHALL include an API key in request headers
2. WHEN the SolverService receives a request, THE SolverService SHALL validate the API key before processing
3. IF the API key is invalid, THEN THE SolverService SHALL return a 401 Unauthorized response
4. THE WebApp SHALL handle SolverService connection failures with retry logic and error messages
5. THE WebApp SHALL log all requests to the SolverService for audit purposes
6. THE SolverService SHALL expose OpenAPI documentation at the /docs endpoint

### Requirement 11: Data Persistence and Migration

**User Story:** As a system operator, I want reliable data storage with migration support, so that the system can evolve without data loss.

#### Acceptance Criteria

1. THE WebApp SHALL use Prisma ORM to manage database schema and migrations
2. WHEN the database schema changes, THE WebApp SHALL support running Prisma migrations to update the database structure
3. THE WebApp SHALL use SQLite as the default database provider
4. THE WebApp SHALL support switching to PostgreSQL by changing the Prisma datasource configuration
5. WHEN the system initializes, THE WebApp SHALL run a seed script to populate sample data for development
6. THE WebApp SHALL maintain referential integrity through foreign key constraints

### Requirement 12: Deployment and Containerization

**User Story:** As a system operator, I want containerized deployment, so that I can easily deploy and scale the system.

#### Acceptance Criteria

1. THE WebApp SHALL provide a Dockerfile that builds a Node.js 18+ container
2. THE SolverService SHALL provide a Dockerfile that builds a Python 3.11+ container
3. WHEN using Docker Compose, THE system SHALL start both WebApp and SolverService containers
4. WHEN using Docker Compose, THE system SHALL mount SQLite database as a persistent volume
5. THE WebApp container SHALL expose port 3000 for HTTP traffic
6. THE SolverService container SHALL expose port 8000 for HTTP traffic
7. THE Docker Compose configuration SHALL define environment variables through an .env file
