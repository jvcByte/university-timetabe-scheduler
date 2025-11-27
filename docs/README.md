# Documentation Index

Welcome to the University Timetable Scheduler documentation. This index will help you find the information you need.

## Quick Links

- **[Main README](../README.md)** - Project overview and quick start
- **[User Guide](USER_GUIDE.md)** - Complete user documentation
- **[Architecture](ARCHITECTURE.md)** - System architecture and design
- **[API Documentation](API_DOCUMENTATION.md)** - REST API reference
- **[Solver Algorithm](SOLVER_ALGORITHM.md)** - Optimization algorithm details

---

## Documentation by Role

### For End Users

**Getting Started:**
1. Read the [User Guide](USER_GUIDE.md) introduction
2. Find your role section (Administrator, Faculty, or Student)
3. Follow the step-by-step instructions

**Common Tasks:**
- [Creating courses](USER_GUIDE.md#creating-a-course)
- [Setting instructor availability](USER_GUIDE.md#setting-instructor-availability)
- [Generating timetables](USER_GUIDE.md#generating-timetables)
- [Viewing schedules](USER_GUIDE.md#viewing-your-schedule)
- [Exporting data](USER_GUIDE.md#exporting-data)

**Troubleshooting:**
- [Common issues and solutions](USER_GUIDE.md#troubleshooting)
- [Getting help](USER_GUIDE.md#getting-help)

### For Administrators

**Setup and Configuration:**
1. [Installation guide](../README.md#getting-started)
2. [Database setup](../README.md#initialize-database)
3. [Environment configuration](../README.md#set-up-environment-variables)
4. [Constraint configuration](USER_GUIDE.md#configuring-constraints)

**Data Management:**
- [Importing data](USER_GUIDE.md#importing-data)
- [Exporting data](USER_GUIDE.md#exporting-data)
- [Database migration](../README.md#database-migration)

**Timetable Management:**
- [Generation process](USER_GUIDE.md#generating-timetables)
- [Manual editing](USER_GUIDE.md#editing-timetables)
- [Publishing](USER_GUIDE.md#publishing-timetables)
- [Analytics](USER_GUIDE.md#analytics-and-reports)

### For Developers

**Getting Started:**
1. [Architecture overview](ARCHITECTURE.md#system-overview)
2. [Technology stack](ARCHITECTURE.md#technology-stack)
3. [Development setup](../README.md#local-development)
4. [Project structure](../README.md#project-structure)

**Core Concepts:**
- [System architecture](ARCHITECTURE.md#architecture-diagrams)
- [Component details](ARCHITECTURE.md#component-details)
- [Data flow](ARCHITECTURE.md#data-flow)
- [Security architecture](ARCHITECTURE.md#security-architecture)

**API Integration:**
- [Solver API reference](API_DOCUMENTATION.md)
- [Authentication](API_DOCUMENTATION.md#authentication)
- [Request/response formats](API_DOCUMENTATION.md#data-models)
- [Error handling](API_DOCUMENTATION.md#error-handling)

**Algorithm Details:**
- [Constraint programming overview](SOLVER_ALGORITHM.md#algorithm-type-constraint-programming)
- [Problem formulation](SOLVER_ALGORITHM.md#problem-formulation)
- [Hard constraints](SOLVER_ALGORITHM.md#hard-constraints-must-be-satisfied)
- [Soft constraints](SOLVER_ALGORITHM.md#soft-constraints-preferences-to-optimize)
- [Optimization process](SOLVER_ALGORITHM.md#algorithm-pseudocode)

**Testing:**
- [E2E tests](../e2e/README.md)
- [Solver tests](../solver/tests/README.md)
- [Running tests](../README.md#testing)

**Deployment:**
- [Docker deployment](../README.md#docker-deployment)
- [Production deployment](../README.md#production-deployment)
- [Environment variables](../README.md#environment-variables)

### For DevOps Engineers

**Deployment:**
- [Docker setup](ARCHITECTURE.md#deployment-architecture)
- [Production environment](ARCHITECTURE.md#production-environment)
- [Environment configuration](../README.md#environment-variables)

**Monitoring:**
- [Logging](API_DOCUMENTATION.md#monitoring-and-logging)
- [Health checks](API_DOCUMENTATION.md#health-check)
- [Performance metrics](ARCHITECTURE.md#monitoring-and-observability)

**Scaling:**
- [Horizontal scaling](ARCHITECTURE.md#horizontal-scaling)
- [Vertical scaling](ARCHITECTURE.md#vertical-scaling)
- [Database scaling](ARCHITECTURE.md#database-scaling)
- [Caching strategy](ARCHITECTURE.md#caching-strategy)

**Security:**
- [Security architecture](ARCHITECTURE.md#security-architecture)
- [Authentication security](ARCHITECTURE.md#authentication-security)
- [API security](ARCHITECTURE.md#api-security)

---

## Documentation by Topic

### Architecture and Design

**System Design:**
- [High-level architecture](ARCHITECTURE.md#high-level-system-architecture)
- [Component architecture](ARCHITECTURE.md#component-architecture)
- [Data flow](ARCHITECTURE.md#data-flow-architecture)
- [Deployment architecture](ARCHITECTURE.md#deployment-architecture)

**Design Patterns:**
- [Web application patterns](ARCHITECTURE.md#web-application-patterns)
- [Solver service patterns](ARCHITECTURE.md#solver-service-patterns)

**Technology Decisions:**
- [Technology stack](ARCHITECTURE.md#technology-stack)
- [Why Next.js?](ARCHITECTURE.md#web-application)
- [Why OR-Tools?](SOLVER_ALGORITHM.md#algorithm-type-constraint-programming)

### API and Integration

**Solver Service API:**
- [Endpoints](API_DOCUMENTATION.md#endpoints)
- [Authentication](API_DOCUMENTATION.md#authentication)
- [Data models](API_DOCUMENTATION.md#data-models)
- [Error handling](API_DOCUMENTATION.md#error-handling)

**Web Application API:**
- [Server Actions](ARCHITECTURE.md#server-actions)
- [API Routes](ARCHITECTURE.md#api-routes)

**Integration Examples:**
- [Generating timetables](API_DOCUMENTATION.md#generate-timetable)
- [Validating timetables](API_DOCUMENTATION.md#validate-timetable)
- [Retry logic](API_DOCUMENTATION.md#retry-logic)

### Algorithm and Optimization

**Constraint Programming:**
- [Overview](SOLVER_ALGORITHM.md#algorithm-type-constraint-programming)
- [Problem formulation](SOLVER_ALGORITHM.md#problem-formulation)
- [Decision variables](SOLVER_ALGORITHM.md#decision-variables)

**Constraints:**
- [Hard constraints](SOLVER_ALGORITHM.md#hard-constraints-must-be-satisfied)
- [Soft constraints](SOLVER_ALGORITHM.md#soft-constraints-preferences-to-optimize)
- [Objective function](SOLVER_ALGORITHM.md#objective-function)

**Solver Configuration:**
- [Parameters](SOLVER_ALGORITHM.md#parameters)
- [Performance characteristics](SOLVER_ALGORITHM.md#performance-characteristics)
- [Optimization strategies](SOLVER_ALGORITHM.md#optimization-strategies)

**Solution Analysis:**
- [Fitness score](SOLVER_ALGORITHM.md#fitness-score-calculation)
- [Infeasibility analysis](SOLVER_ALGORITHM.md#infeasibility-analysis)
- [Violation detection](SOLVER_ALGORITHM.md#solution-extraction)

### Data Management

**Database:**
- [Schema](ARCHITECTURE.md#data-layer)
- [Migrations](../README.md#database-management)
- [Seeding](../README.md#sample-data)

**Import/Export:**
- [CSV import](USER_GUIDE.md#csv-import)
- [Excel import](USER_GUIDE.md#excel-import)
- [Data export](USER_GUIDE.md#exporting-data)
- [Database migration](../README.md#migrating-from-sqlite-to-postgresql-neon)

### Security

**Authentication:**
- [Authentication flow](ARCHITECTURE.md#authentication-flow)
- [Password security](ARCHITECTURE.md#password-security)
- [JWT security](ARCHITECTURE.md#jwt-security)

**Authorization:**
- [Role-based access control](ARCHITECTURE.md#role-based-access-control)
- [API security](ARCHITECTURE.md#api-security)

**Data Protection:**
- [Database security](ARCHITECTURE.md#database-security)
- [Transport security](ARCHITECTURE.md#transport-security)
- [Input validation](ARCHITECTURE.md#input-validation)

### Testing

**Test Types:**
- [Unit tests](../README.md#testing)
- [Integration tests](../solver/tests/README.md)
- [E2E tests](../e2e/README.md)

**Running Tests:**
- [Web application tests](../README.md#testing)
- [Solver service tests](../solver/tests/README.md#running-tests)
- [E2E tests](../e2e/README.md#running-the-tests)

**Test Coverage:**
- [E2E test coverage](../e2e/README.md#test-coverage)
- [Solver test coverage](../solver/tests/README.md#test-coverage)

### Deployment and Operations

**Development:**
- [Local setup](../README.md#local-development)
- [Docker Compose](../README.md#docker-deployment)
- [Environment variables](../README.md#environment-variables)

**Production:**
- [Vercel deployment](../README.md#deploying-to-vercel)
- [Solver service deployment](ARCHITECTURE.md#production-environment)
- [Database hosting](../README.md#set-up-neon-database)

**Monitoring:**
- [Logging](API_DOCUMENTATION.md#monitoring-and-logging)
- [Metrics](ARCHITECTURE.md#monitoring-and-observability)
- [Health checks](API_DOCUMENTATION.md#health-check)

---

## Frequently Asked Questions

### General

**Q: What is this system for?**  
A: The University Timetable Scheduler automates the creation of conflict-free class schedules while optimizing for preferences like instructor availability and compact student schedules.

**Q: Who can use this system?**  
A: The system supports three user roles: Administrators (full access), Faculty (view schedules, set availability), and Students (view schedules).

**Q: How long does timetable generation take?**  
A: Typically 30 seconds to 2 minutes for 100-300 courses. Larger schedules may take up to 5 minutes.

### Technical

**Q: What algorithm is used for optimization?**  
A: Google OR-Tools CP-SAT (Constraint Programming - Satisfiability) solver. See [Solver Algorithm](SOLVER_ALGORITHM.md) for details.

**Q: Can the system handle large universities?**  
A: Yes, the solver can handle 2000+ course events. The system is designed to scale horizontally. See [Scalability](ARCHITECTURE.md#scalability-considerations).

**Q: What databases are supported?**  
A: SQLite (development) and PostgreSQL (production). The system uses Prisma ORM for database abstraction.

**Q: How is security handled?**  
A: NextAuth.js for authentication, JWT tokens, role-based access control, bcrypt password hashing, and API key authentication for services. See [Security Architecture](ARCHITECTURE.md#security-architecture).

### Usage

**Q: What if timetable generation fails?**  
A: The system provides detailed error messages explaining why (e.g., insufficient rooms, instructor availability conflicts). See [Troubleshooting](USER_GUIDE.md#troubleshooting).

**Q: Can I manually edit generated timetables?**  
A: Yes, the system provides a drag-and-drop interface with real-time conflict detection. See [Editing Timetables](USER_GUIDE.md#editing-timetables).

**Q: How do I import existing data?**  
A: Use CSV or Excel import functionality. See [Importing Data](USER_GUIDE.md#importing-data) for format requirements.

**Q: Can I export timetables to PDF?**  
A: Yes, the system supports PDF and Excel export with filtering options. See [Exporting Timetables](USER_GUIDE.md#exporting-timetables).

---

## Contributing

### Documentation

**Improving Documentation:**
1. Identify gaps or unclear sections
2. Create or update documentation files
3. Follow the existing structure and style
4. Submit a pull request

**Documentation Standards:**
- Use clear, concise language
- Include code examples where appropriate
- Add diagrams for complex concepts
- Keep information up-to-date

### Code

**Development Workflow:**
1. Read [Architecture](ARCHITECTURE.md) and [API Documentation](API_DOCUMENTATION.md)
2. Set up development environment
3. Write tests for new features
4. Follow existing code patterns
5. Submit pull request with documentation updates

---

## Support

### Getting Help

**Documentation:**
- Search this documentation index
- Check the [User Guide](USER_GUIDE.md) for common tasks
- Review [Troubleshooting](USER_GUIDE.md#troubleshooting) section

**Technical Support:**
- Email: support@university.edu
- Hours: Monday-Friday, 9:00 AM - 5:00 PM

**Bug Reports:**
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Include: Steps to reproduce, expected behavior, actual behavior, screenshots

**Feature Requests:**
- GitHub Discussions: [Start a discussion](https://github.com/your-repo/discussions)
- Describe: Use case, proposed solution, benefits

---

## Version History

### Version 1.0.0 (November 26, 2025)

**Documentation:**
- ✅ User Guide
- ✅ Architecture Documentation
- ✅ API Documentation
- ✅ Solver Algorithm Documentation
- ✅ E2E Test Documentation
- ✅ Solver Test Documentation

**Features:**
- ✅ Academic data management
- ✅ Automated timetable generation
- ✅ Manual editing with drag-and-drop
- ✅ Role-based access control
- ✅ Import/export functionality
- ✅ Analytics dashboard
- ✅ Faculty availability management
- ✅ PDF and Excel export

**Testing:**
- ✅ 43 solver service tests
- ✅ 6 E2E test suites
- ✅ Integration tests
- ✅ Unit tests

---

## License

MIT License - See [LICENSE](../LICENSE) file for details

---

**Last Updated:** November 26, 2025  
**Documentation Version:** 1.0.0  
**Maintained By:** Development Team
