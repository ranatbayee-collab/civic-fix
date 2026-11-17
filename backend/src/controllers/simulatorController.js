import { runWhatIfSimulation } from '../services/simulatorService.js';

export function runSimulation(req, res) {
  try {
    const {
      scenario = 'repair_top_potholes',
      targetCategory = 'pothole',
      countToResolve = 10,
      additionalCrewCount = 2,
      budgetLakhs = 5
    } = req.body;

    const result = runWhatIfSimulation({
      scenario,
      targetCategory,
      countToResolve: Number(countToResolve) || 10,
      additionalCrewCount: Number(additionalCrewCount) || 0,
      budgetLakhs: Number(budgetLakhs) || 5
    });

    return res.json(result);
  } catch (err) {
    console.error('Simulation error:', err);
    return res.status(500).json({ error: 'Failed to run What-If simulation' });
  }
}
