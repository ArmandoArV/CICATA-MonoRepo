DROP DATABASE IF EXISTS CICATADocs;
CREATE DATABASE CICATADocs;
USE CICATADocs;

-- ========================================================
-- 1. CATÁLOGOS Y ROLES
-- ========================================================

CREATE TABLE userRoles (
    idRole  INT         AUTO_INCREMENT NOT NULL,
    role    VARCHAR(30) NOT NULL UNIQUE,
    PRIMARY KEY (idRole)
);

CREATE TABLE programs (
    idProgram       INT         AUTO_INCREMENT NOT NULL,
    name            VARCHAR(60) NOT NULL UNIQUE,
    isSocialService TINYINT(1)  NOT NULL DEFAULT 0,
    isDeleted       BOOL        DEFAULT 0,
    PRIMARY KEY (idProgram)
);

CREATE TABLE schoolCycles (
    idCycle     INT         AUTO_INCREMENT NOT NULL,
    cycle       VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(50) NOT NULL COMMENT 'Ej. periodo agosto 2024 - enero 2025',
    startDate   DATE        NOT NULL,
    endDate     DATE        NOT NULL,
    PRIMARY KEY (idCycle)
);

CREATE TABLE statusCatalog (
    idStatus INT         AUTO_INCREMENT NOT NULL,
    type     VARCHAR(30) NOT NULL UNIQUE,
    PRIMARY KEY (idStatus)
);

-- Poblar estatus obligatorios para la lógica del sistema
INSERT INTO statusCatalog (type) VALUES 
('ACTIVO'), 
('INSCRITO'), 
('GRADUADO'), 
('BAJA TEMPORAL'), 
('BAJA DEFINITIVA');

-- ========================================================
-- 2. USUARIOS (GENERAL, ADMIN, PROFESORES, ESTUDIANTES)
-- ========================================================

CREATE TABLE users (
    idUser         INT         AUTO_INCREMENT NOT NULL,
    name           VARCHAR(75) NOT NULL,
    lastName       VARCHAR(75) NOT NULL,
    roleId         INT         NOT NULL,
    gender         ENUM('M', 'F', 'X') NOT NULL DEFAULT 'X' COMMENT 'M=Masculino, F=Femenino, X=Neutro',
    academicDegree VARCHAR(15) NULL COMMENT 'Ej. Dr., Dra., M. en C., Lic.',
    PRIMARY KEY (idUser),
    CONSTRAINT fk_users_role FOREIGN KEY (roleId) REFERENCES userRoles(idRole)
);

CREATE TABLE admin (
    idAdmin  INT          AUTO_INCREMENT NOT NULL,
    userId   INT          NOT NULL UNIQUE,
    username VARCHAR(25)  NOT NULL,
    password VARCHAR(255) NOT NULL,
    email    VARCHAR(100) NOT NULL UNIQUE,
    PRIMARY KEY (idAdmin),
    CONSTRAINT fk_admin_user FOREIGN KEY (userId) REFERENCES users(idUser) ON DELETE CASCADE
);

CREATE TABLE professors (
    idProfessor     INT         AUTO_INCREMENT NOT NULL,
    userId          INT         NOT NULL UNIQUE,
    ipnRegistration VARCHAR(20) NULL,
    employeeNumber  VARCHAR(20) NOT NULL UNIQUE,
    academicLoad    DOUBLE      NOT NULL,
    availableHours  DOUBLE      NOT NULL,
    programId       INT         NOT NULL,
    statusId        INT         NOT NULL,
    PRIMARY KEY (idProfessor),
    CONSTRAINT fk_professors_user    FOREIGN KEY (userId) REFERENCES users(idUser) ON DELETE CASCADE,
    CONSTRAINT fk_professors_program FOREIGN KEY (programId) REFERENCES programs(idProgram),
    CONSTRAINT fk_professors_status  FOREIGN KEY (statusId) REFERENCES statusCatalog(idStatus)
);

