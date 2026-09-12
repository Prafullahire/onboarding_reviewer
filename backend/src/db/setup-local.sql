-- Run this once as MySQL root (MySQL Workbench, or: mysql -u root -p)
-- Creates the database and application user for local development without Docker.

CREATE DATABASE IF NOT EXISTS onboarding_reviewer
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'onboarding'@'localhost' IDENTIFIED BY 'onboarding_pass';
GRANT ALL PRIVILEGES ON onboarding_reviewer.* TO 'onboarding'@'localhost';
FLUSH PRIVILEGES;
