// Automated department routing based on civic problem category

export const DEPARTMENT_MAPPING = {
  pothole: {
    department: 'Road Maintenance',
    code: 'ROAD',
    sla_hours: 48,
    priority_baseline: 'HIGH'
  },
  garbage: {
    department: 'Sanitation Department',
    code: 'SANI',
    sla_hours: 24,
    priority_baseline: 'MEDIUM'
  },
  streetlight: {
    department: 'Electrical Department',
    code: 'ELEC',
    sla_hours: 36,
    priority_baseline: 'MEDIUM'
  },
  water_leak: {
    department: 'Water Supply Department',
    code: 'WATR',
    sla_hours: 12,
    priority_baseline: 'HIGH'
  },
  drainage: {
    department: 'Drainage Department',
    code: 'DRAN',
    sla_hours: 24,
    priority_baseline: 'HIGH'
  },
  fallen_tree: {
    department: 'Disaster & Forest',
    code: 'TREE',
    sla_hours: 8,
    priority_baseline: 'CRITICAL'
  },
  traffic_signal: {
    department: 'Traffic Management',
    code: 'TRAF',
    sla_hours: 12,
    priority_baseline: 'HIGH'
  }
};

export function routeDepartment(category) {
  const norm = (category || '').toLowerCase().trim();
  const info = DEPARTMENT_MAPPING[norm];
  if (info) {
    return info.department;
  }
  return 'Civic Administration';
}
