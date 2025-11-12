import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create departments
  const departments = [
    { code: 'CSC', name: 'Computer Science', description: 'Study of computation, information, and automation' },
    { code: 'SEN', name: 'Software Engineering', description: 'Study of systematic process of software development lifecycle.' },
    { code: 'MATH', name: 'Mathematics', description: 'Study of numbers, quantity, structure, space, and change' },
    { code: 'PHY', name: 'Physics', description: 'Study of matter, energy, and the fundamental forces of nature' },
    { code: 'CHEM', name: 'Chemistry', description: 'Study of matter and its properties, composition, and reactions' },
    { code: 'BIO', name: 'Biology', description: 'Study of living organisms and their vital processes' },
    { code: 'ENG', name: 'English', description: 'Study of English language, literature, and composition' },
    { code: 'HIS', name: 'History', description: 'Study of past events and their impact on society' },
    { code: 'PSY', name: 'Psychology', description: 'Study of mind and behavior' },
    { code: 'ECO', name: 'Economics', description: 'Study of production, distribution, and consumption of goods and services' },
    { code: 'BUS', name: 'Business Administration', description: 'Study of business management and operations' },
    { code: 'EENG', name: 'Electrical Engineering', description: 'Study of electricity, electronics, and electromagnetism' },
    { code: 'MENG', name: 'Mechanical Engineering', description: 'Study of mechanics, thermodynamics, and materials science' },
    { code: 'CENG', name: 'Civil Engineering', description: 'Study of design and construction of infrastructure' },
    { code: 'ART', name: 'Art', description: 'Study of visual arts, design, and creative expression' },
    { code: 'MUS', name: 'Music', description: 'Study of musical theory, performance, and composition' },
    { code: 'PHIL', name: 'Philosophy', description: 'Study of fundamental questions about existence, knowledge, and ethics' },
    { code: 'SOC', name: 'Sociology', description: 'Study of society, social relationships, and institutions' },
    { code: 'POL', name: 'Political Science', description: 'Study of government, politics, and political behavior' },
    { code: 'ANTH', name: 'Anthropology', description: 'Study of human societies, cultures, and their development' },
    { code: 'GEO', name: 'Geography', description: 'Study of Earth\'s landscapes, environments, and places' },
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

  // Create sample faculty users and instructors
  const facultyPassword = await bcrypt.hash('faculty123', 10);
  
  const faculty1 = await prisma.user.upsert({
    where: { email: 'john.smith@university.edu' },
    update: {},
    create: {
      email: 'john.smith@university.edu',
      name: 'Dr. John Smith',
      password: facultyPassword,
      role: 'FACULTY',
    },
  });

  const instructor1 = await prisma.instructor.upsert({
    where: { email: 'john.smith@university.edu' },
    update: {},
    create: {
      userId: faculty1.id,
      name: 'Dr. John Smith',
      email: 'john.smith@university.edu',
      departmentId: createdDepartments['CSC'].id,
      teachingLoad: 12,
      availability: {
        MONDAY: ['09:00-12:00', '14:00-17:00'],
        TUESDAY: ['09:00-12:00', '14:00-17:00'],
        WEDNESDAY: ['09:00-12:00', '14:00-17:00'],
        THURSDAY: ['09:00-12:00', '14:00-17:00'],
        FRIDAY: ['09:00-12:00'],
      },
      preferences: {
        preferredDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
        preferredTimes: ['09:00-12:00'],
      },
    },
  });

  const faculty2 = await prisma.user.upsert({
    where: { email: 'jane.doe@university.edu' },
    update: {},
    create: {
      email: 'jane.doe@university.edu',
      name: 'Dr. Jane Doe',
      password: facultyPassword,
      role: 'FACULTY',
    },
  });

  const instructor2 = await prisma.instructor.upsert({
    where: { email: 'jane.doe@university.edu' },
    update: {},
    create: {
      userId: faculty2.id,
      name: 'Dr. Jane Doe',
      email: 'jane.doe@university.edu',
      departmentId: createdDepartments['CSC'].id,
      teachingLoad: 15,
      availability: {
        MONDAY: ['10:00-13:00', '14:00-18:00'],
        TUESDAY: ['10:00-13:00', '14:00-18:00'],
        WEDNESDAY: ['10:00-13:00', '14:00-18:00'],
        THURSDAY: ['10:00-13:00', '14:00-18:00'],
        FRIDAY: ['10:00-13:00'],
      },
    },
  });

  const faculty3 = await prisma.user.upsert({
    where: { email: 'robert.johnson@university.edu' },
    update: {},
    create: {
      email: 'robert.johnson@university.edu',
      name: 'Prof. Robert Johnson',
      password: facultyPassword,
      role: 'FACULTY',
    },
  });

  const instructor3 = await prisma.instructor.upsert({
    where: { email: 'robert.johnson@university.edu' },
    update: {},
    create: {
      userId: faculty3.id,
      name: 'Prof. Robert Johnson',
      email: 'robert.johnson@university.edu',
      departmentId: createdDepartments['MATH'].id,
      teachingLoad: 12,
      availability: {
        MONDAY: ['08:00-12:00', '13:00-17:00'],
        TUESDAY: ['08:00-12:00', '13:00-17:00'],
        WEDNESDAY: ['08:00-12:00', '13:00-17:00'],
        THURSDAY: ['08:00-12:00', '13:00-17:00'],
        FRIDAY: ['08:00-12:00'],
      },
    },
  });

  console.log('Created instructors:', instructor1.name, instructor2.name, instructor3.name);

  // Create sample rooms
  const room1 = await prisma.room.upsert({
    where: { name: 'CSC-101' },
    update: {},
    create: {
      name: 'CSC-101',
      building: 'Computer Science Building',
      capacity: 50,
      type: 'LECTURE_HALL',
      equipment: ['PROJECTOR', 'WHITEBOARD', 'AUDIO_SYSTEM'],
    },
  });

  const room2 = await prisma.room.upsert({
    where: { name: 'CSC-LAB-1' },
    update: {},
    create: {
      name: 'CSC-LAB-1',
      building: 'Computer Science Building',
      capacity: 30,
      type: 'LAB',
      equipment: ['COMPUTERS', 'PROJECTOR', 'WHITEBOARD'],
    },
  });

  const room3 = await prisma.room.upsert({
    where: { name: 'MATH-201' },
    update: {},
    create: {
      name: 'MATH-201',
      building: 'Mathematics Building',
      capacity: 40,
      type: 'LECTURE_HALL',
      equipment: ['PROJECTOR', 'WHITEBOARD'],
    },
  });

  const room4 = await prisma.room.upsert({
    where: { name: 'SEM-A' },
    update: {},
    create: {
      name: 'SEM-A',
      building: 'Main Building',
      capacity: 25,
      type: 'SEMINAR',
      equipment: ['WHITEBOARD', 'TV_SCREEN'],
    },
  });

  const room5 = await prisma.room.upsert({
    where: { name: 'AUDITORIUM' },
    update: {},
    create: {
      name: 'AUDITORIUM',
      building: 'Main Building',
      capacity: 200,
      type: 'AUDITORIUM',
      equipment: ['PROJECTOR', 'AUDIO_SYSTEM', 'STAGE', 'MICROPHONES'],
    },
  });

  console.log('Created rooms:', room1.name, room2.name, room3.name, room4.name, room5.name);

  // Create sample courses
  const course1 = await prisma.course.upsert({
    where: { code: 'CSC101' },
    update: {},
    create: {
      code: 'CSC101',
      title: 'Introduction to Programming',
      duration: 90,
      credits: 3,
      departmentId: createdDepartments['CSC'].id,
      roomType: 'LECTURE_HALL',
    },
  });

  const course2 = await prisma.course.upsert({
    where: { code: 'CSC102' },
    update: {},
    create: {
      code: 'CSC102',
      title: 'Data Structures and Algorithms',
      duration: 90,
      credits: 4,
      departmentId: createdDepartments['CSC'].id,
      roomType: 'LECTURE_HALL',
    },
  });

  const course3 = await prisma.course.upsert({
    where: { code: 'CSC201' },
    update: {},
    create: {
      code: 'CSC201',
      title: 'Database Systems',
      duration: 90,
      credits: 3,
      departmentId: createdDepartments['CSC'].id,
      roomType: 'LECTURE_HALL',
    },
  });

  const course4 = await prisma.course.upsert({
    where: { code: 'CS202' },
    update: {},
    create: {
      code: 'CS202',
      title: 'Software Engineering Lab',
      duration: 120,
      credits: 2,
      departmentId: createdDepartments['CSC'].id,
      roomType: 'LAB',
    },
  });

  const course5 = await prisma.course.upsert({
    where: { code: 'MATH101' },
    update: {},
    create: {
      code: 'MATH101',
      title: 'Calculus I',
      duration: 90,
      credits: 4,
      departmentId: createdDepartments['MATH'].id,
      roomType: 'LECTURE_HALL',
    },
  });

  const course6 = await prisma.course.upsert({
    where: { code: 'MATH201' },
    update: {},
    create: {
      code: 'MATH201',
      title: 'Linear Algebra',
      duration: 90,
      credits: 3,
      departmentId: createdDepartments['MATH'].id,
      roomType: 'LECTURE_HALL',
    },
  });

  console.log('Created courses:', course1.code, course2.code, course3.code, course4.code, course5.code, course6.code);

  // Create student groups
  const group1 = await prisma.studentGroup.upsert({
    where: { name: 'CSC-2024-A' },
    update: {},
    create: {
      name: 'CSC-2024-A',
      program: 'Computer Science',
      year: 1,
      semester: 1,
      size: 45,
    },
  });

  const group2 = await prisma.studentGroup.upsert({
    where: { name: 'CSC-2024-B' },
    update: {},
    create: {
      name: 'CSC-2024-B',
      program: 'Computer Science',
      year: 1,
      semester: 1,
      size: 42,
    },
  });

  const group3 = await prisma.studentGroup.upsert({
    where: { name: 'CSC-2023-A' },
    update: {},
    create: {
      name: 'CSC-2023-A',
      program: 'Computer Science',
      year: 2,
      semester: 3,
      size: 38,
    },
  });

  console.log('Created student groups:', group1.name, group2.name, group3.name);

  // Link courses to instructors
  await prisma.courseInstructor.upsert({
    where: {
      courseId_instructorId: {
        courseId: course1.id,
        instructorId: instructor1.id,
      },
    },
    update: {},
    create: {
      courseId: course1.id,
      instructorId: instructor1.id,
      isPrimary: true,
    },
  });

  await prisma.courseInstructor.upsert({
    where: {
      courseId_instructorId: {
        courseId: course2.id,
        instructorId: instructor1.id,
      },
    },
    update: {},
    create: {
      courseId: course2.id,
      instructorId: instructor1.id,
      isPrimary: true,
    },
  });

  await prisma.courseInstructor.upsert({
    where: {
      courseId_instructorId: {
        courseId: course3.id,
        instructorId: instructor2.id,
      },
    },
    update: {},
    create: {
      courseId: course3.id,
      instructorId: instructor2.id,
      isPrimary: true,
    },
  });

  await prisma.courseInstructor.upsert({
    where: {
      courseId_instructorId: {
        courseId: course4.id,
        instructorId: instructor2.id,
      },
    },
    update: {},
    create: {
      courseId: course4.id,
      instructorId: instructor2.id,
      isPrimary: true,
    },
  });

  await prisma.courseInstructor.upsert({
    where: {
      courseId_instructorId: {
        courseId: course5.id,
        instructorId: instructor3.id,
      },
    },
    update: {},
    create: {
      courseId: course5.id,
      instructorId: instructor3.id,
      isPrimary: true,
    },
  });

  await prisma.courseInstructor.upsert({
    where: {
      courseId_instructorId: {
        courseId: course6.id,
        instructorId: instructor3.id,
      },
    },
    update: {},
    create: {
      courseId: course6.id,
      instructorId: instructor3.id,
      isPrimary: true,
    },
  });

  console.log('Linked courses to instructors');

  // Link courses to student groups
  await prisma.courseGroup.upsert({
    where: {
      courseId_groupId: {
        courseId: course1.id,
        groupId: group1.id,
      },
    },
    update: {},
    create: {
      courseId: course1.id,
      groupId: group1.id,
    },
  });

  await prisma.courseGroup.upsert({
    where: {
      courseId_groupId: {
        courseId: course1.id,
        groupId: group2.id,
      },
    },
    update: {},
    create: {
      courseId: course1.id,
      groupId: group2.id,
    },
  });

  await prisma.courseGroup.upsert({
    where: {
      courseId_groupId: {
        courseId: course5.id,
        groupId: group1.id,
      },
    },
    update: {},
    create: {
      courseId: course5.id,
      groupId: group1.id,
    },
  });

  await prisma.courseGroup.upsert({
    where: {
      courseId_groupId: {
        courseId: course5.id,
        groupId: group2.id,
      },
    },
    update: {},
    create: {
      courseId: course5.id,
      groupId: group2.id,
    },
  });

  await prisma.courseGroup.upsert({
    where: {
      courseId_groupId: {
        courseId: course2.id,
        groupId: group3.id,
      },
    },
    update: {},
    create: {
      courseId: course2.id,
      groupId: group3.id,
    },
  });

  await prisma.courseGroup.upsert({
    where: {
      courseId_groupId: {
        courseId: course3.id,
        groupId: group3.id,
      },
    },
    update: {},
    create: {
      courseId: course3.id,
      groupId: group3.id,
    },
  });

  await prisma.courseGroup.upsert({
    where: {
      courseId_groupId: {
        courseId: course4.id,
        groupId: group3.id,
      },
    },
    update: {},
    create: {
      courseId: course4.id,
      groupId: group3.id,
    },
  });

  await prisma.courseGroup.upsert({
    where: {
      courseId_groupId: {
        courseId: course6.id,
        groupId: group3.id,
      },
    },
    update: {},
    create: {
      courseId: course6.id,
      groupId: group3.id,
    },
  });

  console.log('Linked courses to student groups');

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
