const { query } = require('../config/db');
const OutreachService = require('../services/OutreachService');

class AdminController {
  /**
   * Get all items routed to the Manual Review Queue
   */
  static async getReviewQueue(req, res) {
    try {
      const items = await query.all(
        `SELECT vq.*, a.application_number, a.scheme_id, s.name as scheme_name,
                u.name as student_name, u.otr_number, u.institution_name, u.phone, u.email
         FROM verification_queue vq
         JOIN applications a ON vq.application_id = a.id
         JOIN schemes s ON a.scheme_id = s.id
         JOIN users u ON vq.user_id = u.id
         ORDER BY vq.created_at DESC`
      );

      // Parse JSON checks summary
      const formattedItems = items.map((item) => ({
        ...item,
        checksSummary: item.checks_summary ? JSON.parse(item.checks_summary) : null
      }));

      const pendingCount = items.filter(i => i.status === 'PENDING_MANUAL_REVIEW').length;
      const approvedCount = items.filter(i => i.status === 'APPROVED_BY_OFFICER').length;

      return res.json({
        queue: formattedItems,
        metrics: {
          totalFlagged: items.length,
          pendingReview: pendingCount,
          resolvedReview: approvedCount
        }
      });
    } catch (err) {
      console.error('Fetch review queue error:', err);
      return res.status(500).json({ error: 'Failed to retrieve manual review queue' });
    }
  }

  /**
   * Officer decision on flagged application (Approve exception or Request clarification)
   */
  static async processReviewDecision(req, res) {
    try {
      const { queueId } = req.params;
      const { decision, remarks } = req.body; // decision: 'APPROVE' or 'REQUEST_CLARIFICATION'

      const item = await query.get(
        `SELECT vq.*, a.id as app_id, a.user_id, a.scheme_id, u.name as student_name
         FROM verification_queue vq
         JOIN applications a ON vq.application_id = a.id
         JOIN users u ON a.user_id = u.id
         WHERE vq.id = ?`,
        [queueId]
      );

      if (!item) {
        return res.status(404).json({ error: 'Review queue record not found' });
      }

      if (decision === 'APPROVE') {
        // Approve exception: Advance to State Sanctioned
        await query.run(
          `UPDATE verification_queue
           SET status = 'APPROVED_BY_OFFICER', officer_remarks = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [remarks || 'Discrepancy accepted upon manual scrutiny of supporting documents.', req.user.name, queueId]
        );

        await query.run(
          `UPDATE applications
           SET current_stage = 'STATE_SANCTIONED', updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [item.app_id]
        );

        await query.run(
          `INSERT INTO application_stages (application_id, stage_key, stage_label, status, remarks, officer_name, completed_at)
           VALUES (?, 'STATE_SANCTIONED', 'Officer Manual Review Cleared', 'COMPLETED', ?, ?, CURRENT_TIMESTAMP)`,
          [item.app_id, remarks || 'Officer verified identity and approved discrepancy.', req.user.name]
        );

        // Notify student
        await query.run(
          `INSERT INTO notifications (user_id, title, message, type, action_route)
           VALUES (?, 'Verification Cleared by Officer', ?, 'MILESTONE', 'Dashboard')`,
          [item.user_id, `Your ${item.scheme_id} application passed manual review by ${req.user.name}. Stage updated to Sanctioned.`]
        );

        return res.json({ message: 'Application discrepancy successfully approved and forwarded to sanction.' });
      } else {
        // Flag for Clarification / Deficiency
        await query.run(
          `UPDATE verification_queue
           SET status = 'CLARIFICATION_REQUESTED', officer_remarks = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [remarks || 'Please upload an affidavit or corrected document.', req.user.name, queueId]
        );

        await query.run(
          `UPDATE applications
           SET current_stage = 'FLAGGED_DEFICIENCY', updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [item.app_id]
        );

        await query.run(
          `INSERT INTO deficiencies (application_id, code, severity, title, message, action_type, is_resolved)
           VALUES (?, 'OFFICER_CLARIFICATION', 'CRITICAL', 'Clarification Requested by Nodal Officer', ?, 'UPLOAD_DOCUMENT', 0)`,
          [item.app_id, remarks || 'Nodal officer requires document re-upload due to data mismatch.']
        );

        // Notify student
        await query.run(
          `INSERT INTO notifications (user_id, title, message, type, action_route)
           VALUES (?, 'Action Required: Officer Review Request', ?, 'DEFICIENCY', 'Wallet')`,
          [item.user_id, remarks || 'Tribal Welfare officer has requested document clarification.']
        );

        return res.json({ message: 'Clarification request issued to student.' });
      }
    } catch (err) {
      console.error('Review decision error:', err);
      return res.status(500).json({ error: 'Failed to process officer decision.' });
    }
  }

  /**
   * Coverage Gap Analytics (UDISE+/AISHE ST roll vs Active Claims)
   */
  static async getCoverageGapReport(req, res) {
    try {
      const report = await OutreachService.getCoverageGaps();
      return res.json(report);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to generate coverage gap report' });
    }
  }

  /**
   * Trigger targeted outreach broadcast to unreached ST students
   */
  static async triggerOutreachBroadcast(req, res) {
    try {
      const result = await OutreachService.triggerOutreachBroadcast();
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: 'Failed to execute outreach broadcast' });
    }
  }
}

module.exports = AdminController;
