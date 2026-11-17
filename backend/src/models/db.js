import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, '../../data/civicfix.json');

// Initialize database with realistic seed data if not present
function initializeDatabase() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      if (data && data.users && data.complaints) {
        return data;
      }
    } catch (err) {
      console.warn('Corrupt DB file found, re-initializing...', err.message);
    }
  }

  // Generate password hashes for demo accounts (password: citizen123, admin123, worker123)
  const salt = bcrypt.genSaltSync(10);
  const citizenHash = bcrypt.hashSync('citizen123', salt);
  const adminHash = bcrypt.hashSync('admin123', salt);
  const workerHash = bcrypt.hashSync('worker123', salt);

  const initialData = {
    users: [
      {
        id: 'usr-admin-1',
        name: 'Dr. Sarah Mukherjee (Municipal Commissioner)',
        email: 'admin@civicfix.org',
        password_hash: adminHash,
        role: 'ADMIN',
        phone: '+91 98765 43210',
        department: 'Civic Administration',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'usr-citizen-1',
        name: 'Aarav Sharma',
        email: 'citizen@civicfix.org',
        password_hash: citizenHash,
        role: 'CITIZEN',
        phone: '+91 91234 56789',
        department: null,
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        created_at: new Date(Date.now() - 15 * 86400000).toISOString()
      },
      {
        id: 'usr-worker-1',
        name: 'Rajesh Verma (Road Crew Lead)',
        email: 'worker@civicfix.org',
        password_hash: workerHash,
        role: 'WORKER',
        phone: '+91 97890 12345',
        department: 'Road Maintenance',
        avatar_url: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString()
      },
      {
        id: 'usr-worker-2',
        name: 'Sunita Das (Sanitation Supervisor)',
        email: 'sanitation.worker@civicfix.org',
        password_hash: workerHash,
        role: 'WORKER',
        phone: '+91 94321 09876',
        department: 'Sanitation Department',
        avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
        created_at: new Date(Date.now() - 18 * 86400000).toISOString()
      },
      {
        id: 'usr-worker-3',
        name: 'Manoj Patra (Electrical Tech)',
        email: 'electrical.worker@civicfix.org',
        password_hash: workerHash,
        role: 'WORKER',
        phone: '+91 93456 78901',
        department: 'Electrical Department',
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        created_at: new Date(Date.now() - 12 * 86400000).toISOString()
      }
    ],

    departments: [
      { id: 'dept-1', name: 'Road Maintenance', code: 'ROAD', lead: 'Rajesh Verma', active_workers: 14, total_resolved: 420 },
      { id: 'dept-2', name: 'Sanitation Department', code: 'SANI', lead: 'Sunita Das', active_workers: 22, total_resolved: 680 },
      { id: 'dept-3', name: 'Electrical Department', code: 'ELEC', lead: 'Manoj Patra', active_workers: 9, total_resolved: 245 },
      { id: 'dept-4', name: 'Water Supply Department', code: 'WATR', lead: 'Alok Jena', active_workers: 11, total_resolved: 190 },
      { id: 'dept-5', name: 'Drainage Department', code: 'DRAN', lead: 'Priyanka Roy', active_workers: 8, total_resolved: 160 },
      { id: 'dept-6', name: 'Disaster & Forest', code: 'TREE', lead: 'Kailash Sahu', active_workers: 6, total_resolved: 85 },
      { id: 'dept-7', name: 'Traffic Management', code: 'TRAF', lead: 'Inspector Pradhan', active_workers: 12, total_resolved: 310 }
    ],

    complaints: [
      {
        id: 'CF-1024',
        user_id: 'usr-citizen-1',
        reporter_name: 'Aarav Sharma',
        category: 'pothole',
        description: 'Large deep pothole spanning 1.5 meters near the college campus entrance. Multiple two-wheelers skidding.',
        image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
        resolution_image_url: null,
        latitude: 20.2961,
        longitude: 85.8245,
        address: 'Near College Road, Jayadev Vihar, Bhubaneswar, Odisha',
        zone: 'North Central - Ward 14',
        severity: 'HIGH',
        severity_score: 90,
        traffic_level: 'HIGH',
        traffic_score: 85,
        nearby_reports_count: 17,
        location_importance: 'HIGH',
        location_score: 95,
        priority_score: 89,
        priority_breakdown: {
          severity_contrib: 36.0,
          traffic_contrib: 21.25,
          reports_contrib: 18.0,
          location_contrib: 14.25
        },
        status: 'IN_PROGRESS',
        department: 'Road Maintenance',
        assigned_to: 'usr-worker-1',
        assigned_worker_name: 'Rajesh Verma (Road Crew Lead)',
        is_emergency: false,
        ai_detection_meta: {
          category: 'pothole',
          confidence: 0.94,
          severity: 'HIGH',
          bounding_boxes: [
            { label: 'pothole', confidence: 0.94, box: [0.35, 0.22, 0.78, 0.81] }
          ],
          model: 'YOLOv8-Civic-v2'
        },
        ai_verification_meta: null,
        citizen_feedback: null,
        created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 6 * 3600000).toISOString(),
        resolved_at: null
      },
      {
        id: 'CF-1025',
        user_id: 'usr-citizen-1',
        reporter_name: 'Aarav Sharma',
        category: 'garbage',
        description: 'Overflowing commercial dumpster blocking sidewalk and spreading stench near community park.',
        image_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800',
        resolution_image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
        latitude: 20.3012,
        longitude: 85.8198,
        address: 'Plot 44, Acharya Vihar Main Road, Bhubaneswar',
        zone: 'Central - Ward 9',
        severity: 'MEDIUM',
        severity_score: 65,
        traffic_level: 'MEDIUM',
        traffic_score: 60,
        nearby_reports_count: 8,
        location_importance: 'MEDIUM',
        location_score: 70,
        priority_score: 65,
        priority_breakdown: {
          severity_contrib: 26.0,
          traffic_contrib: 15.0,
          reports_contrib: 14.0,
          location_contrib: 10.5
        },
        status: 'RESOLVED',
        department: 'Sanitation Department',
        assigned_to: 'usr-worker-2',
        assigned_worker_name: 'Sunita Das (Sanitation Supervisor)',
        is_emergency: false,
        ai_detection_meta: {
          category: 'garbage',
          confidence: 0.91,
          severity: 'MEDIUM',
          bounding_boxes: [
            { label: 'garbage_pile', confidence: 0.91, box: [0.2, 0.15, 0.85, 0.85] }
          ],
          model: 'YOLOv8-Civic-v2'
        },
        ai_verification_meta: {
          verified: true,
          resolution_confidence: 0.93,
          defect_cleared: true,
          notes: 'AI verified: Area cleaned and waste container cleared. 0 garbage detected.'
        },
        citizen_feedback: null, // waiting for citizen confirmation
        created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        resolved_at: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: 'CF-1026',
        user_id: 'usr-citizen-1',
        reporter_name: 'Aarav Sharma',
        category: 'water_leak',
        description: 'Major underground pipe burst. Clean drinking water flooding street into residential apartments.',
        image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800',
        resolution_image_url: null,
        latitude: 20.3155,
        longitude: 85.8234,
        address: 'Near Nalco Square, Chandrasekharpur, Bhubaneswar',
        zone: 'North Zone - Ward 18',
        severity: 'CRITICAL',
        severity_score: 95,
        traffic_level: 'HIGH',
        traffic_score: 80,
        nearby_reports_count: 24,
        location_importance: 'HIGH',
        location_score: 90,
        priority_score: 93,
        priority_breakdown: {
          severity_contrib: 38.0,
          traffic_contrib: 20.0,
          reports_contrib: 20.0,
          location_contrib: 13.5
        },
        status: 'AI_VERIFIED',
        department: 'Water Supply Department',
        assigned_to: null,
        assigned_worker_name: null,
        is_emergency: true,
        ai_detection_meta: {
          category: 'water_leak',
          confidence: 0.96,
          severity: 'CRITICAL',
          bounding_boxes: [
            { label: 'water_leak', confidence: 0.96, box: [0.25, 0.18, 0.9, 0.88] }
          ],
          model: 'YOLOv8-Civic-v2'
        },
        ai_verification_meta: null,
        citizen_feedback: null,
        created_at: new Date(Date.now() - 12 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 11 * 3600000).toISOString(),
        resolved_at: null
      },
      {
        id: 'CF-1027',
        user_id: 'usr-citizen-1',
        reporter_name: 'Aarav Sharma',
        category: 'streetlight',
        description: 'Dark junction due to 3 continuous broken streetlights. Safety hazard for pedestrians at night.',
        image_url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
        resolution_image_url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
        latitude: 20.2889,
        longitude: 85.8391,
        address: 'Saheed Nagar Market Junction, Bhubaneswar',
        zone: 'East Zone - Ward 32',
        severity: 'MEDIUM',
        severity_score: 70,
        traffic_level: 'MEDIUM',
        traffic_score: 70,
        nearby_reports_count: 9,
        location_importance: 'HIGH',
        location_score: 85,
        priority_score: 74,
        priority_breakdown: {
          severity_contrib: 28.0,
          traffic_contrib: 17.5,
          reports_contrib: 15.5,
          location_contrib: 12.75
        },
        status: 'VERIFIED',
        department: 'Electrical Department',
        assigned_to: 'usr-worker-3',
        assigned_worker_name: 'Manoj Patra (Electrical Tech)',
        is_emergency: false,
        ai_detection_meta: {
          category: 'streetlight',
          confidence: 0.89,
          severity: 'MEDIUM',
          bounding_boxes: [
            { label: 'streetlight_damaged', confidence: 0.89, box: [0.1, 0.3, 0.9, 0.6] }
          ],
          model: 'YOLOv8-Civic-v2'
        },
        ai_verification_meta: {
          verified: true,
          resolution_confidence: 0.95,
          defect_cleared: true,
          notes: 'Luminaire replaced and powered on successfully.'
        },
        citizen_feedback: {
          confirmed: true,
          satisfaction: 5,
          comment: 'Fixed within 24 hours! Lights are working brightly now.',
          submitted_at: new Date(Date.now() - 10 * 3600000).toISOString()
        },
        created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 10 * 3600000).toISOString(),
        resolved_at: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        id: 'CF-1028',
        user_id: 'usr-citizen-1',
        reporter_name: 'Aarav Sharma',
        category: 'fallen_tree',
        description: 'Large banyan branch snapped across 2 lanes of traffic following heavy thunderstorm winds.',
        image_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        resolution_image_url: null,
        latitude: 20.3088,
        longitude: 85.8312,
        address: 'Forest Park Road, Unit 1, Bhubaneswar',
        zone: 'Central West - Ward 21',
        severity: 'CRITICAL',
        severity_score: 95,
        traffic_level: 'SEVERE',
        traffic_score: 95,
        nearby_reports_count: 31,
        location_importance: 'CRITICAL',
        location_score: 90,
        priority_score: 94,
        priority_breakdown: {
          severity_contrib: 38.0,
          traffic_contrib: 23.75,
          reports_contrib: 20.0,
          location_contrib: 13.5
        },
        status: 'ASSIGNED',
        department: 'Disaster & Forest',
        assigned_to: 'usr-worker-1',
        assigned_worker_name: 'Rajesh Verma (Road Crew Lead)',
        is_emergency: true,
        ai_detection_meta: {
          category: 'fallen_tree',
          confidence: 0.97,
          severity: 'CRITICAL',
          bounding_boxes: [
            { label: 'fallen_tree_blockage', confidence: 0.97, box: [0.15, 0.1, 0.85, 0.9] }
          ],
          model: 'YOLOv8-Civic-v2'
        },
        ai_verification_meta: null,
        citizen_feedback: null,
        created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        resolved_at: null
      },
      {
        id: 'CF-1029',
        user_id: 'usr-citizen-1',
        reporter_name: 'Aarav Sharma',
        category: 'drainage',
        description: 'Severely choked stormwater canal overflowing filthy water on pedestrian promenade.',
        image_url: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800',
        resolution_image_url: null,
        latitude: 20.3201,
        longitude: 85.8122,
        address: 'Damana Square, Patia Main Road, Bhubaneswar',
        zone: 'North Zone - Ward 6',
        severity: 'HIGH',
        severity_score: 85,
        traffic_level: 'MEDIUM',
        traffic_score: 70,
        nearby_reports_count: 14,
        location_importance: 'HIGH',
        location_score: 80,
        priority_score: 81,
        priority_breakdown: {
          severity_contrib: 34.0,
          traffic_contrib: 17.5,
          reports_contrib: 17.5,
          location_contrib: 12.0
        },
        status: 'REPORTED',
        department: 'Drainage Department',
        assigned_to: null,
        assigned_worker_name: null,
        is_emergency: false,
        ai_detection_meta: {
          category: 'drainage',
          confidence: 0.93,
          severity: 'HIGH',
          bounding_boxes: [
            { label: 'blocked_drain', confidence: 0.93, box: [0.28, 0.2, 0.82, 0.8] }
          ],
          model: 'YOLOv8-Civic-v2'
        },
        ai_verification_meta: null,
        citizen_feedback: null,
        created_at: new Date(Date.now() - 14 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 14 * 3600000).toISOString(),
        resolved_at: null
      },
      {
        id: 'CF-1030',
        user_id: 'usr-citizen-1',
        reporter_name: 'Aarav Sharma',
        category: 'traffic_signal',
        description: 'Traffic light stuck on blinking amber at busy 4-way crossroad causing chaotic gridlock.',
        image_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800',
        resolution_image_url: null,
        latitude: 20.2912,
        longitude: 85.8285,
        address: 'Vani Vihar Flyover Junction, Bhubaneswar',
        zone: 'Central - Ward 11',
        severity: 'HIGH',
        severity_score: 88,
        traffic_level: 'SEVERE',
        traffic_score: 95,
        nearby_reports_count: 22,
        location_importance: 'HIGH',
        location_score: 92,
        priority_score: 91,
        priority_breakdown: {
          severity_contrib: 35.2,
          traffic_contrib: 23.75,
          reports_contrib: 18.5,
          location_contrib: 13.8
        },
        status: 'ASSIGNED',
        department: 'Traffic Management',
        assigned_to: 'usr-worker-3',
        assigned_worker_name: 'Manoj Patra (Electrical Tech)',
        is_emergency: false,
        ai_detection_meta: {
          category: 'traffic_signal',
          confidence: 0.95,
          severity: 'HIGH',
          bounding_boxes: [
            { label: 'traffic_light_malfunction', confidence: 0.95, box: [0.12, 0.35, 0.75, 0.65] }
          ],
          model: 'YOLOv8-Civic-v2'
        },
        ai_verification_meta: null,
        citizen_feedback: null,
        created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
        resolved_at: null
      }
    ],

    complaint_logs: [
      {
        id: 'log-1',
        complaint_id: 'CF-1024',
        action: 'REPORTED',
        status_from: null,
        status_to: 'REPORTED',
        performed_by_name: 'Aarav Sharma (Citizen)',
        notes: 'Complaint submitted with photo and GPS location',
        created_at: new Date(Date.now() - 48 * 3600000).toISOString()
      },
      {
        id: 'log-2',
        complaint_id: 'CF-1024',
        action: 'AI_VERIFICATION',
        status_from: 'REPORTED',
        status_to: 'AI_VERIFIED',
        performed_by_name: 'AI Civic Engine (YOLOv8)',
        notes: 'Pothole detected with 94% confidence, severity classified as HIGH (Priority Score: 89)',
        created_at: new Date(Date.now() - 47 * 3600000).toISOString()
      },
      {
        id: 'log-3',
        complaint_id: 'CF-1024',
        action: 'ASSIGNED',
        status_from: 'AI_VERIFIED',
        status_to: 'ASSIGNED',
        performed_by_name: 'Admin System',
        notes: 'Auto-routed to Road Maintenance, assigned to Rajesh Verma',
        created_at: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        id: 'log-4',
        complaint_id: 'CF-1024',
        action: 'WORK_STARTED',
        status_from: 'ASSIGNED',
        status_to: 'IN_PROGRESS',
        performed_by_name: 'Rajesh Verma (Worker)',
        notes: 'Repair crew dispatched with cold-mix asphalt patch truck',
        created_at: new Date(Date.now() - 6 * 3600000).toISOString()
      }
    ],

    notifications: [
      {
        id: 'notif-1',
        user_id: 'usr-citizen-1',
        complaint_id: 'CF-1025',
        title: 'Problem Resolved! Please Verify',
        message: 'Your report #CF-1025 (Garbage Accumulation) has been resolved by Sanitation Department. Please confirm the fix.',
        type: 'SUCCESS',
        is_read: false,
        created_at: new Date(Date.now() - 4 * 3600000).toISOString()
      },
      {
        id: 'notif-2',
        user_id: 'usr-citizen-1',
        complaint_id: 'CF-1024',
        title: 'Work In Progress',
        message: 'Worker Rajesh Verma has commenced road repair work on #CF-1024 (Pothole at Jayadev Vihar).',
        type: 'INFO',
        is_read: true,
        created_at: new Date(Date.now() - 6 * 3600000).toISOString()
      }
    ]
  };

  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf8');
  return initialData;
}

