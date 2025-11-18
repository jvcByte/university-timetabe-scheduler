-- Seed data for Neon database
-- Run this in Neon SQL Editor after uploading the schema

-- Insert admin user
INSERT INTO "User" (id, email, name, password, role, "createdAt", "updatedAt")
VALUES (
  'cm4xadmin123456789',
  'admin@university.edu',
  'System Administrator',
  '$2a$10$/L2/EG.jPS.WLd/p6H.0Nus4xdo7sQSoIxGoVFcM2VKLLEBbapzDq',
  'ADMIN',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert departments
INSERT INTO "Department" (code, name, description, "createdAt", "updatedAt")
VALUES 
  ('CSC', 'Computer Science', 'Computer Science Department', NOW(), NOW()),
  ('MATH', 'Mathematics', 'Mathematics Department', NOW(), NOW()),
  ('ENG', 'Engineering', 'Engineering Department', NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- Insert rooms
INSERT INTO "Room" (name, building, capacity, type, equipment, "createdAt", "updatedAt")
VALUES 
  ('ROOM-101', 'Main Building', 50, 'LECTURE_HALL', '["PROJECTOR", "WHITEBOARD"]'::jsonb, NOW(), NOW()),
  ('LAB-201', 'Science Building', 30, 'LAB', '["COMPUTERS", "PROJECTOR"]'::jsonb, NOW(), NOW()),
  ('SEM-301', 'Academic Building', 25, 'SEMINAR', '["WHITEBOARD", "TV_SCREEN"]'::jsonb, NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

-- Insert default constraint configuration
INSERT INTO "ConstraintConfig" (
  name, "isDefault", "noRoomDoubleBooking", "noInstructorDoubleBooking",
  "roomCapacityCheck", "roomTypeMatch", "workingHoursOnly",
  "instructorPreferencesWeight", "compactSchedulesWeight",
  "balancedDailyLoadWeight", "preferredRoomsWeight",
  "workingHoursStart", "workingHoursEnd", "createdAt", "updatedAt"
)
VALUES (
  'Default Configuration', true, true, true, true, true, true,
  5, 7, 6, 3, '08:00', '18:00', NOW(), NOW()
)
ON CONFLICT (name) DO NOTHING;

-- Verify data was inserted
SELECT 'Admin user created:' as status, email, name, role FROM "User" WHERE role = 'ADMIN';
SELECT 'Departments created:' as status, COUNT(*) as count FROM "Department";
SELECT 'Rooms created:' as status, COUNT(*) as count FROM "Room";
SELECT 'Constraint config created:' as status, COUNT(*) as count FROM "ConstraintConfig";
