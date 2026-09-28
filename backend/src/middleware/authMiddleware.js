const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'mota_tribal_scholarship_super_secret_jwt_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please login.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = user;
    next();
  });
}

function requireOfficer(req, res, next) {
  if (!req.user || (req.user.role !== 'OFFICER' && req.user.role !== 'ADMIN')) {
    return res.status(403).json({ error: 'Unauthorized. Official/Officer privileges required.' });
  }
  next();
}

module.exports = { authenticateToken, requireOfficer, JWT_SECRET };
