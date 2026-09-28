const { query } = require('../config/db');

async function initSchema() {
  console.log('Initializing database tables...');

  // Users table
  await query.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      otr_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      aadhaar_hash TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'STUDENT',
      caste_category TEXT DEFAULT 'ST',
      sub_tribe TEXT,
      pvtg_status INTEGER DEFAULT 0,
      annual_income REAL DEFAULT 0.0,
      institution_name TEXT,
      aishe_code TEXT,
      course_name TEXT,
      bank_name TEXT,
      account_number TEXT,
      ifsc_code TEXT,
      aadhaar_seeded INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Schemes table
  await query.exec(`
    CREATE TABLE IF NOT EXISTS schemes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_portal TEXT NOT NULL,
      description TEXT NOT NULL,
      target_audience TEXT NOT NULL,
      income_ceiling REAL,
      benefits_summary TEXT,
      is_active INTEGER DEFAULT 1
    );
  `);

  // Applications table
  await query.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      scheme_id TEXT NOT NULL,
      source_portal TEXT NOT NULL,
      portal_application_id TEXT,
      academic_year TEXT NOT NULL DEFAULT '2025-2026',
      current_stage TEXT NOT NULL DEFAULT 'SUBMITTED',
      sanctioned_amount REAL DEFAULT 0.0,
      disbursed_amount REAL DEFAULT 0.0,
      dbt_status TEXT DEFAULT 'PENDING',
      utr_number TEXT,
      disbursed_at DATETIME,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (scheme_id) REFERENCES schemes(id)
    );
  `);

  // Application Stages table (Chronological timeline tracking)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS application_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      stage_key TEXT NOT NULL,
      stage_label TEXT NOT NULL,
      status TEXT NOT NULL,
      remarks TEXT,
      officer_name TEXT,
      completed_at DATETIME,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
  `);

  // Documents table (Digital Wallet & DigiLocker reusability)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date TEXT,
      is_digilocker_verified INTEGER DEFAULT 0,
      digilocker_uri TEXT,
      digital_signature_hash TEXT,
      reusable INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Deficiencies table (Direct Action Items for Student)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS deficiencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      severity TEXT DEFAULT 'WARNING',
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      action_type TEXT NOT NULL,
      target_doc_type TEXT,
      is_resolved INTEGER DEFAULT 0,
      resolution_remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
    );
  `);

  // Verification Queue (Exceptions routed for Human Review)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS verification_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      scheme_id TEXT NOT NULL,
      overall_confidence REAL NOT NULL,
      status TEXT DEFAULT 'PENDING_MANUAL_REVIEW',
      checks_summary TEXT,
      discrepancy_field TEXT,
      submitted_value TEXT,
      registry_value TEXT,
      registry_source TEXT,
      officer_remarks TEXT,
      reviewed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Notifications table
  await query.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'INFO',
      action_route TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Enrolled Registry Data (UDISE+/AISHE ST roll mock for Coverage Gap Analysis)
  await query.exec(`
    CREATE TABLE IF NOT EXISTS enrolled_registry_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apaar_id TEXT UNIQUE NOT NULL,
      student_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      caste_category TEXT NOT NULL,
      institution_code TEXT NOT NULL,
      institution_name TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      eligible_scheme TEXT NOT NULL,
      is_availing_scholarship INTEGER DEFAULT 0,
      otr_number TEXT
    );
  `);

  console.log('Database tables initialized successfully.');
}

module.exports = { initSchema };
