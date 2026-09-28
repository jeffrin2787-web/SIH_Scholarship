const express = require('express');
const router = express.Router();

const { authenticateToken, requireOfficer } = require('../middleware/authMiddleware');
const AuthController = require('../controllers/authController');
const ApplicationController = require('../controllers/applicationController');
const DocumentController = require('../controllers/documentController');
const JagoController = require('../controllers/jagoController');
const AdminController = require('../controllers/adminController');
const NotificationController = require('../controllers/notificationController');

// --- Health Check ---
router.get('/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'MoTA Unified Scholarship Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// --- Auth Routes ---
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.get('/auth/profile', authenticateToken, AuthController.getProfile);
router.put('/auth/bank-details', authenticateToken, AuthController.updateBankDetails);

// --- Schemes & Applications ---
router.get('/schemes', ApplicationController.getSchemes);
router.get('/applications/my-applications', authenticateToken, ApplicationController.getMyApplications);
router.get('/applications/:id', authenticateToken, ApplicationController.getApplicationById);
router.post('/applications/apply', authenticateToken, ApplicationController.applyForScheme);
router.post('/applications/deficiencies/:deficiencyId/resolve', authenticateToken, ApplicationController.resolveDeficiency);

// --- Digital Document Wallet & DigiLocker ---
router.get('/wallet/documents', authenticateToken, DocumentController.getMyDocuments);
router.post('/wallet/sync-digilocker', authenticateToken, DocumentController.syncDigiLocker);
router.post('/wallet/upload', authenticateToken, DocumentController.uploadDocument);

// --- JAGO AI Conversational Assistant ---
router.post('/jago/chat', authenticateToken, JagoController.chat);

// --- Notifications ---
router.get('/notifications', authenticateToken, NotificationController.getMyNotifications);
router.put('/notifications/:id/read', authenticateToken, NotificationController.markAsRead);
router.put('/notifications/read-all', authenticateToken, NotificationController.markAllAsRead);

// --- Admin & Officer Portal ---
router.get('/admin/review-queue', authenticateToken, requireOfficer, AdminController.getReviewQueue);
router.post('/admin/review-queue/:queueId/decision', authenticateToken, requireOfficer, AdminController.processReviewDecision);
router.get('/admin/coverage-gaps', authenticateToken, requireOfficer, AdminController.getCoverageGapReport);
router.post('/admin/outreach-broadcast', authenticateToken, requireOfficer, AdminController.triggerOutreachBroadcast);

module.exports = router;
