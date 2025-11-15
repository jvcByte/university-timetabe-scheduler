# Form Validation Implementation

## Overview

This document describes the comprehensive form validation implementation using Zod and React Hook Form across the University Timetable Scheduler application. All forms now feature real-time validation with field-level error messages.

## Implementation Summary

### Technology Stack

- **Zod**: Schema validation library for TypeScript
- **React Hook Form**: Performant form library with built-in validation support
- **@hookform/resolvers/zod**: Integration between React Hook Form and Zod

### Key Features

1. **Real-time Validation**: Forms validate on blur by default (`mode: "onBlur"`)
2. **Field-level Error Messages**: Each field displays specific validation errors
3. **Type Safety**: Full TypeScript support with inferred types from Zod schemas
4. **Centralized Schemas**: All validation schemas defined in `lib/validation.ts`
5. **Consistent UX**: Uniform error display across all forms

## Forms Updated

### 1. Course Form (`components/course-form.tsx`)

**Status**: ✅ Already implemented

**Features**:
- Course code validation (uppercase letters, numbers, hyphens only)
- Title length validation (3-200 characters)
- Duration validation (30-300 minutes)
- Credits validation (1-10)
- Department selection validation
- Optional room type validation

**Schema**: `courseFormSchema` (defined inline, matches `lib/validation.ts`)

### 2. Instructor Form (`components/instructor-form.tsx`)

**Status**: ✅ Already implemented

**Features**:
- Name validation (2-100 characters)
- Email validation (valid email format)
- Department selection validation
- Teaching load validation (1-40 hours)
- Availability time slot validation (HH:MM-HH:MM format)
- Custom validation for availability JSON structure

**Schema**: `instructorFormSchema` (defined inline)

### 3. Room Form (`components/room-form.tsx`)

**Status**: ✅ Already implemented

**Features**:
- Room name validation (1-50 characters)
- Building validation (1-100 characters)
- Capacity validation (1-1000)
- Room type selection validation
- Equipment array validation

**Schema**: `roomFormSchema` (defined inline)

### 4. Student Group Form (`components/student-group-form.tsx`)

**Status**: ✅ Already implemented

**Features**:
- Group name validation (2-100 characters)
- Program validation (2-100 characters)
- Year validation (1-10)
- Semester validation (1-2)
- Group size validation (1-500)
- Course assignment validation

**Schema**: `studentGroupFormSchema` (defined inline)

### 5. Login Form (`components/login-form.tsx`)

**Status**: ✅ Already implemented

**Features**:
- Email validation (valid email format, max 100 characters)
- Password validation (6-100 characters)
- Real-time validation on blur

**Schema**: `loginSchema` from `lib/validation.ts`

### 6. Register Form (`components/register-form.tsx`)

**Status**: ✅ **NEWLY UPDATED**

**Changes Made**:
- Migrated from manual state management to React Hook Form
- Integrated Zod validation with `registerSchema`
- Added field-level error messages
- Implemented real-time validation on blur

**Features**:
- Name validation (2-100 characters)
- Email validation (valid email format, max 100 characters)
- Password validation (6-100 characters)
- Role selection validation (ADMIN, FACULTY, STUDENT)

**Schema**: `registerSchema` from `lib/validation.ts`

### 7. Timetable Generation Form (`components/timetable-generation-form.tsx`)

**Status**: ✅ **NEWLY UPDATED**

**Changes Made**:
- Migrated from manual state management to React Hook Form
- Created inline Zod schema for validation
- Added field-level error messages for all inputs
- Implemented real-time validation on blur

**Features**:
- Timetable name validation (3-100 characters)
- Semester validation (1-50 characters)
- Academic year validation (YYYY or YYYY-YYYY format)
- Constraint config selection validation
- Time limit validation (10-1200 seconds)
- Local solver toggle validation

**Schema**: `timetableGenerationSchema` (defined inline)

### 8. Availability Form (`components/availability-form.tsx`)

**Status**: ✅ **NEWLY UPDATED**

**Changes Made**:
- Added time slot validation using `validateTimeSlot` utility
- Implemented validation error display
- Added pre-submission validation check

**Features**:
- Time slot format validation (HH:MM-HH:MM)
- End time after start time validation
- Day-specific validation error messages
- Reset functionality with error clearing

**Validation**: Uses `validateTimeSlot` from `lib/validation.ts`

### 9. Constraint Editor (`components/constraint-editor.tsx`)

**Status**: ✅ **NEWLY UPDATED**

**Changes Made**:
- Added working hours validation using `validateWorkingHours` utility
- Implemented validation error display
- Added pre-submission validation check

**Features**:
- Working hours format validation (HH:MM)
- End time after start time validation
- Minimum 2-hour span validation
- Hard constraint toggle validation
- Soft constraint weight validation (0-10 scale)

**Validation**: Uses `validateWorkingHours` from `lib/validation.ts`

## Validation Schemas

All validation schemas are centralized in `lib/validation.ts`:

### Core Schemas

1. **courseSchema**: Course creation/update validation
2. **instructorSchema**: Instructor creation/update validation
3. **roomSchema**: Room creation/update validation
4. **studentGroupSchema**: Student group creation/update validation
5. **loginSchema**: User login validation
6. **registerSchema**: User registration validation
7. **generateTimetableSchema**: Timetable generation validation
8. **constraintConfigSchema**: Constraint configuration validation

### Validation Utilities

1. **validateTimeSlot(timeSlot: string)**: Validates time slot format and logic
2. **validateWorkingHours(start: string, end: string)**: Validates working hours
3. **validateSoftConstraintWeights(weights)**: Ensures at least one weight > 0
4. **safeValidate(schema, data)**: Safe parsing with detailed error messages

