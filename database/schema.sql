-- ============================================================
-- AI CivicFix - PostgreSQL Database Schema
-- Production Schema for Civic Problem Reporting & Resolution
-- ============================================================

-- Create Enums
CREATE TYPE user_role AS ENUM ('CITIZEN', 'ADMIN', 'OFFICER', 'WORKER');

CREATE TYPE complaint_status AS ENUM (
  'REPORTED',
  'AI_VERIFIED',
  'ASSIGNED',
  'IN_PROGRESS',
  'RESOLVED',
  'VERIFIED',
  'REOPENED'
);

CREATE TYPE complaint_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE civic_category AS ENUM (
  'pothole',
  'garbage',
  'streetlight',
  'water_leak',
  'drainage',
  'fallen_tree',
  'traffic_signal'
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'CITIZEN',
  phone VARCHAR(32),
  department VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  lead_officer_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  contact_email VARCHAR(160),
  active_workers INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  category civic_category NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  resolution_image_url TEXT,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  address VARCHAR(255) NOT NULL,
  zone VARCHAR(100),
  
  -- AI & Priority Engines
  severity complaint_severity NOT NULL DEFAULT 'MEDIUM',
  severity_score INT NOT NULL DEFAULT 50,
  priority_score INT NOT NULL DEFAULT 50,
  priority_breakdown JSONB, -- { severity_weight, traffic_weight, reports_weight, location_weight }
  
  -- Workflow Status Pipeline
  status complaint_status NOT NULL DEFAULT 'REPORTED',
  department VARCHAR(100) NOT NULL,
  assigned_to VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  assigned_worker_name VARCHAR(120),
  
  -- AI Metadata
  ai_detection_meta JSONB, -- { confidence, bounding_boxes, detected_classes, model }
  ai_verification_meta JSONB, -- { verified: bool, resolution_confidence: float, notes }
  
  -- Citizen Confirmation
  citizen_feedback JSONB, -- { confirmed: bool, satisfaction: int, comment: text, timestamp }
  
  -- Flags
  is_emergency BOOLEAN DEFAULT FALSE,
  nearby_reports_count INT DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_complaints_user ON complaints(user_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_category ON complaints(category);
CREATE INDEX idx_complaints_priority ON complaints(priority_score DESC);
CREATE INDEX idx_complaints_department ON complaints(department);
CREATE INDEX idx_complaints_coords ON complaints(latitude, longitude);

-- Timeline / Audit Logs
CREATE TABLE IF NOT EXISTS complaint_logs (
  id VARCHAR(64) PRIMARY KEY,
  complaint_id VARCHAR(64) REFERENCES complaints(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  status_from VARCHAR(50),
  status_to VARCHAR(50),
  performed_by_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  performed_by_name VARCHAR(120),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_complaint ON complaint_logs(complaint_id);

-- In-app Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
  complaint_id VARCHAR(64) REFERENCES complaints(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'INFO',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
