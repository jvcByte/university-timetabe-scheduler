# Database Seed Summary

## Overview
The database has been successfully populated with comprehensive course data for multiple departments, covering all levels from 100L to 500L.

## Populated Data

### Departments with Courses (8 departments)
Each department has 25 courses (5 per level from 100L to 500L):

1. **CSC - Computer Science** (25 courses)
   - 100L: Introduction to Computer Science, Programming, Computer Fundamentals, Discrete Mathematics, Programming Lab
   - 200L: Data Structures, Algorithms, OOP, Computer Architecture, Web Development
   - 300L: Database Systems, Operating Systems, Software Engineering, Computer Networks, AI
   - 400L: Machine Learning, Compiler Design, Distributed Systems, Cybersecurity, Mobile Development
   - 500L: Advanced Algorithms, Cloud Computing, Deep Learning, Research Methods, Project

2. **SEN - Software Engineering** (25 courses)
   - 100L: Intro to SE, Programming Fundamentals, Development Tools, Requirements Engineering, Technical Communication
   - 200L: Design Patterns, Agile Development, Software Testing, Version Control, UI/UX Design
   - 300L: Software Architecture, DevOps, Quality Assurance, Project Management, Microservices
   - 400L: Software Maintenance, Security, Metrics, Enterprise Development, Ethics
   - 500L: Advanced SE, Process Improvement, Research, Capstone Projects

3. **MATH - Mathematics** (25 courses)
   - 100L: Calculus I, Linear Algebra I, Probability, Geometry, Mathematical Methods
   - 200L: Calculus II, Linear Algebra II, Differential Equations, Statistics, Abstract Algebra
   - 300L: Real Analysis, Complex Analysis, Numerical Analysis, Topology, Mathematical Modeling
   - 400L: Advanced Calculus, Functional Analysis, Number Theory, Graph Theory, Optimization
   - 500L: Advanced Abstract Algebra, Measure Theory, PDEs, Research Seminar, Thesis

4. **PHY - Physics** (25 courses)
   - 100L: Mechanics, Electricity & Magnetism, Physics Lab I, Waves & Optics, Modern Physics
   - 200L: Classical Mechanics, Thermodynamics, Electromagnetic Theory, Physics Lab II, Mathematical Methods
   - 300L: Quantum Mechanics I, Statistical Mechanics, Solid State Physics, Electronics, Computational Physics
   - 400L: Quantum Mechanics II, Nuclear Physics, Particle Physics, Astrophysics, Advanced Lab
   - 500L: Advanced Quantum Mechanics, Quantum Field Theory, General Relativity, Research Methods, Thesis

5. **CHEM - Chemistry** (25 courses)
   - 100L: General Chemistry I & II, Chemistry Lab I, Inorganic Chemistry, Atomic Structure
   - 200L: Organic Chemistry I & II, Physical Chemistry I, Analytical Chemistry, Chemistry Lab II
   - 300L: Physical Chemistry II, Quantum Chemistry, Spectroscopy, Biochemistry, Environmental Chemistry
   - 400L: Advanced Organic Chemistry, Polymer Chemistry, Medicinal Chemistry, Industrial Chemistry, Advanced Lab
   - 500L: Advanced Physical Chemistry, Computational Chemistry, Chemical Kinetics, Research Seminar, Thesis

6. **BIO - Biology** (25 courses)
   - 100L: General Biology I & II, Biology Lab I, Cell Biology, Botany
   - 200L: Genetics, Microbiology, Zoology, Ecology, Biology Lab II
   - 300L: Molecular Biology, Biochemistry, Physiology, Evolution, Bioinformatics
   - 400L: Immunology, Developmental Biology, Biotechnology, Conservation Biology, Advanced Lab
   - 500L: Advanced Molecular Biology, Genomics, Systems Biology, Research Methods, Thesis

7. **ENG - English** (25 courses)
   - 100L: Composition I & II, Intro to Literature, Grammar & Usage, Public Speaking
   - 200L: British Literature I, American Literature, Creative Writing, Poetry Analysis, Technical Writing
   - 300L: Shakespeare Studies, Modern Literature, Literary Theory, World Literature, Linguistics
   - 400L: Advanced Literary Analysis, Contemporary Literature, Postcolonial Literature, Drama & Theatre, Professional Writing
   - 500L: Advanced Literary Theory, Research Methods, Comparative Literature, Thesis Seminar, Thesis

8. **ECO - Economics** (25 courses)
   - 100L: Principles of Economics I & II, Intro to Micro/Macroeconomics, Economic Mathematics
   - 200L: Intermediate Micro/Macroeconomics, Statistics for Economics, Money & Banking, Development Economics
   - 300L: Econometrics, International Economics, Public Finance, Labor Economics, Environmental Economics
   - 400L: Advanced Econometrics, Game Theory, Industrial Organization, Financial Economics, Economic Policy
   - 500L: Advanced Micro/Macro Theory, Research Methods, Thesis Seminar, Thesis

9. **EENG - Electrical Engineering** (25 courses)
   - 100L: Intro to EE, Circuit Analysis I, Engineering Math I, Digital Logic Design, Engineering Drawing
   - 200L: Circuit Analysis II, Electronics I, Signals & Systems, Electromagnetic Fields, EE Lab I
   - 300L: Electronics II, Control Systems, Power Systems, Communication Systems, Microprocessors
   - 400L: Digital Signal Processing, Power Electronics, Embedded Systems, Renewable Energy, Advanced Lab
   - 500L: Advanced Control Systems, VLSI Design, Wireless Communications, Research Seminar, Capstone Project

### Supporting Data Created

#### Instructors (66 total)
- 3 instructors per department (21 departments × 3 = 63)
- Each instructor has:
  - Full availability schedule (Monday-Friday)
  - Teaching load of 12 hours
  - Preferred days and times
  - Faculty user account with password: `faculty123`

#### Rooms (89 total)
- 4 rooms per department:
  - 2 Lecture Halls (capacity: 50-60)
  - 1 Laboratory (capacity: 30)
  - 1 Seminar Room (capacity: 25)
- Each room equipped with appropriate facilities

#### Student Groups (108 total)
- 5 groups per department (one for each level: 100L-500L)
- Group sizes: 35-54 students
- Named format: `{DEPT_CODE}-{LEVEL}L-A`

#### Relationships
- **Course-Instructor Links**: 230
  - Each course assigned to 1-2 instructors from the same department
- **Course-Group Links**: 232
  - Each course linked to appropriate student groups by level

## How to Use

### Run the Seed Script
```bash
pnpm tsx prisma/seed-comprehensive.ts
```

### Query Examples
```typescript
// Get all courses for a department
const cscCourses = await prisma.course.findMany({
  where: { department: { code: 'CSC' } },
  include: { department: true }
});

// Get courses by level
const level100Courses = await prisma.course.findMany({
  where: { code: { endsWith: '101' } }
});

// Get instructor's courses
const instructorCourses = await prisma.course.findMany({
  where: {
    instructors: {
      some: { instructor: { email: 'csc.prof.a@university.edu' } }
    }
  }
});
```

## Notes
- All courses have appropriate room types (LECTURE_HALL, LAB, SEMINAR)
- Course durations: 90 minutes (lectures) or 120 minutes (labs/projects)
- Credits range from 2-6 based on course type
- The original seed.ts file remains unchanged for backward compatibility
