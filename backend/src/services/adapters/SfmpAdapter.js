/**
 * Adapter for SFMP (Scholarship Fellowship Management Portal - Canara Bank)
 * Handles: National Fellowship for ST Students (NFST - M.Phil / Ph.D.)
 */
class SfmpAdapter {
  static normalizeStage(sfmpStatus) {
    switch (sfmpStatus?.toUpperCase()) {
      case 'APPLICATION_FILED':
      case 'SUBMITTED':
        return 'SUBMITTED';
      case 'UNIVERSITY_NODAL_CLEARED':
        return 'INSTITUTE_VERIFIED';
      case 'UGC_NTA_VERIFIED':
      case 'FELLOWSHIP_SCRUTINY_PASS':
        return 'DISTRICT_VERIFIED';
      case 'AWARD_LETTER_ISSUED':
      case 'SANCTION_CLEARANCE':
        return 'STATE_SANCTIONED';
      case 'CANARA_DBT_RELEASED':
      case 'DISBURSED':
        return 'DISBURSED';
      case 'DISCREPANCY_FLAGGED':
      case 'DEFICIENCY':
        return 'FLAGGED_DEFICIENCY';
      default:
        return 'SUBMITTED';
    }
  }

  static formatRecord(rawRecord) {
    return {
      applicationNumber: rawRecord.application_number,
      sourcePortal: 'SFMP',
      schemeId: 'NFST',
      schemeName: 'National Fellowship for ST Students',
      academicYear: rawRecord.academic_year,
      currentStage: this.normalizeStage(rawRecord.current_stage),
      sanctionedAmount: rawRecord.sanctioned_amount || 0,
      disbursedAmount: rawRecord.disbursed_amount || 0,
      dbtStatus: rawRecord.dbt_status || 'PENDING',
      utrNumber: rawRecord.utr_number,
      disbursedAt: rawRecord.disbursed_at
    };
  }
}

module.exports = SfmpAdapter;