CREATE TABLE students (
    idStudent          INT         AUTO_INCREMENT NOT NULL,
    userId             INT         NOT NULL UNIQUE,
    curp               VARCHAR(18) NOT NULL UNIQUE,
    registration       VARCHAR(35) NOT NULL UNIQUE,
    timeModality       ENUM('TC', 'TP') NOT NULL DEFAULT 'TC' COMMENT 'TC = Tiempo Completo, TP = Tiempo Parcial',
    programId          INT         NOT NULL,
    localTutorId       INT         NOT NULL,
    academicDirectorId INT         NOT NULL,
    enrollmentCycleId  INT         NOT NULL,
    semester           INT         NOT NULL,
    statusId           INT         NOT NULL,
    PRIMARY KEY (idStudent),
    CONSTRAINT fk_students_user     FOREIGN KEY (userId) REFERENCES users(idUser) ON DELETE CASCADE,
    CONSTRAINT fk_students_program  FOREIGN KEY (programId) REFERENCES programs(idProgram),
    CONSTRAINT fk_students_tutor    FOREIGN KEY (localTutorId) REFERENCES users(idUser),
    CONSTRAINT fk_students_director FOREIGN KEY (academicDirectorId) REFERENCES professors(idProfessor),
    CONSTRAINT fk_students_cycle    FOREIGN KEY (enrollmentCycleId) REFERENCES schoolCycles(idCycle),
    CONSTRAINT fk_students_status   FOREIGN KEY (statusId) REFERENCES statusCatalog(idStatus)
);

CREATE TABLE reenrollments (
    idReenrollment     INT AUTO_INCREMENT NOT NULL,
    studentId          INT NOT NULL,
    cycleId            INT NOT NULL,
    advisorId          INT NOT NULL,
    academicDirectorId INT NOT NULL,
    PRIMARY KEY (idReenrollment),
    CONSTRAINT uq_reenrollment_cycle UNIQUE (studentId, cycleId),
    CONSTRAINT fk_reenroll_student   FOREIGN KEY (studentId) REFERENCES students(idStudent),
    CONSTRAINT fk_reenroll_cycle     FOREIGN KEY (cycleId) REFERENCES schoolCycles(idCycle),
    CONSTRAINT fk_reenroll_advisor   FOREIGN KEY (advisorId) REFERENCES professors(idProfessor),
    CONSTRAINT fk_reenroll_director  FOREIGN KEY (academicDirectorId) REFERENCES professors(idProfessor)
);

-- ========================================================
-- 3. MATERIAS, GRUPOS Y ESTANCIAS
-- ========================================================

CREATE TABLE subjects (
    idSubject   INT           AUTO_INCREMENT NOT NULL,
    name        VARCHAR(60)   NOT NULL UNIQUE,
    subjectKey  VARCHAR(20)   NOT NULL UNIQUE,
    credits     DECIMAL(4,2)  NOT NULL COMMENT 'Ej. 1.00, 3.00 para formato SATCA',
    semester    INT           NOT NULL DEFAULT 1 COMMENT 'Semestre al que pertenece la materia',
    topics      TEXT          NOT NULL,
    isDeleted   BOOL          DEFAULT 0,
    PRIMARY KEY (idSubject)
);

CREATE TABLE studyGroups (
    idGroup      INT         AUTO_INCREMENT NOT NULL,
    groupKey     VARCHAR(20) NOT NULL UNIQUE,
    subjectId    INT         NOT NULL,
    campus       VARCHAR(50) NOT NULL DEFAULT 'CICATA MORELOS' COMMENT 'Sede: ENCB, UPIBI, etc.',
    place        VARCHAR(50) NOT NULL,
    schedule     VARCHAR(50) NULL,
    professorId  INT         NOT NULL,
    cycleId      INT         NOT NULL,
    observations VARCHAR(255) NULL,
    PRIMARY KEY (idGroup),
    CONSTRAINT fk_groups_subject   FOREIGN KEY (subjectId) REFERENCES subjects(idSubject),
    CONSTRAINT fk_groups_professor FOREIGN KEY (professorId) REFERENCES professors(idProfessor),
    CONSTRAINT fk_groups_cycle     FOREIGN KEY (cycleId) REFERENCES schoolCycles(idCycle)
);

