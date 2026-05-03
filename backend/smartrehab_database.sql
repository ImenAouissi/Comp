-- ============================================================
-- Smart Rehab & Green Center — Base de données MySQL
-- ============================================================
-- COMMENT IMPORTER :
--   1. Ouvrez http://localhost/phpmyadmin
--   2. Cliquez "Nouvelle base de données" → tapez: smartrehab → Créer
--   3. Cliquez sur "smartrehab" dans la liste à gauche
--   4. Cliquez l'onglet "Importer"
--   5. Cliquez "Choisir un fichier" → sélectionnez ce fichier
--   6. Cliquez "Importer" en bas
--   C'est tout ! ✅
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- Créer et utiliser la base
CREATE DATABASE IF NOT EXISTS `smartrehab`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `smartrehab`;

-- ============================================================
-- TABLE: users
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `email`      VARCHAR(255) NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `name`       VARCHAR(255) NOT NULL,
  `role`       VARCHAR(50)  NOT NULL DEFAULT 'staff',
  `active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mot de passe = SHA256 du mot de passe en clair
-- admin123      → SHA256
-- medecin123    → SHA256
-- etc.
INSERT INTO `users` (`email`, `password`, `name`, `role`) VALUES
('admin@smartrehab.tn',    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'Admin Centre',        'admin'),
('khelil@smartrehab.tn',   'cb5c00f334789faa10f6f1cdf0246b8c099bb649565031f1ff5d8b1e344aa762', 'Dr. Sami Khelil',     'medecin'),
('trabelsi@smartrehab.tn', 'fb1549ec668427876d6567d44607845418b75dd11639a2d0a3cbdcf826e878c2', 'Mme. Ines Trabelsi',  'psychologue'),
('bouzid@smartrehab.tn',   '464f5abb37afa755b5eba650303add3cf588343faa19bdee0c7398fc6d700c9e', 'M. Yassine Bouzid',   'formateur'),
('salem@smartrehab.tn',    '777a025f5ca4a20f7bafee940f2820e28e1f4bbcbd9dd774bbce883166ef7c55', 'Coach Maher Salem',   'coach'),
('sfaxi@smartrehab.tn',    '5e38c40ba8ebd51a18e7b5be636b49f70c9aaf1c49e4df4541e5e90a34c998db', 'Mme. Fatma Sfaxi',    'infirmier');

-- ============================================================
-- TABLE: residents
-- ============================================================
DROP TABLE IF EXISTS `residents`;
CREATE TABLE `residents` (
  `id`           INT AUTO_INCREMENT PRIMARY KEY,
  `code`         VARCHAR(20)  NOT NULL UNIQUE,
  `nom`          VARCHAR(100) NOT NULL,
  `prenom`       VARCHAR(100) NOT NULL DEFAULT '',
  `age`          INT,
  `telephone`    VARCHAR(30),
  `status`       VARCHAR(20)  NOT NULL DEFAULT 'actif',
  `pilier`       VARCHAR(30)  NOT NULL DEFAULT 'therapie',
  `progress`     INT          NOT NULL DEFAULT 0,
  `diagnostique` TEXT,
  `objectif`     TEXT,
  `notes`        TEXT,
  `entree`       DATE,
  `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `residents` (`code`,`prenom`,`nom`,`age`,`status`,`pilier`,`progress`,`diagnostique`,`objectif`,`notes`,`entree`) VALUES
