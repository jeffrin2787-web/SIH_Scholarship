const bcrypt = require('bcryptjs');
const { query } = require('../config/db');
const { initSchema } = require('./initDb');

async function seed() {
  await initSchema();

  console.log('Clearing existing data for fresh seed...');
  await query.exec(`
    DELETE FROM enrolled_registry_data;
    DELETE FROM notifications;
    DELETE FROM verification_queue;
    DELETE FROM deficiencies;
    DELETE FROM documents;
    DELETE FROM application_stages;
    DELETE FROM applications;
    DELETE FROM schemes;
    DELETE FROM users;
  `);

  console.log('Seeding Schemes...');
  const schemes = [
    {
      id: 'PRE_MATRIC',
      name: 'Pre-Matric Scholarship for ST Students',
      source_portal: 'NSP',
      description: 'Financial support to ST students studying in Classes IX and X to minimize dropout rates.',
      target_audience: 'Class IX & X ST Students',
      income_ceiling: 250000.0,
      benefits_summary: 'Day Scholar: ₹3,500/year | Hosteller: ₹7,000/year + Book grant'
    },
    {
      id: 'POST_MATRIC',
      name: 'Post-Matric Scholarship for ST Students',
      source_portal: 'NSP',
      description: 'Comprehensive scholarship covering tuition, maintenance, and study tours from Class XI through Master/PhD.',
      target_audience: 'Class XI to Postgraduate / Professional Courses',
      income_ceiling: 250000.0,
      benefits_summary: 'Tuition fees reimbursement + Maintenance allowance up to ₹13,500/year'
    },
    {
      id: 'TOP_CLASS',
      name: 'Top Class Education Scheme for ST Students',
      source_portal: 'NSP',
      description: 'Full financial support for ST students admitted to notified premier institutes (IITs, IIMs, AIIMS, NLUs).',
      target_audience: 'Premier Institute ST Scholars',
      income_ceiling: 600000.0,
      benefits_summary: 'Full tuition fee + Living expense ₹3,000/month + Books ₹5,000/year + Computer ₹45,000 one-time'
    },
    {
      id: 'NFST',
      name: 'National Fellowship for Higher Education of ST Students',
      source_portal: 'SFMP',
      description: 'Direct fellowship for ST candidates pursuing regular M.Phil. and Ph.D. degrees in Indian Universities.',
      target_audience: 'M.Phil / Ph.D. Research Scholars (NET/JRF qualified)',
      income_ceiling: null,
      benefits_summary: 'JRF: ₹37,000/month | SRF: ₹42,000/month + Annual Contingency ₹20,500'
    },
    {
      id: 'NOS',
      name: 'National Overseas Scholarship for ST Students',
      source_portal: 'NOS_PORTAL',
      description: 'Financial assistance to selected ST students for pursuing Master-level courses and Ph.D. abroad.',
      target_audience: 'Overseas Master / Ph.D. Aspirants',
      income_ceiling: 600000.0,
      benefits_summary: 'Annual maintenance £9,900 (UK) / $15,400 (USA) + Full tuition fees + Airfare'
    }
  ];

  for (const s of schemes) {
    await query.run(
      `INSERT INTO schemes (id, name, source_portal, description, target_audience, income_ceiling, benefits_summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.name, s.source_portal, s.description, s.target_audience, s.income_ceiling, s.benefits_summary]
    );
  }

  console.log('Seeding Users...');
  const salt = await bcrypt.genSalt(10);
  const studentPassword = await bcrypt.hash('Student@123', salt);
  const officerPassword = await bcrypt.hash('Officer@123', salt);

  // Student 1: Sunita Soren (Active Post-Matric)
  const user1 = await query.run(
    `INSERT INTO users (
      otr_number, name, email, phone, aadhaar_hash, password_hash, role,
      caste_category, sub_tribe, pvtg_status, annual_income, institution_name,
      aishe_code, course_name, bank_name, account_number, ifsc_code, aadhaar_seeded
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '20268839201941',
      'Sunita Soren',
      'sunita.soren@example.edu',
      '9876543210',
      'XXXX-XXXX-9021',
      studentPassword,
      'STUDENT',
      'ST',
      'Santhal',
      0,
      140000.0,
      'Ranchi University College of Science',
      'C-41982',
      'B.Sc Computer Science (2nd Year)',
      'State Bank of India',
      '30987654321',
      'SBIN0000167',
      1
    ]
  );

  // Student 2: Rajesh Kumar Munda (Disbursed Pre-Matric)
  const user2 = await query.run(
    `INSERT INTO users (
      otr_number, name, email, phone, aadhaar_hash, password_hash, role,
      caste_category, sub_tribe, pvtg_status, annual_income, institution_name,
      aishe_code, course_name, bank_name, account_number, ifsc_code, aadhaar_seeded
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '20267711442290',
      'Rajesh Kumar Munda',
      'rajesh.munda@example.edu',
      '9811223344',
      'XXXX-XXXX-4412',
      studentPassword,
      'STUDENT',
      'ST',
      'Munda',
      1, // PVTG Birhor
      85000.0,
      'Eklavya Model Residential School (EMRS) Torpa',
      'UDISE-20040100201',
      'Class X',
      'Bank of India',
      '489910110022341',
      'BKID0004899',
      1
    ]
  );

  // Student 3: Anjali Kerketta (NFST Fellowship under review)
  const user3 = await query.run(
    `INSERT INTO users (
      otr_number, name, email, phone, aadhaar_hash, password_hash, role,
      caste_category, sub_tribe, pvtg_status, annual_income, institution_name,
      aishe_code, course_name, bank_name, account_number, ifsc_code, aadhaar_seeded
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      '20265533119933',
      'Anjali Kerketta',
      'anjali.kerketta@example.edu',
      '9765432109',
      'XXXX-XXXX-8823',
      studentPassword,
      'STUDENT',
      'ST',
      'Oraon',
      0,
      195000.0,
      'Jawaharlal Nehru University (JNU), New Delhi',
      'U-0109',
      'Ph.D. in Tribal Linguistics',
      'Canara Bank',
      '110098765432',
      'CNRB0001100',
      1
    ]
  );

  // Officer / Admin: MoTA Nodal Reviewer
  await query.run(
    `INSERT INTO users (
      otr_number, name, email, phone, aadhaar_hash, password_hash, role,
      caste_category, sub_tribe, pvtg_status, annual_income, institution_name,
      aishe_code, course_name, bank_name, account_number, ifsc_code, aadhaar_seeded
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'OFFICER202601',
      'Dr. Ramesh Chandra Meena',
      'officer@mota.gov.in',
      '9988776655',
      'XXXX-XXXX-1100',
      officerPassword,
      'OFFICER',
      'ST',
      'Meena',
      0,
      0.0,
      'Ministry of Tribal Affairs, Shastri Bhawan',
      'GOI-MOTA-01',
      'Director of Tribal Welfare',
      null, null, null, 1
    ]
  );

  console.log('Seeding Applications & Lifecycles...');

  // Application 1: Sunita Soren -> Post-Matric (Under District Verification, Sanction pending)
  const app1 = await query.run(
    `INSERT INTO applications (
      application_number, user_id, scheme_id, source_portal, portal_application_id,
      academic_year, current_stage, sanctioned_amount, disbursed_amount, dbt_status, utr_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'NSP-202526-POST-99182',
      user1.id,
      'POST_MATRIC',
      'NSP',
      'NSP2025ST0099182',
      '2025-2026',
      'DISTRICT_VERIFIED',
      18500.0,
      0.0,
      'AWAITING_STATE_SANCTION',
      null
    ]
  );

  const stagesApp1 = [
    { key: 'SUBMITTED', label: 'Application Submitted', status: 'COMPLETED', remarks: 'Submitted with DigiLocker verified ST Certificate.', officer: 'System Auto-Accept', date: '2025-08-15 10:30:00' },
    { key: 'INSTITUTE_VERIFIED', label: 'Institute Verification (L1)', status: 'COMPLETED', remarks: 'Roll number, attendance (82%), and AISHE enrollment validated.', officer: 'Prof. S. K. Mahato (Nodal Officer)', date: '2025-08-28 14:15:00' },
    { key: 'DISTRICT_VERIFIED', label: 'District Welfare Scrutiny (L2)', status: 'COMPLETED', remarks: 'Caste & Residence authenticated against State e-District record.', officer: 'P. Linda (District Tribal Welfare Officer)', date: '2025-09-12 16:45:00' },
    { key: 'STATE_SANCTIONED', label: 'State Sanction Order', status: 'CURRENT', remarks: 'Batch sanction order generation in progress.', officer: 'Directorate of Tribal Welfare', date: null },
    { key: 'DISBURSED', label: 'DBT Direct Benefit Transfer', status: 'PENDING', remarks: 'PFMS electronic release to Aadhaar seeded bank account.', officer: 'Public Financial Management System', date: null }
  ];

  for (const stg of stagesApp1) {
    await query.run(
      `INSERT INTO application_stages (application_id, stage_key, stage_label, status, remarks, officer_name, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [app1.id, stg.key, stg.label, stg.status, stg.remarks, stg.officer, stg.date]
    );
  }

  // Deficiency for Sunita (Expired income cert)
  await query.run(
    `INSERT INTO deficiencies (application_id, code, severity, title, message, action_type, target_doc_type, is_resolved)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      app1.id,
      'INCOME_CERT_RENEWAL',
      'WARNING',
      'Income Certificate Renewal Required for Next Academic Term',
      'Your existing income certificate expires on 31-March-2026. Please pull your latest income certificate via DigiLocker to ensure uninterrupted disbursement.',
      'UPLOAD_DOCUMENT',
      'INCOME_CERTIFICATE',
      0
    ]
  );

  // Application 2: Rajesh Kumar Munda -> Pre-Matric (Disbursed)
  const app2 = await query.run(
    `INSERT INTO applications (
      application_number, user_id, scheme_id, source_portal, portal_application_id,
      academic_year, current_stage, sanctioned_amount, disbursed_amount, dbt_status, utr_number, disbursed_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'NSP-202526-PRE-44018',
      user2.id,
      'PRE_MATRIC',
      'NSP',
      'NSP2025PRE44018',
      '2025-2026',
      'DISBURSED',
      7000.0,
      7000.0,
      'CREDITED_TO_ACCOUNT',
      'UTR20250918BOI994821',
      '2025-09-18 11:20:00'
    ]
  );

  const stagesApp2 = [
    { key: 'SUBMITTED', label: 'Application Submitted', status: 'COMPLETED', remarks: 'EMRS School portal auto-push.', officer: 'System Auto-Accept', date: '2025-07-10 09:00:00' },
    { key: 'INSTITUTE_VERIFIED', label: 'Institute Verification (L1)', status: 'COMPLETED', remarks: 'Principal confirmed residential hostel status.', officer: 'Principal EMRS Torpa', date: '2025-07-22 11:00:00' },
    { key: 'DISTRICT_VERIFIED', label: 'District Scrutiny (L2)', status: 'COMPLETED', remarks: 'PVTG Birhor priority verification passed.', officer: 'Khunti DTO', date: '2025-08-05 15:30:00' },
    { key: 'STATE_SANCTIONED', label: 'Sanction Order Issued', status: 'COMPLETED', remarks: 'Sanction Order #JH-MOTA-PRE-2025-992', officer: 'State Project Director', date: '2025-08-25 14:00:00' },
    { key: 'DISBURSED', label: 'DBT Direct Benefit Transfer', status: 'COMPLETED', remarks: 'Amount ₹7,000 credited to Bank of India AC ending ...2341.', officer: 'PFMS Govt of India', date: '2025-09-18 11:20:00' }
  ];

  for (const stg of stagesApp2) {
    await query.run(
      `INSERT INTO application_stages (application_id, stage_key, stage_label, status, remarks, officer_name, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [app2.id, stg.key, stg.label, stg.status, stg.remarks, stg.officer, stg.date]
    );
  }

  // Application 3: Anjali Kerketta -> NFST (National Fellowship on SFMP / Canara Bank)
  const app3 = await query.run(
    `INSERT INTO applications (
      application_number, user_id, scheme_id, source_portal, portal_application_id,
      academic_year, current_stage, sanctioned_amount, disbursed_amount, dbt_status, utr_number
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'SFMP-202526-NFST-0192',
      user3.id,
      'NFST',
      'SFMP',
      'CNRB-NFST-2025-8812',
      '2025-2026',
      'FLAGGED_DEFICIENCY',
      444000.0, // 37k/mo fellowship
      0.0,
      'PENDING_VERIFICATION_CLEARANCE',
      null
    ]
  );

  const stagesApp3 = [
    { key: 'SUBMITTED', label: 'Application Submitted', status: 'COMPLETED', remarks: 'Submitted on Canara Bank SFMP Portal.', officer: 'System', date: '2025-09-01 12:00:00' },
    { key: 'INSTITUTE_VERIFIED', label: 'JNU Nodal Scrutiny', status: 'COMPLETED', remarks: 'Dean of Language Studies endorsed Ph.D. registration.', officer: 'JNU Nodal Cell', date: '2025-09-10 15:30:00' },
    { key: 'VERIFICATION_ENGINE', label: 'Automated Registry Verification', status: 'FLAGGED', remarks: 'Name variance on UGC-NTA score card (Anjali K. Kerketta vs Anjali Kerketta). Routed to Manual Review Queue.', officer: 'MoTA Smart Automation', date: '2025-09-11 10:00:00' },
    { key: 'STATE_SANCTIONED', label: 'Ministry Fellowship Sanction', status: 'PENDING', remarks: 'Awaiting officer sign-off on name discrepancy.', officer: 'MoTA New Delhi', date: null },
    { key: 'DISBURSED', label: 'Quarterly Fellowship Credit', status: 'PENDING', remarks: 'Direct DBT release by Canara Bank.', officer: 'Canara Bank SFMP Cell', date: null }
  ];

  for (const stg of stagesApp3) {
    await query.run(
      `INSERT INTO application_stages (application_id, stage_key, stage_label, status, remarks, officer_name, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [app3.id, stg.key, stg.label, stg.status, stg.remarks, stg.officer, stg.date]
    );
  }

  // Seed Verification Queue for Anjali (Exception routed to human reviewer)
  await query.run(
    `INSERT INTO verification_queue (
      application_id, user_id, scheme_id, overall_confidence, status,
      checks_summary, discrepancy_field, submitted_value, registry_value,
      registry_source, officer_remarks
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      app3.id,
      user3.id,
      'NFST',
      84.5,
      'PENDING_MANUAL_REVIEW',
      JSON.stringify({
        aadhaar_identity: { score: 100, status: 'PASSED' },
        caste_certificate: { score: 100, status: 'PASSED', cert_no: 'JH-ST-2023-99481' },
        ugc_net_jrf: { score: 69, status: 'FLAGGED', reason: 'Name Initial Variance' },
        university_enrollment: { score: 100, status: 'PASSED', aishe: 'U-0109' }
      }),
      'Student Name on UGC-NTA NET Certificate',
      'Anjali Kerketta',
      'Anjali K. Kerketta',
      'UGC-NTA National Testing Agency Registry',
      'Name has middle initial "K." (Kerketta). Roll #2024-NET-09941 matches subject Tribal and Regional Languages.'
    ]
  );

  console.log('Seeding DigiLocker Digital Document Wallet...');
  const documents = [
    {
      user_id: user1.id,
      doc_type: 'CASTE_CERTIFICATE',
      title: 'Scheduled Tribe Caste Certificate',
      file_url: 'https://digilocker.gov.in/issued/JH/ST/JH-ST-2022-884920.pdf',
      issuer: 'Sub-Divisional Officer, Ranchi, Govt of Jharkhand',
      issue_date: '2022-06-14',
      is_digilocker_verified: 1,
      digilocker_uri: 'in.gov.jharkhand.edistrict:caste-JH-ST-2022-884920',
      digital_signature_hash: 'SHA256:88F9A01C48912E3B212948AC48F190B'
    },
    {
      user_id: user1.id,
      doc_type: 'INCOME_CERTIFICATE',
      title: 'Income Certificate (FY 2024-25)',
      file_url: 'https://digilocker.gov.in/issued/JH/INC/JH-INC-2024-11029.pdf',
      issuer: 'Circle Officer, Kanke, Ranchi',
      issue_date: '2024-04-10',
      is_digilocker_verified: 1,
      digilocker_uri: 'in.gov.jharkhand.edistrict:income-JH-INC-2024-11029',
      digital_signature_hash: 'SHA256:77A8B91F001923CD661848E2198089F'
    },
    {
      user_id: user1.id,
      doc_type: 'MARKSHEET_12',
      title: 'Class XII Higher Secondary Marksheet',
      file_url: 'https://digilocker.gov.in/issued/JAC/HSC/2023-88910.pdf',
      issuer: 'Jharkhand Academic Council (JAC), Ranchi',
      issue_date: '2023-05-30',
      is_digilocker_verified: 1,
      digilocker_uri: 'in.gov.jac:marksheet-12-2023-88910',
      digital_signature_hash: 'SHA256:44E119B0018C6793A000193EAA45892'
    },
    {
      user_id: user2.id,
      doc_type: 'CASTE_CERTIFICATE',
      title: 'PVTG Birhor Tribe Certificate',
      file_url: 'https://digilocker.gov.in/issued/JH/ST/JH-ST-2021-99018.pdf',
      issuer: 'Deputy Commissioner, Khunti, Jharkhand',
      issue_date: '2021-08-19',
      is_digilocker_verified: 1,
      digilocker_uri: 'in.gov.jharkhand.edistrict:caste-JH-ST-2021-99018',
      digital_signature_hash: 'SHA256:550189AB22C79018449D0012E481977'
    },
    {
      user_id: user3.id,
      doc_type: 'UGC_NET_JRF',
      title: 'UGC-NET JRF Eligibility Certificate',
      file_url: 'https://digilocker.gov.in/issued/NTA/NET/2024-09941.pdf',
      issuer: 'National Testing Agency (UGC-NTA)',
      issue_date: '2024-07-25',
      is_digilocker_verified: 1,
      digilocker_uri: 'in.gov.nta:net-jrf-2024-09941',
      digital_signature_hash: 'SHA256:338810BCDF901248A99100346E8912C'
    }
  ];

  for (const doc of documents) {
    await query.run(
      `INSERT INTO documents (
        user_id, doc_type, title, file_url, issuer, issue_date,
        is_digilocker_verified, digilocker_uri, digital_signature_hash, reusable
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [doc.user_id, doc.doc_type, doc.title, doc.file_url, doc.issuer, doc.issue_date, doc.is_digilocker_verified, doc.digilocker_uri, doc.digital_signature_hash]
    );
  }

  console.log('Seeding Notifications...');
  const notifications = [
    {
      user_id: user1.id,
      title: 'Application Passed District Verification',
      message: 'Your Post-Matric application #NSP-202526-POST-99182 has cleared District Level Scrutiny.',
      type: 'MILESTONE',
      action_route: 'Dashboard'
    },
    {
      user_id: user1.id,
      title: 'Income Certificate Renewal Needed',
      message: 'Ensure you renew your income certificate before 31-March-2026 to prevent renewal disbursement delays.',
      type: 'DEFICIENCY',
      action_route: 'Wallet'
    },
    {
      user_id: user2.id,
      title: 'DBT Payment Disbursed: ₹7,000 Credited',
      message: '₹7,000 has been credited to your Bank of India account via PFMS DBT. Ref: UTR20250918BOI994821.',
      type: 'DISBURSEMENT',
      action_route: 'Dashboard'
    }
  ];

  for (const n of notifications) {
    await query.run(
      `INSERT INTO notifications (user_id, title, message, type, action_route)
       VALUES (?, ?, ?, ?, ?)`,
      [n.user_id, n.title, n.message, n.type, n.action_route]
    );
  }

  console.log('Seeding UDISE+/AISHE Registry Records for Coverage Gap Detection...');
  const registryStudents = [
    {
      apaar_id: 'APAAR-2026-9001',
      student_name: 'Birsa Ho',
      dob: '2008-03-12',
      caste_category: 'ST',
      institution_code: 'UDISE-20040100412',
      institution_name: 'Govt High School Chaibasa, West Singhbhum',
      district: 'West Singhbhum',
      state: 'Jharkhand',
      eligible_scheme: 'PRE_MATRIC',
      is_availing_scholarship: 0,
      otr_number: null
    },
    {
      apaar_id: 'APAAR-2026-9002',
      student_name: 'Salomi Marandi',
      dob: '2006-11-20',
      caste_category: 'ST',
      institution_code: 'AISHE-C-22901',
      institution_name: 'St. Xaviers College, Simdega',
      district: 'Simdega',
      state: 'Jharkhand',
      eligible_scheme: 'POST_MATRIC',
      is_availing_scholarship: 0,
      otr_number: null
    },
    {
      apaar_id: 'APAAR-2026-9003',
      student_name: 'Karan Gond',
      dob: '2007-05-18',
      caste_category: 'ST',
      institution_code: 'UDISE-22010400192',
      institution_name: 'EMRS Bastar Higher Secondary',
      district: 'Bastar',
      state: 'Chhattisgarh',
      eligible_scheme: 'PRE_MATRIC',
      is_availing_scholarship: 0,
      otr_number: null
    },
    {
      apaar_id: 'APAAR-2026-9004',
      student_name: 'Manish Bhil',
      dob: '2005-09-04',
      caste_category: 'ST',
      institution_code: 'AISHE-C-55102',
      institution_name: 'Govt College Jhabua',
      district: 'Jhabua',
      state: 'Madhya Pradesh',
      eligible_scheme: 'POST_MATRIC',
      is_availing_scholarship: 0,
      otr_number: null
    },
    {
      apaar_id: 'APAAR-2026-9005',
      student_name: 'Sunita Soren',
      dob: '2005-07-15',
      caste_category: 'ST',
      institution_code: 'AISHE-C-41982',
      institution_name: 'Ranchi University College of Science',
      district: 'Ranchi',
      state: 'Jharkhand',
      eligible_scheme: 'POST_MATRIC',
      is_availing_scholarship: 1,
      otr_number: '20268839201941'
    }
  ];

  for (const reg of registryStudents) {
    await query.run(
      `INSERT INTO enrolled_registry_data (
        apaar_id, student_name, dob, caste_category, institution_code,
        institution_name, district, state, eligible_scheme, is_availing_scholarship, otr_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reg.apaar_id, reg.student_name, reg.dob, reg.caste_category,
        reg.institution_code, reg.institution_name, reg.district,
        reg.state, reg.eligible_scheme, reg.is_availing_scholarship, reg.otr_number
      ]
    );
  }

  console.log('Seeding completed successfully!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = { seed };
