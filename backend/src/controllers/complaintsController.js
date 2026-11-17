import { db } from '../models/db.js';
import { detectProblemFromImage, verifyResolutionProof } from '../services/aiVisionService.js';
import { calculatePriorityScore } from '../services/priorityService.js';
import { routeDepartment } from '../services/departmentRouter.js';
import { reverseGeocode } from '../services/geocodingService.js';

export async function createComplaint(req, res) {
  try {
    const {
      description,
      latitude,
      longitude,
      category_hint,
      is_emergency,
      image_url: providedImageUrl
    } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Problem description is required.' });
    }

    // Coordinates fallback to smart city center if not provided
    const lat = latitude ? parseFloat(latitude) : 20.2961;
    const lng = longitude ? parseFloat(longitude) : 85.8245;

    // Determine image URL
    let imageUrl = providedImageUrl;
    if (req.file) {
      // Local uploaded image
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (!imageUrl) {
      // Fallback category representative image
      const fallbackImages = {
        pothole: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
        garbage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?w=800',
        streetlight: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
        water_leak: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=800',
        drainage: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800',
        fallen_tree: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
        traffic_signal: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800'
      };
      imageUrl = fallbackImages[category_hint] || fallbackImages.pothole;
    }

    // 1. Step: Reverse Geocoding
    const geoInfo = await reverseGeocode(lat, lng);

    // 2. Step: AI Computer Vision Detection
    const aiDetection = await detectProblemFromImage({
      imageUrl,
      description,
      categoryHint: category_hint
    });

    const category = aiDetection.category;

    // 3. Step: Calculate Priority Score using the exact 4-factor formula
    const nearbyReports = Math.floor(3 + Math.random() * 12);
    const priorityCalc = calculatePriorityScore({
      severity: aiDetection.severity,
      severityScore: aiDetection.severity_score,
      trafficLevel: aiDetection.traffic_estimate,
      nearbyReports,
      locationImportance: is_emergency ? 'CRITICAL' : 'HIGH',
      isEmergency: Boolean(is_emergency)
    });

    // 4. Step: Automatically Route Department
    const department = routeDepartment(category);

    const complaintId = `CF-${Math.floor(1000 + Math.random() * 9000)}`;
    const userId = req.user ? req.user.id : 'usr-citizen-1';
    const reporterName = req.user ? req.user.name : 'Aarav Sharma';

    const newComplaint = {
      id: complaintId,
      user_id: userId,
      reporter_name: reporterName,
      category,
      description,
      image_url: imageUrl,
      resolution_image_url: null,
      latitude: lat,
      longitude: lng,
      address: geoInfo.address,
      zone: geoInfo.zone,
      landmark: geoInfo.landmark,

      severity: aiDetection.severity,
      severity_score: aiDetection.severity_score,
      traffic_level: aiDetection.traffic_estimate,
      traffic_score: 80,
      nearby_reports_count: nearbyReports,
      location_importance: is_emergency ? 'CRITICAL' : 'HIGH',
      location_score: is_emergency ? 98 : 85,

      priority_score: priorityCalc.priority_score,
      priority_band: priorityCalc.priority_band,
      priority_breakdown: priorityCalc.breakdown,

      status: 'AI_VERIFIED', // Transitions automatically from REPORTED to AI_VERIFIED
      department,
      assigned_to: null,
      assigned_worker_name: null,
      is_emergency: Boolean(is_emergency),

      ai_detection_meta: aiDetection,
      ai_verification_meta: null,
      citizen_feedback: null,

      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      resolved_at: null
    };

    db.complaints.insert(newComplaint);

    // Create Audit Logs
    db.logs.add({
      complaint_id: complaintId,
      action: 'REPORTED',
      status_from: null,
      status_to: 'REPORTED',
      performed_by_name: `${reporterName} (Citizen)`,
      notes: `Citizen reported civic issue: "${description.substring(0, 60)}..." with photo and GPS coordinates.`
    });

    db.logs.add({
      complaint_id: complaintId,
      action: 'AI_VERIFICATION',
      status_from: 'REPORTED',
      status_to: 'AI_VERIFIED',
      performed_by_name: 'AI Civic Engine (YOLOv8 & DeepVision)',
      notes: `AI detected ${category.replace('_', ' ')} with ${(aiDetection.confidence * 100).toFixed(0)}% confidence. Priority calculated: ${priorityCalc.priority_score}/100.`
    });

    // Create Notification
    db.notifications.add({
      user_id: userId,
      complaint_id: complaintId,
      title: 'Complaint Registered & AI Verified',
      message: `Your complaint #${complaintId} (${category}) has been verified and routed to ${department}.`,
      type: 'INFO'
    });

    return res.status(201).json({
      message: 'Complaint successfully created and AI-verified',
      complaint: newComplaint
    });
  } catch (err) {
    console.error('Error creating complaint:', err);
    return res.status(500).json({ error: 'Failed to process and create civic complaint.' });
  }
}

