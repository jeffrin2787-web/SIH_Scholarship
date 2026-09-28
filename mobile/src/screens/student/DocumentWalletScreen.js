import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput
} from 'react-native';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import Header from '../../components/Header';
import DocumentCard from '../../components/DocumentCard';

const DOC_TYPES = [
  { key: 'CASTE_CERTIFICATE', label: 'ST Caste Certificate', defaultTitle: 'Scheduled Tribe (ST) Certificate', defaultIssuer: 'Sub-Divisional Officer / Tehsildar' },
  { key: 'INCOME_CERTIFICATE', label: 'Income Certificate', defaultTitle: 'Annual Family Income Certificate', defaultIssuer: 'Circle Officer / Tehsildar' },
  { key: 'MARKSHEET_10', label: 'Class X Marksheet', defaultTitle: 'Secondary Examination Marksheet (Class X)', defaultIssuer: 'State Education Board / CBSE' },
  { key: 'MARKSHEET_12', label: 'Class XII Marksheet', defaultTitle: 'Higher Secondary Marksheet (Class XII)', defaultIssuer: 'State Secondary Council / CBSE' },
  { key: 'COLLEGE_ID', label: 'College Admission Offer', defaultTitle: 'College Admission / Enrollment Letter', defaultIssuer: 'University / Institute Registrar' },
  { key: 'OTHER', label: 'Other Document', defaultTitle: 'Supporting Affidavit / Certificate', defaultIssuer: 'Competent Authority' }
];

