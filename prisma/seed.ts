import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create departments (reduced to 5)
  const departments = [
    { code: 'CSC', name: 'Computer Science', description: 'Study of computation, information, and automation' },
    { code: 'MATH', name: 'Mathematics', description: 'Study of numbers, quantity, structure, space, and change' },
    { code: 'PHY', name: 'Physics', description: 'Study of matter, energy, and the fundamental forces of nature' },
    { code: 'ENG', name: 'Engineering', description: 'Study of engineering principles and applications' },
    { code: 'BUS', name: 'Business Administration', description: 'Study of business management and operations' },
  ];

  const createdDepartments: Record<string, any> = {};
  
  for (const dept of departments) {
    const department = await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: dept,
    });
    createdDepartments[dept.code] = department;
  }
  
  console.log(`Created ${departments.length} departments`);

  // Create sample admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@university.edu' },
    update: {},
    create: {
      email: 'admin@university.edu',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create sample faculty users and instructors (reduced to 10)
  const facultyPassword = await bcrypt.hash('faculty123', 10);
  const instructors = [];
  
  const instructorData = [
    { name: 'Dr. John Smith', email: 'john.smith@university.edu', dept: 'CSC' },
    { name: 'Dr. Jane Doe', email: 'jane.doe@university.edu', dept: 'CSC' },
    { name: 'Prof. Robert Johnson', email: 'robert.johnson@university.edu', dept: 'MATH' },
    { name: 'Dr. Sarah Williams', email: 'sarah.williams@university.edu', dept: 'MATH' },
    { name: 'Prof. Michael Brown', email: 'michael.brown@university.edu', dept: 'PHY' },
    { name: 'Dr. Emily Davis', email: 'emily.davis@university.edu', dept: 'PHY' },
    { name: 'Prof. David Wilson', email: 'david.wilson@university.edu', dept: 'ENG' },
    { name: 'Dr. Lisa Anderson', email: 'lisa.anderson@university.edu', dept: 'ENG' },
    { name: 'Prof. James Taylor', email: 'james.taylor@university.edu', dept: 'BUS' },
    { name: 'Dr. Maria Garcia', email: 'maria.garcia@university.edu', dept: 'BUS' },
  ];

  for (const data of instructorData) {
    const faculty = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        password: facultyPassword,
        role: 'FACULTY',
      },
    });

    const instructor = await prisma.instructor.upsert({
      where: { email: data.email },
      update: {},
      create: {
        userId: faculty.id,
        name: data.name,
        email: data.email,
        departmentId: createdDepartments[data.dept].id,
        teachingLoad: 12,
        availability: {
          MONDAY: ['09:00-12:00', '14:00-17:00'],
          TUESDAY: ['09:00-12:00', '14:00-17:00'],
          WEDNESDAY: ['09:00-12:00', '14:00-17:00'],
          THURSDAY: ['09:00-12:00', '14:00-17:00'],
          FRIDAY: ['09:00-12:00'],
        },
      },
    });
    instructors.push(instructor);
  }

  console.log(`Created ${instructors.length} instructors`);

  // Create sample rooms (reduced to 10)
  const rooms = [];
  const roomData = [
    { name: 'CSC-101', building: 'Computer Science Building', capacity: 50, type: 'LECTURE_HALL' },
    { name: 'CSC-LAB-1', building: 'Computer Science Building', capacity: 30, type: 'LAB' },
    { name: 'MATH-201', building: 'Mathematics Building', capacity: 40, type: 'LECTURE_HALL' },
    { name: 'MATH-202', building: 'Mathematics Building', capacity: 35, type: 'LECTURE_HALL' },
    { name: 'PHY-101', building: 'Physics Building', capacity: 45, type: 'LECTURE_HALL' },
    { name: 'PHY-LAB-1', building: 'Physics Building', capacity: 25, type: 'LAB' },
    { name: 'ENG-301', building: 'Engineering Building', capacity: 40, type: 'LECTURE_HALL' },
    { name: 'ENG-LAB-1', building: 'Engineering Building', capacity: 30, type: 'LAB' },
    { name: 'BUS-201', building: 'Business Building', capacity: 50, type: 'LECTURE_HALL' },
    { name: 'SEM-A', building: 'Main Building', capacity: 25, type: 'SEMINAR' },
  ];

  for (const data of roomData) {
    const room = await prisma.room.upsert({
      where: { name: data.name },
      update: {},
      create: {
        name: data.name,
        building: data.building,
        capacity: data.capacity,
        type: data.type,
        equipment: ['PROJECTOR', 'WHITEBOARD'],
      },
    });
    rooms.push(room);
  }

  console.log(`Created ${rooms.length} rooms`);

  // Create sample courses (exactly 20)
  const courses = [];
  const courseData = [
    // Computer Science (5 courses)
    { code: 'CSC101', title: 'Introduction to Programming', duration: 90, credits: 3, dept: 'CSC', type: 'LECTURE_HALL' },
    { code: 'CSC102', title: 'Data Structures and Algorithms', duration: 90, credits: 4, dept: 'CSC', type: 'LECTURE_HALL' },
    { code: 'CSC201', title: 'Database Systems', duration: 90, credits: 3, dept: 'CSC', type: 'LECTURE_HALL' },
    { code: 'CSC202', title: 'Software Engineering', duration: 90, credits: 3, dept: 'CSC', type: 'LECTURE_HALL' },
    { code: 'CSC-LAB', title: 'Programming Lab', duration: 120, credits: 2, dept: 'CSC', type: 'LAB' },
    
    // Mathematics (4 courses)
    { code: 'MATH101', title: 'Calculus I', duration: 90, credits: 4, dept: 'MATH', type: 'LECTURE_HALL' },
    { code: 'MATH102', title: 'Calculus II', duration: 90, credits: 4, dept: 'MATH', type: 'LECTURE_HALL' },
    { code: 'MATH201', title: 'Linear Algebra', duration: 90, credits: 3, dept: 'MATH', type: 'LECTURE_HALL' },
    { code: 'MATH301', title: 'Discrete Mathematics', duration: 90, credits: 3, dept: 'MATH', type: 'LECTURE_HALL' },
    
    // Physics (4 courses)
    { code: 'PHY101', title: 'Physics I', duration: 90, credits: 4, dept: 'PHY', type: 'LECTURE_HALL' },
    { code: 'PHY102', title: 'Physics II', duration: 90, credits: 4, dept: 'PHY', type: 'LECTURE_HALL' },
    { code: 'PHY201', title: 'Modern Physics', duration: 90, credits: 3, dept: 'PHY', type: 'LECTURE_HALL' },
    { code: 'PHY-LAB', title: 'Physics Laboratory', duration: 120, credits: 2, dept: 'PHY', type: 'LAB' },
    
    // Engineering (4 courses)
    { code: 'ENG101', title: 'Engineering Fundamentals', duration: 90, credits: 3, dept: 'ENG', type: 'LECTURE_HALL' },
    { code: 'ENG201', title: 'Circuit Analysis', duration: 90, credits: 4, dept: 'ENG', type: 'LECTURE_HALL' },
    { code: 'ENG301', title: 'Digital Systems', duration: 90, credits: 3, dept: 'ENG', type: 'LECTURE_HALL' },
    { code: 'ENG-LAB', title: 'Engineering Lab', duration: 120, credits: 2, dept: 'ENG', type: 'LAB' },
    
    // Business (3 courses)
    { code: 'BUS101', title: 'Introduction to Business', duration: 90, credits: 3, dept: 'BUS', type: 'LECTURE_HALL' },
    { code: 'BUS201', title: 'Business Management', duration: 90, credits: 3, dept: 'BUS', type: 'LECTURE_HALL' },
    { code: 'BUS301', title: 'Marketing Principles', duration: 90, credits: 3, dept: 'BUS', type: 'LECTURE_HALL' },
  ];

  for (const data of courseData) {
    const course = await prisma.course.upsert({
      where: { code: data.code },
      update: {},
      create: {
        code: data.code,
        title: data.title,
        duration: data.duration,
        credits: data.credits,
        departmentId: createdDepartments[data.dept].id,
        roomType: data.type,
      },
    });
    courses.push(course);
  }

  console.log(`Created ${courses.length} courses`);

  // Create student groups (reduced to 5)
  const groups = [];
  const groupData = [
    { name: 'CSC-2024-A', program: 'Computer Science', year: 1, semester: 1, size: 45 },
    { name: 'MATH-2024-A', program: 'Mathematics', year: 1, semester: 1, size: 40 },
    { name: 'PHY-2024-A', program: 'Physics', year: 1, semester: 1, size: 35 },
    { name: 'ENG-2024-A', program: 'Engineering', year: 1, semester: 1, size: 50 },
    { name: 'BUS-2024-A', program: 'Business', year: 1, semester: 1, size: 42 },
  ];

  for (const data of groupData) {
    const group = await prisma.studentGroup.upsert({
      where: { name: data.name },
      update: {},
      create: data,
    });
    groups.push(group);
  }

  console.log(`Created ${groups.length} student groups`);

  // Link courses to instructors (2 instructors per department, each teaching 2-3 courses)
  let linkCount = 0;
  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    // Assign instructors from the same department (2 per dept, so i/2.5 gives us the right instructor)
    const instructorIndex = Math.floor(i / 2) % instructors.length;
    const instructor = instructors[instructorIndex];
    
    await prisma.courseInstructor.upsert({
      where: {
        courseId_instructorId: {
          courseId: course.id,
          instructorId: instructor.id,
        },
      },
      update: {},
      create: {
        courseId: course.id,
        instructorId: instructor.id,
        isPrimary: true,
      },
    });
    linkCount++;
  }
  console.log(`Linked ${linkCount} course-instructor relationships`);

  // Link courses to student groups (each group takes 4 courses from their department)
  linkCount = 0;
  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    // Each group takes courses from their department
    const startIdx = i * 4; // 4 courses per department (approximately)
    const endIdx = Math.min(startIdx + 4, courses.length);
    
    for (let j = startIdx; j < endIdx; j++) {
      if (j < courses.length) {
        await prisma.courseGroup.upsert({
          where: {
            courseId_groupId: {
              courseId: courses[j].id,
              groupId: group.id,
            },
          },
          update: {},
          create: {
            courseId: courses[j].id,
            groupId: group.id,
          },
        });
        linkCount++;
      }
    }
  }
  console.log(`Linked ${linkCount} course-group relationships`);

  // Create default constraint configuration
  const constraintConfig = await prisma.constraintConfig.upsert({
    where: { name: 'Default Configuration' },
    update: {},
    create: {
      name: 'Default Configuration',
      isDefault: true,
      noRoomDoubleBooking: true,
      noInstructorDoubleBooking: true,
      roomCapacityCheck: true,
      roomTypeMatch: true,
      workingHoursOnly: true,
      instructorPreferencesWeight: 5,
      compactSchedulesWeight: 7,
      balancedDailyLoadWeight: 6,
      preferredRoomsWeight: 3,
      workingHoursStart: '08:00',
      workingHoursEnd: '18:00',
    },
  });

  console.log('Created default constraint configuration:', constraintConfig.name);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
