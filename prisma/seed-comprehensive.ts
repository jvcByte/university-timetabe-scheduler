import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Course data for each department (100L to 500L)
const coursesByDepartment: Record<string, Array<{ code: string; title: string; level: number; credits: number; duration: number; roomType: string }>> = {
  CSC: [
    // 100 Level
    { code: 'CSC101', title: 'Introduction to Computer Science', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC102', title: 'Introduction to Programming', level: 100, credits: 4, duration: 90, roomType: 'LAB' },
    { code: 'CSC103', title: 'Computer Fundamentals', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC104', title: 'Discrete Mathematics', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC105', title: 'Programming Lab I', level: 100, credits: 2, duration: 120, roomType: 'LAB' },
    // 200 Level
    { code: 'CSC201', title: 'Data Structures', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC202', title: 'Algorithms', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC203', title: 'Object-Oriented Programming', level: 200, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'CSC204', title: 'Computer Architecture', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC205', title: 'Web Development', level: 200, credits: 3, duration: 90, roomType: 'LAB' },
    // 300 Level
    { code: 'CSC301', title: 'Database Systems', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC302', title: 'Operating Systems', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC303', title: 'Software Engineering', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC304', title: 'Computer Networks', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC305', title: 'Artificial Intelligence', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 400 Level
    { code: 'CSC401', title: 'Machine Learning', level: 400, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC402', title: 'Compiler Design', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC403', title: 'Distributed Systems', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC404', title: 'Cybersecurity', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC405', title: 'Mobile App Development', level: 400, credits: 3, duration: 90, roomType: 'LAB' },
    // 500 Level
    { code: 'CSC501', title: 'Advanced Algorithms', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC502', title: 'Cloud Computing', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC503', title: 'Deep Learning', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CSC504', title: 'Research Methods', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'CSC505', title: 'Project', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  SEN: [
    // 100 Level
    { code: 'SEN101', title: 'Introduction to Software Engineering', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN102', title: 'Programming Fundamentals', level: 100, credits: 4, duration: 90, roomType: 'LAB' },
    { code: 'SEN103', title: 'Software Development Tools', level: 100, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'SEN104', title: 'Requirements Engineering', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN105', title: 'Technical Communication', level: 100, credits: 2, duration: 90, roomType: 'LECTURE_HALL' },
    // 200 Level
    { code: 'SEN201', title: 'Software Design Patterns', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN202', title: 'Agile Development', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN203', title: 'Software Testing', level: 200, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'SEN204', title: 'Version Control Systems', level: 200, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'SEN205', title: 'UI/UX Design', level: 200, credits: 3, duration: 90, roomType: 'LAB' },
    // 300 Level
    { code: 'SEN301', title: 'Software Architecture', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN302', title: 'DevOps Practices', level: 300, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'SEN303', title: 'Software Quality Assurance', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN304', title: 'Software Project Management', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN305', title: 'Microservices Architecture', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 400 Level
    { code: 'SEN401', title: 'Software Maintenance', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN402', title: 'Software Security', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN403', title: 'Software Metrics', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN404', title: 'Enterprise Software Development', level: 400, credits: 4, duration: 90, roomType: 'LAB' },
    { code: 'SEN405', title: 'Software Engineering Ethics', level: 400, credits: 2, duration: 90, roomType: 'SEMINAR' },
    // 500 Level
    { code: 'SEN501', title: 'Advanced Software Engineering', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN502', title: 'Software Process Improvement', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'SEN503', title: 'Software Engineering Research', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'SEN504', title: 'Capstone Project I', level: 500, credits: 3, duration: 120, roomType: 'SEMINAR' },
    { code: 'SEN505', title: 'Capstone Project II', level: 500, credits: 3, duration: 120, roomType: 'SEMINAR' },
  ],
  MATH: [
    // 100 Level
    { code: 'MATH101', title: 'Calculus I', level: 100, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH102', title: 'Linear Algebra I', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH103', title: 'Introduction to Probability', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH104', title: 'Geometry', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH105', title: 'Mathematical Methods', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 200 Level
    { code: 'MATH201', title: 'Calculus II', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH202', title: 'Linear Algebra II', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH203', title: 'Differential Equations', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH204', title: 'Statistics', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH205', title: 'Abstract Algebra', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 300 Level
    { code: 'MATH301', title: 'Real Analysis', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH302', title: 'Complex Analysis', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH303', title: 'Numerical Analysis', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH304', title: 'Topology', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH305', title: 'Mathematical Modeling', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 400 Level
    { code: 'MATH401', title: 'Advanced Calculus', level: 400, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH402', title: 'Functional Analysis', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH403', title: 'Number Theory', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH404', title: 'Graph Theory', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH405', title: 'Optimization Theory', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 500 Level
    { code: 'MATH501', title: 'Advanced Abstract Algebra', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH502', title: 'Measure Theory', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH503', title: 'Partial Differential Equations', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'MATH504', title: 'Research Seminar', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'MATH505', title: 'Thesis', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  PHY: [
    // 100 Level
    { code: 'PHY101', title: 'Mechanics', level: 100, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY102', title: 'Electricity and Magnetism', level: 100, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY103', title: 'Physics Laboratory I', level: 100, credits: 2, duration: 120, roomType: 'LAB' },
    { code: 'PHY104', title: 'Waves and Optics', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY105', title: 'Introduction to Modern Physics', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 200 Level
    { code: 'PHY201', title: 'Classical Mechanics', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY202', title: 'Thermodynamics', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY203', title: 'Electromagnetic Theory', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY204', title: 'Physics Laboratory II', level: 200, credits: 2, duration: 120, roomType: 'LAB' },
    { code: 'PHY205', title: 'Mathematical Methods in Physics', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 300 Level
    { code: 'PHY301', title: 'Quantum Mechanics I', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY302', title: 'Statistical Mechanics', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY303', title: 'Solid State Physics', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY304', title: 'Electronics', level: 300, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'PHY305', title: 'Computational Physics', level: 300, credits: 3, duration: 90, roomType: 'LAB' },
    // 400 Level
    { code: 'PHY401', title: 'Quantum Mechanics II', level: 400, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY402', title: 'Nuclear Physics', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY403', title: 'Particle Physics', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY404', title: 'Astrophysics', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY405', title: 'Advanced Laboratory', level: 400, credits: 3, duration: 120, roomType: 'LAB' },
    // 500 Level
    { code: 'PHY501', title: 'Advanced Quantum Mechanics', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY502', title: 'Quantum Field Theory', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY503', title: 'General Relativity', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PHY504', title: 'Research Methods in Physics', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'PHY505', title: 'Thesis', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  CHEM: [
    // 100 Level
    { code: 'CHEM101', title: 'General Chemistry I', level: 100, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM102', title: 'General Chemistry II', level: 100, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM103', title: 'Chemistry Laboratory I', level: 100, credits: 2, duration: 120, roomType: 'LAB' },
    { code: 'CHEM104', title: 'Inorganic Chemistry', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM105', title: 'Atomic Structure', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 200 Level
    { code: 'CHEM201', title: 'Organic Chemistry I', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM202', title: 'Organic Chemistry II', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM203', title: 'Physical Chemistry I', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM204', title: 'Analytical Chemistry', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM205', title: 'Chemistry Laboratory II', level: 200, credits: 2, duration: 120, roomType: 'LAB' },
    // 300 Level
    { code: 'CHEM301', title: 'Physical Chemistry II', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM302', title: 'Quantum Chemistry', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM303', title: 'Spectroscopy', level: 300, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'CHEM304', title: 'Biochemistry', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM305', title: 'Environmental Chemistry', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 400 Level
    { code: 'CHEM401', title: 'Advanced Organic Chemistry', level: 400, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM402', title: 'Polymer Chemistry', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM403', title: 'Medicinal Chemistry', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM404', title: 'Industrial Chemistry', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM405', title: 'Advanced Laboratory', level: 400, credits: 3, duration: 120, roomType: 'LAB' },
    // 500 Level
    { code: 'CHEM501', title: 'Advanced Physical Chemistry', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM502', title: 'Computational Chemistry', level: 500, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'CHEM503', title: 'Chemical Kinetics', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'CHEM504', title: 'Research Seminar', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'CHEM505', title: 'Thesis', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  BIO: [
    // 100 Level
    { code: 'BIO101', title: 'General Biology I', level: 100, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO102', title: 'General Biology II', level: 100, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO103', title: 'Biology Laboratory I', level: 100, credits: 2, duration: 120, roomType: 'LAB' },
    { code: 'BIO104', title: 'Cell Biology', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO105', title: 'Botany', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 200 Level
    { code: 'BIO201', title: 'Genetics', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO202', title: 'Microbiology', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO203', title: 'Zoology', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO204', title: 'Ecology', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO205', title: 'Biology Laboratory II', level: 200, credits: 2, duration: 120, roomType: 'LAB' },
    // 300 Level
    { code: 'BIO301', title: 'Molecular Biology', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO302', title: 'Biochemistry', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO303', title: 'Physiology', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO304', title: 'Evolution', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO305', title: 'Bioinformatics', level: 300, credits: 3, duration: 90, roomType: 'LAB' },
    // 400 Level
    { code: 'BIO401', title: 'Immunology', level: 400, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO402', title: 'Developmental Biology', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO403', title: 'Biotechnology', level: 400, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'BIO404', title: 'Conservation Biology', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO405', title: 'Advanced Laboratory', level: 400, credits: 3, duration: 120, roomType: 'LAB' },
    // 500 Level
    { code: 'BIO501', title: 'Advanced Molecular Biology', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO502', title: 'Genomics', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO503', title: 'Systems Biology', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BIO504', title: 'Research Methods', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'BIO505', title: 'Thesis', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  ENG: [
    // 100 Level
    { code: 'ENG101', title: 'English Composition I', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG102', title: 'English Composition II', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG103', title: 'Introduction to Literature', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG104', title: 'Grammar and Usage', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG105', title: 'Public Speaking', level: 100, credits: 2, duration: 90, roomType: 'SEMINAR' },
    // 200 Level
    { code: 'ENG201', title: 'British Literature I', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG202', title: 'American Literature', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG203', title: 'Creative Writing', level: 200, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'ENG204', title: 'Poetry Analysis', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG205', title: 'Technical Writing', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 300 Level
    { code: 'ENG301', title: 'Shakespeare Studies', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG302', title: 'Modern Literature', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG303', title: 'Literary Theory', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG304', title: 'World Literature', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG305', title: 'Linguistics', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 400 Level
    { code: 'ENG401', title: 'Advanced Literary Analysis', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'ENG402', title: 'Contemporary Literature', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG403', title: 'Postcolonial Literature', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG404', title: 'Drama and Theatre', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG405', title: 'Professional Writing', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    // 500 Level
    { code: 'ENG501', title: 'Advanced Literary Theory', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'ENG502', title: 'Research Methods in Literature', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'ENG503', title: 'Comparative Literature', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ENG504', title: 'Thesis Seminar', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'ENG505', title: 'Thesis', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  ECO: [
    // 100 Level
    { code: 'ECO101', title: 'Principles of Economics I', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO102', title: 'Principles of Economics II', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO103', title: 'Introduction to Microeconomics', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO104', title: 'Introduction to Macroeconomics', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO105', title: 'Economic Mathematics', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 200 Level
    { code: 'ECO201', title: 'Intermediate Microeconomics', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO202', title: 'Intermediate Macroeconomics', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO203', title: 'Statistics for Economics', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO204', title: 'Money and Banking', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO205', title: 'Development Economics', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 300 Level
    { code: 'ECO301', title: 'Econometrics', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO302', title: 'International Economics', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO303', title: 'Public Finance', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO304', title: 'Labor Economics', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO305', title: 'Environmental Economics', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 400 Level
    { code: 'ECO401', title: 'Advanced Econometrics', level: 400, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO402', title: 'Game Theory', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO403', title: 'Industrial Organization', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO404', title: 'Financial Economics', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO405', title: 'Economic Policy', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 500 Level
    { code: 'ECO501', title: 'Advanced Microeconomic Theory', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO502', title: 'Advanced Macroeconomic Theory', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'ECO503', title: 'Research Methods in Economics', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'ECO504', title: 'Thesis Seminar', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'ECO505', title: 'Thesis', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  EENG: [
    // 100 Level
    { code: 'EENG101', title: 'Introduction to Electrical Engineering', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG102', title: 'Circuit Analysis I', level: 100, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG103', title: 'Engineering Mathematics I', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG104', title: 'Digital Logic Design', level: 100, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'EENG105', title: 'Engineering Drawing', level: 100, credits: 2, duration: 90, roomType: 'LAB' },
    // 200 Level
    { code: 'EENG201', title: 'Circuit Analysis II', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG202', title: 'Electronics I', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG203', title: 'Signals and Systems', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG204', title: 'Electromagnetic Fields', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG205', title: 'Electrical Engineering Lab I', level: 200, credits: 2, duration: 120, roomType: 'LAB' },
    // 300 Level
    { code: 'EENG301', title: 'Electronics II', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG302', title: 'Control Systems', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG303', title: 'Power Systems', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG304', title: 'Communication Systems', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG305', title: 'Microprocessors', level: 300, credits: 3, duration: 90, roomType: 'LAB' },
    // 400 Level
    { code: 'EENG401', title: 'Digital Signal Processing', level: 400, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG402', title: 'Power Electronics', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG403', title: 'Embedded Systems', level: 400, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'EENG404', title: 'Renewable Energy Systems', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG405', title: 'Advanced Laboratory', level: 400, credits: 3, duration: 120, roomType: 'LAB' },
    // 500 Level
    { code: 'EENG501', title: 'Advanced Control Systems', level: 500, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG502', title: 'VLSI Design', level: 500, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'EENG503', title: 'Wireless Communications', level: 500, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'EENG504', title: 'Research Seminar', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'EENG505', title: 'Capstone Project', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  HIS: [
    // 100 Level
    { code: 'HIS101', title: 'World History I', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS102', title: 'World History II', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS103', title: 'Introduction to Historical Methods', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS104', title: 'Ancient Civilizations', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS105', title: 'Historical Research Skills', level: 100, credits: 2, duration: 90, roomType: 'SEMINAR' },
    // 200 Level
    { code: 'HIS201', title: 'Medieval History', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS202', title: 'Modern European History', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS203', title: 'American History', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS204', title: 'African History', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS205', title: 'History of Science', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 300 Level
    { code: 'HIS301', title: 'Contemporary World History', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS302', title: 'Social History', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS303', title: 'Economic History', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS304', title: 'Political History', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'HIS305', title: 'Cultural History', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 400 Level
    { code: 'HIS401', title: 'Historiography', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'HIS402', title: 'Advanced Historical Research', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'HIS403', title: 'Oral History', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'HIS404', title: 'Digital History', level: 400, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'HIS405', title: 'Public History', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    // 500 Level
    { code: 'HIS501', title: 'Advanced Historiography', level: 500, credits: 4, duration: 90, roomType: 'SEMINAR' },
    { code: 'HIS502', title: 'Historical Theory', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'HIS503', title: 'Comparative History', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'HIS504', title: 'Thesis Seminar', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'HIS505', title: 'Thesis', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  PSY: [
    // 100 Level
    { code: 'PSY101', title: 'Introduction to Psychology', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY102', title: 'Developmental Psychology', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY103', title: 'Research Methods in Psychology', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY104', title: 'Biological Psychology', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY105', title: 'Psychology Laboratory I', level: 100, credits: 2, duration: 120, roomType: 'LAB' },
    // 200 Level
    { code: 'PSY201', title: 'Cognitive Psychology', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY202', title: 'Social Psychology', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY203', title: 'Personality Psychology', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY204', title: 'Statistics for Psychology', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY205', title: 'Abnormal Psychology', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 300 Level
    { code: 'PSY301', title: 'Clinical Psychology', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY302', title: 'Educational Psychology', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY303', title: 'Health Psychology', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY304', title: 'Neuropsychology', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY305', title: 'Psychology Laboratory II', level: 300, credits: 2, duration: 120, roomType: 'LAB' },
    // 400 Level
    { code: 'PSY401', title: 'Advanced Research Methods', level: 400, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'PSY402', title: 'Psychological Testing', level: 400, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'PSY403', title: 'Counseling Psychology', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'PSY404', title: 'Industrial Psychology', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'PSY405', title: 'Psychology Internship', level: 400, credits: 3, duration: 120, roomType: 'SEMINAR' },
    // 500 Level
    { code: 'PSY501', title: 'Advanced Clinical Psychology', level: 500, credits: 4, duration: 90, roomType: 'SEMINAR' },
    { code: 'PSY502', title: 'Psychological Research', level: 500, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'PSY503', title: 'Advanced Statistics', level: 500, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'PSY504', title: 'Thesis Seminar', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'PSY505', title: 'Thesis', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
  BUS: [
    // 100 Level
    { code: 'BUS101', title: 'Introduction to Business', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS102', title: 'Business Mathematics', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS103', title: 'Principles of Management', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS104', title: 'Business Communication', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS105', title: 'Introduction to Accounting', level: 100, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 200 Level
    { code: 'BUS201', title: 'Financial Accounting', level: 200, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS202', title: 'Marketing Principles', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS203', title: 'Human Resource Management', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS204', title: 'Business Statistics', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS205', title: 'Operations Management', level: 200, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    // 300 Level
    { code: 'BUS301', title: 'Corporate Finance', level: 300, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS302', title: 'Strategic Management', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS303', title: 'International Business', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS304', title: 'Business Law', level: 300, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS305', title: 'Entrepreneurship', level: 300, credits: 3, duration: 90, roomType: 'SEMINAR' },
    // 400 Level
    { code: 'BUS401', title: 'Advanced Finance', level: 400, credits: 4, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS402', title: 'Business Analytics', level: 400, credits: 3, duration: 90, roomType: 'LAB' },
    { code: 'BUS403', title: 'Leadership and Ethics', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'BUS404', title: 'Supply Chain Management', level: 400, credits: 3, duration: 90, roomType: 'LECTURE_HALL' },
    { code: 'BUS405', title: 'Business Capstone', level: 400, credits: 3, duration: 90, roomType: 'SEMINAR' },
    // 500 Level
    { code: 'BUS501', title: 'Advanced Strategic Management', level: 500, credits: 4, duration: 90, roomType: 'SEMINAR' },
    { code: 'BUS502', title: 'Corporate Governance', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'BUS503', title: 'Business Research Methods', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'BUS504', title: 'MBA Seminar', level: 500, credits: 3, duration: 90, roomType: 'SEMINAR' },
    { code: 'BUS505', title: 'Business Project', level: 500, credits: 6, duration: 120, roomType: 'SEMINAR' },
  ],
};

async function main() {
  console.log('Starting comprehensive database seed...');

  // Get all departments
  const departments = await prisma.department.findMany();
  console.log(`Found ${departments.length} departments`);

  const facultyPassword = await bcrypt.hash('faculty123', 10);
  const createdInstructors: any[] = [];
  const createdRooms: any[] = [];
  const createdCourses: any[] = [];
  const createdGroups: any[] = [];

  // Create instructors for each department (3 per department)
  for (const dept of departments) {
    const instructorNames = [
      { name: `Dr. ${dept.code} Professor A`, email: `${dept.code.toLowerCase()}.prof.a@university.edu` },
      { name: `Dr. ${dept.code} Professor B`, email: `${dept.code.toLowerCase()}.prof.b@university.edu` },
      { name: `Prof. ${dept.code} Lecturer C`, email: `${dept.code.toLowerCase()}.lect.c@university.edu` },
    ];

    for (const instructorData of instructorNames) {
      const user = await prisma.user.upsert({
        where: { email: instructorData.email },
        update: {},
        create: {
          email: instructorData.email,
          name: instructorData.name,
          password: facultyPassword,
          role: 'FACULTY',
        },
      });

      const instructor = await prisma.instructor.upsert({
        where: { email: instructorData.email },
        update: {},
        create: {
          userId: user.id,
          name: instructorData.name,
          email: instructorData.email,
          departmentId: dept.id,
          teachingLoad: 12,
          availability: {
            MONDAY: ['08:00-12:00', '14:00-17:00'],
            TUESDAY: ['08:00-12:00', '14:00-17:00'],
            WEDNESDAY: ['08:00-12:00', '14:00-17:00'],
            THURSDAY: ['08:00-12:00', '14:00-17:00'],
            FRIDAY: ['08:00-12:00', '14:00-16:00'],
          },
          preferences: {
            preferredDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          },
        },
      });

      createdInstructors.push({ ...instructor, deptCode: dept.code });
    }
  }
  console.log(`Created ${createdInstructors.length} instructors`);

  // Create rooms for each department
  for (const dept of departments) {
    const roomTypes = [
      { name: `${dept.code}-LH1`, type: 'LECTURE_HALL', capacity: 60 },
      { name: `${dept.code}-LH2`, type: 'LECTURE_HALL', capacity: 50 },
      { name: `${dept.code}-LAB1`, type: 'LAB', capacity: 30 },
      { name: `${dept.code}-SEM1`, type: 'SEMINAR', capacity: 25 },
    ];

    for (const roomData of roomTypes) {
      const room = await prisma.room.upsert({
        where: { name: roomData.name },
        update: {},
        create: {
          name: roomData.name,
          building: `${dept.name} Building`,
          capacity: roomData.capacity,
          type: roomData.type as any,
          equipment: roomData.type === 'LAB' 
            ? ['COMPUTERS', 'PROJECTOR', 'WHITEBOARD']
            : ['PROJECTOR', 'WHITEBOARD', 'AUDIO_SYSTEM'],
        },
      });

      createdRooms.push(room);
    }
  }
  console.log(`Created ${createdRooms.length} rooms`);

  // Create courses for departments that have course data
  for (const dept of departments) {
    const courses = coursesByDepartment[dept.code];
    if (!courses) continue;

    for (const courseData of courses) {
      const course = await prisma.course.upsert({
        where: { code: courseData.code },
        update: {},
        create: {
          code: courseData.code,
          title: courseData.title,
          duration: courseData.duration,
          credits: courseData.credits,
          departmentId: dept.id,
          roomType: courseData.roomType as any,
        },
      });

      createdCourses.push({ ...course, deptCode: dept.code, level: courseData.level });

      // Assign instructors to courses (1-2 instructors per course)
      const deptInstructors = createdInstructors.filter(i => i.deptCode === dept.code);
      const assignedInstructor = deptInstructors[Math.floor(Math.random() * deptInstructors.length)];

      if (assignedInstructor) {
        await prisma.courseInstructor.upsert({
          where: {
            courseId_instructorId: {
              courseId: course.id,
              instructorId: assignedInstructor.id,
            },
          },
          update: {},
          create: {
            courseId: course.id,
            instructorId: assignedInstructor.id,
            isPrimary: true,
          },
        });
      }
    }
  }
  console.log(`Created ${createdCourses.length} courses`);

  // Create student groups for each department and level
  for (const dept of departments) {
    const levels = [100, 200, 300, 400, 500];
    
    for (const level of levels) {
      const groupName = `${dept.code}-${level}L-A`;
      const year = level / 100;
      const semester = (year - 1) * 2 + 1;

      const group = await prisma.studentGroup.upsert({
        where: { name: groupName },
        update: {},
        create: {
          name: groupName,
          program: dept.name,
          year: year,
          semester: semester,
          size: 35 + Math.floor(Math.random() * 20), // 35-54 students
        },
      });

      createdGroups.push({ ...group, deptCode: dept.code, level });

      // Link courses to student groups
      const levelCourses = createdCourses.filter(
        c => c.deptCode === dept.code && c.level === level
      );

      for (const course of levelCourses) {
        await prisma.courseGroup.upsert({
          where: {
            courseId_groupId: {
              courseId: course.id,
              groupId: group.id,
            },
          },
          update: {},
          create: {
            courseId: course.id,
            groupId: group.id,
          },
        });
      }
    }
  }
  console.log(`Created ${createdGroups.length} student groups`);

  console.log('Comprehensive database seed completed successfully!');
  console.log(`Summary:
  - Departments: ${departments.length}
  - Instructors: ${createdInstructors.length}
  - Rooms: ${createdRooms.length}
  - Courses: ${createdCourses.length}
  - Student Groups: ${createdGroups.length}
  `);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
