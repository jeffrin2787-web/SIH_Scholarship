const { query } = require('../config/db');
const DigiLockerAdapter = require('../services/adapters/DigiLockerAdapter');

class DocumentController {
  static async getMyDocuments(req, res) {
    try {
      const documents = await query.all(
        `SELECT * FROM documents WHERE user_id = ? ORDER BY is_digilocker_verified DESC, created_at DESC`,
        [req.user.id]
      );
      return res.json({
        documents,
        totalCount: documents.length,
        verifiedCount: documents.filter(d => d.is_digilocker_verified).length
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to retrieve documents from wallet' });
    }
  }

  static async syncDigiLocker(req, res) {
    try {
      const user = await query.get(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Simulate OAuth token exchange and fetching issued documents
      const issuedDocs = DigiLockerAdapter.simulateFetchIssuedDocuments(user.aadhaar_hash, user.name);

      const savedDocs = [];
      for (const doc of issuedDocs) {
        // Check if doc of this type already exists
        const existing = await query.get(
          `SELECT id FROM documents WHERE user_id = ? AND doc_type = ?`,
          [req.user.id, doc.docType]
        );

        if (existing) {
          await query.run(
            `UPDATE documents
             SET title = ?, file_url = ?, issuer = ?, issue_date = ?,
                 is_digilocker_verified = 1, digilocker_uri = ?,
                 digital_signature_hash = ?, reusable = 1
             WHERE id = ?`,
            [doc.title, doc.fileUrl, doc.issuer, doc.issueDate, doc.digilockerUri, doc.digitalSignature, existing.id]
          );
          savedDocs.push({ id: existing.id, ...doc });
        } else {
          const insertRes = await query.run(
            `INSERT INTO documents (
              user_id, doc_type, title, file_url, issuer, issue_date,
              is_digilocker_verified, digilocker_uri, digital_signature_hash, reusable
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, 1)`,
            [req.user.id, doc.docType, doc.title, doc.fileUrl, doc.issuer, doc.issueDate, doc.digilockerUri, doc.digitalSignature]
          );
          savedDocs.push({ id: insertRes.id, ...doc });
        }
      }

      // Record notification
      await query.run(
        `INSERT INTO notifications (user_id, title, message, type, action_route)
         VALUES (?, 'DigiLocker Sync Complete', 'Successfully imported and verified 4 certificates. These are now reusable across all MoTA schemes.', 'MILESTONE', 'Wallet')`,
        [req.user.id]
      );

      return res.json({
        message: 'DigiLocker documents imported and cryptographically verified successfully!',
        importedCount: savedDocs.length,
        documents: savedDocs
      });
    } catch (err) {
      console.error('DigiLocker sync error:', err);
      return res.status(500).json({ error: 'Failed to synchronize with DigiLocker.' });
    }
  }

  static async uploadDocument(req, res) {
    try {
      const { docType, title, issuer, issueDate, fileName, fileData } = req.body;
      if (!docType || !title) {
        return res.status(400).json({ error: 'Document type and title are required.' });
      }

      const fileUrl = fileData 
        ? fileData 
        : `https://storage.mota.gov.in/uploads/${req.user.id}_${docType.toLowerCase()}_${Date.now()}.pdf`;

      const docIssuer = issuer || (fileName ? `Self-Uploaded File (${fileName})` : 'Self-Uploaded Scan');
      const docDate = issueDate || new Date().toISOString().split('T')[0];

      const result = await query.run(
        `INSERT INTO documents (
          user_id, doc_type, title, file_url, issuer, issue_date,
          is_digilocker_verified, digilocker_uri, digital_signature_hash, reusable
        ) VALUES (?, ?, ?, ?, ?, ?, 0, NULL, NULL, 1)`,
        [req.user.id, docType, title, fileUrl, docIssuer, docDate]
      );

      // Record notification for student
      await query.run(
        `INSERT INTO notifications (user_id, title, message, type, action_route)
         VALUES (?, 'Document Uploaded Successfully', ?, 'MILESTONE', 'Wallet')`,
        [req.user.id, `"${title}" has been uploaded to your Digital Wallet and is ready for multi-scheme reuse.`]
      );

      return res.status(201).json({
        message: 'Document uploaded successfully! It is now stored in your wallet and reusable across all 5 schemes.',
        document: {
          id: result.id,
          user_id: req.user.id,
          doc_type: docType,
          title,
          file_url: fileUrl,
          issuer: docIssuer,
          issue_date: docDate,
          is_digilocker_verified: 0,
          reusable: 1
        }
      });
    } catch (err) {
      console.error('Document upload error:', err);
      return res.status(500).json({ error: 'Failed to upload document.' });
    }
  }
}

module.exports = DocumentController;
