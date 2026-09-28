/**
 * Adapter for National Overseas Scholarship (NOS) Standalone Portal
 * Handles: ST scholars pursuing Master's and Ph.D. overseas
 */
class NosAdapter {
  static normalizeStage(nosStatus) {
    switch (nosStatus?.toUpperCase()) {
      case 'APPLIED':
      case 'SUBMITTED':
        return 'SUBMITTED';
      case 'DOCUMENTS_VERIFIED':
        return 'INSTITUTE_VERIFIED';
      case 'EMBASSY_CONSENT_RECEIVED':
      case 'SELECTION_COMMITTEE_CLEARED':
        return 'DISTRICT_VERIFIED';
      case 'PROVISIONAL_AWARD_SANCTIONED':
        return 'STATE_SANCTIONED';
      case 'FEES_AIRFARE_DISBURSED':
      case 'DISBURSED':
        return 'DISBURSED';
      case 'DOC_DEFICIENT':
        return 'FLAGGED_DEFICIENCY';
      default:
        return 'SUBMITTED';
    }
  }

  static formatRecord(rawRecord) {
    return {
      applicationNumber: rawRecord.application_number,
      sourcePortal: 'NOS_PORTAL',
      schemeId: 'NOS',
      schemeName: 'National Overseas Scholarship for ST Students',
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

module.exports = NosAdapter;
