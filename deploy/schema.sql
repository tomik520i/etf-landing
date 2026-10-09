-- Schéma databáze etf_lp. Spustit jako root MariaDB: sudo mariadb < schema.sql
-- Uživatele s heslem vytváří INSTALL.md (krok 3) – heslo nepatří do souboru v gitu.

CREATE DATABASE IF NOT EXISTS etf_lp CHARACTER SET utf8mb4 COLLATE utf8mb4_czech_ci;
USE etf_lp;

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  consent TINYINT(1) NOT NULL,
  ad_variant CHAR(1),
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB;

-- Odhlášení: DB uživatel smí jen SELECT/INSERT, proto se odhlášení zapisuje jako nový řádek
CREATE TABLE IF NOT EXISTS unsubscribes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_unsub_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  event VARCHAR(50) NOT NULL,
  ad_variant CHAR(1),
  props JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_time (event, created_at),
  INDEX idx_session (session_id)
) ENGINE=InnoDB;