export async function listComplaints(req, res) {
  try {
    const filters = {
      status: req.query.status,
      category: req.query.category,
      department: req.query.department,
      user_id: req.query.user_id,
      assigned_to: req.query.assigned_to,
      search: req.query.search
    };

    const complaints = db.complaints.list(filters);
    return res.json({ complaints, total: complaints.length });
  } catch (err) {
    console.error('List complaints error:', err);
    return res.status(500).json({ error: 'Failed to retrieve complaints.' });
  }
}

export async function getComplaint(req, res) {
  try {
    const { id } = req.params;
    const complaint = db.complaints.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const logs = db.logs.getByComplaintId(id);

    return res.json({
      complaint,
      timeline: logs
    });
  } catch (err) {
    console.error('Get complaint error:', err);
    return res.status(500).json({ error: 'Failed to retrieve complaint.' });
  }
}

export async function assignWorker(req, res) {
  try {
    const { id } = req.params;
    const { worker_id, worker_name, notes } = req.body;

    const complaint = db.complaints.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const worker = db.users.findById(worker_id);
    const assignedName = worker ? worker.name : worker_name || 'Assigned Officer';

    const updated = db.complaints.update(id, {
      status: 'ASSIGNED',
      assigned_to: worker_id,
      assigned_worker_name: assignedName
    });

    db.logs.add({
      complaint_id: id,
      action: 'ASSIGNED',
      status_from: complaint.status,
      status_to: 'ASSIGNED',
      performed_by_name: req.user ? req.user.name : 'Municipal Administrator',
      notes: notes || `Complaint assigned to field worker: ${assignedName}`
    });

    // Notify citizen
    db.notifications.add({
      user_id: complaint.user_id,
      complaint_id: id,
      title: 'Worker Dispatched',
      message: `Your complaint #${id} has been assigned to ${assignedName}.`,
      type: 'INFO'
    });

    // Notify worker
    if (worker_id) {
      db.notifications.add({
        user_id: worker_id,
        complaint_id: id,
        title: 'New Task Assigned',
        message: `You have been assigned to #${id} (${complaint.category}) at ${complaint.address}.`,
        type: 'WARNING'
      });
    }

    return res.json({ message: 'Worker assigned successfully', complaint: updated });
  } catch (err) {
    console.error('Assign worker error:', err);
    return res.status(500).json({ error: 'Failed to assign worker.' });
  }
}

export async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const complaint = db.complaints.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const prevStatus = complaint.status;
    const updated = db.complaints.update(id, { status });

    db.logs.add({
      complaint_id: id,
      action: `STATUS_CHANGE_TO_${status}`,
      status_from: prevStatus,
      status_to: status,
      performed_by_name: req.user ? req.user.name : 'System Operator',
      notes: notes || `Status updated from ${prevStatus} to ${status}`
    });

    db.notifications.add({
      user_id: complaint.user_id,
      complaint_id: id,
      title: `Complaint Status: ${status}`,
      message: `Your report #${id} is now ${status.replace('_', ' ')}.`,
      type: 'INFO'
    });

    return res.json({ message: 'Status updated successfully', complaint: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update complaint status.' });
  }
}