export default function DocumentWalletScreen() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [consentModalVisible, setConsentModalVisible] = useState(false);

  // Manual Upload Modal State
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('CASTE_CERTIFICATE');
  const [uploadTitle, setUploadTitle] = useState('Scheduled Tribe (ST) Certificate');
  const [uploadIssuer, setUploadIssuer] = useState('Sub-Divisional Officer / Tehsildar');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/wallet/documents');
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.warn('Wallet fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = async () => {
    setConsentModalVisible(false);
    setSyncing(true);
    try {
      const res = await api.post('/wallet/sync-digilocker');
      const msg = `Imported and cryptographically verified ${res.data.importedCount} certificates. You can now use these across any of the 5 MoTA schemes without re-uploading.`;
      if (Platform.OS === 'web') {
        window.alert(`DigiLocker Linked Successfully! 🎉\n\n${msg}`);
      } else {
        Alert.alert('DigiLocker Linked Successfully! 🎉', msg, [{ text: 'Great' }]);
      }
      fetchDocuments();
    } catch (err) {
      if (Platform.OS === 'web') {
        window.alert('Failed to synchronize with DigiLocker.');
      } else {
        Alert.alert('Error', 'Failed to synchronize with DigiLocker.');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectDocType = (item) => {
    setUploadDocType(item.key);
    setUploadTitle(item.defaultTitle);
    setUploadIssuer(item.defaultIssuer);
  };

  const handlePickFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.png,.jpg,.jpeg';
      input.onchange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const fileSizeFormatted = file.size > 1024 * 1024
            ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
            : Math.round(file.size / 1024) + ' KB';

          setSelectedFile({
            name: file.name,
            size: fileSizeFormatted,
            type: file.type
          });

          const reader = new FileReader();
          reader.onload = () => {
            setFileData(reader.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      setSelectedFile({
        name: `${uploadDocType.toLowerCase()}_scan.pdf`,
        size: '280 KB',
        type: 'application/pdf'
      });
      setFileData('data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp...');
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadTitle.trim()) {
      if (Platform.OS === 'web') {
        window.alert('Please enter a document title.');
      } else {
        Alert.alert('Validation', 'Please enter a document title.');
      }
      return;
    }

    setUploading(true);
    try {
      await api.post('/wallet/upload', {
        docType: uploadDocType,
        title: uploadTitle.trim(),
        issuer: uploadIssuer.trim(),
        issueDate: new Date().toISOString().split('T')[0],
        fileName: selectedFile?.name || null,
        fileData: fileData || null
      });

      if (Platform.OS === 'web') {
        window.alert('Document uploaded successfully! It is now stored in your wallet and reusable across all 5 schemes.');
      } else {
        Alert.alert('Upload Successful 🎉', 'Your certificate has been added to your wallet and is ready for multi-scheme reuse.');
      }

      setUploadModalVisible(false);
      setSelectedFile(null);
      setFileData(null);
      fetchDocuments();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Upload failed';
      if (Platform.OS === 'web') {
        window.alert('Upload error: ' + msg);
      } else {
        Alert.alert('Upload Failed', msg);
      }
    } finally {
      setUploading(false);
    }
  };

  const verifiedCount = documents.filter((d) => d.is_digilocker_verified).length;

  return (
    <View style={styles.screen}>
      <Header
        title="Digital Document Wallet"
        subtitle="DigiLocker Integration & Reusable Vault"
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* HERO BANNER WITH DIGILOCKER & DIRECT UPLOAD */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTop}>
            <View style={styles.dlLogoBox}>
              <Text style={styles.dlLogoText}>DigiLocker</Text>
            </View>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedTagText}>✓ MoTA Partner</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Eliminate Repetitive Paperwork</Text>
          <Text style={styles.heroDesc}>
            Fetch your verified ST Certificate, Income, and Marksheets once via DigiLocker, or upload scanned copies directly. Reusable across all 5 MoTA schemes without re-uploading.
          </Text>

          <View style={styles.heroBtnRow}>
            <TouchableOpacity
              style={[styles.syncBtn, { flex: 1.2, marginRight: 8 }]}
              onPress={() => setConsentModalVisible(true)}
              disabled={syncing}
            >
              {syncing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.syncBtnText}>
                  {verifiedCount > 0 ? '🔄 Sync DigiLocker' : '🔗 Link DigiLocker'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadHeroBtn, { flex: 1 }]}
              onPress={() => setUploadModalVisible(true)}
            >
              <Text style={styles.uploadHeroBtnText}>📤 Upload File</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* VAULT STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{documents.length}</Text>
            <Text style={styles.statLabel}>Total Documents</Text>
          </View>
          <View style={[styles.statBox, { borderColor: colors.success }]}>
            <Text style={[styles.statNum, { color: colors.success }]}>{verifiedCount}</Text>
            <Text style={styles.statLabel}>Digitally Verified</Text>
          </View>
          <View style={[styles.statBox, { borderColor: colors.primary }]}>
            <Text style={[styles.statNum, { color: colors.primary }]}>5</Text>
            <Text style={styles.statLabel}>Schemes Supported</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Your Stored Digital Certificates</Text>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={() => setUploadModalVisible(true)}
          >
            <Text style={styles.headerAddBtnText}>+ Upload Scan</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
        ) : documents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>Wallet is Empty</Text>
            <Text style={styles.emptyDesc}>
              Tap "Link DigiLocker" or "Upload File" above to add your certificates and marksheets.
            </Text>
          </View>
        ) : (
          documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} />
          ))
        )}
      </ScrollView>

      {/* DIGILOCKER OAUTH2 CONSENT MODAL */}
      <Modal
        visible={consentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setConsentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.dlHeaderBadge}>
                <Text style={styles.dlHeaderBadgeText}>DigiLocker</Text>
              </View>
              <Text style={styles.modalHeaderTitle}>Citizen Consent Request</Text>
            </View>

            <Text style={styles.consentAppTitle}>
              Ministry of Tribal Affairs (MoTA)
            </Text>
            <Text style={styles.consentSub}>
              is requesting authorized consent to access your issued digital records:
            </Text>

            <View style={styles.scopesList}>
              <View style={styles.scopeItem}>
                <Text style={styles.scopeCheck}>✓</Text>
                <Text style={styles.scopeText}>Scheduled Tribe (ST/PVTG) Caste Certificate</Text>
              </View>
              <View style={styles.scopeItem}>
                <Text style={styles.scopeCheck}>✓</Text>
                <Text style={styles.scopeText}>Annual Family Income Certificate (State e-District)</Text>
              </View>
              <View style={styles.scopeItem}>
                <Text style={styles.scopeCheck}>✓</Text>
                <Text style={styles.scopeText}>Secondary & Higher Secondary Marksheets</Text>
              </View>
              <View style={styles.scopeItem}>
                <Text style={styles.scopeCheck}>✓</Text>
                <Text style={styles.scopeText}>UGC-NET / Academic Credentials (if applicable)</Text>
              </View>
            </View>

            <Text style={styles.consentNotice}>
              🔒 Protected by Government of India IT Act 2000. Data will only be utilized for MoTA scholarship verification.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.denyBtn}
                onPress={() => setConsentModalVisible(false)}
              >
                <Text style={styles.denyBtnText}>Deny</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.allowBtn}
                onPress={handleGrantConsent}
              >
                <Text style={styles.allowBtnText}>Allow & Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MANUAL DOCUMENT UPLOAD MODAL */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.uploadModalScroll}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.uploadIconHeader}>📤</Text>
                <Text style={styles.modalHeaderTitle}>Upload Certificate to Wallet</Text>
              </View>

              <Text style={styles.inputGroupLabel}>Select Certificate Type:</Text>
              <View style={styles.docTypeChips}>
                {DOC_TYPES.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.docChip,
                      uploadDocType === item.key && styles.docChipActive
                    ]}
                    onPress={() => handleSelectDocType(item)}
                  >
                    <Text
                      style={[
                        styles.docChipText,
                        uploadDocType === item.key && styles.docChipTextActive
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Document Title *</Text>
                <TextInput
                  style={styles.input}
                  value={uploadTitle}
                  onChangeText={setUploadTitle}
                  placeholder="e.g. ST Caste Certificate"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Issuing Authority / Office</Text>
                <TextInput
                  style={styles.input}
                  value={uploadIssuer}
                  onChangeText={setUploadIssuer}
                  placeholder="e.g. Sub-Divisional Officer, Ranchi"
                />
              </View>

              {/* FILE PICKER SECTION */}
              <View style={styles.filePickerBox}>
                <Text style={styles.label}>Attach Document File (PDF, PNG, JPG)</Text>
                <TouchableOpacity style={styles.fileSelectBtn} onPress={handlePickFile}>
                  <Text style={styles.fileSelectBtnText}>
                    {selectedFile ? '📁 Change Selected File' : '📎 Choose File from Device / Computer'}
                  </Text>
                </TouchableOpacity>

                {selectedFile ? (
                  <View style={styles.selectedFileBadge}>
                    <Text style={styles.fileCheckIcon}>✓</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.selectedFileName} numberOfLines={1}>
                        {selectedFile.name}
                      </Text>
                      <Text style={styles.selectedFileSize}>{selectedFile.size}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.fileHelperText}>
                    Tap to select certificate scan or PDF from your device.
                  </Text>
                )}
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.denyBtn}
                  onPress={() => setUploadModalVisible(false)}
                  disabled={uploading}
                >
                  <Text style={styles.denyBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.submitUploadBtn}
                  onPress={handleUploadSubmit}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitUploadBtnText}>Upload & Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  heroBanner: {
    backgroundColor: '#0F2C24',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1B4D3E'
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  dlLogoBox: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6
  },
  dlLogoText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  verifiedTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  verifiedTagText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '700'
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  heroDesc: {
    fontSize: 11,
    color: '#A7F3D0',
    lineHeight: 16,
    marginTop: 4,
    marginBottom: 14
  },
  heroBtnRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  syncBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  uploadHeroBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  uploadHeroBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  statNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text
  },
  statLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text
  },
  headerAddBtn: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  headerAddBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700'
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border
  },
  emptyIcon: {
    fontSize: 34,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text
  },
  emptyDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    padding: 16
  },
  uploadModalScroll: {
    justifyContent: 'center',
    flexGrow: 1
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    elevation: 5
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  uploadIconHeader: {
    fontSize: 20,
    marginRight: 8
  },
  dlHeaderBadge: {
    backgroundColor: '#0052CC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8
  },
  dlHeaderBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900'
  },
  modalHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text
  },
  consentAppTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary
  },
  consentSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 4
  },
  scopesList: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    padding: 12,
    marginVertical: 12
  },
  scopeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  scopeCheck: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
    marginRight: 8
  },
  scopeText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    flex: 1
  },
  consentNotice: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 14,
    marginBottom: 16
  },
  inputGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6
  },
  docTypeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  docChip: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: colors.border
  },
  docChipActive: {
    backgroundColor: colors.primaryLighter,
    borderColor: colors.primary
  },
  docChipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  docChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  formGroup: {
    marginBottom: 12
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4
  },
  input: {
    backgroundColor: colors.borderLight,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: colors.text
  },
  filePickerBox: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed'
  },
  fileSelectBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginVertical: 6
  },
  fileSelectBtnText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700'
  },
  selectedFileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.success
  },
  fileCheckIcon: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '800',
    marginRight: 8
  },
  selectedFileName: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text
  },
  selectedFileSize: {
    fontSize: 9,
    color: colors.textMuted
  },
  fileHelperText: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 2
  },
  modalBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  denyBtn: {
    flex: 1,
    backgroundColor: colors.borderLight,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8
  },
  denyBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700'
  },
  allowBtn: {
    flex: 1.5,
    backgroundColor: '#0052CC',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  allowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  submitUploadBtn: {
    flex: 1.5,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  submitUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  }
});