CREATE TABLE groupVisitingProfessors (
    idGroupVisitor INT    AUTO_INCREMENT NOT NULL,
    groupId        INT    NOT NULL,
    professorId    INT    NOT NULL,
    assignedHours  DOUBLE NOT NULL,
    PRIMARY KEY (idGroupVisitor),
    CONSTRAINT uq_gvp_group_professor UNIQUE (groupId, professorId),
    CONSTRAINT fk_gvp_group     FOREIGN KEY (groupId) REFERENCES studyGroups(idGroup),
    CONSTRAINT fk_gvp_professor FOREIGN KEY (professorId) REFERENCES professors(idProfessor)
);

CREATE TABLE studentsInGroups (
    idEnrollment INT         AUTO_INCREMENT NOT NULL,
    studentId    INT         NOT NULL,
    groupId      INT         NOT NULL,
    grade        VARCHAR(5)  NULL COMMENT 'Número ej. 10 o letras ej. AC',
    recordFolio  VARCHAR(30) NULL COMMENT 'Folio del acta ej. 25AM018',
    termType     VARCHAR(10) NULL COMMENT 'Plazo ej. TC',
    PRIMARY KEY (idEnrollment),
    CONSTRAINT uq_student_group UNIQUE (studentId, groupId),
    CONSTRAINT fk_sig_student FOREIGN KEY (studentId) REFERENCES students(idStudent),
    CONSTRAINT fk_sig_group   FOREIGN KEY (groupId) REFERENCES studyGroups(idGroup)
);

CREATE TABLE studentProjects (
    idProject         INT AUTO_INCREMENT NOT NULL,
    studentId         INT NOT NULL,
    advisorId         INT NOT NULL,
    originInstitution VARCHAR(100) NULL COMMENT 'Ej. Instituto Tecnológico de Zacatepec',
    originCareer      VARCHAR(100) NULL COMMENT 'Ej. Ingeniería Bioquímica',
    projectType       ENUM('Residencia Profesional', 'Servicio Social', 'Estancia Tecnológica') NOT NULL,
    projectName       TEXT NOT NULL,
    totalHours        INT NOT NULL,
    startDate         DATE NOT NULL,
    endDate           DATE NOT NULL,
    PRIMARY KEY (idProject),
    CONSTRAINT fk_sp_student FOREIGN KEY (studentId) REFERENCES students(idStudent),
    CONSTRAINT fk_sp_advisor FOREIGN KEY (advisorId) REFERENCES professors(idProfessor)
);

-- ========================================================
-- 4. DOCUMENTOS, FORMATOS Y FOLIOS HISTÓRICOS
-- ========================================================

CREATE TABLE docTypes (
    idDocType INT         AUTO_INCREMENT NOT NULL,
    name      VARCHAR(80) NOT NULL UNIQUE,
    target    ENUM('professor','student') NOT NULL,
    PRIMARY KEY (idDocType)
);

CREATE TABLE docFormats (
    idFormat   INT         AUTO_INCREMENT NOT NULL,
    docTypeId  INT         NOT NULL,
    year       YEAR        NOT NULL,
    mimeType   VARCHAR(50) NOT NULL,
    format     LONGBLOB    NOT NULL,
    uploadedAt DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idFormat),
    CONSTRAINT uq_format_type_year UNIQUE (docTypeId, year),
    CONSTRAINT fk_df_doctype FOREIGN KEY (docTypeId) REFERENCES docTypes(idDocType)
);

