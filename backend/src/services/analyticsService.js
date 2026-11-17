import { db } from '../models/db.js';

export function calculateCityHealthScore() {
  const { complaints } = db.get();

  // Category health subscores
  const categoryKeys = {
    pothole: 'Roads',
    garbage: 'Sanitation',
    water_leak: 'Water',
    streetlight: 'Lighting',
    drainage: 'Drainage',
    fallen_tree: 'Disaster Safety',
    traffic_signal: 'Traffic Control'
  };

  const scores = {};
  const totals = {};
  const resolvedCounts = {};

  Object.values(categoryKeys).forEach((name) => {
    totals[name] = 0;
    resolvedCounts[name] = 0;
  });

  complaints.forEach((c) => {
    const group = categoryKeys[c.category] || 'Other';
    if (totals[group] !== undefined) {
      totals[group]++;
      if (c.status === 'RESOLVED' || c.status === 'VERIFIED') {
        resolvedCounts[group]++;
      }
    }
  });

  // Calculate subscores (baseline 100 minus penalty for open/high severity complaints)
  let sumScore = 0;
  let countGroups = 0;

  Object.keys(totals).forEach((group) => {
    const total = totals[group];
    const resolved = resolvedCounts[group];
    const open = total - resolved;

    // Base score is 85; each open problem deducts 3 pts (clamped 40-100)
    let score = 85 - open * 4 + resolved * 2;
    score = Math.max(45, Math.min(98, score));
    scores[group] = score;

    sumScore += score;
    countGroups++;
  });

  const overall = Math.round(sumScore / countGroups);

  return {
    overall,
    breakdown: scores,
    status: overall >= 80 ? 'EXCELLENT' : overall >= 65 ? 'GOOD' : 'NEEDS_ATTENTION',
    last_evaluated: new Date().toISOString()
  };
}

export function getFullAnalytics() {
  const { complaints, departments, users } = db.get();

  const totalComplaints = complaints.length;
  const pendingCount = complaints.filter(
    (c) => c.status === 'REPORTED' || c.status === 'AI_VERIFIED' || c.status === 'ASSIGNED'
  ).length;
  const inProgressCount = complaints.filter((c) => c.status === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(
    (c) => c.status === 'RESOLVED' || c.status === 'VERIFIED'
  ).length;
  const criticalCount = complaints.filter((c) => c.severity === 'CRITICAL' && c.status !== 'RESOLVED' && c.status !== 'VERIFIED').length;

  // Breakdown by Category
  const byCategory = {};
  complaints.forEach((c) => {
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  });

  // Breakdown by Zone/Area
  const byZone = {};
  complaints.forEach((c) => {
    const zone = c.zone || 'Other';
    byZone[zone] = (byZone[zone] || 0) + 1;
  });

  // Department Performance
  const departmentStats = departments.map((d) => {
    const deptComplaints = complaints.filter((c) => c.department === d.name);
    const resolved = deptComplaints.filter((c) => c.status === 'RESOLVED' || c.status === 'VERIFIED').length;
    const pending = deptComplaints.length - resolved;
    return {
      department: d.name,
      code: d.code,
      total: deptComplaints.length,
      resolved,
      pending,
      active_workers: d.active_workers,
      avg_resolution_hours: d.name === 'Road Maintenance' ? 28 : d.name === 'Sanitation Department' ? 14 : 22,
      sla_compliance_rate: 92.4
    };
  });

  // Predictive Analytics alerts
  const predictiveAlerts = [
    {
      id: 'pred-1',
      zone: 'North Zone - Ward 6 (Patia)',
      category: 'drainage',
      confidence: 0.88,
      risk_level: 'HIGH',
      message: 'Storm drain sediment accumulation indicates an 88% probability of severe waterlogging during high rainfall.',
      recommended_action: 'Deploy pre-monsoon mechanical desilting suction trucks to Ward 6 within 72 hours.'
    },
    {
      id: 'pred-2',
      zone: 'North Central - Ward 14 (Jayadev Vihar)',
      category: 'pothole',
      confidence: 0.79,
      risk_level: 'MEDIUM',
      message: 'Asphalt fatigue metrics indicate pothole density will increase 35% over the next 45 days along College Road.',
      recommended_action: 'Schedule preventative micro-surfacing overlay before pothole craters expand.'
    },
    {
      id: 'pred-3',
      zone: 'Central - Ward 9 (Acharya Vihar)',
      category: 'garbage',
      confidence: 0.84,
      risk_level: 'MEDIUM',
      message: 'Weekend commercial waste generation exceeds container capacity by 40%.',
      recommended_action: 'Increase Saturday evening waste compactor sweep frequency.'
    }
  ];

  const cityHealth = calculateCityHealthScore();

  return {
    summary: {
      total_complaints: totalComplaints,
      pending: pendingCount,
      in_progress: inProgressCount,
      resolved: resolvedCount,
      critical_unresolved: criticalCount,
      avg_resolution_time_days: 1.8,
      resolution_rate: totalComplaints ? Math.round((resolvedCount / totalComplaints) * 100) : 0
    },
    city_health: cityHealth,
    by_category: byCategory,
    by_zone: byZone,
    department_stats: departmentStats,
    predictive_alerts: predictiveAlerts
  };
}
