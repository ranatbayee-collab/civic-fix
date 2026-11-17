import { detectProblemFromImage } from '../services/aiVisionService.js';
import { calculatePriorityScore } from '../services/priorityService.js';
import { handleCopilotQuery } from '../services/copilotService.js';

export async function scanImage(req, res) {
  try {
    const { image_url, description, category_hint } = req.body;
    let img = image_url;
    if (req.file) {
      img = `/uploads/${req.file.filename}`;
    }

    if (!img && !description && !category_hint) {
      return res.status(400).json({ error: 'Image or description required for AI scanning.' });
    }

    const detection = await detectProblemFromImage({
      imageUrl: img,
      description,
      categoryHint: category_hint
    });

    const priority = calculatePriorityScore({
      severity: detection.severity,
      severityScore: detection.severity_score,
      trafficLevel: detection.traffic_estimate,
      nearbyReports: 12,
      locationImportance: 'HIGH'
    });

    return res.json({
      success: true,
      detection,
      priority,
      image_url: img
    });
  } catch (err) {
    console.error('Scan error:', err);
    return res.status(500).json({ error: 'Failed to run AI scan.' });
  }
}

export async function calculatePriority(req, res) {
  try {
    const result = calculatePriorityScore(req.body);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'Priority calculation error' });
  }
}

export async function copilotChat(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }
    const response = handleCopilotQuery(prompt);
    return res.json(response);
  } catch (err) {
    console.error('Copilot error:', err);
    return res.status(500).json({ error: 'Copilot query failed' });
  }
}