export async function submitResolutionProof(req, res) {
  try {
    const { id } = req.params;
    const { resolution_notes, resolution_image_url: providedAfterUrl } = req.body;

    const complaint = db.complaints.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    let afterImageUrl = providedAfterUrl;
    if (req.file) {
      afterImageUrl = `/uploads/${req.file.filename}`;
    } else if (!afterImageUrl) {
      const repairedImages = {
        pothole: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
        garbage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800',
        streetlight: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800',
        water_leak: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800',
        drainage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800',
        fallen_tree: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800',
        traffic_signal: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800'
      };
      afterImageUrl = repairedImages[complaint.category] || repairedImages.pothole;
    }

    // Run AI Resolution Verification on Before & After Photos
    const aiVerification = await verifyResolutionProof({
      beforeImageUrl: complaint.image_url,
      afterImageUrl,
      category: complaint.category,
      notes: resolution_notes
    });

    const updated = db.complaints.update(id, {
      status: 'RESOLVED',
      resolution_image_url: afterImageUrl,
      resolved_at: new Date().toISOString(),
      ai_verification_meta: aiVerification
    });

    db.logs.add({
      complaint_id: id,
      action: 'WORKER_RESOLVED',
      status_from: complaint.status,
      status_to: 'RESOLVED',
      performed_by_name: req.user ? req.user.name : 'Field Worker',
      notes: `Resolution proof uploaded: "${resolution_notes || 'Defect repaired'}".`
    });

    db.logs.add({
      complaint_id: id,
      action: 'AI_RESOLUTION_VERIFIED',
      status_from: 'RESOLVED',
      status_to: 'RESOLVED',
      performed_by_name: 'AI Resolution Verifier',
      notes: `AI Verification Confidence: ${(aiVerification.resolution_confidence * 100).toFixed(0)}%. ${aiVerification.notes}`
    });

    // Notify Citizen to confirm
    db.notifications.add({
      user_id: complaint.user_id,
      complaint_id: id,
      title: 'Problem Resolved! Please Confirm',
      message: `Your report #${id} (${complaint.category}) has been repaired. Please view before/after photos and confirm.`,
      type: 'SUCCESS'
    });

    return res.json({
      message: 'Resolution proof submitted and AI verified',
      complaint: updated,
      ai_verification: aiVerification
    });
  } catch (err) {
    console.error('Error submitting resolution proof:', err);
    return res.status(500).json({ error: 'Failed to submit resolution proof.' });
  }
}

export async function citizenConfirmResolution(req, res) {
  try {
    const { id } = req.params;
    const { confirmed, satisfaction, comment } = req.body;

    const complaint = db.complaints.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const isConfirmed = Boolean(confirmed);
    const newStatus = isConfirmed ? 'VERIFIED' : 'REOPENED';

    const feedback = {
      confirmed: isConfirmed,
      satisfaction: Number(satisfaction) || (isConfirmed ? 5 : 1),
      comment: comment || (isConfirmed ? 'Citizen confirmed fix.' : 'Citizen reported issue was not resolved properly.'),
      submitted_at: new Date().toISOString()
    };

    const updated = db.complaints.update(id, {
      status: newStatus,
      citizen_feedback: feedback
    });

    db.logs.add({
      complaint_id: id,
      action: isConfirmed ? 'CITIZEN_CONFIRMED' : 'CITIZEN_REOPENED',
      status_from: complaint.status,
      status_to: newStatus,
      performed_by_name: req.user ? req.user.name : 'Aarav Sharma (Citizen)',
      notes: isConfirmed
        ? `Citizen verified resolution. Rating: ${feedback.satisfaction}/5. "${feedback.comment}"`
        : `Citizen REOPENED issue. Reason: "${feedback.comment}". Escalated to supervisor.`
    });

    return res.json({
      message: isConfirmed ? 'Resolution confirmed by citizen!' : 'Complaint has been reopened.',
      complaint: updated
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to record citizen confirmation.' });
  }
}

export async function toggleEmergencyEscalation(req, res) {
  try {
    const { id } = req.params;
    const complaint = db.complaints.findById(id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found.' });
    }

    const newEmergency = !complaint.is_emergency;
    const newPriority = newEmergency ? 98 : Math.max(50, complaint.priority_score - 15);

    const updated = db.complaints.update(id, {
      is_emergency: newEmergency,
      priority_score: newPriority,
      priority_band: newEmergency ? 'CRITICAL' : 'HIGH'
    });

    db.logs.add({
      complaint_id: id,
      action: newEmergency ? 'EMERGENCY_ESCALATION' : 'EMERGENCY_CLEARED',
      status_from: complaint.status,
      status_to: complaint.status,
      performed_by_name: req.user ? req.user.name : 'Municipal Control Room',
      notes: newEmergency
        ? 'Emergency mode enabled. Priority escalated to 98/100 (Immediate dispatch required).'
        : 'Emergency mode deactivated.'
    });

    return res.json({ message: 'Emergency status updated', complaint: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle emergency status.' });
  }
}
