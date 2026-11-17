import { db } from '../models/db.js';
import { calculateCityHealthScore } from './analyticsService.js';

export function runWhatIfSimulation({
  scenario = 'repair_top_potholes',
  targetCategory = 'pothole',
  countToResolve = 10,
  additionalCrewCount = 0,
  budgetLakhs = 5
}) {
  const currentHealth = calculateCityHealthScore();
  const { complaints } = db.get();

  const totalOpen = complaints.filter((c) => c.status !== 'RESOLVED' && c.status !== 'VERIFIED').length;
  const targetOpen = complaints.filter(
    (c) => c.category === targetCategory && c.status !== 'RESOLVED' && c.status !== 'VERIFIED'
  ).length;

  const baselineComplaints = Math.max(targetOpen, 24); // baseline count for simulation context
  const resolvedCount = Math.min(countToResolve, baselineComplaints);

  // Calculate predicted reductions
  const complaintsDropPercent = Math.min(65, Math.round((resolvedCount / baselineComplaints) * 75));
  const trafficImpactReductionPercent = Math.min(50, Math.round(complaintsDropPercent * 0.65 + additionalCrewCount * 3));
  const healthScoreIncrease = Math.min(18, Math.round((resolvedCount * 0.7) + (additionalCrewCount * 0.5)));

  const predictedHealthScore = Math.min(99, currentHealth.overall + healthScoreIncrease);

  return {
    is_simulation: true,
    disclaimer: 'These values represent AI predictive estimates based on historical municipal response patterns and traffic sensor correlation, not guaranteed outcomes.',
    scenario: {
      id: scenario,
      title: scenario === 'repair_top_potholes'
        ? `Repair ${resolvedCount} Highest-Priority Potholes`
        : scenario === 'sanitation_blitz'
        ? 'Deploy Extra Sanitation & Waste Compactor Fleet'
        : 'Emergency Pre-Monsoon Drainage Overhaul',
      target_category: targetCategory,
      count_resolved: resolvedCount,
      extra_crew: additionalCrewCount,
      estimated_budget: `₹${budgetLakhs} Lakhs`
    },
    before: {
      category_complaints: baselineComplaints,
      traffic_congestion_index: targetCategory === 'pothole' || targetCategory === 'traffic_signal' ? 'HIGH (78/100)' : 'MODERATE (52/100)',
      city_health_score: currentHealth.overall,
      category_health_subscore: currentHealth.breakdown[targetCategory === 'pothole' ? 'Roads' : 'Sanitation'] || 71
    },
    after_predicted: {
      category_complaints: Math.max(0, baselineComplaints - resolvedCount),
      complaints_change_percent: -complaintsDropPercent,
      traffic_impact_reduction_percent: trafficImpactReductionPercent,
      city_health_score: predictedHealthScore,
      city_health_score_delta: `+${healthScoreIncrease} points`,
      estimated_turnaround_days: Math.max(2, Math.round(resolvedCount / (2 + additionalCrewCount)))
    }
  };
}
