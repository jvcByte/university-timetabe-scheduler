from fastapi import FastAPI, HTTPException, Depends, Security, Request, status
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import logging
import time
from .config import settings
from .models.schemas import GenerationPayload, TimetableResult, ValidationPayload, ValidationResult

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    logger.info("Starting Solver Service...")
    logger.info(f"Log level: {settings.log_level}")
    yield
    logger.info("Shutting down Solver Service...")


app = FastAPI(
    title="University Timetable Solver Service",
    description="Constraint-based optimization service for timetable generation using OR-Tools",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests."""
    start_time = time.time()
    
    logger.info(f"Request: {request.method} {request.url.path}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(
        f"Response: {request.method} {request.url.path} "
        f"Status: {response.status_code} "
        f"Duration: {process_time:.3f}s"
    )
    
    return response


# Error handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.error(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Validation error",
            "errors": exc.errors(),
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    """Handle value errors."""
    logger.error(f"Value error: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# API Key authentication
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=True)


async def verify_api_key(api_key: str = Security(api_key_header)):
    """Verify API key from request header."""
    if api_key != settings.api_key:
        logger.warning("Invalid API key attempt")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    return api_key


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "University Timetable Solver Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health",
    }


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "solver",
        "version": "1.0.0",
    }


@app.post("/api/v1/generate", response_model=TimetableResult)
async def generate_timetable(
    payload: GenerationPayload,
    api_key: str = Depends(verify_api_key)
):
    """
    Generate optimized timetable using constraint programming.
    
    This endpoint accepts course, instructor, room, and student group data
    along with constraint configurations, and returns an optimized timetable
    that satisfies all hard constraints while minimizing soft constraint violations.
    
    Args:
        payload: Generation request containing all input data
        api_key: API key for authentication
        
    Returns:
        TimetableResult with assignments, fitness score, and violations
    """
    logger.info(
        f"Received generation request: "
        f"{len(payload.courses)} courses, "
        f"{len(payload.instructors)} instructors, "
        f"{len(payload.rooms)} rooms, "
        f"{len(payload.groups)} groups"
    )
    
    try:
        # Import optimizer
        from .solver.optimizer import optimize_timetable
        
        # Run optimization
        success, assignments, fitness_score, violations, solve_time, message = optimize_timetable(payload)
        
        logger.info(
            f"Optimization completed: success={success}, "
            f"assignments={len(assignments)}, "
            f"fitness={fitness_score}, "
            f"time={solve_time:.2f}s"
        )
        
        return TimetableResult(
            success=success,
            assignments=assignments,
            fitness_score=fitness_score,
            violations=violations,
            solve_time_seconds=solve_time,
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error during timetable generation: {str(e)}", exc_info=True)
        
        return TimetableResult(
            success=False,
            assignments=[],
            fitness_score=None,
            violations=[],
            solve_time_seconds=0.0,
            message=f"Generation failed: {str(e)}"
        )


@app.post("/api/v1/validate", response_model=ValidationResult)
async def validate_timetable(
    payload: ValidationPayload,
    api_key: str = Depends(verify_api_key)
):
    """
    Validate a timetable for constraint violations.
    
    This endpoint checks all hard constraints and returns any conflicts found.
    It validates existing assignments against the provided courses, instructors,
    rooms, groups, and constraint configuration.
    
    Args:
        payload: Validation request containing entity data and assignments to validate
        api_key: API key for authentication
        
    Returns:
        ValidationResult with validity status and list of conflicts
    """
    logger.info(
        f"Received validation request: "
        f"{len(payload.assignments)} assignments, "
        f"{len(payload.courses)} courses, "
        f"{len(payload.instructors)} instructors, "
        f"{len(payload.rooms)} rooms, "
        f"{len(payload.groups)} groups"
    )
    
    try:
        # Import validator
        from .solver.validator import validate_timetable as run_validation
        
        # Run validation
        is_valid, conflicts = run_validation(payload, payload.assignments)
        
        logger.info(
            f"Validation completed: {'VALID' if is_valid else 'INVALID'} "
            f"({len(conflicts)} conflicts found)"
        )
        
        return ValidationResult(
            is_valid=is_valid,
            conflicts=conflicts
        )
        
    except Exception as e:
        logger.error(f"Error during validation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )
