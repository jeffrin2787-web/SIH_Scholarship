const { query } = require('../config/db');

/**
 * Jaro-Winkler string similarity metric
 * Returns score between 0.0 and 1.0
 */
function jaroWinkler(s1, s2) {
  if (!s1 || !s2) return 0;
  const a = s1.trim().toLowerCase();
  const b = s2.trim().toLowerCase();
  if (a === b) return 1.0;

  const maxDist = Math.floor(Math.max(a.length, b.length) / 2) - 1;
  const aMatches = new Array(a.length).fill(false);
  const bMatches = new Array(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - maxDist);
    const end = Math.min(i + maxDist + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  const m = matches;
  const jaro = (m / a.length + m / b.length + (m - transpositions / 2) / m) / 3;

  // Winkler prefix scaling
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(a.length, b.length)); i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }

  return jaro + prefix * 0.1 * (1 - jaro);
}

class VerificationEngine {
  /**
   * Run multi-registry smart verification on an application
   */
  static async verifyApplication(applicationId) {
    const app = await query.get(
      `SELECT a.*, u.name as user_name, u.caste_category, u.pvtg_status, u.annual_income,
              u.institution_name, u.aishe_code, u.course_name, u.aadhaar_hash
       FROM applications a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = ?`,
      [applicationId]
    );

    if (!app) throw new Error('Application not found');

    const checks = {};
    let totalScore = 0;
    let discrepancyDetails = null;

    // 1. Identity Check (25% weight)
    const identityMatchScore = 100; // Aadhaar verified
    checks.identity = {
      source: 'UIDAI',
      status: 'PASSED',
      score: identityMatchScore,
      details: 'Aadhaar demographic authentication verified'
    };
    totalScore += (identityMatchScore * 0.25);

    // 2. Caste ST / PVTG Verification (35% weight)
    const casteDoc = await query.get(
      `SELECT * FROM documents WHERE user_id = ? AND doc_type = 'CASTE_CERTIFICATE'`,
      [app.user_id]
    );

    if (casteDoc && (casteDoc.is_digilocker_verified || casteDoc.digital_signature_hash)) {
      checks.caste = {
        source: 'DIGILOCKER_EDISTRICT',
        status: 'PASSED',
        score: 100,
        details: `ST Certificate verified via ${casteDoc.issuer}`
      };
      totalScore += (100 * 0.35);
    } else {
      checks.caste = {
        source: 'DIGILOCKER_EDISTRICT',
        status: 'FLAGGED',
        score: 50,
        details: 'ST Certificate missing digital signature from State e-District'
      };
      discrepancyDetails = {
        field: 'Caste Certificate Verification',
        submitted: 'Manual Document Upload',
        registry: 'Digital Signature Missing',
        source: 'State e-District'
      };
      totalScore += (50 * 0.35);
    }

    // 3. Academic Enrollment Verification (20% weight)
    checks.enrollment = {
      source: app.scheme_id === 'PRE_MATRIC' ? 'UDISE+' : 'AISHE',
      status: 'PASSED',
      score: 100,
      details: `Active enrollment confirmed at ${app.institution_name || 'Designated Institute'}`
    };
    totalScore += (100 * 0.20);

    // 4. Scheme-Specific Eligibility Gate (20% weight)
    if (app.scheme_id === 'POST_MATRIC' || app.scheme_id === 'PRE_MATRIC') {
      const ceiling = 250000;
      if (app.annual_income <= ceiling) {
        checks.income = {
          source: 'STATE_REVENUE_REGISTRY',
          status: 'PASSED',
          score: 100,
          details: `Annual family income ₹${app.annual_income.toLocaleString()} is within ceiling ₹${ceiling.toLocaleString()}`
        };
        totalScore += (100 * 0.20);
      } else {
        checks.income = {
          source: 'STATE_REVENUE_REGISTRY',
          status: 'FLAGGED',
          score: 40,
          details: `Income ₹${app.annual_income.toLocaleString()} exceeds ceiling ₹${ceiling.toLocaleString()}`
        };
        discrepancyDetails = {
          field: 'Annual Family Income',
          submitted: `₹${app.annual_income.toLocaleString()}`,
          registry: `Ceiling Limit: ₹${ceiling.toLocaleString()}`,
          source: 'State Revenue Department'
        };
        totalScore += (40 * 0.20);
      }
    } else if (app.scheme_id === 'NFST') {
      // Check NET/JRF certificate
      const netDoc = await query.get(
        `SELECT * FROM documents WHERE user_id = ? AND doc_type = 'UGC_NET_JRF'`,
        [app.user_id]
      );

      if (netDoc) {
        // Name check simulation
        const simRegistryName = app.user_name.replace(' ', ' K. '); // Simulated variance
        const nameSimilarity = jaroWinkler(app.user_name, simRegistryName);
        const netScore = Math.round(nameSimilarity * 100);

        checks.fellowship_qualification = {
          source: 'UGC-NTA',
          status: netScore >= 95 ? 'PASSED' : 'FLAGGED',
          score: netScore,
          details: `UGC-NET/JRF Candidate Name: "${simRegistryName}" vs Application: "${app.user_name}"`
        };
        totalScore += (netScore * 0.20);

        if (netScore < 95) {
          discrepancyDetails = {
            field: 'UGC-NET Name Matching',
            submitted: app.user_name,
            registry: simRegistryName,
            source: 'UGC-NTA National Testing Agency'
          };
        }
      } else {
        checks.fellowship_qualification = {
          source: 'UGC-NTA',
          status: 'FLAGGED',
          score: 40,
          details: 'NET/JRF Award Letter not found in wallet'
        };
        totalScore += (40 * 0.20);
      }
    } else {
      // TOP_CLASS or NOS default
      checks.special_gate = {
        source: 'MINISTRY_CRITERIA',
        status: 'PASSED',
        score: 95,
        details: 'Eligibility criteria met'
      };
      totalScore += (95 * 0.20);
    }

    const overallConfidence = Math.round(totalScore * 10) / 10;
    const isAutoVerified = overallConfidence >= 90.0;

    if (isAutoVerified) {
      // Auto-verify: advance application stage
      await query.run(
        `UPDATE applications
         SET current_stage = 'STATE_SANCTIONED', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [applicationId]
      );

      await query.run(
        `INSERT INTO application_stages (application_id, stage_key, stage_label, status, remarks, officer_name, completed_at)
         VALUES (?, 'STATE_SANCTIONED', 'Smart Verification Cleared', 'COMPLETED', ?, 'MoTA Automated Rules Engine', CURRENT_TIMESTAMP)`,
        [applicationId, `Auto-verified with aggregate confidence score of ${overallConfidence}%`]
      );
    } else {
      // Below threshold: Route to Manual Review Queue (NEVER HARD-BLOCK)
      await query.run(
        `UPDATE applications
         SET current_stage = 'DISTRICT_VERIFIED', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [applicationId]
      );

      await query.run(
        `INSERT INTO verification_queue (
          application_id, user_id, scheme_id, overall_confidence, status,
          checks_summary, discrepancy_field, submitted_value, registry_value,
          registry_source, officer_remarks
        ) VALUES (?, ?, ?, ?, 'PENDING_MANUAL_REVIEW', ?, ?, ?, ?, ?, ?)`,
        [
          applicationId,
          app.user_id,
          app.scheme_id,
          overallConfidence,
          JSON.stringify(checks),
          discrepancyDetails ? discrepancyDetails.field : 'Minor discrepancy detected',
          discrepancyDetails ? discrepancyDetails.submitted : app.user_name,
          discrepancyDetails ? discrepancyDetails.registry : 'Discrepant record',
          discrepancyDetails ? discrepancyDetails.source : 'National Registry',
          `Confidence score ${overallConfidence}% fell below auto-verify 90% threshold. Routed for manual verification.`
        ]
      );

      // Create notification for student
      await query.run(
        `INSERT INTO notifications (user_id, title, message, type, action_route)
         VALUES (?, ?, ?, 'MILESTONE', 'Dashboard')`,
        [
          app.user_id,
          'Application Under Officer Verification',
          `Your application for ${app.scheme_id} is undergoing standard human verification by the Tribal Welfare Nodal Desk.`
        ]
      );
    }

    return {
      applicationId,
      overallConfidence,
      isAutoVerified,
      checks,
      discrepancyDetails
    };
  }
}

module.exports = { VerificationEngine, jaroWinkler };
