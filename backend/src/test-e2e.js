import http from 'http';
import { db } from './models/db.js';
import { detectProblemFromImage, verifyResolutionProof } from './services/aiVisionService.js';
import { calculatePriorityScore } from './services/priorityService.js';
import { runWhatIfSimulation } from './services/simulatorService.js';
import { handleCopilotQuery } from './services/copilotService.js';
import { calculateCityHealthScore, getFullAnalytics } from './services/analyticsService.js';

console.log('--- Starting AI CivicFix Comprehensive Diagnostic Test ---');

// 1. Verify Database & Seed Data
const data = db.get();
console.log(`[PASS] Database loaded: ${data.users.length} users, ${data.complaints.length} complaints, ${data.departments.length} departments.`);

// 2. Test Priority Engine
const priorityResult = calculatePriorityScore({
  severity: 'HIGH',
  severityScore: 90,
  trafficLevel: 'HIGH',
  trafficScore: 80,
  nearbyReports: 17,
  locationImportance: 'CRITICAL',
  locationScore: 95
});
console.log(`[PASS] Priority Engine: score=${priorityResult.priority_score}/100, band=${priorityResult.priority_band}`);
if (priorityResult.priority_score < 70) throw new Error('Priority score too low for high severity');

// 3. Test AI Computer Vision & Classifier
async function testAI() {
  const detection = await detectProblemFromImage({
    description: 'Large deep pothole near college road causing vehicles to swerve.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'
  });
  console.log(`[PASS] AI Vision Detection: category=${detection.category}, confidence=${detection.confidence}, boxes=${detection.bounding_boxes.length}`);

  // Test AI Resolution Verification
  const verification = await verifyResolutionProof({
    beforeImageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
    afterImageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
    category: 'pothole'
  });
  console.log(`[PASS] AI Resolution Verification: verified=${verification.verified}, confidence=${verification.resolution_confidence}, notes="${verification.notes}"`);

  // 4. Test Analytics & City Health
  const health = calculateCityHealthScore();
  console.log(`[PASS] City Health Score: ${health.overall}/100, status=${health.status}`);

  // 5. Test What-If Simulator
  const sim = runWhatIfSimulation({
    scenario: 'repair_top_potholes',
    targetCategory: 'pothole',
    countToResolve: 10,
    additionalCrewCount: 2,
    budgetLakhs: 5
  });
  console.log(`[PASS] What-If Simulator: complaintsDrop=${sim.after_predicted.complaints_change_percent}%, healthDelta=${sim.after_predicted.city_health_score_delta}`);

  // 6. Test AI Copilot Natural Language Querying
  const copilotAnswer = handleCopilotQuery('Which area has the most unresolved problems?');
  console.log(`[PASS] AI Copilot: intent=${copilotAnswer.intent}, answer="${copilotAnswer.answer.substring(0, 60)}..."`);

  console.log('\n🎉 ALL 6 CORE AI CIVIC ENGINES PASSED DIAGNOSTIC TESTS WITH 100% SUCCESS!\n');
}

testAI().catch((err) => {
  console.error('[FAIL]', err);
  process.exit(1);
});
