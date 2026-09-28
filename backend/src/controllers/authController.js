const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function generateOtrNumber() {
  const currentYear = new Date().getFullYear();
  const randomTenDigits = Math.floor(1000000000 + Math.random() * 9000000000);
  return `${currentYear}${randomTenDigits}`; // 14-digit OTR
}

class AuthController {
  static async register(req, res) {
    try {
      const {
        name,
        email,
        phone,
        aadhaarNumber,
        password,
        casteCategory = 'ST',
        subTribe,
        isPvtg = 0,
        annualIncome = 0,
        institutionName,
        aisheCode,
        courseName,
        bankName,
        accountNumber,
        ifscCode
      } = req.body;

      if (!name || !email || !password || !phone) {
        return res.status(400).json({ error: 'Name, email, phone, and password are required.' });
      }

      // Check if user already exists
      const existingUser = await query.get(
        `SELECT id FROM users WHERE email = ?`,
        [email.toLowerCase()]
      );
      if (existingUser) {
        return res.status(400).json({ error: 'A student profile with this email already exists.' });
      }

      const otrNumber = generateOtrNumber();
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const aadhaarHash = aadhaarNumber ? `XXXX-XXXX-${aadhaarNumber.slice(-4)}` : 'XXXX-XXXX-0000';

      const result = await query.run(
        `INSERT INTO users (
          otr_number, name, email, phone, aadhaar_hash, password_hash, role,
          caste_category, sub_tribe, pvtg_status, annual_income, institution_name,
          aishe_code, course_name, bank_name, account_number, ifsc_code, aadhaar_seeded
        ) VALUES (?, ?, ?, ?, ?, ?, 'STUDENT', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          otrNumber,
          name,
          email.toLowerCase(),
          phone,
          aadhaarHash,
          passwordHash,
          casteCategory,
          subTribe || 'Generic ST',
          isPvtg ? 1 : 0,
          parseFloat(annualIncome) || 0,
          institutionName || 'Affiliated Institution',
          aisheCode || 'C-99000',
          courseName || 'General Academic',
          bankName || 'State Bank of India',
          accountNumber || '10002938491',
          ifscCode || 'SBIN0000100'
        ]
      );

      // Create welcome notification
      await query.run(
        `INSERT INTO notifications (user_id, title, message, type, action_route)
         VALUES (?, ?, ?, 'MILESTONE', 'Dashboard')`,
        [
          result.id,
          '14-Digit OTR Generated Successfully',
          `Welcome to MoTA Unified Scholarship Portal! Your One-Time Registration number is ${otrNumber}. Use this across all 5 schemes.`
        ]
      );

      const token = jwt.sign(
        { id: result.id, otr: otrNumber, role: 'STUDENT', name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Registration successful! 14-digit OTR generated.',
        user: {
          id: result.id,
          otrNumber,
          name,
          email: email.toLowerCase(),
          role: 'STUDENT',
          casteCategory
        },
        token
      });
    } catch (err) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Failed to create student account.' });
    }
  }

  static async login(req, res) {
    try {
      const { identifier, password } = req.body; // identifier can be OTR number, email, or phone

      if (!identifier || !password) {
        return res.status(400).json({ error: 'OTR Number / Email and password are required.' });
      }

      const user = await query.get(
        `SELECT * FROM users
         WHERE otr_number = ? OR email = ? OR phone = ?`,
        [identifier.trim(), identifier.trim().toLowerCase(), identifier.trim()]
      );

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. User not found.' });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      }

      const token = jwt.sign(
        { id: user.id, otr: user.otr_number, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          otrNumber: user.otr_number,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          casteCategory: user.caste_category,
          subTribe: user.sub_tribe,
          pvtgStatus: user.pvtg_status,
          institutionName: user.institution_name,
          courseName: user.course_name,
          annualIncome: user.annual_income,
          bankName: user.bank_name,
          accountNumber: user.account_number,
          aadhaarSeeded: user.aadhaar_seeded
        },
        token
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Authentication failed.' });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await query.get(
        `SELECT id, otr_number, name, email, phone, aadhaar_hash, role,
                caste_category, sub_tribe, pvtg_status, annual_income,
                institution_name, aishe_code, course_name, bank_name,
                account_number, ifsc_code, aadhaar_seeded, created_at
         FROM users WHERE id = ?`,
        [req.user.id]
      );

      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({ profile: user });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve profile' });
    }
  }

  static async updateBankDetails(req, res) {
    try {
      const { bankName, accountNumber, ifscCode, aadhaarSeeded = 1 } = req.body;
      await query.run(
        `UPDATE users
         SET bank_name = ?, account_number = ?, ifsc_code = ?, aadhaar_seeded = ?
         WHERE id = ?`,
        [bankName, accountNumber, ifscCode, aadhaarSeeded ? 1 : 0, req.user.id]
      );

      return res.json({ message: 'Bank and DBT seeding details updated successfully.' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to update bank details.' });
    }
  }
}

module.exports = AuthController;