CREATE TABLE docFolios (
    idFolio        INT         AUTO_INCREMENT NOT NULL,
    professorId    INT         NOT NULL,
    docTypeId      INT         NOT NULL,
    studentId      INT         NULL,
    cycleId        INT         NOT NULL,
    folioNumber    INT         NOT NULL,
    fullFolio      VARCHAR(60) NOT NULL UNIQUE,
    signatoryTitle VARCHAR(100) NOT NULL COMMENT 'Cargo al firmar: Ej. Subdirector Académico',
    elaboratedBy   INT         NULL COMMENT 'Usuario admin/staff que generó el documento',
    reviewedBy     INT         NULL COMMENT 'Usuario admin/staff que revisó el documento',
    ccList         TEXT        NULL COMMENT 'Lista de autoridades en copia (C.c.p.) al momento de emisión',
    issuedAt       DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (idFolio),
    CONSTRAINT fk_folio_professor  FOREIGN KEY (professorId) REFERENCES professors(idProfessor),
    CONSTRAINT fk_folio_doctype    FOREIGN KEY (docTypeId) REFERENCES docTypes(idDocType),
    CONSTRAINT fk_folio_student    FOREIGN KEY (studentId) REFERENCES students(idStudent),
    CONSTRAINT fk_folio_cycle      FOREIGN KEY (cycleId) REFERENCES schoolCycles(idCycle),
    CONSTRAINT fk_folio_elaborated FOREIGN KEY (elaboratedBy) REFERENCES users(idUser),
    CONSTRAINT fk_folio_reviewed   FOREIGN KEY (reviewedBy) REFERENCES users(idUser)
);

CREATE TABLE letterheadConfig (
    id              INT          NOT NULL DEFAULT 1,
    logoHeader      MEDIUMBLOB   NULL COMMENT 'PNG/JPG of header-left logo',
    topRight        MEDIUMBLOB   NULL COMMENT 'PNG/JPG of top-right decoration',
    footerBottom    MEDIUMBLOB   NULL COMMENT 'PNG/JPG of footer-left image',
    headerBarColor  VARCHAR(7)   NOT NULL DEFAULT '#8B1832' COMMENT 'Hex color for footer line',
    accentColor     VARCHAR(7)   NOT NULL DEFAULT '#591020' COMMENT 'Hex color for footer text',
    updatedAt       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT ck_singleton CHECK (id = 1)
);

INSERT INTO letterheadConfig (id) VALUES (1);

-- ========================================================
-- 5. TRIGGERS Y EVENT SCHEDULER
-- ========================================================

DELIMITER $$

-- Trigger: Límite de profesores visitantes
CREATE TRIGGER trg_max_visitors_before_insert
BEFORE INSERT ON groupVisitingProfessors
FOR EACH ROW
BEGIN
    DECLARE v_count INT;
    SELECT COUNT(*) INTO v_count FROM groupVisitingProfessors WHERE groupId = NEW.groupId;
    IF v_count >= 4 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'No se pueden asignar más de 4 profesores visitantes por grupo.';
    END IF;
END$$

-- Trigger: Descuento de horas al asignar
CREATE TRIGGER trg_deduct_hours_on_assign
AFTER INSERT ON groupVisitingProfessors
FOR EACH ROW
BEGIN
    UPDATE professors SET availableHours = availableHours - NEW.assignedHours WHERE idProfessor = NEW.professorId;
END$$

-- Trigger: Restauración de horas al eliminar
CREATE TRIGGER trg_restore_hours_on_remove
AFTER DELETE ON groupVisitingProfessors
FOR EACH ROW
BEGIN
    UPDATE professors SET availableHours = availableHours + OLD.assignedHours WHERE idProfessor = OLD.professorId;
END$$

-- Activar Event Scheduler a nivel global
SET GLOBAL event_scheduler = ON$$

-- Evento Automático: Cambiar de INSCRITO a ACTIVO cuando inicia el ciclo
CREATE EVENT IF NOT EXISTS evt_actualizar_alumnos_activos
ON SCHEDULE EVERY 1 DAY STARTS (CURRENT_DATE + INTERVAL 1 DAY)
DO
BEGIN
    UPDATE students s
    JOIN schoolCycles sc ON s.enrollmentCycleId = sc.idCycle
    SET s.statusId = (SELECT idStatus FROM statusCatalog WHERE type = 'ACTIVO')
    WHERE s.statusId = (SELECT idStatus FROM statusCatalog WHERE type = 'INSCRITO')
      AND CURDATE() >= sc.startDate
      AND CURDATE() <= sc.endDate;
END$$

DELIMITER ;