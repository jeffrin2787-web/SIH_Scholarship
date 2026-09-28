const { query } = require('../config/db');
const { VerificationEngine } = require('../services/VerificationEngine');
const NspAdapter = require('../services/adapters/NspAdapter');
const SfmpAdapter = require('../services/adapters/SfmpAdapter');
const NosAdapter = require('../services/adapters/NosAdapter');

class ApplicationController {
  static async getSchemes(req, res) {
    try {
      const schemes = await query.all(`SELECT * FROM schemes WHERE is_active = 1`);
      return res.json({ schemes });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch scholarship schemes' });
    }
  }

  static async getMyApplications(req, res) {
    try {
      const rawApps = await query.all(
        `SELECT a.*, s.name as scheme_name, s.description as scheme_desc
         FROM applications a
         JOIN schemes s ON a.scheme_id = s.id
         WHERE a.user_id = ?
         ORDER BY a.applied_at DESC`,
        [req.user.id]
      );

      // Normalize through adapters based on source portal
      const normalizedApps = await Promise.all(
        rawApps.map(async (app) => {
          let normalized;
          if (app.source_portal === 'NSP') {
            normalized = NspAdapter.formatRecord(app);
          } else if (app.source_portal === 'SFMP') {
            normalized = SfmpAdapter.formatRecord(app);
          } else {
            normalized = NosAdapter.formatRecord(app);
          }

          // Fetch deficiencies
          const deficiencies = await query.all(
            `SELECT * FROM deficiencies WHERE application_id = ? AND is_resolved = 0`,
            [app.id]
          );

          return {
            id: app.id,
            ...normalized,
            deficiencies,
            appliedAt: app.applied_at
          };
        })
      );

      // Summary statistics
      const totalSanctioned = rawApps.reduce((acc, a) => acc + (a.sanctioned_amount || 0), 0);
      const totalDisbursed = rawApps.reduce((acc, a) => acc + (a.disbursed_amount || 0), 0);

      return res.json({
        applications: normalizedApps,
        summary: {
          totalApplications: normalizedApps.length,
          totalSanctionedAmount: totalSanctioned,
          totalDisbursedAmount: totalDisbursed,
          activeCount: normalizedApps.filter(a => a.currentStage !== 'DISBURSED').length
        }
      });
    } catch (err) {
      console.error('Fetch applications error:', err);
      return res.status(500).json({ error: 'Failed to fetch unified scholarship records' });
    }
  }

  static async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const app = await query.get(
        `SELECT a.*, s.name as scheme_name, s.description as scheme_desc, s.benefits_summary,
                u.name as student_name, u.otr_number, u.bank_name, u.account_number, u.aadhaar_seeded
         FROM applications a
         JOIN schemes s ON a.scheme_id = s.id
         JOIN users u ON a.user_id = u.id
         WHERE a.id = ? AND (a.user_id = ? OR ? IN ('OFFICER', 'ADMIN'))`,
        [id, req.user.id, req.user.role]
      );

      if (!app) {
        return res.status(404).json({ error: 'Scholarship application not found' });
      }

      // Fetch 5-Stage Timeline
      const stages = await query.all(
        `SELECT * FROM application_stages
         WHERE application_id = ?
         ORDER BY id ASC`,
        [id]
      );

      // Fetch Deficiencies
      const deficiencies = await query.all(
        `SELECT * FROM deficiencies
         WHERE application_id = ?
         ORDER BY is_resolved ASC, created_at DESC`,
        [id]
      );

      return res.json({
        application: app,
        stages,
        deficiencies
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch application timeline' });
    }
  }

