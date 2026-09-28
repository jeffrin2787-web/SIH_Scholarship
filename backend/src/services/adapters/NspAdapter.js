/**
 * Adapter for National Scholarship Portal (NSP)
 * Handles: Pre-Matric, Post-Matric, Top Class Education for ST
 */
class NspAdapter {
  static normalizeStage(nspStatus) {
    switch (nspStatus?.toUpperCase()) {
      case 'APPLICATION_ACCEPTED':
      case 'SUBMITTED':
        return 'SUBMITTED';
      case 'INSTITUTE_VERIFIED':
      case 'L1_VERIFIED':
        return 'INSTITUTE_VERIFIED';
      case 'DISTRICT_VERIFIED':
      case 'L2_VERIFIED':
        return 'DISTRICT_VERIFIED';
      case 'MERIT_LIST_GENERATED':
      case 'SANCTION_APPROVED':
        return 'STATE_SANCTIONED';
      case 'PAYMENT_SUCCESSFUL':
      case 'DISBURSED':
        return 'DISBURSED';
      case 'DEFECTIVE':
        return 'FLAGGED_DEFICIENCY';
      default:
        return 'SUBMITTED';
    }
  }

  static formatRecord(rawRecord) {
    return {
      applicationNumber: rawRecord.application_number,
      sourcePortal: 'NSP',
      schemeId: rawRecord.scheme_id,
      schemeName: rawRecord.scheme_name,
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

module.exports = NspAdapter;