('RES-001','Ahmed',   'Bensalem',  24,'actif',   'therapie',  68,'Cannabis modéré, anxiété sociale',        'Sevrage complet et réinsertion','Bonne participation aux groupes','2024-09-12'),
('RES-002','Sarra',   'Mansouri',  21,'actif',   'formation', 45,'Alcool, instabilité professionnelle',     'Sevrage complet et réinsertion','Progresse bien en formation','2024-10-01'),
('RES-003','Youssef', 'Khelifi',   27,'actif',   'sport',     82,'Polyconsommation, faible estime de soi', 'Sevrage complet et réinsertion','Excellent en sport','2024-08-20'),
('RES-004','Nour',    'Triki',     19,'suspendu','therapie',  30,'Cannabis sévère, rupture familiale',      'Sevrage complet et réinsertion','Séance manquée','2024-11-05'),
('RES-005','Amine',   'Riahi',     26,'sorti',   'formation', 95,'Alcool, réinséré en entreprise',          'Sevrage complet et réinsertion','Réintégration réussie','2024-06-14'),
('RES-006','Mariem',  'Gharbi',    23,'actif',   'ecologie',  55,'Anxiété + dépendance benzodiazépines',    'Sevrage complet et réinsertion','Aime jardinage','2024-12-01'),
('RES-007','Khalil',  'Azizi',     31,'actif',   'therapie',  40,'Héroïne, programme méthadone',            'Sevrage complet et réinsertion','Programme méthadone en cours','2025-01-03'),
('RES-008','Fatma',   'Elloumi',   22,'actif',   'sport',     73,'Cannabis + sédentarité',                  'Sevrage complet et réinsertion','Motivée pour le sport','2024-11-20'),
('RES-009','Sofiene', 'Ben Amara', 28,'actif',   'formation', 61,'Alcool professionnel, divorce',           'Sevrage complet et réinsertion','Formation bureautique','2024-10-15'),
('RES-010','Lina',    'Hammami',   20,'actif',   'ecologie',  38,'Dépression + automédication',             'Sevrage complet et réinsertion','Suivie par psychologue','2025-01-10'),
('RES-011','Riadh',   'Chaabane',  35,'actif',   'therapie',  52,'Alcool chronique, hépatite C',            'Sevrage complet et réinsertion','Traitement hépatite en cours','2024-09-28'),
('RES-012','Ines',    'Boughzala', 25,'actif',   'sport',     79,'Cannabis, syndrome anxieux',              'Sevrage complet et réinsertion','Bons résultats sport','2024-12-15');

-- ============================================================
-- TABLE: sessions
-- ============================================================
DROP TABLE IF EXISTS `sessions`;
CREATE TABLE `sessions` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `resident_id` INT         NOT NULL,
  `type`        VARCHAR(50) NOT NULL,
  `praticien`   VARCHAR(100) NOT NULL,
  `date`        DATE        NOT NULL,
  `duration`    INT         NOT NULL DEFAULT 60,
  `notes`       TEXT,
  `status`      VARCHAR(20) NOT NULL DEFAULT 'planifiee',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `sessions` (`resident_id`,`type`,`praticien`,`date`,`duration`,`status`,`notes`) VALUES
(1,'individuelle','Dr. Khelil',   '2025-06-02',60,'realisee','Bonne progression'),
(2,'groupe',      'Mme. Trabelsi','2025-06-03',90,'planifiee',''),
(3,'sport',       'Coach Salem',  '2025-06-04',45,'realisee','Excellente séance'),
(4,'famille',     'Mme. Trabelsi','2025-06-05',60,'planifiee',''),
(5,'formation',   'M. Bouzid',    '2025-06-06',120,'realisee','Module bureautique'),
(6,'individuelle','Dr. Khelil',   '2025-06-07',60,'planifiee',''),
(7,'groupe',      'Mme. Trabelsi','2025-06-08',90,'realisee','Groupe motivé'),
(8,'sport',       'Coach Salem',  '2025-06-09',45,'planifiee',''),
(9,'individuelle','Dr. Khelil',   '2025-06-10',60,'planifiee',''),
(10,'ecologie',   'Mme. Sfaxi',   '2025-06-11',60,'planifiee',''),
(11,'individuelle','Dr. Khelil',  '2025-06-12',60,'realisee','Séance productive'),
(12,'sport',      'Coach Salem',  '2025-06-13',45,'planifiee',''),
(1,'groupe',      'Mme. Trabelsi','2025-05-28',90,'realisee',''),
(3,'individuelle','Dr. Khelil',   '2025-05-25',60,'realisee',''),
(2,'formation',   'M. Bouzid',    '2025-05-20',120,'realisee',''),
(7,'sport',       'Coach Salem',  '2025-05-18',45,'realisee',''),
(6,'individuelle','Dr. Khelil',   '2025-05-15',60,'realisee',''),
(9,'groupe',      'Mme. Trabelsi','2025-05-12',90,'realisee',''),
(11,'sport',      'Coach Salem',  '2025-05-10',45,'realisee',''),
(8,'individuelle','Dr. Khelil',   '2025-05-08',60,'realisee','');