  static async applyForScheme(req, res) {
    try {
      const { schemeId, academicYear = '2025-2026', requestedAmount = 0 } = req.body;

      if (!schemeId) {
        return res.status(400).json({ error: 'Scheme identifier is required.' });
      }

      const scheme = await query.get(`SELECT * FROM schemes WHERE id = ?`, [schemeId]);
      if (!scheme) {
        return res.status(404).json({ error: 'Invalid scholarship scheme selected.' });
      }

      // RULE: Student can only avail ONE active scholarship at a time!
      const activeApp = await query.get(
        `SELECT a.*, s.name as scheme_name
         FROM applications a
         JOIN schemes s ON a.scheme_id = s.id
         WHERE a.user_id = ? AND a.current_stage != 'DISBURSED'`,
        [req.user.id]
      );

      if (activeApp) {
        return res.status(409).json({
          error: 'ONE_SCHEME_RESTRICTION',
          message: `Ministry guidelines state that a student can only avail one scholarship scheme at a time. You currently have an active application for '${activeApp.scheme_name}' at stage '${activeApp.current_stage}'.`,
          activeApplication: activeApp
        });
      }

      // Generate scheme-specific application number
      const appNumber = `${scheme.source_portal}-${academicYear.replace('-', '')}-${schemeId}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Calculate sanctioned amount based on scheme
      let initialSanction = requestedAmount;
      if (!initialSanction || initialSanction <= 0) {
        if (schemeId === 'PRE_MATRIC') initialSanction = 7000;
        else if (schemeId === 'POST_MATRIC') initialSanction = 18500;
        else if (schemeId === 'TOP_CLASS') initialSanction = 85000;
        else if (schemeId === 'NFST') initialSanction = 444000;
        else if (schemeId === 'NOS') initialSanction = 1200000;
      }

      const newApp = await query.run(
        `INSERT INTO applications (
          application_number, user_id, scheme_id, source_portal, portal_application_id,
          academic_year, current_stage, sanctioned_amount, disbursed_amount, dbt_status
        ) VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, 0, 'AWAITING_VERIFICATION')`,
        [appNumber, req.user.id, schemeId, scheme.source_portal, `REF-${Math.floor(100000 + Math.random() * 900000)}`, academicYear, initialSanction]
      );

      // Create initial timeline stage
      await query.run(
        `INSERT INTO application_stages (application_id, stage_key, stage_label, status, remarks, officer_name, completed_at)
         VALUES (?, 'SUBMITTED', 'Application Submitted', 'COMPLETED', 'Application received with OTR identity & linked digital wallet.', 'System', CURRENT_TIMESTAMP)`,
        [newApp.id]
      );

      await query.run(
        `INSERT INTO application_stages (application_id, stage_key, stage_label, status, remarks, officer_name)
         VALUES (?, 'INSTITUTE_VERIFIED', 'Institute L1 Verification', 'CURRENT', 'Awaiting institute nodal officer scrutiny.', 'Institute Nodal Officer')`,
        [newApp.id]
      );

      // Trigger Smart Verification Engine
      const verification = await VerificationEngine.verifyApplication(newApp.id);

      return res.status(201).json({
        message: 'Application submitted successfully! Automated verification pipeline triggered.',
        applicationId: newApp.id,
        applicationNumber: appNumber,
        scheme: scheme.name,
        verification
      });
    } catch (err) {
      console.error('Application error:', err);
      return res.status(500).json({ error: 'Failed to process scholarship application.' });
    }
  }

  static async resolveDeficiency(req, res) {
    try {
      const { deficiencyId } = req.params;
      const { remarks } = req.body;

      const def = await query.get(
        `SELECT d.*, a.user_id FROM deficiencies d
         JOIN applications a ON d.application_id = a.id
         WHERE d.id = ?`,
        [deficiencyId]
      );

      if (!def) return res.status(404).json({ error: 'Deficiency record not found' });
      if (def.user_id !== req.user.id && req.user.role !== 'OFFICER') {
        return res.status(403).json({ error: 'Unauthorized to resolve this deficiency' });
      }

      await query.run(
        `UPDATE deficiencies
         SET is_resolved = 1, resolution_remarks = ?
         WHERE id = ?`,
        [remarks || 'Document updated by student via Digital Wallet', deficiencyId]
      );

      return res.json({ message: 'Deficiency resolved successfully. Application proceeds to next stage.' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to resolve deficiency.' });
    }
  }
}

module.exports = ApplicationController;
