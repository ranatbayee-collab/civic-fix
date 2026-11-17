-- ============================================================
-- AI CivicFix - Initial PostgreSQL Seed Data
-- ============================================================

INSERT INTO users (id, name, email, password_hash, role, phone, department)
VALUES
  ('usr-admin-1', 'Dr. Sarah Mukherjee', 'admin@civicfix.org', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qH0.6Y9cE5wP7u5x9Yv5FqF5qF5qF5q', 'ADMIN', '+91 98765 43210', 'Civic Administration'),
  ('usr-citizen-1', 'Aarav Sharma', 'citizen@civicfix.org', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qH0.6Y9cE5wP7u5x9Yv5FqF5qF5qF5q', 'CITIZEN', '+91 91234 56789', NULL),
  ('usr-worker-1', 'Rajesh Verma', 'worker@civicfix.org', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qH0.6Y9cE5wP7u5x9Yv5FqF5qF5qF5q', 'WORKER', '+91 97890 12345', 'Road Maintenance'),
  ('usr-worker-2', 'Sunita Das', 'sanitation.worker@civicfix.org', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qH0.6Y9cE5wP7u5x9Yv5FqF5qF5qF5q', 'WORKER', '+91 94321 09876', 'Sanitation Department'),
  ('usr-worker-3', 'Manoj Patra', 'electrical.worker@civicfix.org', '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.qH0.6Y9cE5wP7u5x9Yv5FqF5qF5qF5q', 'WORKER', '+91 93456 78901', 'Electrical Department')
ON CONFLICT (id) DO NOTHING;

INSERT INTO departments (id, name, code, contact_email, active_workers)
VALUES
  ('dept-1', 'Road Maintenance', 'ROAD', 'roads@civicfix.org', 14),
  ('dept-2', 'Sanitation Department', 'SANI', 'sanitation@civicfix.org', 22),
  ('dept-3', 'Electrical Department', 'ELEC', 'electrical@civicfix.org', 9),
  ('dept-4', 'Water Supply Department', 'WATR', 'water@civicfix.org', 11),
  ('dept-5', 'Drainage Department', 'DRAN', 'drainage@civicfix.org', 8),
  ('dept-6', 'Disaster & Forest', 'TREE', 'disaster@civicfix.org', 6),
  ('dept-7', 'Traffic Management', 'TRAF', 'traffic@civicfix.org', 12)
ON CONFLICT (id) DO NOTHING;

INSERT INTO complaints (
  id, user_id, category, description, image_url, resolution_image_url,
  latitude, longitude, address, zone, severity, severity_score, priority_score,
  status, department, assigned_to, assigned_worker_name, is_emergency
)
VALUES
  ('CF-1024', 'usr-citizen-1', 'pothole', 'Large deep pothole spanning 1.5 meters near college campus.', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800', NULL, 20.2961, 85.8245, 'Near College Road, Jayadev Vihar, Bhubaneswar', 'North Central - Ward 14', 'HIGH', 90, 89, 'IN_PROGRESS', 'Road Maintenance', 'usr-worker-1', 'Rajesh Verma', false),
  ('CF-1025', 'usr-citizen-1', 'garbage', 'Overflowing commercial dumpster blocking sidewalk.', 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800', 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800', 20.3012, 85.8198, 'Plot 44, Acharya Vihar Main Road, Bhubaneswar', 'Central - Ward 9', 'MEDIUM', 65, 65, 'RESOLVED', 'Sanitation Department', 'usr-worker-2', 'Sunita Das', false),
  ('CF-1026', 'usr-citizen-1', 'water_leak', 'Underground pipe burst flooding street.', 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800', NULL, 20.3155, 85.8234, 'Near Nalco Square, Chandrasekharpur, Bhubaneswar', 'North Zone - Ward 18', 'CRITICAL', 95, 93, 'AI_VERIFIED', 'Water Supply Department', NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