### Common Validators

- `CommonValidators.id`: Positive integer validation
- `CommonValidators.email`: Email format validation
- `CommonValidators.name`: Name length validation
- `CommonValidators.time24Hour`: 24-hour time format validation
- `CommonValidators.timeSlot`: Time slot format validation

### Validation Patterns

- `ValidationPatterns.courseCode`: `/^[A-Z0-9-]+$/`
- `ValidationPatterns.time24Hour`: `/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/`
- `ValidationPatterns.timeSlot`: `/^\d{2}:\d{2}-\d{2}:\d{2}$/`

## Implementation Pattern

### Standard Form Implementation

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define schema
const formSchema = z.object({
  field: z.string().min(1, "Field is required"),
  // ... more fields
});

type FormData = z.infer<typeof formSchema>;

export function MyForm() {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onBlur", // Validate on blur
    defaultValues: {
      // ... default values
    },
  });

  const onSubmit = async (data: FormData) => {
    // Handle submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="field">Field *</Label>
        <Input
          id="field"
          {...register("field")}
          disabled={isSubmitting}
        />
        {errors.field && (
          <p className="text-sm text-red-600">{errors.field.message}</p>
        )}
      </div>
      {/* More fields */}
      <Button type="submit" disabled={isSubmitting}>
        Submit
      </Button>
    </form>
  );
}
```

### Select Field Pattern

```typescript
const selectedValue = watch("fieldName");

<Select
  value={selectedValue?.toString()}
  onValueChange={(value) => setValue("fieldName", Number(value))}
  disabled={isSubmitting}
>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    {options.map((option) => (
      <SelectItem key={option.id} value={option.id.toString()}>
        {option.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
{errors.fieldName && (
  <p className="text-sm text-red-600">{errors.fieldName.message}</p>
)}
```

## Error Display Pattern

All forms follow a consistent error display pattern:

1. **Field-level errors**: Displayed below each input field in red text
2. **Form-level errors**: Displayed at the top of the form in a red alert box
3. **Validation errors**: Displayed immediately on blur (real-time feedback)
4. **Submission errors**: Displayed after failed submission attempts

### Error Message Styling

```tsx
{errors.fieldName && (
  <p className="text-sm text-red-600">{errors.fieldName.message}</p>
)}
```

### Form-level Error Display

```tsx
{error && (
  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
    {error}
  </div>
)}
```

## Validation Modes

All forms use `mode: "onBlur"` for validation, which provides:

- **Better UX**: Users aren't interrupted while typing
- **Immediate Feedback**: Validation occurs when leaving a field
- **Performance**: Reduces unnecessary validation calls
- **Consistency**: Uniform behavior across all forms

## Testing Validation

### Manual Testing Checklist

For each form, verify:

1. ✅ Empty required fields show error on blur
2. ✅ Invalid formats show appropriate error messages
3. ✅ Valid input clears error messages
4. ✅ Form submission is blocked when validation fails
5. ✅ Error messages are user-friendly and specific
6. ✅ Loading states disable form inputs
7. ✅ Success/error toasts appear after submission

### Example Test Cases

**Course Form**:
- Empty course code → "Course code must be at least 2 characters"
- Lowercase code "abc123" → "Course code must contain only uppercase letters..."
- Duration 20 → "Duration must be at least 30 minutes"
- Credits 15 → "Credits must be at most 10"

**Register Form**:
- Invalid email "test@" → "Invalid email address"
- Short password "123" → "Password must be at least 6 characters"
- Empty name → "Name must be at least 2 characters"

**Timetable Generation Form**:
- Invalid year "2024-25" → "Academic year must be in format YYYY or YYYY-YYYY"
- Time limit 5 → "Time limit must be at least 10 seconds"
- Empty name → "Timetable name must be at least 3 characters"

## Benefits

1. **Type Safety**: Zod schemas provide compile-time type checking
2. **Reusability**: Schemas can be shared between client and server
3. **Maintainability**: Centralized validation logic
4. **User Experience**: Real-time feedback with clear error messages
5. **Developer Experience**: Simple API with excellent TypeScript support
6. **Performance**: Efficient validation with minimal re-renders
7. **Consistency**: Uniform validation behavior across all forms

## Future Enhancements

Potential improvements for future iterations:

1. **Custom Error Messages**: More context-specific error messages
2. **Async Validation**: Check for duplicate emails, course codes, etc.
3. **Cross-field Validation**: Validate relationships between fields
4. **Conditional Validation**: Different rules based on form state
5. **Validation Debouncing**: Reduce validation frequency for expensive checks
6. **Accessibility**: Enhanced ARIA labels and error announcements
7. **Internationalization**: Multi-language error messages

## Related Files

- `lib/validation.ts`: Centralized validation schemas and utilities
- `components/*-form.tsx`: Individual form components
- `actions/*.ts`: Server actions with validation
- `lib/error-handling.ts`: Error handling utilities

## Requirements Satisfied

This implementation satisfies **Requirement 1.7** from the requirements document:

> "IF imported data contains validation errors, THEN THE WebApp SHALL display error messages with row numbers and field details"

All forms now provide:
- ✅ Field-level validation with specific error messages
- ✅ Real-time validation feedback
- ✅ Type-safe validation schemas
- ✅ Consistent error display patterns
- ✅ User-friendly error messages

## Conclusion

The form validation implementation provides a robust, type-safe, and user-friendly validation system across all forms in the application. By leveraging Zod and React Hook Form, we achieve excellent developer experience while maintaining high code quality and user experience standards.
