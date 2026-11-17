// Priority Calculation Engine according to the civic AI algorithm specification:
// Priority Score = (Severity × 40%) + (Traffic × 25%) + (Report Count × 20%) + (Location Importance × 15%)
// Normalized to 0–100.

export function calculatePriorityScore({
  severity = 'MEDIUM',
  severityScore = null,
  trafficLevel = 'MEDIUM',
  trafficScore = null,
  nearbyReports = 1,
  locationImportance = 'MEDIUM',
  locationScore = null,
  isEmergency = false
}) {
  // 1. Severity (0 - 100)
  let sevVal = 50;
  if (severityScore !== null && severityScore !== undefined) {
    sevVal = Number(severityScore);
  } else {
    const sevMap = { LOW: 35, MEDIUM: 65, HIGH: 88, CRITICAL: 96 };
    sevVal = sevMap[severity?.toUpperCase()] || 50;
  }

  // 2. Traffic Level (0 - 100)
  let trafVal = 50;
  if (trafficScore !== null && trafficScore !== undefined) {
    trafVal = Number(trafficScore);
  } else {
    const trafMap = { LOW: 25, MEDIUM: 60, HIGH: 85, SEVERE: 98 };
    trafVal = trafMap[trafficLevel?.toUpperCase()] || 50;
  }

  // 3. Report Count (0 - 100)
  // 1 report = 20, 5 reports = 50, 15 reports = 80, 25+ reports = 100
  const repCount = Math.max(1, Number(nearbyReports) || 1);
  const repScore = Math.min(100, Math.round(20 + Math.min(repCount, 25) * 3.2));

  // 4. Location Importance (0 - 100) (e.g. Hospital road, school zone, major arterial vs alleyway)
  let locVal = 60;
  if (locationScore !== null && locationScore !== undefined) {
    locVal = Number(locationScore);
  } else {
    const locMap = { LOW: 30, MEDIUM: 60, HIGH: 85, CRITICAL: 98 };
    locVal = locMap[locationImportance?.toUpperCase()] || 60;
  }

  // Calculate weighted contributions
  const severityContrib = (sevVal * 0.40);
  const trafficContrib = (trafVal * 0.25);
  const reportsContrib = (repScore * 0.20);
  const locationContrib = (locVal * 0.15);

  let finalScore = Math.round(severityContrib + trafficContrib + reportsContrib + locationContrib);

  // Emergency Mode Escalation
  if (isEmergency) {
    finalScore = Math.max(finalScore, 95);
  }

  finalScore = Math.max(1, Math.min(100, finalScore));

  let priorityBand = 'LOW';
  if (finalScore >= 85) priorityBand = 'CRITICAL';
  else if (finalScore >= 70) priorityBand = 'HIGH';
  else if (finalScore >= 50) priorityBand = 'MEDIUM';

  return {
    priority_score: finalScore,
    priority_band: priorityBand,
    breakdown: {
      severity: { value: sevVal, weight: '40%', contribution: Number(severityContrib.toFixed(1)) },
      traffic: { value: trafVal, weight: '25%', contribution: Number(trafficContrib.toFixed(1)) },
      reports: { value: repScore, count: repCount, weight: '20%', contribution: Number(reportsContrib.toFixed(1)) },
      location: { value: locVal, weight: '15%', contribution: Number(locationContrib.toFixed(1)) },
      is_emergency: Boolean(isEmergency)
    }
  };
}