-- ============================================================
-- TABLE: biometrics
-- ============================================================
DROP TABLE IF EXISTS `biometrics`;
CREATE TABLE `biometrics` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `resident_id` INT NOT NULL,
  `device_id`   VARCHAR(50),
  `heart_rate`  FLOAT,
  `temperature` FLOAT,
  `steps`       INT     DEFAULT 0,
  `spo2`        FLOAT,
  `recorded_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `biometrics` (`resident_id`,`device_id`,`heart_rate`,`temperature`,`steps`,`spo2`,`recorded_at`) VALUES
(1,'ESP32-001',72,36.5,450,98.2,'2025-06-13 06:00:00'),
(1,'ESP32-001',75,36.6,620,98.5,'2025-06-13 07:00:00'),
(1,'ESP32-001',138,37.1,150,97.8,'2025-06-13 08:00:00'),
(1,'ESP32-001',80,36.8,800,98.0,'2025-06-13 09:00:00'),
(1,'ESP32-001',78,36.7,950,98.3,'2025-06-13 10:00:00'),
(2,'ESP32-002',68,36.4,500,97.9,'2025-06-13 06:00:00'),
(2,'ESP32-002',70,36.5,700,98.1,'2025-06-13 07:00:00'),
(2,'ESP32-002',72,36.6,850,98.4,'2025-06-13 08:00:00'),
(3,'ESP32-003',65,36.3,1200,98.6,'2025-06-13 06:00:00'),
(3,'ESP32-003',85,36.8,1500,98.5,'2025-06-13 07:00:00'),
(3,'ESP32-003',90,37.0,1800,98.3,'2025-06-13 08:00:00'),
(4,'ESP32-004',88,36.9,200,97.5,'2025-06-13 06:00:00'),
(4,'ESP32-004',92,37.0,180,97.3,'2025-06-13 07:00:00'),
(5,'ESP32-005',70,36.5,600,98.0,'2025-06-13 06:00:00'),
(5,'ESP32-005',72,36.6,750,98.2,'2025-06-13 07:00:00'),
(6,'ESP32-006',67,36.4,400,98.1,'2025-06-13 06:00:00'),
(6,'ESP32-006',69,36.5,350,98.0,'2025-06-13 07:00:00'),
(7,'ESP32-007',42,36.2,50, 96.5,'2025-06-13 06:00:00'),
(7,'ESP32-007',58,36.4,120,97.0,'2025-06-13 07:00:00'),
(7,'ESP32-007',65,36.6,200,97.5,'2025-06-13 08:00:00'),
(8,'ESP32-008',74,36.6,900,98.3,'2025-06-13 06:00:00'),
(8,'ESP32-008',80,36.8,1100,98.4,'2025-06-13 07:00:00'),
(9,'ESP32-009',71,36.5,550,98.0,'2025-06-13 06:00:00'),
(9,'ESP32-009',73,36.6,700,98.2,'2025-06-13 07:00:00'),
(10,'ESP32-010',66,36.3,80, 97.8,'2025-06-13 06:00:00'),
(10,'ESP32-010',68,36.4,50, 97.9,'2025-06-13 07:00:00'),
(11,'ESP32-011',76,36.7,350,98.0,'2025-06-13 06:00:00'),
(11,'ESP32-011',78,36.8,400,98.1,'2025-06-13 07:00:00'),
(12,'ESP32-012',73,36.6,850,98.3,'2025-06-13 06:00:00'),
(12,'ESP32-012',77,36.7,950,98.4,'2025-06-13 07:00:00');

-- ============================================================
-- TABLE: alerts
-- ============================================================
DROP TABLE IF EXISTS `alerts`;
CREATE TABLE `alerts` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `resident_id` INT,
  `type`        VARCHAR(50) NOT NULL,
  `severity`    VARCHAR(20) NOT NULL DEFAULT 'medium',
  `message`     TEXT        NOT NULL,
  `resolved`    TINYINT(1)  NOT NULL DEFAULT 0,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`resident_id`) REFERENCES `residents`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `alerts` (`resident_id`,`type`,`severity`,`message`,`resolved`) VALUES
(1,'heart_rate','high',  'RES-001 Ahmed Bensalem : Rythme cardiaque élevé 138 bpm',0),
(7,'heart_rate','high',  'RES-007 Khalil Azizi : Rythme cardiaque bas 42 bpm',0),
(10,'inactivite','medium','RES-010 Lina Hammami : Inactivité détectée depuis 4h',0),
(4,'absence',   'medium','RES-004 Nour Triki : Séance manquée sans justification',0),
(3,'heart_rate','low',   'RES-003 Youssef Khelifi : Valeur normalisée — surveillance levée',1);

-- ============================================================
-- TABLE: notifications
-- ============================================================
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `title`      VARCHAR(255) NOT NULL,
  `body`       TEXT         NOT NULL,
  `type`       VARCHAR(30)  NOT NULL DEFAULT 'info',
  `target_uid` INT,
  `read`       TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `notifications` (`title`,`body`,`type`,`read`) VALUES
('Alerte IoT détectée',  'RES-001 : rythme cardiaque élevé (138 bpm)','alert',  0),
('Nouvelle séance',       'RES-003 : yoga planifié demain 09:00',       'info',   0),
('Résident admis',        'Dossier RES-012 créé avec succès',           'success',1),
('Rapport mensuel',       'Le rapport de juin est disponible',          'info',   1);

-- ============================================================
-- TABLE: formations
-- ============================================================
DROP TABLE IF EXISTS `formations`;
CREATE TABLE `formations` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `titre`      VARCHAR(255) NOT NULL,
  `formateur`  VARCHAR(100) NOT NULL,
  `places`     INT          NOT NULL DEFAULT 15,
  `inscrits`   INT          NOT NULL DEFAULT 0,
  `statut`     VARCHAR(20)  NOT NULL DEFAULT 'actif',
  `debut`      DATE         NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `formations` (`titre`,`formateur`,`places`,`inscrits`,`statut`,`debut`) VALUES
('Bureautique & MS Office',  'M. Bouzid',    15,12,'actif',    '2025-01-06'),
('Design graphique (Canva)', 'Mme. Ghorbel', 12, 8,'actif',    '2025-01-08'),
('Poterie & céramique',      'M. Chaabane',  10,10,'actif',    '2024-12-15'),
('Couture & textile',        'Mme. Sfaxi',   10, 7,'actif',    '2025-01-10'),
('Entrepreneuriat social',   'M. Ben Ali',   20,14,'planifiee','2025-02-01'),
('Développement web',        'Mme. Ghorbel', 12, 0,'planifiee','2025-02-15');

-- ============================================================
-- TABLE: registrations
-- ============================================================
DROP TABLE IF EXISTS `registrations`;
CREATE TABLE `registrations` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `nom`         VARCHAR(100) NOT NULL,
  `prenom`      VARCHAR(100) NOT NULL,
  `email`       VARCHAR(255) NOT NULL,
  `telephone`   VARCHAR(30),
  `age`         INT,
  `type`        VARCHAR(20)  NOT NULL DEFAULT 'resident',
  `role`        VARCHAR(50),
  `situation`   TEXT,
  `message`     TEXT,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'en_attente',
  `reviewed_by` INT,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `registrations` (`nom`,`prenom`,`email`,`telephone`,`age`,`type`,`role`,`situation`,`message`,`status`) VALUES
('Ben Salah','Omar',   'omar.bensalah@gmail.com','+216 22 111 222',23,'resident','','Cannabis depuis 3 ans',  'Je veux m en sortir.',         'en_attente'),
('Mejri',   'Nadia',  'nadia.mejri@gmail.com',  '+216 55 333 444',20,'resident','','Dépendance médicaments',  'J ai besoin d aide urgente.',  'en_attente'),
('Haddad',  'Karim',  'karim.haddad@gmail.com', '+216 98 555 666',29,'resident','','Alcool, problèmes pro',   'Prêt à changer.',              'en_attente'),
('Gharbi',  'Fatma',  'fatma.gharbi2@gmail.com','+216 22 444 888',25,'resident','','Benzodiazépines',         'Recommandée par médecin.',     'approuve'),
('Hmidi',   'Zied',   'zied.hmidi@gmail.com',   '+216 55 000 111',27,'resident','','Cannabis + inactivité',   '',                             'refuse'),
('Nasr',    'Sonia',  'sonia.nasr@gmail.com',   '+216 71 222 333',38,'staff',   'psychologue','','Psychologue 10 ans expérience.', 'en_attente');

-- ============================================================
-- TABLE: activity_logs
-- ============================================================
DROP TABLE IF EXISTS `activity_logs`;
CREATE TABLE `activity_logs` (
  `id`          INT AUTO_INCREMENT PRIMARY KEY,
  `user_id`     INT,
  `action`      VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50)  NOT NULL,
  `entity_id`   INT,
  `details`     TEXT,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `activity_logs` (`user_id`,`action`,`entity_type`,`entity_id`,`details`) VALUES
(1,'CREATE','resident',1,'Création dossier RES-001 Ahmed Bensalem'),
(1,'CREATE','resident',2,'Création dossier RES-002 Sarra Mansouri'),
(2,'CREATE','session', 1,'Séance individuelle RES-001 planifiée'),
(3,'UPDATE','resident',1,'Mise à jour progression RES-001 : 68%'),
(1,'APPROVE','registration',4,'Approbation Fatma Gharbi'),
(2,'CREATE','session', 3,'Séance sport RES-003 réalisée');

-- ============================================================
-- TABLE: messages
-- ============================================================
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id`         INT AUTO_INCREMENT PRIMARY KEY,
  `from_uid`   INT NOT NULL,
  `to_uid`     INT,
  `subject`    VARCHAR(255) NOT NULL DEFAULT '',
  `body`       TEXT         NOT NULL,
  `read`       TINYINT(1)   NOT NULL DEFAULT 0,
  `thread_id`  INT,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`from_uid`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `messages` (`from_uid`,`to_uid`,`subject`,`body`,`read`) VALUES
