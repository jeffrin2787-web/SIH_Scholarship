const { query } = require('../config/db');

class OutreachService {
  /**
   * Find enrolled ST students in UDISE+/AISHE who have no active scholarship claims
   */
  static async getCoverageGaps() {
    // Total enrolled ST students in registry
    const totalEnrolled = await query.get(
      `SELECT COUNT(*) as count FROM enrolled_registry_data`
    );

    // Enrolled students already availing scholarship
    const availingCount = await query.get(
      `SELECT COUNT(*) as count FROM enrolled_registry_data WHERE is_availing_scholarship = 1`
    );

    // Missing / unreached eligible ST students
    const unreachedCount = totalEnrolled.count - availingCount.count;
    const coveragePercentage = totalEnrolled.count > 0
      ? Math.round((availingCount.count / totalEnrolled.count) * 100)
      : 0;

    // Detailed list of unreached beneficiaries
    const unreachedList = await query.all(
      `SELECT * FROM enrolled_registry_data
       WHERE is_availing_scholarship = 0
       ORDER BY state, district`
    );

    // Grouping by District
    const districtBreakdown = await query.all(
      `SELECT district, state, COUNT(*) as unreached_count,
              GROUP_CONCAT(eligible_scheme) as eligible_schemes
       FROM enrolled_registry_data
       WHERE is_availing_scholarship = 0
       GROUP BY district, state`
    );

    return {
      metrics: {
        totalEnrolledST: totalEnrolled.count,
        availingScholarship: availingCount.count,
        unreachedEligibleST: unreachedCount,
        coveragePercentage: `${coveragePercentage}%`
      },
      districtBreakdown,
      unreachedStudents: unreachedList
    };
  }

  /**
   * Broadcast proactive outreach notification to all unreached students
   */
  static async triggerOutreachBroadcast(targetDistrict = null) {
    const students = await query.all(
      `SELECT * FROM enrolled_registry_data WHERE is_availing_scholarship = 0`
    );

    // Simulate sending SMS / Push notification outreach
    const outreachLogs = students.map((s) => ({
      apaarId: s.apaar_id,
      name: s.student_name,
      institution: s.institution_name,
      district: s.district,
      recommendedScheme: s.eligible_scheme,
      messageSent: `Namaste ${s.student_name}! MoTA records show you are enrolled at ${s.institution_name} and eligible for the ${s.eligible_scheme} Scholarship. Apply easily with your 14-digit OTR.`,
      dispatchedAt: new Date().toISOString()
    }));

    return {
      success: true,
      broadcastCount: outreachLogs.length,
      outreachLogs
    };
  }
}

module.exports = OutreachService;