let dbCache = initializeDatabase();

export const db = {
  get: () => {
    if (!dbCache) dbCache = initializeDatabase();
    return dbCache;
  },

  save: (data) => {
    dbCache = data;
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write to DB file:', err);
    }
  },

  // Helper collections
  users: {
    findByEmail: (email) => {
      const { users } = db.get();
      return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    },
    findById: (id) => {
      const { users } = db.get();
      return users.find((u) => u.id === id);
    },
    insert: (user) => {
      const data = db.get();
      data.users.push(user);
      db.save(data);
      return user;
    },
    listWorkers: (dept = null) => {
      const { users } = db.get();
      return users.filter(
        (u) => (u.role === 'WORKER' || u.role === 'OFFICER') && (!dept || u.department === dept)
      );
    }
  },

  complaints: {
    list: (filters = {}) => {
      let { complaints } = db.get();
      if (filters.status) {
        complaints = complaints.filter((c) => c.status === filters.status);
      }
      if (filters.category) {
        complaints = complaints.filter((c) => c.category === filters.category);
      }
      if (filters.department) {
        complaints = complaints.filter((c) => c.department === filters.department);
      }
      if (filters.user_id) {
        complaints = complaints.filter((c) => c.user_id === filters.user_id);
      }
      if (filters.assigned_to) {
        complaints = complaints.filter((c) => c.assigned_to === filters.assigned_to);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        complaints = complaints.filter(
          (c) =>
            c.id.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
        );
      }
      return complaints.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },

    findById: (id) => {
      const { complaints } = db.get();
      return complaints.find((c) => c.id === id);
    },

    insert: (complaint) => {
      const data = db.get();
      data.complaints.unshift(complaint);
      db.save(data);
      return complaint;
    },

    update: (id, updates) => {
      const data = db.get();
      const idx = data.complaints.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      data.complaints[idx] = {
        ...data.complaints[idx],
        ...updates,
        updated_at: new Date().toISOString()
      };
      db.save(data);
      return data.complaints[idx];
    }
  },

  logs: {
    add: (logEntry) => {
      const data = db.get();
      const entry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString(),
        ...logEntry
      };
      data.complaint_logs.unshift(entry);
      db.save(data);
      return entry;
    },
    getByComplaintId: (complaintId) => {
      const { complaint_logs } = db.get();
      return (complaint_logs || []).filter((l) => l.complaint_id === complaintId);
    }
  },

  notifications: {
    add: (notif) => {
      const data = db.get();
      const entry = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        created_at: new Date().toISOString(),
        is_read: false,
        ...notif
      };
      data.notifications.unshift(entry);
      db.save(data);
      return entry;
    },
    getByUserId: (userId) => {
      const { notifications } = db.get();
      return (notifications || []).filter((n) => n.user_id === userId);
    },
    markRead: (id) => {
      const data = db.get();
      const notif = data.notifications.find((n) => n.id === id);
      if (notif) notif.is_read = true;
      db.save(data);
    }
  },

  departments: {
    list: () => {
      const { departments } = db.get();
      return departments || [];
    }
  }
};