(2,1,'Point hebdomadaire',     'Bonjour,\n\nRES-001 montre une bonne progression cette semaine. Participation aux groupes notable.\n\nDr. Khelil',0),
(3,1,'Demande consultation',   'Bonjour,\n\nRES-004 présente des signes d anxiété accrus. Consultation urgente nécessaire.\n\nMme. Trabelsi',0),
(1,2,'Re: Point hebdomadaire', 'Merci. Je valide la progression de RES-001. Continuez.\n\nAdmin',1),
(5,NULL,'Rappel réunion équipe','Réunion vendredi à 14h en salle de formation. Présence obligatoire.\n\nCoach Salem',0);

-- ============================================================
-- Vérification finale
-- ============================================================
SELECT 'users'         AS `table`, COUNT(*) AS `lignes` FROM `users`
UNION ALL
SELECT 'residents',    COUNT(*) FROM `residents`
UNION ALL
SELECT 'sessions',     COUNT(*) FROM `sessions`
UNION ALL
SELECT 'biometrics',   COUNT(*) FROM `biometrics`
UNION ALL
SELECT 'alerts',       COUNT(*) FROM `alerts`
UNION ALL
SELECT 'formations',   COUNT(*) FROM `formations`
UNION ALL
SELECT 'registrations',COUNT(*) FROM `registrations`
UNION ALL
SELECT 'messages',     COUNT(*) FROM `messages`;

-- ============================================================
-- ✅ Import terminé !
-- Connectez-vous avec : admin@smartrehab.tn / admin123
-- ============================================================
