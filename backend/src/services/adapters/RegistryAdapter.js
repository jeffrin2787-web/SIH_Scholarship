/**
 * Registry Adapter
 * Simulates external registry verification lookups:
 * - UIDAI (Identity & demographic check)
 * - AISHE (Higher Education Institution & roll numbers)
 * - UDISE+ (School Student Enrollment roll numbers)
 * - UGC-NTA (National Testing Agency NET/JRF fellowship status)
 */
class RegistryAdapter {
  static verifyAadhaar(aadhaarNumber, expectedName, expectedDob) {
    return {
      source: 'UIDAI',
      status: 'MATCH_FOUND',
      demographicMatch: true,
      registeredName: expectedName,
      aadhaarLinkedBank: true
    };
  }

  static verifyEnrollment(instituteCode, studentName, rollNumber) {
    const isSchool = instituteCode.startsWith('UDISE');
    return {
      source: isSchool ? 'UDISE+' : 'AISHE',
      institutionCode: instituteCode,
      studentName: studentName,
      status: 'ACTIVE_ENROLLMENT',
      academicSession: '2025-2026',
      attendancePercentage: 84.5
    };
  }

  static verifyUgcNetJrf(rollNumber, studentName) {
    // Simulates checking National Testing Agency fellowship roll
    return {
      source: 'UGC-NTA',
      rollNumber: rollNumber,
      candidateName: studentName,
      qualifiedSubject: 'Tribal and Regional Studies',
      awardLetterIssued: true,
      validTill: '2027-12-31'
    };
  }
}

module.exports = RegistryAdapter;
