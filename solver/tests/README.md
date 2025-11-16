# Solver Service Tests

This directory contains comprehensive pytest tests for the University Timetable Solver Service.

## Test Files

### Automated Pytest Tests

1. **test_api_endpoints.py** - Tests for FastAPI endpoints
   - Health check endpoint
   - API authentication
   - Generation endpoint with various scenarios
   - Validation endpoint with conflict detection
   - 12 tests total

2. **test_constraint_validation.py** - Tests for constraint validation logic
   - Valid timetable validation
   - Room conflict detection
   - Instructor conflict detection
   - Student group conflict detection
   - Room capacity constraints
   - Room type constraints
   - Instructor availability constraints
   - Working hours constraints
   - Multiple simultaneous violations
   - 16 tests total

3. **test_solver_optimization.py** - Tests for OR-Tools solver
   - Basic solver functionality
   - Hard constraint satisfaction
   - Soft constraint optimization
   - Solution extraction
   - Infeasibility detection
   - Optimizer class functionality
   - 15 tests total

### Manual Test Scripts

These scripts require the solver service to be running:

- **manual_api_validator.py** - Manual API validation testing
- **manual_optimizer_basic.py** - Manual optimizer testing
- **manual_validator.py** - Manual validator testing

## Running Tests

### Prerequisites

1. Activate the virtual environment:
   ```bash
   cd solver
   source venv/bin/activate
   ```

2. Install test dependencies (if not already installed):
   ```bash
   pip install pytest httpx
   ```

### Run All Tests

```bash
pytest tests/
```

### Run Specific Test Files

```bash
# API endpoint tests
pytest tests/test_api_endpoints.py -v

# Constraint validation tests
pytest tests/test_constraint_validation.py -v

# Solver optimization tests
pytest tests/test_solver_optimization.py -v
```

### Run Specific Test Classes or Functions

```bash
# Run a specific test class
pytest tests/test_api_endpoints.py::TestAuthentication -v

# Run a specific test function
pytest tests/test_solver_optimization.py::TestBasicSolver::test_solver_finds_solution -v
```

### Run with Coverage

```bash
pytest tests/ --cov=app --cov-report=html
```

## Test Coverage

The test suite covers:

- ✅ API endpoint functionality (12 tests)
- ✅ Request/response validation
- ✅ API authentication and authorization
- ✅ All hard constraint validation (16 tests)
- ✅ Solver optimization with small problem instances (15 tests)
- ✅ Infeasibility detection
- ✅ Solution extraction and fitness scoring

**Total: 43 automated tests**

## Test Results

All tests pass successfully:
- 43 passed
- 0 failed
- Test execution time: ~3 seconds

## Requirements Covered

These tests satisfy the requirements from task 22.3:
- ✅ Test API endpoints with pytest
- ✅ Test constraint validation
- ✅ Test solver with small problem instances
- ✅ Requirements: 4.8, 5.2

## Notes

- Tests use FastAPI TestClient for API testing (no server required)
- Tests use small problem instances to ensure fast execution
- All tests are independent and can run in any order
- Tests validate both success and failure scenarios
