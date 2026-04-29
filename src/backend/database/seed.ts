import "server-only";

import { query, execute } from "@/backend/database/pool";
import { hashPassword } from "@/backend/utils";
import { Logger } from "@/backend/utils";

let seeded = false;

export async function seedDevData(): Promise<void> {
  if (seeded) return;
  seeded = true;

  // Check if data already exists
  const roles = await query<{ c: number }>("SELECT COUNT(*) AS c FROM userRoles");
  if ((roles[0]?.c ?? 0) > 0) {
    Logger.info("Seed", "Data already exists — skipping");
    return;
  }

  Logger.info("Seed", "Seeding development data...");

  // 1. User Roles
  await execute("INSERT INTO userRoles (role) VALUES ('ADMIN'), ('PROFESSOR'), ('STUDENT')");

  // 2. Programs
  await execute(
    `INSERT INTO programs (name, isSocialService) VALUES
      ('Maestría en Tecnología Avanzada', 0),
      ('Doctorado en Tecnología Avanzada', 0),
      ('Servicio Social', 1)`
  );

  // 3. School Cycles
  await execute(
    `INSERT INTO schoolCycles (cycle, description, startDate, endDate) VALUES
      ('2025A', 'Periodo enero - junio 2025',       '2025-01-13', '2025-06-30'),
      ('2025B', 'Periodo agosto 2025 - enero 2026', '2025-08-04', '2026-01-23'),
      ('2026A', 'Periodo febrero - julio 2026',     '2026-02-02', '2026-07-17')`
  );

  // 4. Users (1 admin + 4 professors + 5 students)
  await execute(
    `INSERT INTO users (name, lastName, roleId, gender, academicDegree) VALUES
      ('Administrador',     'CICATA',             1, 'M', NULL),
      ('Carlos Eduardo',    'García López',       2, 'M', 'Dr.'),
      ('María Fernanda',    'Rodríguez Sánchez',  2, 'F', 'Dra.'),
      ('Roberto',           'Hernández Martínez', 2, 'M', 'M. en C.'),
      ('Ana Lucía',         'Pérez Morales',      2, 'F', 'Dra.'),
      ('Juan Pablo',        'Ramírez Torres',     3, 'M', NULL),
      ('Sofía Valentina',   'Cruz Méndez',        3, 'F', NULL),
      ('Diego Alejandro',   'Flores Ríos',        3, 'M', NULL),
      ('Camila Andrea',     'Ortiz Ruiz',         3, 'F', NULL),
      ('Miguel Ángel',      'Vargas Delgado',     3, 'M', NULL)`
  );

  // 5. Admin (hash password at runtime)
  const hashedPw = hashPassword("Admin123");
  await execute(
    "INSERT INTO admin (userId, username, password, email) VALUES (?, ?, ?, ?)",
    [1, "admin", hashedPw, "admin@cicata.ipn.mx"]
  );

  // 6. Professors
  await execute(
    `INSERT INTO professors (userId, ipnRegistration, employeeNumber, academicLoad, availableHours, programId, statusId) VALUES
      (2, 'IPN-2010-0042', 'P001', 20.0, 10.0, 1, 1),
      (3, 'IPN-2012-0108', 'P002', 20.0, 15.0, 1, 1),
      (4, 'IPN-2015-0237', 'P003', 15.0,  8.0, 2, 1),
      (5, 'IPN-2018-0315', 'P004', 20.0, 12.0, 2, 1)`
  );

  // 7. Students
  await execute(
    `INSERT INTO students (userId, curp, registration, timeModality, programId, localTutorId, academicDirectorId, enrollmentCycleId, semester, statusId) VALUES
      (6,  'RATJ000515HMSMRN01', 'M2025001', 'TC', 1, 2, 1, 1, 1, 1),
      (7,  'CUMS010220MDFRNF02', 'M2025002', 'TC', 1, 3, 2, 1, 2, 1),
      (8,  'FORD990830HMSLLG03', 'D2025001', 'TC', 2, 4, 3, 2, 1, 2),
      (9,  'OIRC001105MDFRTM04', 'M2025003', 'TP', 1, 5, 1, 1, 3, 1),
      (10, 'VADM980712HMSRLG05', 'D2025002', 'TC', 2, 2, 4, 2, 2, 1)`
  );

  // 8. Subjects
  await execute(
    `INSERT INTO subjects (name, subjectKey, credits, semester, topics) VALUES
      ('Matemáticas Avanzadas',        'MAT101', 6.00, 1, 'Álgebra lineal, cálculo multivariable, ecuaciones diferenciales parciales, métodos numéricos'),
      ('Física de Materiales',         'FIS201', 4.50, 1, 'Estructura cristalina, propiedades mecánicas, difracción de rayos X, microscopía electrónica'),
      ('Nanotecnología',               'NAN301', 6.00, 2, 'Síntesis de nanomateriales, caracterización, aplicaciones biomédicas, nanofabricación'),
      ('Biotecnología Aplicada',       'BIO401', 4.50, 2, 'Ingeniería genética, bioprocesos, fermentación, bioremediación'),
      ('Seminario de Investigación I', 'SEM101', 3.00, 1, 'Metodología de investigación, redacción científica, análisis bibliográfico, presentación de avances')`
  );

  // 9. Study Groups
  await execute(
    `INSERT INTO studyGroups (groupKey, subjectId, campus, place, schedule, professorId, cycleId, observations) VALUES
      ('MAT101-2025A', 1, 'CICATA MORELOS', 'Aula 101',            'Lun-Vie 9:00-11:00',  1, 1, NULL),
      ('FIS201-2025A', 2, 'CICATA MORELOS', 'Laboratorio Física',  'Mar-Jue 11:00-13:00', 2, 1, 'Requiere bata de laboratorio'),
      ('NAN301-2025B', 3, 'CICATA MORELOS', 'Laboratorio Nano',    'Lun-Mié 14:00-16:00', 3, 2, 'Acceso restringido a cuarto limpio'),
      ('SEM101-2025A', 5, 'CICATA MORELOS', 'Sala de Seminarios',  'Vie 10:00-12:00',     4, 1, NULL)`
  );

  // 10. Group Visiting Professors
  await execute(
    `INSERT INTO groupVisitingProfessors (groupId, professorId, assignedHours) VALUES
      (1, 3, 4.0),
      (2, 4, 3.0)`
  );

  // 11. Students In Groups
  await execute(
    `INSERT INTO studentsInGroups (studentId, groupId, grade, recordFolio, termType) VALUES
      (1, 1, '9.5',  '25AM001', 'TC'),
      (1, 4, '10',   '25AM002', 'TC'),
      (2, 1, '8.7',  '25AM003', 'TC'),
      (2, 2, '9.2',  '25AM004', 'TC'),
      (4, 1, '9.0',  '25AM005', 'TC'),
      (3, 3, NULL,    NULL,      'TC')`
  );

  // 12. Reenrollments
  await execute(
    `INSERT INTO reenrollments (studentId, cycleId, advisorId, academicDirectorId) VALUES
      (2, 2, 1, 2),
      (5, 2, 3, 4)`
  );

  // 13. Student Projects
  await execute(
    `INSERT INTO studentProjects (studentId, advisorId, originInstitution, originCareer, projectType, projectName, totalHours, startDate, endDate) VALUES
      (3, 3, 'Instituto Tecnológico de Zacatepec', 'Ingeniería Bioquímica', 'Residencia Profesional', 'Síntesis y caracterización de nanopartículas de óxido de zinc para aplicaciones fotocatalíticas', 480, '2025-08-01', '2025-12-15'),
      (1, 1, NULL, NULL, 'Servicio Social', 'Desarrollo de materiales compuestos con propiedades antimicrobianas para uso hospitalario', 480, '2025-03-01', '2025-08-31')`
  );

  // 14. Document Types
  await execute(
    `INSERT INTO docTypes (name, target) VALUES
      ('Constancia de Inscripción',      'student'),
      ('Constancia de Reinscripción',    'student'),
      ('Constancia de Promedio Global',  'student'),
      ('Carta de Aceptación',            'student')`
  );

  Logger.info("Seed", "Dev data ready — admin/Admin123 (10 users, 4 profs, 5 students, 5 subjects, 4 groups)");
}
